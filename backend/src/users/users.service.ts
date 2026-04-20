import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(filters: { role?: string; limit?: number } = {}): Promise<User[]> {
    const qb = this.usersRepository.createQueryBuilder('u').orderBy('u.created_at', 'DESC');
    if (filters.role) qb.andWhere('u.role = :role', { role: filters.role });
    if (filters.limit && filters.limit > 0) qb.take(Math.min(filters.limit, 500));
    return qb.getMany();
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findCreators(): Promise<Partial<User>[]> {
    return this.usersRepository
      .createQueryBuilder('u')
      .where('u.role = :role', { role: 'creator' })
      .andWhere('u.is_active = true')
      .select([
        'u.id', 'u.full_name', 'u.avatar_url', 'u.bio',
        'u.starting_price', 'u.delivery_days', 'u.service_categories',
        'u.portfolio_url', 'u.creator_tier', 'u.creator_rating', 'u.creator_completed',
        'u.created_at',
      ])
      .orderBy('u.creator_completed', 'DESC')
      .getMany();
  }

  async findCreatorById(id: string): Promise<Partial<User> | null> {
    return this.usersRepository
      .createQueryBuilder('u')
      .where('u.id = :id', { id })
      .andWhere('u.role = :role', { role: 'creator' })
      .select([
        'u.id', 'u.full_name', 'u.avatar_url', 'u.bio',
        'u.starting_price', 'u.delivery_days', 'u.service_categories',
        'u.portfolio_url', 'u.creator_tier', 'u.creator_rating', 'u.creator_completed',
        'u.created_at',
      ])
      .getOne();
  }

  async updateProfile(id: string, data: Partial<User>): Promise<Partial<User> | null> {
    const safe = [
      'full_name','phone','avatar_url','bio',
      'starting_price','delivery_days','service_categories',
      'portfolio_url','creator_tier','bank_name','bank_account','bank_account_name',
    ];
    const patch: any = {};
    for (const k of safe) { if (data[k] !== undefined) patch[k] = data[k]; }
    await this.usersRepository.update(id, patch);
    return this.findOne(id);
  }
}