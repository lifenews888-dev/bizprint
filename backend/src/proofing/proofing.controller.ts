import {
  Controller, Get, Post, Patch, Param, Body,
  UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProofingService } from './proofing.service';

@ApiTags('Proofing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('proofing')
export class ProofingController {
  constructor(private readonly svc: ProofingService) {}

  @Get(':orderId/versions')
  getVersions(@Param('orderId') orderId: string) {
    return this.svc.getVersions(orderId);
  }

  @Post(':orderId/versions')
  addVersion(@Param('orderId') orderId: string, @Body('fileUrl') fileUrl: string) {
    return this.svc.addVersion(orderId, fileUrl);
  }

  @Post(':orderId/versions/:versionId/annotations')
  addAnnotation(
    @Param('orderId') orderId: string,
    @Param('versionId') versionId: string,
    @Body() dto: any,
  ) {
    return this.svc.addAnnotation(orderId, versionId, dto);
  }

  @Patch(':orderId/versions/:versionId/annotations/:annId/resolve')
  resolveAnnotation(
    @Param('versionId') versionId: string,
    @Param('annId') annId: string,
  ) {
    return this.svc.resolveAnnotation(versionId, annId);
  }

  @Patch(':orderId/versions/:versionId/review')
  review(
    @Param('versionId') versionId: string,
    @Body() dto: any,
    @Request() req: any,
  ) {
    return this.svc.review(versionId, { ...dto, reviewedById: req.user.id });
  }
}
