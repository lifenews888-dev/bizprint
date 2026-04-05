import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProofVersion } from './entities/proof-version.entity';

export interface ProofSummary {
  orderId: string;
  totalVersions: number;
  latestVersion: number;
  latestStatus: string;
  openAnnotations: number;
  resolvedAnnotations: number;
  lastUpdated: Date | null;
}

@Injectable()
export class ProofingService {
  private readonly logger = new Logger(ProofingService.name);

  constructor(
    @InjectRepository(ProofVersion)
    private repo: Repository<ProofVersion>,
  ) {}

  async getVersions(orderId: string): Promise<ProofVersion[]> {
    return this.repo.find({ where: { orderId }, order: { version: 'ASC' } });
  }

  async getLatestVersion(orderId: string): Promise<ProofVersion | null> {
    return this.repo.findOne({ where: { orderId }, order: { version: 'DESC' } });
  }

  async getSummary(orderId: string): Promise<ProofSummary> {
    const versions = await this.getVersions(orderId);
    const latest = versions[versions.length - 1] ?? null;
    const allAnnotations = versions.flatMap(v => v.annotations ?? []);

    return {
      orderId,
      totalVersions: versions.length,
      latestVersion: latest?.version ?? 0,
      latestStatus: latest?.status ?? 'none',
      openAnnotations: allAnnotations.filter((a: any) => !a.resolved).length,
      resolvedAnnotations: allAnnotations.filter((a: any) => a.resolved).length,
      lastUpdated: latest?.reviewedAt ?? latest?.createdAt ?? null,
    };
  }

  async addVersion(orderId: string, fileUrl: string): Promise<ProofVersion> {
    const last = await this.repo.findOne({ where: { orderId }, order: { version: 'DESC' } });
    const version = (last?.version ?? 0) + 1;

    this.logger.log(`Proof v${version} нэмэгдлээ: order=${orderId}`);

    return this.repo.save(this.repo.create({
      orderId,
      fileUrl,
      version,
    }));
  }

  async addAnnotation(_orderId: string, versionId: string, annotation: any): Promise<ProofVersion> {
    const v = await this.repo.findOne({ where: { id: versionId } });
    if (!v) throw new NotFoundException('Proof version олдсонгүй');

    const ann = {
      ...annotation,
      id: Date.now().toString(),
      type: annotation.type ?? 'pin', // pin | area | note
      resolved: false,
      createdAt: new Date(),
    };

    v.annotations = [...(v.annotations ?? []), ann];
    return this.repo.save(v);
  }

  async resolveAnnotation(versionId: string, annotationId: string): Promise<ProofVersion> {
    const v = await this.repo.findOne({ where: { id: versionId } });
    if (!v) throw new NotFoundException('Proof version олдсонгүй');
    v.annotations = v.annotations.map((a: any) =>
      a.id === annotationId ? { ...a, resolved: true, resolvedAt: new Date() } : a,
    );
    return this.repo.save(v);
  }

  async deleteAnnotation(versionId: string, annotationId: string): Promise<ProofVersion> {
    const v = await this.repo.findOne({ where: { id: versionId } });
    if (!v) throw new NotFoundException('Proof version олдсонгүй');
    v.annotations = v.annotations.filter((a: any) => a.id !== annotationId);
    return this.repo.save(v);
  }

  async review(versionId: string, dto: {
    status: string;
    note?: string;
    reviewedById: string;
  }): Promise<ProofVersion> {
    const v = await this.repo.findOne({ where: { id: versionId } });
    if (!v) throw new NotFoundException('Proof version олдсонгүй');

    this.logger.log(`Proof ${versionId} → ${dto.status} (by ${dto.reviewedById})`);

    await this.repo.update(versionId, {
      status: dto.status,
      reviewNote: dto.note,
      reviewedById: dto.reviewedById,
      reviewedAt: new Date(),
    });
    return this.repo.findOne({ where: { id: versionId } });
  }

  async getOrdersNeedingProof(): Promise<string[]> {
    const results = await this.repo
      .createQueryBuilder('pv')
      .select('DISTINCT pv."orderId"', 'orderId')
      .where('pv.status = :status', { status: 'pending' })
      .getRawMany();
    return results.map(r => r.orderId);
  }
}
