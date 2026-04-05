import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProofingService } from './proofing.service';

@ApiTags('Proofing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('proofing')
export class ProofingController {
  constructor(private readonly svc: ProofingService) {}

  @Get(':orderId/summary')
  @ApiOperation({ summary: 'Proof-ийн товч мэдээлэл' })
  getSummary(@Param('orderId') orderId: string) {
    return this.svc.getSummary(orderId);
  }

  @Get(':orderId/versions')
  @ApiOperation({ summary: 'Бүх proof хувилбарууд' })
  getVersions(@Param('orderId') orderId: string) {
    return this.svc.getVersions(orderId);
  }

  @Get(':orderId/latest')
  @ApiOperation({ summary: 'Хамгийн сүүлийн хувилбар' })
  getLatest(@Param('orderId') orderId: string) {
    return this.svc.getLatestVersion(orderId);
  }

  @Post(':orderId/versions')
  @ApiOperation({ summary: 'Шинэ proof хувилбар нэмэх' })
  addVersion(@Param('orderId') orderId: string, @Body('fileUrl') fileUrl: string) {
    return this.svc.addVersion(orderId, fileUrl);
  }

  @Post(':orderId/versions/:versionId/annotations')
  @ApiOperation({ summary: 'Annotation нэмэх' })
  addAnnotation(
    @Param('orderId') orderId: string,
    @Param('versionId') versionId: string,
    @Body() dto: any,
  ) {
    return this.svc.addAnnotation(orderId, versionId, dto);
  }

  @Patch(':orderId/versions/:versionId/annotations/:annId/resolve')
  @ApiOperation({ summary: 'Annotation шийдэгдсэн гэж тэмдэглэх' })
  resolveAnnotation(
    @Param('versionId') versionId: string,
    @Param('annId') annId: string,
  ) {
    return this.svc.resolveAnnotation(versionId, annId);
  }

  @Delete(':orderId/versions/:versionId/annotations/:annId')
  @ApiOperation({ summary: 'Annotation устгах' })
  deleteAnnotation(
    @Param('versionId') versionId: string,
    @Param('annId') annId: string,
  ) {
    return this.svc.deleteAnnotation(versionId, annId);
  }

  @Patch(':orderId/versions/:versionId/review')
  @ApiOperation({ summary: 'Proof батлах / засвар шаардах' })
  review(
    @Param('versionId') versionId: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return this.svc.review(versionId, { ...dto, reviewedById: req.user.id });
  }

  @Get('pending')
  @ApiOperation({ summary: 'Proof хүлээж буй захиалгууд' })
  getPendingOrders() {
    return this.svc.getOrdersNeedingProof();
  }
}
