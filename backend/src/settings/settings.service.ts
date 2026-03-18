import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './settings.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private repo: Repository<Setting>,
  ) {}

  async getAll(): Promise<Record<string, string>> {
    const settings = await this.repo.find();
    const result: Record<string, string> = {};
    settings.forEach(s => (result[s.key] = s.value));
    return result;
  }

  async get(key: string): Promise<string | null> {
    const s = await this.repo.findOne({ where: { key } });
    return s ? s.value : null;
  }

  async set(key: string, value: string, type = 'text', label = ''): Promise<Setting> {
    let s = await this.repo.findOne({ where: { key } });
    if (s) {
      s.value = value;
      s.type = type;
      if (label) s.label = label;
    } else {
      s = this.repo.create({ key, value, type, label });
    }
    return this.repo.save(s);
  }

  async bulkSet(data: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.repo.delete({ key });
  }
}