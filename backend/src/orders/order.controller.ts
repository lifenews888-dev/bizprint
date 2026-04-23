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

@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private ops: OrderOpsService,
    private filesService: FilesService,
    private pdfInspector: PdfInspectorService,
    private uploadService: UploadService,
  ) {}

  /* âââââââââââââââââââââââââââââââââââââââ
   *  OPS â KPI, Alerts, Bulk (BEFORE :id routes!)
   * âââââââââââââââââââââââââââââââââââââââ */

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

  @Post('bulk/status')
  @UseGuards(JwtAuthGuard)
  bulkStatus(@Body() body: { order_ids: string[]; status: string }, @Request() req: any) {
    return this.ops.bulkUpdateStatus(body.order_ids, body.status, req.user?.email);
  }

  @Post('bulk/assign')
  @UseGuards(JwtAuthGuard)
  bulkAssign(@Body() body: { order_ids: string[]; vendor_id: string }) {
    return this.ops.bulkAssignVendor(body.order_ids, body.vendor_id);
  }

  @Post('bulk/priority')
  @UseGuards(JwtAuthGuard)
  bulkPriority(@Body() body: { order_ids: string[]; priority: string }) {
    return this.ops.bulkSetPriority(body.order_ids, body.priority);
  }

  @Post('bulk/cancel')
  @UseGuards(JwtAuthGuard)
  bulkCancel(@Body() body: { order_ids: string[] }) {
    return this.ops.bulkCancel(body.order_ids);
  }

  /* âââââââââââââââââââââââââââââââââââââââ
   *  CRUD â standard order endpoints
   * âââââââââââââââââââââââââââââââââââââââ */

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

  @Get()
  @UseGuards(JwtAuthGuard)
  getAll() {
    return this.ordersService.getOrders();
  }

  @Get('customer/:customer_id')
  @UseGuards(JwtAuthGuard)
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

  // âââ Public order tracking (no auth) âââ
  @Get('track/:orderNumber')
  async trackOrder(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.getPublicTracking(orderNumber);
  }

  /* âââââââââââââââââââââââââââââââââââââââ
   *  :id routes (AFTER static routes)
   * âââââââââââââââââââââââââââââââââââââââ */

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getOne(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Get(':id/files')
  @UseGuards(JwtAuthGuard)
  async getOrderFiles(@Param('id') orderId: string) {
    await this.ordersService.getOrderById(orderId);
    return this.filesService.findByOrder(orderId);
  }

  @Get(':id/timeline')
  @UseGuards(JwtAuthGuard)
  getTimeline(@Param('id') id: string) {
    return this.ops.getTimeline(id);
  }

  @Get(':id/status-logs')
  @UseGuards(JwtAuthGuard)
  getStatusLogs(@Param('id') id: string) {
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
    if (!file) throw new BadRequestException('Ð¤Ð°Ð¹Ð» Ð±Ð°Ð¹ÑÐ³Ò¯Ð¹ Ð±Ð°Ð¹Ð½Ð°');

    const order = await this.ordersService.getOrderById(orderId);
    const allowedStatuses = ['pending_file', 'file_rejected'];
    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Ð¤Ð°Ð¹Ð» Ð¾ÑÑÑÐ»Ð°Ñ Ð±Ð¾Ð»Ð¾Ð¼Ð¶Ð³Ò¯Ð¹. ÐÐ°ÑÐ¸Ð°Ð»Ð³ÑÐ½ ÑÓ©Ð»Ó©Ð²: "${order.status}". ÐÓ©Ð²ÑÓ©Ð½ "pending_file" ÑÑÐ²ÑÐ» "file_rejected" Ò¯ÐµÐ´ ÑÐ°Ð¹Ð» Ð¾ÑÑÑÐ»Ð½Ð°.`,
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
      await this.ordersService.updateOrder(orderId, { status: 'file_review' });
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
        ? `Ð¤Ð°Ð¹Ð» Ð°Ð¼Ð¶Ð¸Ð»ÑÑÐ°Ð¹ Ð¾ÑÑÑÐ»Ð¶, PDF ÑÐ¸Ð½Ð¶Ð¸Ð»Ð³ÑÑ ÑÐ¸Ð¹Ð³Ð´Ð»ÑÑ. ÐÐ½Ð¾Ð¾: ${analysis?.score ?? '-'}/100`
        : 'Ð¤Ð°Ð¹Ð» Ð°Ð¼Ð¶Ð¸Ð»ÑÑÐ°Ð¹ Ð¾ÑÑÑÐ»Ð°Ð³Ð´Ð»Ð°Ð°. Ð¨Ð°Ð»Ð³Ð°Ð»ÑÐ°Ð´ Ð¾ÑÐ»Ð¾Ð¾.',
    };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Body() body: any, @Request() req: any) {
    return this.ordersService.updateOrder(id, body, { id: req.user?.id, role: req.user?.role });
  }

  @Patch(':id/revert')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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