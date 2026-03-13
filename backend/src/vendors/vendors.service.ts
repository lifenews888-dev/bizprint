import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Vendor } from './vendor.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private repo: Repository<Vendor>,
  ) {}

  create(data: any) {
    const vendor = this.repo.create(data);
    return this.repo.save(vendor);
  }

  findAll() {
    return this.repo.find();
  }
}