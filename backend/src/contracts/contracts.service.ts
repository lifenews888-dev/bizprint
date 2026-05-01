import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Contract, ContractStatus } from './contract.entity'

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
  ) {}

  async createFromQuote(quoteId: string) {
    const contract = this.contractRepo.create({
      quote_id: quoteId,
      contract_number: `CT-${Date.now()}`,
      status: ContractStatus.DRAFT,
    })

    return this.contractRepo.save(contract)
  }

  async signContract(id: string, signature: any, ip: string, ua: string) {
    const contract = await this.contractRepo.findOne({ where: { id } })
    if (!contract) throw new Error('Contract not found')

    contract.customer_signature_data = signature
    contract.customer_ip = ip
    contract.customer_user_agent = ua
    contract.status = ContractStatus.SIGNED
    contract.signed_at = new Date()

    return this.contractRepo.save(contract)
  }
}
