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
}