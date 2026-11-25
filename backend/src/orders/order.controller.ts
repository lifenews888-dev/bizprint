import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  Res,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { OrdersService } from './order.service';
import { OrderOpsService } from './services/order-ops.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { FilesService } from '../files/files.service';
import { PdfInspectorService } from '../ai/pdf-inspector/pdf-inspector.service';
import { UploadService } from '../upload/upload.service';
import { MailService } from '../mail/mail.service';

@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private ops: OrderOpsService,
    private filesService: FilesService,
    private pdfInspector: PdfInspectorService,
    private uploadService: UploadService,
    private mailService: MailService,
  ) {}

  /** Хэвлэх эх хүлээн авах төлөвүүд (төлбөрийн дараа — үйлдвэрт орохоос өмнө) */
  private static readonly ARTWORK_STATUSES = ['confirmed', 'pending_file', 'file_review', 'file_rejected'];

  private assertOwner(order: { customer_id?: string }, user: any) {
    const staff = ['admin', 'superadmin', 'sales', 'designer', 'staff'].includes(user?.role);
    if (!staff && order.customer_id && order.customer_id !== user?.id) {
      throw new ForbiddenException('Зөвхөн өөрийн захиалгад файл илгээнэ');
    }
  }

  /* ═══════════════════════════════════════
   *  OPS — KPI, Alerts, Bulk (BEFORE :id routes!)
   * ═══════════════════════════════════════ */

  @Get('ops/summary')
  @UseGuards(JwtAuthGuard)
  getKpiSummary() {
    return this.ops.getKpiSummary();
  }

  @Get('ops/alerts')
  @UseGuards(JwtAuthGuard)
  getAlerts() {
    return this.ops.getAlerts();
  }

  @Post('ops/sla-check')
  @UseGuards(JwtAuthGuard)
  checkSla() {
    return this.ops.checkSla();
  }

  // Bulk mutations are platform-wide admin operations — guard with AdminGuard
  // so a regular customer can't mass-cancel/reassign/re-prioritize orders.
  @Post('bulk/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  bulkStatus(@Body() body: { order_ids: string[]; status: string }, @Request() req: any) {
    return this.ops.bulkUpdateStatus(body.order_ids, body.status, req.user?.email);
  }

  @Post('bulk/assign')
  @UseGuards(JwtAuthGuard, AdminGuard)
  bulkAssign(@Body() body: { order_ids: string[]; vendor_id: string }) {
    return this.ops.bulkAssignVendor(body.order_ids, body.vendor_id);
  }

  @Post('bulk/priority')
  @UseGuards(JwtAuthGuard, AdminGuard)
  bulkPriority(@Body() body: { order_ids: string[]; priority: string }) {
    return this.ops.bulkSetPriority(body.order_ids, body.priority);
  }

  @Post('bulk/cancel')
  @UseGuards(JwtAuthGuard, AdminGuard)
  bulkCancel(@Body() body: { order_ids: string[] }) {
    return this.ops.bulkCancel(body.order_ids);
  }

  /* ═══════════════════════════════════════
   *  CRUD — standard order endpoints
   * ═══════════════════════════════════════ */

  // ADMIN-ONLY: direct order creation (manual entry, imports, recovery).
  // Customer flow MUST go through /cart/quote/confirm or /orders/from-quote
  // so pricing, vendor split, and audit trail run consistently.
  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() body: any, @Request() req: any) {
    return this.ordersService.createOrder({ ...body, customer_id: body.customer_id || req.user?.id });
  }

  @Post('from-quote')
  @UseGuards(JwtAuthGuard)
  createFromQuote(
    @Body() body: { quote_id: string; payment_method?: string },
    @Request() req: any,
  ) {
    return this.ordersService.createFromQuote(body.quote_id, req.user.id, body.payment_method);
  }

  // Admin/superadmin бүх захиалгыг, бусад нь зөвхөн өөрийнхөө захиалгыг харна.
  // (Өмнө нь нэвтэрсэн хэн ч бүх хэрэглэгчийн захиалгыг авч чаддаг байсан —
  // customer dashboard энэ endpoint-ыг дууддаг.)
  @Get()
  @UseGuards(JwtAuthGuard)
  getAll(@Request() req: any) {
    const role = req.user?.role;
    if (role === 'admin' || role === 'superadmin') return this.ordersService.getOrders();
    return this.ordersService.getOrdersByCustomer(req.user.id);
  }

  // Admin-only: read any customer's orders. Customers use /orders/my (which is
  // scoped to req.user.id) — exposing an arbitrary customer_id here would be IDOR.
  @Get('customer/:customer_id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getByCustomer(@Param('customer_id') customer_id: string) {
    return this.ordersService.getOrdersByCustomer(customer_id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyOrders(@Request() req: any) {
    return this.ordersService.getOrdersByCustomer(req.user.id);
  }

  @Get('vendor/me')
  @UseGuards(JwtAuthGuard)
  getMyVendorOrders(@Request() req: any) {
    return this.ordersService.getOrdersByVendor(req.user.id);
  }

  // ─── Public order tracking (no auth) ───
  @Get('track/:orderNumber')
  async trackOrder(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.getPublicTracking(orderNumber);
  }

  /* ═══════════════════════════════════════
   *  :id routes (AFTER static routes)
   * ═══════════════════════════════════════ */

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOne(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.getOrderForUser(id, req.user);
  }

  @Get(':id/files')
  @UseGuards(JwtAuthGuard)
  async getOrderFiles(@Param('id') orderId: string, @Request() req: any) {
    await this.ordersService.getOrderForUser(orderId, req.user);
    return this.filesService.findByOrder(orderId);
  }

  @Get(':id/timeline')
  @UseGuards(JwtAuthGuard)
  async getTimeline(@Param('id') id: string, @Request() req: any) {
    await this.ordersService.getOrderForUser(id, req.user);
    return this.ops.getTimeline(id);
  }

  @Get(':id/status-logs')
  @UseGuards(JwtAuthGuard)
  async getStatusLogs(@Param('id') id: string, @Request() req: any) {
    await this.ordersService.getOrderForUser(id, req.user);
    return this.ops.getStatusLogs(id);
  }

  @Post(':id/schedule-zoom')
  @UseGuards(JwtAuthGuard)
  async scheduleZoom(
    @Param('id') orderId: string,
    @Body() body: { scheduled_at?: string; notes?: string },
    @Request() req: any,
  ) {
    return this.ordersService.scheduleZoom(orderId, req.user.id, body.scheduled_at, body.notes);
  }

  @Post(':id/upload-file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  async uploadOrderFile(
    @Param('id') orderId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) throw new BadRequestException('Файл байхгүй байна');

    const order = await this.ordersService.getOrderById(orderId);
    this.assertOwner(order, req.user);
    // Олон файл илгээж болно: эхний файлын дараа file_review болсон ч дараагийнхыг хүлээн авна
    if (!OrdersController.ARTWORK_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `Файл оруулах боломжгүй. Захиалгын төлөв: "${order.status}". Үйлдвэрт орохоос өмнө файлаа илгээнэ.`,
      );
    }

    const uploadResult = this.uploadService.processFile(file);
    if ('error' in uploadResult && uploadResult.error) {
      throw new BadRequestException(uploadResult.error);
    }

    const fileRecord = await this.filesService.create({
      order_id: orderId,
      filename: file.originalname,
      path: (uploadResult as any).file_url,
      size: file.size,
      mime_type: file.mimetype,
      uploaded_by: req.user?.id,
      uploaded_by_role: req.user?.role || 'customer',
    });

    let analysis = null;
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      try {
        analysis = await this.pdfInspector.inspect(file.buffer);
        await this.filesService.updateAnalysis(fileRecord.id, analysis);
      } catch (e) {
        console.log('PDF inspection error (non-blocking):', e.message);
      }
    }

    try {
      if (order.status === 'file_rejected') {
        await this.ordersService.updateOrder(orderId, { status: 'pending_file' });
      }
      if (order.status === 'pending_file' || order.status === 'file_rejected') {
        await this.ordersService.updateOrder(orderId, { status: 'file_review' });
      }
    } catch (e) {
      console.log('Status transition warning:', e.message);
    }

    try {
      const orderRepo = this.ordersService['ordersRepo'];
      await orderRepo.update(orderId, { file_url: (uploadResult as any).file_url });
    } catch {}

    return {
      success: true,
      file: fileRecord,
      analysis,
      order_status: 'file_review',
      message: isPdf
        ? `Файл амжилттай оруулж, PDF шинжилгээ хийгдлээ. Оноо: ${analysis?.score ?? '-'}/100`
        : 'Файл амжилттай оруулагдлаа. Шалгалтад орлоо.',
    };
  }

  /**
   * Бэлэн файлгүй үйлчлүүлэгч: хаяг/бараан дээр гарах нэр, лого, имэйлээ үлдээнэ —
   * BizPrint загварыг хийж тэр имэйл рүү илгээнэ. Хүсэлт order.options.design_request-д хадгалагдана.
   */
  @Post(':id/design-request')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('logo', {
    storage: memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  async designRequest(
    @Param('id') orderId: string,
    @UploadedFile() logo: Express.Multer.File | undefined,
    @Body() body: { brand_text?: string; email?: string; notes?: string },
    @Request() req: any,
  ) {
    const brandText = String(body?.brand_text || '').trim().slice(0, 500);
    const email = String(body?.email || '').trim().toLowerCase();
    const notes = String(body?.notes || '').trim().slice(0, 2000);
    if (!brandText) throw new BadRequestException('Хаяг, бараан дээр гарах нэр/текстээ бичнэ үү');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Загвар илгээх имэйл хаягаа зөв оруулна уу');

    const order = await this.ordersService.getOrderById(orderId);
    this.assertOwner(order, req.user);
    if (!OrdersController.ARTWORK_STATUSES.includes(order.status)) {
      throw new BadRequestException(`Захиалгын төлөв "${order.status}" — загварын хүсэлт хүлээн авах боломжгүй.`);
    }

    let logoUrl: string | null = null;
    if (logo) {
      const up = this.uploadService.processFile(logo);
      if ('error' in up && up.error) throw new BadRequestException(up.error);
      const url: string = (up as any).file_url;
      logoUrl = url;
      await this.filesService.create({
        order_id: orderId,
        filename: `ЛОГО — ${logo.originalname}`,
        path: url,
        size: logo.size,
        mime_type: logo.mimetype,
        uploaded_by: req.user?.id,
        uploaded_by_role: req.user?.role || 'customer',
      });
    }

    const request = {
      brand_text: brandText,
      email,
      notes,
      logo_url: logoUrl,
      requested_at: new Date().toISOString(),
      status: 'waiting_design', // загвар хийгдэж буй → имэйлээр илгээгдэнэ
    };
    const orderRepo = this.ordersService['ordersRepo'];
    await orderRepo.update(orderId, {
      options: { ...(order.options || {}), design_request: request } as any,
      notes: [order.notes, `Загвар хийлгэх: «${brandText}» · имэйл ${email}${notes ? ` · ${notes}` : ''}`].filter(Boolean).join('\n'),
    });

    try {
      if (order.status === 'file_rejected') await this.ordersService.updateOrder(orderId, { status: 'pending_file' });
      if (order.status === 'pending_file' || order.status === 'file_rejected') {
        await this.ordersService.updateOrder(orderId, { status: 'file_review' });
      }
    } catch (e) {
      console.log('Status transition warning:', e.message);
    }

    const code = orderId.slice(-8).toUpperCase();
    this.mailService.sendGenericNotification({
      to: email,
      name: order.customer_name || 'Хэрэглэгч',
      title: `Загварын хүсэлт хүлээн авлаа — #${code}`,
      message: `«${brandText}» гэсэн нэр${logoUrl ? ', лого' : ''}-г хүлээн авлаа. Манай дизайнер загварыг бэлтгээд энэ имэйл рүү илгээнэ. Батласны дараа үйлдвэрт оруулна.`,
    }).catch((e) => console.log('Design request email failed:', e.message));
    const ops = process.env.ORDERS_EMAIL || process.env.ADMIN_EMAIL;
    if (ops) {
      this.mailService.sendGenericNotification({
        to: ops,
        name: 'BizPrint',
        title: `Загвар хийх хүсэлт #${code}`,
        message: `${order.product_name || 'Захиалга'} · «${brandText}» · ${email}${logoUrl ? ` · лого: ${logoUrl}` : ''}${notes ? ` · ${notes}` : ''}`,
      }).catch(() => {});
    }

    return { success: true, design_request: request, order_status: 'file_review' };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.ordersService.updateOrder(id, body, { id: req.user?.id, role: req.user?.role });
  }

  // SECURITY: revert skips the state machine's actor checks, so admin-only
  // (only caller is the admin workflow page).
  @Patch(':id/revert')
  @UseGuards(JwtAuthGuard, AdminGuard)
  revertStatus(
    @Param('id') id: string,
    @Body() body: { reason: string; target_stage?: string },
    @Request() req: any,
  ) {
    const user = req.user?.name || req.user?.email || 'Admin';
    return this.ordersService.revertStatus(id, body.reason, user, body.target_stage);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.cancelOrder(id, undefined, { id: req.user?.id, role: req.user?.role });
  }

  @Post(':id/reassign-vendor')
  @UseGuards(JwtAuthGuard, AdminGuard)
  reassignVendor(@Param('id') id: string, @Body() body: { vendor_id: string }) {
    return this.ordersService.reassignVendor(id, body.vendor_id);
  }

  // ─── CSV / Excel export ───────────────────────────────────────────────
  @Get('export')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async exportOrders(
    @Query('format') format: string = 'csv',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Res() res?: Response,
  ) {
    const csv = await this.ordersService.exportOrders({ startDate, endDate, status });
    const filename = format === 'excel' ? 'orders.csv' : 'orders.csv';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csv);
  }

}