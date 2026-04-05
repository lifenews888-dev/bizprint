import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProofVersion } from './entities/proof-version.entity';

@Injectable()
export class ProofingService {
  constructor(
    @InjectRepository(ProofVersion)
    private repo: Repository<ProofVersion>,
  ) {}

  async getVersions(orderId: string): Promise<ProofVersion[]> {
    return this.repo.find({ where: { orderId }, order: { version: 'ASC' } });
  }

  async addVersion(orderId: string, fileUrl: string): Promise<ProofVersion> {
    const last = await this.repo.findOne({ where: { orderId }, order: { version: 'DESC' } });
    return this.repo.save(this.repo.create({
      orderId,
      fileUrl,
      version: (last?.version ?? 0) + 1,
    }));
  }

  async addAnnotation(orderId: string, versionId: string, annotation: any): Promise<ProofVersion> {
    const v = await this.repo.findOne({ where: { id: versionId } });
    if (!v) throw new NotFoundException('Proof version олдсонгүй');
    v.annotations = [
      ...(v.annotations ?? []),
      { ...annotation, id: Date.now().toString(), resolved: false, createdAt: new Date() },
    ];
    return this.repo.save(v);
  }

  async resolveAnnotation(versionId: string, annotationId: string): Promise<ProofVersion> {
    const v = await this.repo.findOne({ where: { id: versionId } });
    if (!v) throw new NotFoundException('Proof version олдсонгүй');
    v.annotations = v.annotations.map((a: any) =>
      a.id === annotationId ? { ...a, resolved: true } : a,
    );
    return this.repo.save(v);
  }

  async review(versionId: string, dto: {
    status: string;
    note?: string;
    reviewedById: string;
  }): Promise<ProofVersion> {
    await this.repo.update(versionId, {
      status: dto.status,
      reviewNote: dto.note,
      reviewedById: dto.reviewedById,
      reviewedAt: new Date(),
    });
    return this.repo.findOne({ where: { id: versionId } });
  }
}
