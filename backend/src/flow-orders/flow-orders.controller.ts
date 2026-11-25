import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FlowOrdersService } from './flow-orders.service';
import { FlowTokenGuard } from './flow-token.guard';
import { FlowCatalogService } from './flow-catalog.service';
import {
  CreateFlowOrderDto,
  FlowCatalogQuery,
  FlowQuoteDto,
  ListFlowOrdersQuery,
  UpdateFlowOrderDto,
} from './dto/flow-order.dto';

/**
 * n8n автомат урсгалд зориулсан сервер-сервер API.
 *   POST  /api/flow/orders        захиалга үүсгэх (үнийг сервер бодно)
 *   GET   /api/flow/orders        жагсаалт (?status=&conversationId=&limit=)
 *   GET   /api/flow/orders/:id    нэг захиалга
 *   PATCH /api/flow/orders/:id    төлөв / талбар шинэчлэх (төлөвийн шилжилтийг шалгана)
 */
@Controller('flow/orders')
@UseGuards(FlowTokenGuard)
export class FlowOrdersController {
  constructor(private readonly service: FlowOrdersService) {}

  @Post()
  create(@Body() dto: CreateFlowOrderDto) {
    return this.service.create(dto);
  }

  @Get()
  list(@Query() q: ListFlowOrdersQuery) {
    return this.service.list(q);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateFlowOrderDto,
  ) {
    return this.service.update(id, dto);
  }
}

/**
 * Албан үнийн жагсаалт — чатбот (Яриа), n8n нэг эх сурвалжаас үнэ авна.
 *   GET  /api/flow/catalog?category=flag   бүтээгдэхүүн, хувилбар, НӨАТ орсон үнэ
 *   POST /api/flow/quote                   нэг мөрийн үнэ (хэмжээ, тал, нэмэлт)
 */
@Controller('flow')
@UseGuards(FlowTokenGuard)
export class FlowCatalogController {
  constructor(private readonly catalog: FlowCatalogService) {}

  @Get('catalog')
  list(@Query() q: FlowCatalogQuery) {
    return this.catalog.list(q.category);
  }

  @Post('quote')
  quote(@Body() dto: FlowQuoteDto) {
    return this.catalog.quote(dto);
  }
}
