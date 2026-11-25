import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  ArrayMaxSize,
} from 'class-validator';
import { FlowOrderStatus } from '../entities/flow-order.entity';

export class FlowCustomerDto {
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsString()
  @Matches(/^[+\d][\d\s-]{5,19}$/, { message: 'Утасны дугаар буруу' })
  phone: string;
}

export class CreateFlowOrderDto {
  @IsString() @MaxLength(128) conversationId: string;

  @ValidateNested() @Type(() => FlowCustomerDto) customer: FlowCustomerDto;

  @IsOptional() @IsIn(['business_card']) product?: 'business_card';

  /** bc_products дахь бүтээгдэхүүн; өгөөгүй бол FLOW_BC_PRODUCT_ID */
  @IsOptional() @IsUUID() bcProductId?: string;

  @IsString()
  @Matches(/^[\w-]{1,64}$/, { message: 'template нэр буруу' })
  template: string;

  @Type(() => Number) @IsInt() @Min(1) @Max(100000) quantity: number;

  @IsOptional() @IsIn(['none', 'lak', 'burelt']) finish?:
    | 'none'
    | 'lak'
    | 'burelt';

  @IsObject() fields: Record<string, string>;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  logoUrl?: string;

  @IsOptional() @IsString() @MaxLength(24) source?: string;
}

/** n8n урсгалын шат бүрт шинэчлэгдэх талбарууд. Үнэ (amount) шинэчлэгдэхгүй. */
export class UpdateFlowOrderDto {
  @IsOptional() @IsIn(Object.values(FlowOrderStatus)) status?: FlowOrderStatus;

  // Загвар засвар — зөвхөн rendering / awaiting_approval үед
  @IsOptional() @IsObject() fields?: Record<string, string>;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  editCount?: number;
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  logoUrl?: string;
  @IsOptional() @IsString() @Matches(/^[\w-]{1,64}$/) template?: string;

  // Render үр дүн
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUrl({ require_protocol: true }, { each: true })
  previewUrls?: string[];
  @IsOptional() @IsUrl({ require_protocol: true }) pdfUrl?: string;
  @IsOptional() @IsString() @MaxLength(64) renderJobId?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  renderWarnings?: string[];
  @IsOptional() @IsString() @MaxLength(2000) renderError?: string;

  // Төлбөр
  @IsOptional() @IsString() @MaxLength(64) qpayInvoiceId?: string;
  @IsOptional() @IsDateString() approvedAt?: string;
  @IsOptional() @IsDateString() paidAt?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) paidAmount?: number;
  @IsOptional() @IsString() @MaxLength(64) paymentId?: string;

  // Үйлдвэр, хүргэлт
  @IsOptional() @IsDateString() sentToFactoryAt?: string;
  @IsOptional() @IsDateString() readyAt?: string;
  @IsOptional() @IsIn(['ubcab', 'pickup']) deliveryMethod?: 'ubcab' | 'pickup';
  @IsOptional() @IsString() @MaxLength(500) deliveryAddress?: string;
  @IsOptional() @IsDateString() deliveredAt?: string;
}

export class ListFlowOrdersQuery {
  @IsOptional() @IsIn(Object.values(FlowOrderStatus)) status?: FlowOrderStatus;
  @IsOptional() @IsString() @MaxLength(128) conversationId?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit?: number;
}
