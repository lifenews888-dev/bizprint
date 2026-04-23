import { Response } from 'express';
import { Response 
  @Get('export')
  @Roles('admin')
  async exportOrders(@Res() res: Response) {
    const csv = await this.ordersService.exportOrdersCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send(csv);
  }

  @Get(':id/invoice')
  @Roles('admin', 'customer')
  async downloadInvoice(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.ordersService.generateInvoicePdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="invoice-' + id + '.pdf"');
    res.send(pdfBuffer);
  }
}