import { Type } from 'class-transformer'
import {
  IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, IsUUID,
  Matches, Max, MaxLength, Min, ValidateNested, ArrayMaxSize,
} from 'class-validator'
import { PrintTechnology, PrintDeviceStatus } from './entities/print-device.entity'
import { PrintTicketStatus } from './entities/print-ticket.entity'

const CODE_RE = /^[A-Z0-9][A-Z0-9-]{1,31}$/

export class ColorCodeDto {
  @Matches(CODE_RE, { message: 'code: зөвхөн том үсэг, тоо, зураас (жишээ BP-R101)' })
  code: string

  @IsString() @MaxLength(120)
  name: string

  @IsOptional() @IsString() @MaxLength(40)
  family?: string

  /** Lab эсвэл hex-ийн аль нэг заавал. Lab байхгүй бол hex-ээс тооцоолно. */
  @IsOptional() @IsNumber() @Min(0) @Max(100)
  labL?: number

  @IsOptional() @IsNumber() @Min(-128) @Max(128)
  labA?: number

  @IsOptional() @IsNumber() @Min(-128) @Max(128)
  labB?: number

  @IsOptional() @Matches(/^#[0-9A-Fa-f]{6}$/)
  hex?: string

  @IsOptional() @IsInt()
  sortOrder?: number

  @IsOptional() @IsBoolean()
  isActive?: boolean
}

export class UpdateColorCodeDto {
  @IsOptional() @IsString() @MaxLength(120)
  name?: string

  @IsOptional() @IsString() @MaxLength(40)
  family?: string

  @IsOptional() @IsNumber() @Min(0) @Max(100)
  labL?: number

  @IsOptional() @IsNumber() @Min(-128) @Max(128)
  labA?: number

  @IsOptional() @IsNumber() @Min(-128) @Max(128)
  labB?: number

  @IsOptional() @Matches(/^#[0-9A-Fa-f]{6}$/)
  hex?: string

  @IsOptional() @IsInt()
  sortOrder?: number

  @IsOptional() @IsBoolean()
  isActive?: boolean
}

export class BulkColorCodesDto {
  @IsArray() @ArrayMaxSize(1000) @ValidateNested({ each: true }) @Type(() => ColorCodeDto)
  colors: ColorCodeDto[]
}

export class CheckColorsDto {
  @IsArray() @ArrayMaxSize(50) @IsString({ each: true })
  codes: string[]

  @IsString()
  productType: string

  @IsOptional() @IsString()
  media?: string
}

export class PrintDeviceDto {
  @IsString() @MaxLength(120)
  name: string

  @IsIn(Object.values(PrintTechnology))
  technology: string

  @IsOptional() @IsUUID()
  vendorId?: string

  @IsOptional() @IsUUID()
  agentId?: string | null

  @IsArray() @IsString({ each: true })
  productTypes: string[]

  @IsOptional() @IsArray() @IsString({ each: true })
  media?: string[]

  @IsOptional() @IsInt() @Min(1)
  maxWidthMm?: number

  @IsOptional() @IsString() @MaxLength(120)
  hotfolderKey?: string

  @IsOptional() @IsNumber() @Min(0.5) @Max(20)
  deltaETolerance?: number

  @IsOptional() @IsIn(Object.values(PrintDeviceStatus))
  status?: string

  @IsOptional() @IsString()
  notes?: string
}

export class UpdatePrintDeviceDto {
  @IsOptional() @IsString() @MaxLength(120)
  name?: string

  @IsOptional() @IsIn(Object.values(PrintTechnology))
  technology?: string

  @IsOptional() @IsUUID()
  vendorId?: string

  @IsOptional() @IsUUID()
  agentId?: string | null

  @IsOptional() @IsArray() @IsString({ each: true })
  productTypes?: string[]

  @IsOptional() @IsArray() @IsString({ each: true })
  media?: string[]

  @IsOptional() @IsInt() @Min(1)
  maxWidthMm?: number

  @IsOptional() @IsString() @MaxLength(120)
  hotfolderKey?: string

  @IsOptional() @IsNumber() @Min(0.5) @Max(20)
  deltaETolerance?: number

  @IsOptional() @IsIn(Object.values(PrintDeviceStatus))
  status?: string

  @IsOptional() @IsString()
  notes?: string
}

export class ProfileMeasurementDto {
  @IsString()
  code: string

  @IsOptional() @IsString() @MaxLength(80)
  media?: string

  @IsNumber() @Min(0) @Max(100)
  l: number

  @IsNumber() @Min(-128) @Max(128)
  a: number

  @IsNumber() @Min(-128) @Max(128)
  b: number

  @IsOptional() @IsObject()
  recipe?: Record<string, any>
}

export class UpsertProfilesDto {
  @IsArray() @ArrayMaxSize(2000) @ValidateNested({ each: true }) @Type(() => ProfileMeasurementDto)
  measurements: ProfileMeasurementDto[]
}

export class CreateAgentDto {
  @IsString() @MaxLength(120)
  name: string

  @IsOptional() @IsUUID()
  vendorId?: string
}

export class RoutePreviewDto {
  @IsString()
  productType: string

  @IsArray() @IsString({ each: true })
  colorCodes: string[]

  @IsOptional() @IsNumber() @Min(1)
  widthMm?: number

  @IsOptional() @IsNumber() @Min(1)
  heightMm?: number

  @IsOptional() @IsString()
  media?: string
}

export class DispatchItemDto {
  /** Захиалгын мөр. Order-д мөр байхгүй бол орхино. */
  @IsOptional() @IsUUID()
  orderItemId?: string

  @IsOptional() @IsString()
  productType?: string

  @IsOptional() @IsArray() @IsString({ each: true })
  colorCodes?: string[]

  @IsOptional() @IsNumber() @Min(1)
  widthMm?: number

  @IsOptional() @IsNumber() @Min(1)
  heightMm?: number

  @IsOptional() @IsString()
  media?: string

  @IsOptional() @IsString()
  fileUrl?: string

  @IsOptional() @IsInt() @Min(1)
  quantity?: number

  /** Гараар принтер сонгох (чиглүүлэлтийг алгасахгүй — тохирохгүй бол татгалзана) */
  @IsOptional() @IsUUID()
  deviceId?: string

  @IsOptional() @IsString()
  notes?: string
}

export class DispatchOrderDto {
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => DispatchItemDto)
  items?: DispatchItemDto[]

  /** Аль хэдийн хэвлэгдсэн мөрийг дахин хэвлэх */
  @IsOptional() @IsBoolean()
  reprint?: boolean
}

export class AgentHeartbeatDto {
  @IsOptional() @IsString() @MaxLength(40)
  version?: string

  @IsOptional() @IsString() @MaxLength(120)
  hostname?: string
}

export class AgentPollDto extends AgentHeartbeatDto {
  @IsOptional() @IsInt() @Min(1) @Max(20)
  limit?: number
}

export class AgentTicketStatusDto {
  @IsIn([PrintTicketStatus.CLAIMED, PrintTicketStatus.IN_HOTFOLDER, PrintTicketStatus.PRINTING, PrintTicketStatus.PRINTED, PrintTicketStatus.FAILED])
  status: string

  @IsOptional() @IsString() @MaxLength(2000)
  error?: string
}

export class PrintMediaOptionDto {
  @IsString() @MaxLength(80)
  key: string

  @IsString() @MaxLength(120)
  name: string
}

export class PrintProductTypeDto {
  @Matches(/^[a-z0-9_]{2,40}$/, { message: 'key: жижиг латин үсэг, тоо, _ (жишээ dtf_transfer)' })
  key: string

  @IsString() @MaxLength(120)
  name: string

  @IsOptional() @IsUUID()
  productId?: string | null

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => PrintMediaOptionDto)
  media?: PrintMediaOptionDto[]

  @IsOptional() @IsBoolean()
  isActive?: boolean

  @IsOptional() @IsInt()
  sortOrder?: number
}
