import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import {
  BusinessCardsService,
  BcFinish,
} from '../business-cards/business-cards.service';
import { FlowCatalogService } from './flow-catalog.service';
import {
  FlowFinish,
  FlowOrder,
  FlowOrderStatus as S,
} from './entities/flow-order.entity';
import {
  CreateFlowOrderDto,
  ListFlowOrdersQuery,
  UpdateFlowOrderDto,
} from './dto/flow-order.dto';

/** Урсгалын өнгөлгөө → bc_pricing_tiers-ийн багана */
const FINISH_COLUMN: Record<FlowFinish, BcFinish> = {
  none: 'standard',
  burelt: 'laminated',
  lak: 'varnished',
};

/** Зөвшөөрөгдсөн төлөвийн шилжилт (ижил төлөв рүү PATCH хийх нь үргэлж зөвшөөрөгдөнө) */
export const FLOW_TRANSITIONS: Record<S, S[]> = {
  [S.RENDERING]: [
    S.AWAITING_APPROVAL,
    S.RENDER_FAILED,
    S.NEEDS_HUMAN,
    S.CANCELLED,
  ],
  [S.RENDER_FAILED]: [S.RENDERING, S.NEEDS_HUMAN, S.CANCELLED],
  [S.AWAITING_APPROVAL]: [
    S.RENDERING,
    S.AWAITING_PAYMENT,
    S.NEEDS_HUMAN,
    S.CANCELLED,
  ],
  [S.AWAITING_PAYMENT]: [S.IN_PRODUCTION, S.NEEDS_HUMAN, S.CANCELLED],
  [S.IN_PRODUCTION]: [S.READY, S.NEEDS_HUMAN],
  [S.READY]: [S.DELIVERY_REQUESTED, S.DELIVERED, S.NEEDS_HUMAN],
  [S.DELIVERY_REQUESTED]: [S.DELIVERED, S.NEEDS_HUMAN],
  [S.NEEDS_HUMAN]: [
    S.RENDERING,
    S.AWAITING_APPROVAL,
    S.AWAITING_PAYMENT,
    S.IN_PRODUCTION,
    S.READY,
    S.DELIVERY_REQUESTED,
    S.DELIVERED,
    S.CANCELLED,
  ],
  [S.DELIVERED]: [],
  [S.CANCELLED]: [],
};

/** Загварын өгөгдөл (fields, logo, template) зөвхөн эдгээр төлөвт өөрчлөгдөнө */
const DESIGN_EDITABLE: S[] = [
  S.RENDERING,
  S.RENDER_FAILED,
  S.AWAITING_APPROVAL,
  S.NEEDS_HUMAN,
];

@Injectable()
export class FlowOrdersService {
  private readonly logger = new Logger(FlowOrdersService.name);

  constructor(
    @InjectRepository(FlowOrder) private readonly repo: Repository<FlowOrder>,
    private readonly businessCards: BusinessCardsService,
    private readonly catalog: FlowCatalogService,
  ) {}

  async create(dto: CreateFlowOrderDto) {
    if (dto.product === 'catalog') return this.createCatalog(dto);

    const finish: FlowFinish = dto.finish || 'none';
    const productId = dto.bcProductId || process.env.FLOW_BC_PRODUCT_ID;
    if (!productId)
      throw new BadRequestException(
        'Нэрийн хуудасны бүтээгдэхүүн (FLOW_BC_PRODUCT_ID) тохируулаагүй',
      );

    // Үнийг зөвхөн сервер талд, business-cards-ийн tier-ээс бодно (n8n-ээс ирсэн үнэд итгэхгүй)
    const price = await this.businessCards.calculateFinishPrice(
      productId,
      dto.quantity,
      FINISH_COLUMN[finish],
    );
    if (!price)
      throw new BadRequestException(
        `Үнэ тохируулаагүй: ${finish} / ${dto.quantity}ш`,
      );

    return this.persist(dto, {
      product: 'business_card',
      bc_product_id: productId,
      template: dto.template || process.env.FLOW_BC_TEMPLATE || 'nh-classic-01',
      quantity: dto.quantity,
      finish,
      unit_price: price.unit_price,
      amount_ex_vat: price.subtotal,
      vat: price.vat,
      amount: price.total,
      spec: dto.design ? { design: this.cleanDesign(dto.design) } : null,
    });
  }

  /** Албан үнийн жагсаалтын бараа (туг, даавуун хэвлэл …) — үнийг catalog-pricing бодно */
  private async createCatalog(dto: CreateFlowOrderDto) {
    if (!dto.productSlug || !dto.variantCode) {
      throw new BadRequestException('productSlug, variantCode шаардлагатай');
    }
    const q = await this.catalog.quote({
      productSlug: dto.productSlug,
      variantCode: dto.variantCode,
      widthM: dto.widthM,
      heightM: dto.heightM,
      quantity: dto.quantity,
      sides: dto.sides,
      addons: dto.addons,
      extras: dto.extras,
    });
    return this.persist(dto, {
      product: 'catalog',
      bc_product_id: null,
      product_slug: q.productSlug,
      catalog_line: q.line as unknown as Record<string, unknown>,
      template: dto.template || 'fabric-auto',
      quantity: q.quantity,
      finish: 'none',
      unit_price: q.unitPrice,
      amount_ex_vat: q.amountExVat,
      vat: q.vat,
      amount: q.total,
      spec: {
        productName: q.productName,
        variantLabel: q.variantLabel,
        unit: q.unit,
        // Загварын хэмжээ: м² бараанд үнэтэй ижил, ширхгийн бараанд (өдөн туг, ширээний туг) зөвхөн дизайнд
        widthM: q.line.w ?? dto.widthM ?? null,
        heightM: q.line.h ?? dto.heightM ?? null,
        sides: q.sides,
        addons: q.line.addons ?? null,
        extras: q.extras.length ? q.extras : null,
        design: dto.design ? this.cleanDesign(dto.design) : null,
      },
    });
  }

  private async persist(dto: CreateFlowOrderDto, extra: Partial<FlowOrder>) {
    const now = new Date().toISOString();
    const order = this.repo.create({
      order_no: this.genOrderNo(extra.product === 'catalog' ? 'BP' : 'NH'),
      source: dto.source || 'yria',
      conversation_id: dto.conversationId,
      customer_name: dto.customer.name?.trim() || null,
      customer_phone: dto.customer.phone.replace(/[\s-]/g, ''),
      fields: this.cleanFields(dto.fields),
      logo_url: dto.logoUrl || null,
      status: S.RENDERING,
      status_history: [{ from: null, to: S.RENDERING, at: now }],
      edit_count: 0,
      ...extra,
    });
    const saved = await this.repo.save(order);
    this.logger.log(
      `Flow order ${saved.order_no} (${saved.id}) — ${saved.product_slug || saved.product} ×${saved.quantity}, ${saved.amount}₮`,
    );
    return this.toView(saved);
  }

  /** Дизайны brief: зөвхөн мэдэгдэж буй түлхүүр, өнгө нь #RRGGBB, текст ≤300 */
  cleanDesign(input: Record<string, unknown>): Record<string, string> {
    const out: Record<string, string> = {};
    const color = (v: unknown) =>
      typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim())
        ? v.trim().toUpperCase()
        : null;
    for (const k of ['background', 'textColor', 'accent']) {
      const c = color(input?.[k]);
      if (c) out[k] = c;
    }
    for (const k of ['headline', 'subline', 'extra']) {
      const v = input?.[k];
      if (typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, 300);
    }
    const layout = input?.layout;
    if (
      typeof layout === 'string' &&
      ['center', 'left', 'logo-only', 'text-only'].includes(layout)
    )
      out.layout = layout;
    const notes = input?.notes;
    if (typeof notes === 'string' && notes.trim())
      out.notes = notes.trim().slice(0, 1000);
    return out;
  }

  async findOne(id: string) {
    return this.toView(await this.load(id));
  }

  async list(q: ListFlowOrdersQuery) {
    const where: FindOptionsWhere<FlowOrder> = {};
    if (q.status) where.status = q.status;
    if (q.conversationId) where.conversation_id = q.conversationId;
    const rows = await this.repo.find({
      where,
      order: { created_at: 'DESC' },
      take: q.limit || 50,
    });
    return rows.map((r) => this.toView(r));
  }

  async update(id: string, dto: UpdateFlowOrderDto) {
    const o = await this.load(id);
    const from = o.status;

    const designChange =
      dto.fields !== undefined ||
      dto.logoUrl !== undefined ||
      dto.template !== undefined ||
      dto.design !== undefined ||
      dto.editCount !== undefined;
    if (designChange && !DESIGN_EDITABLE.includes(from)) {
      throw new BadRequestException(
        `"${from}" төлөвт загварын өгөгдлийг өөрчлөх боломжгүй`,
      );
    }

    if (dto.status && dto.status !== from) {
      if (!FLOW_TRANSITIONS[from].includes(dto.status)) {
        throw new BadRequestException(
          `Төлөв шилжих боломжгүй: ${from} → ${dto.status}`,
        );
      }
      if (dto.status === S.IN_PRODUCTION) {
        const paid =
          dto.paidAmount ?? (o.paid_amount != null ? Number(o.paid_amount) : 0);
        if (paid < Number(o.amount))
          throw new BadRequestException(
            'Төлбөр дутуу — үйлдвэрт оруулах боломжгүй',
          );
      }
      o.status = dto.status;
      o.status_history = [
        ...(o.status_history || []),
        { from, to: dto.status, at: new Date().toISOString() },
      ];
    }

    if (dto.fields !== undefined) o.fields = this.cleanFields(dto.fields);
    if (dto.editCount !== undefined) o.edit_count = dto.editCount;
    if (dto.logoUrl !== undefined) o.logo_url = dto.logoUrl;
    if (dto.template !== undefined) o.template = dto.template;
    if (dto.design !== undefined) {
      const prev = (o.spec?.design as Record<string, string>) || {};
      o.spec = {
        ...(o.spec || {}),
        design: { ...prev, ...this.cleanDesign(dto.design) },
      };
    }
    if (dto.previewUrls !== undefined) o.preview_urls = dto.previewUrls;
    if (dto.pdfUrl !== undefined) o.pdf_url = dto.pdfUrl;
    if (dto.renderJobId !== undefined) o.render_job_id = dto.renderJobId;
    if (dto.renderWarnings !== undefined)
      o.render_warnings = dto.renderWarnings;
    if (dto.renderError !== undefined) o.render_error = dto.renderError;
    if (dto.qpayInvoiceId !== undefined) o.qpay_invoice_id = dto.qpayInvoiceId;
    if (dto.approvedAt !== undefined) o.approved_at = new Date(dto.approvedAt);
    if (dto.paidAt !== undefined) o.paid_at = new Date(dto.paidAt);
    if (dto.paidAmount !== undefined) o.paid_amount = dto.paidAmount;
    if (dto.paymentId !== undefined) o.payment_id = dto.paymentId;
    if (dto.sentToFactoryAt !== undefined)
      o.sent_to_factory_at = new Date(dto.sentToFactoryAt);
    if (dto.readyAt !== undefined) o.ready_at = new Date(dto.readyAt);
    if (dto.deliveryMethod !== undefined)
      o.delivery_method = dto.deliveryMethod;
    if (dto.deliveryAddress !== undefined)
      o.delivery_address = dto.deliveryAddress;
    if (dto.deliveredAt !== undefined)
      o.delivered_at = new Date(dto.deliveredAt);

    return this.toView(await this.repo.save(o));
  }

  // ---------- туслах ----------

  private async load(id: string) {
    const o = await this.repo.findOne({ where: { id } });
    if (!o) throw new NotFoundException('Захиалга олдсонгүй');
    return o;
  }

  /** Талбарын нэр: a-z0-9_ (≤32), утга: текст (≤300), дээд тал нь 30 талбар */
  cleanFields(input: Record<string, unknown>): Record<string, string> {
    if (!input || typeof input !== 'object' || Array.isArray(input))
      throw new BadRequestException('fields объект байх ёстой');
    const entries = Object.entries(input);
    if (entries.length > 30) throw new BadRequestException('fields хэт олон');
    const out: Record<string, string> = {};
    for (const [k, v] of entries) {
      if (!/^[a-z0-9_]{1,32}$/.test(k))
        throw new BadRequestException(`Талбарын нэр буруу: ${k}`);
      if (
        v !== null &&
        v !== undefined &&
        typeof v !== 'string' &&
        typeof v !== 'number'
      ) {
        throw new BadRequestException(`${k} текст байх ёстой`);
      }
      const s =
        v == null
          ? ''
          : String(v as string | number)
              .replace(/\r\n?/g, '\n')
              .trim();
      if (s.length > 300) throw new BadRequestException(`${k} хэт урт`);
      out[k] = s;
    }
    return out;
  }

  private genOrderNo(prefix = 'NH') {
    const d = new Date(Date.now() + 8 * 3600 * 1000); // Улаанбаатарын цаг
    const ymd = d.toISOString().slice(2, 10).replace(/-/g, '');
    return `${prefix}${ymd}-${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  toView(o: FlowOrder) {
    const num = (v: unknown) =>
      v === null || v === undefined ? null : Number(v);
    return {
      id: o.id,
      orderNo: o.order_no,
      source: o.source,
      conversationId: o.conversation_id,
      customer: { name: o.customer_name, phone: o.customer_phone },
      product: o.product,
      bcProductId: o.bc_product_id,
      productSlug: o.product_slug,
      catalogLine: o.catalog_line,
      spec: o.spec || null,
      template: o.template,
      quantity: o.quantity,
      finish: o.finish,
      fields: o.fields || {},
      logoUrl: o.logo_url,
      unitPrice: num(o.unit_price),
      amountExVat: num(o.amount_ex_vat),
      vat: num(o.vat),
      amount: num(o.amount),
      status: o.status,
      statusHistory: o.status_history || [],
      editCount: o.edit_count,
      previewUrls: o.preview_urls || [],
      pdfUrl: o.pdf_url,
      renderJobId: o.render_job_id,
      renderWarnings: o.render_warnings || [],
      renderError: o.render_error,
      qpayInvoiceId: o.qpay_invoice_id,
      approvedAt: o.approved_at,
      paidAt: o.paid_at,
      paidAmount: num(o.paid_amount),
      paymentId: o.payment_id,
      sentToFactoryAt: o.sent_to_factory_at,
      readyAt: o.ready_at,
      deliveryMethod: o.delivery_method,
      deliveryAddress: o.delivery_address,
      deliveredAt: o.delivered_at,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    };
  }
}
