import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';

@Injectable()
export class EventsLogService {
  constructor(
    @InjectRepository(Event)
    private readonly repo: Repository<Event>,
  ) {}

  async log(data: {
    entity_type: string;
    entity_id: string;
    action: string;
    old_value?: Record<string, any>;
    new_value?: Record<string, any>;
    actor_id?: string;
    actor_type?: string;
    metadata?: Record<string, any>;
  }) {
    const event = this.repo.create({
      ...data,
      actor_type: data.actor_type || 'system',
    });
    return this.repo.save(event);
  }

  async findByEntity(entity_type: string, entity_id: string) {
    return this.repo.find({
      where: { entity_type, entity_id },
      order: { created_at: 'DESC' },
    });
  }

  async findByType(entity_type: string, limit = 50) {
    return this.repo.find({
      where: { entity_type },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async findRecent(limit = 100) {
    return this.repo.find({
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
