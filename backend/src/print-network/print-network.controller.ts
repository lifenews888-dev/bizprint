import {
  Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, Query, Req, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { SkipThrottle, Throttle } from '@nestjs/throttler'
import { PRINT_FILE_MAX_BYTES, PerUserThrottlerGuard, printFileFilter, printFileStorage, verifyPrintFile } from './print-files'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { PrintNetworkService } from './print-network.service'
import { PrintAgentGuard } from './print-agent.guard'
import { PrintAutomationService } from './print-automation.service'
import {
  AgentHeartbeatDto, AgentPollDto, AgentTicketStatusDto, BulkColorCodesDto, CheckColorsDto, ColorCodeDto,
  CreateAgentDto, DispatchOrderDto, PrintDeviceDto, PrintProductTypeDto, RoutePreviewDto, UpdateColorCodeDto, UpdatePrintDeviceDto,
  UpsertProfilesDto,
} from './dto'

/** Нийтийн: өнгөний каталог ба боломжийн шалгалт (захиалгын портал) */
@Controller('print-network/colors')
export class ColorCatalogController {
  constructor(private readonly svc: PrintNetworkService) {}

  @Get()
  list(@Query('family') family?: string, @Query('productType') productType?: string) {
    return this.svc.listColors({ family, productType })
  }

  @Post('check')
  check(@Body() dto: CheckColorsDto) {
    return this.svc.checkColors(dto)
  }
}

/** Нийтийн/захиалагч: хэвлэлийн төрөл, хэвлэлийн файл upload */
@Controller('print-network')
export class PrintOrderingController {
  constructor(private readonly svc: PrintNetworkService) {}

  @Get('product-types')
  productTypes() {
    return this.svc.listProductTypes()
  }

  @Post('files')
  @UseGuards(JwtAuthGuard, PerUserThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60 * 60 * 1000 } })
  @UseInterceptors(FileInterceptor('file', {
    storage: printFileStorage,
    fileFilter: printFileFilter,
    limits: { fileSize: PRINT_FILE_MAX_BYTES },
  }))
  upload(@UploadedFile() file: Express.Multer.File) {
    return verifyPrintFile(file)
  }
}

/** Админ: каталог, принтер, калибровк, агент, чиглүүлэлт */
@Controller('print-network/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class PrintNetworkAdminController {
  constructor(private readonly svc: PrintNetworkService, private readonly automation: PrintAutomationService) {}

  // Өнгө
  @Get('colors')
  listColors(@Query('family') family?: string) {
    return this.svc.listColors({ family, includeInactive: true })
  }

  @Post('colors')
  createColor(@Body() dto: ColorCodeDto) {
    return this.svc.createColor(dto)
  }

  @Post('colors/bulk')
  bulkColors(@Body() dto: BulkColorCodesDto) {
    return this.svc.bulkUpsertColors(dto.colors)
  }

  @Patch('colors/:id')
  updateColor(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateColorCodeDto) {
    return this.svc.updateColor(id, dto)
  }

  @Delete('colors/:id')
  deactivateColor(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.updateColor(id, { isActive: false })
  }

  // Хэвлэлийн төрөл
  @Get('product-types')
  listProductTypes() {
    return this.svc.listProductTypes(true)
  }

  @Put('product-types')
  upsertProductType(@Body() dto: PrintProductTypeDto) {
    return this.svc.upsertProductType(dto)
  }

  // Принтер
  @Get('devices')
  listDevices() {
    return this.svc.listDevices()
  }

  @Post('devices')
  createDevice(@Body() dto: PrintDeviceDto) {
    return this.svc.createDevice(dto)
  }

  @Patch('devices/:id')
  updateDevice(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePrintDeviceDto) {
    return this.svc.updateDevice(id, dto)
  }

  @Get('devices/:id/profiles')
  getProfiles(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getProfiles(id)
  }

  @Put('devices/:id/profiles')
  upsertProfiles(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpsertProfilesDto) {
    return this.svc.upsertProfiles(id, dto)
  }

  @Delete('devices/:id/profiles/:code')
  deleteProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('code') code: string,
    @Query('media') media?: string,
  ) {
    return this.svc.deleteProfile(id, code, media ?? '')
  }

  @Get('orders')
  printOrders(@Query('limit') limit?: string) {
    return this.svc.listPrintOrders(limit ? Number(limit) : undefined)
  }

  /** Файлын шалгалтын анхааруулгыг үл харгалзан хэвлэлд оруулах */
  @Post('orders/:orderId/approve')
  approve(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.automation.approve(orderId)
  }

  // Агент
  @Get('agents')
  listAgents() {
    return this.svc.listAgents()
  }

  @Post('agents')
  createAgent(@Body() dto: CreateAgentDto) {
    return this.svc.createAgent(dto)
  }

  @Post('agents/:id/rotate-token')
  rotateToken(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.rotateAgentToken(id)
  }

  // Чиглүүлэлт ба тасалбар
  @Post('route/preview')
  preview(@Body() dto: RoutePreviewDto) {
    return this.svc.previewRoute(dto)
  }

  @Post('orders/:orderId/dispatch')
  dispatch(@Param('orderId', ParseUUIDPipe) orderId: string, @Body() dto: DispatchOrderDto) {
    return this.svc.dispatchOrder(orderId, dto)
  }

  @Get('tickets')
  listTickets(
    @Query('status') status?: string,
    @Query('orderId') orderId?: string,
    @Query('deviceId') deviceId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listTickets({ status, orderId, deviceId, limit: limit ? Number(limit) : undefined })
  }

  @Get('tickets/:id')
  getTicket(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getTicket(id)
  }

  @Post('tickets/:id/requeue')
  requeue(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.requeueTicket(id)
  }

  @Post('tickets/:id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.cancelTicket(id)
  }
}

/** Цехийн агент: X-Agent-Token толгойгоор нэвтэрнэ */
@Controller('print-agent')
@UseGuards(PrintAgentGuard)
@SkipThrottle()
export class PrintAgentController {
  constructor(private readonly svc: PrintNetworkService, private readonly automation: PrintAutomationService) {}

  @Post('heartbeat')
  async heartbeat(@Req() req: any, @Body() dto: AgentHeartbeatDto) {
    await this.svc.touchAgent(req.printAgent, dto)
    return { ok: true, agentId: req.printAgent.id, name: req.printAgent.name }
  }

  @Post('poll')
  poll(@Req() req: any, @Body() dto: AgentPollDto) {
    return this.svc.agentPoll(req.printAgent, dto)
  }

  @Post('tickets/:id/status')
  async status(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AgentTicketStatusDto) {
    const t = await this.svc.agentUpdateTicket(req.printAgent, id, dto)
    // Захиалгын төлөв ба мэдэгдэл (keep-alive-д биш). Алдаа нь агентын хариуг саатуулахгүй.
    if (dto.status !== 'claimed') void this.automation.onTicketStatus(t.orderId, dto.status, { id: t.id, error: t.error })
    return t
  }
}

/**
 * Үйлдвэр (vendor/factory): ӨӨРИЙН агент, принтер, өнгөний калибровк, тасалбар.
 * Хүрээг нэвтэрсэн хэрэглэгчийн vendors.user_id-аар серверт тогтооно — клиентээс авахгүй.
 */
@Controller('print-network/vendor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('vendor', 'factory')
export class PrintNetworkVendorController {
  constructor(private readonly svc: PrintNetworkService) {}

  private vendor(req: any) {
    return this.svc.vendorIdForUser(req.user.id)
  }

  @Get('me')
  async me(@Req() req: any) {
    return { vendorId: await this.vendor(req) }
  }

  @Get('product-types')
  productTypes() {
    return this.svc.listProductTypes()
  }

  @Get('colors')
  colors() {
    return this.svc.listColors({})
  }

  @Get('devices')
  async listDevices(@Req() req: any) {
    return this.svc.listDevices(await this.vendor(req))
  }

  @Post('devices')
  async createDevice(@Req() req: any, @Body() dto: PrintDeviceDto) {
    return this.svc.createDevice(dto, await this.vendor(req))
  }

  @Patch('devices/:id')
  async updateDevice(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePrintDeviceDto) {
    return this.svc.updateDevice(id, dto, await this.vendor(req))
  }

  @Get('devices/:id/profiles')
  async getProfiles(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.getProfiles(id, await this.vendor(req))
  }

  @Put('devices/:id/profiles')
  async upsertProfiles(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpsertProfilesDto) {
    return this.svc.upsertProfiles(id, dto, await this.vendor(req))
  }

  @Delete('devices/:id/profiles/:code')
  async deleteProfile(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Param('code') code: string, @Query('media') media?: string) {
    return this.svc.deleteProfile(id, code, media ?? '', await this.vendor(req))
  }

  @Get('agents')
  async listAgents(@Req() req: any) {
    return this.svc.listAgents(await this.vendor(req))
  }

  @Post('agents')
  async createAgent(@Req() req: any, @Body() dto: CreateAgentDto) {
    return this.svc.createAgent(dto, await this.vendor(req))
  }

  @Post('agents/:id/rotate-token')
  async rotateToken(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.rotateAgentToken(id, await this.vendor(req))
  }

  @Get('orders')
  async orders(@Req() req: any, @Query('limit') limit?: string) {
    return this.svc.listPrintOrders(limit ? Number(limit) : undefined, await this.vendor(req))
  }

  @Get('tickets')
  async tickets(@Req() req: any, @Query('status') status?: string, @Query('limit') limit?: string) {
    return this.svc.listTickets({ status, limit: limit ? Number(limit) : undefined }, await this.vendor(req))
  }

  @Post('tickets/:id/requeue')
  async requeue(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.requeueTicket(id, await this.vendor(req))
  }

  @Post('tickets/:id/cancel')
  async cancel(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.cancelTicket(id, await this.vendor(req))
  }
}
