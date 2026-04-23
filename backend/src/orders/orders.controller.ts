import { Response 
  @Get('export')
  @Roles('admin')
  async exportOrders(@Res() res: Response) {
    const csv = await this.ordersService.exportOrdersCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="orders.csv"');
    res.send(csv);
  }
}