import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { Vendor } from '../vendors/vendor.entity'
import { Order } from '../orders/entities/order.entity'
import { Machine } from '../machines/machine.entity'
import { ProductionJob } from '../production/entities/production-job.entity'
import { User } from '../users/user.entity'

@Injectable()
export class AdminService {

  constructor(
    @InjectRepository(Vendor)
    private vendorRepo: Repository<Vendor>,

    @InjectRepository(Order)
    private orderRepo: Repository<Order>,

    @InjectRepository(Machine)
    private machineRepo: Repository<Machine>,

    @InjectRepository(ProductionJob)
    private productionRepo: Repository<ProductionJob>,

    @InjectRepository(User)
    private userRepo: Repository<User>
  ) {}

  async getUsers() {
    return this.userRepo.find()
  }

  async getVendors() {
    return this.vendorRepo.find()
  }

  async getMachines() {
    return this.machineRepo.find()
  }

  async getOrders() {
    return this.orderRepo.find()
  }

  async getProductionJobs() {
    return this.productionRepo.find()
  }

}