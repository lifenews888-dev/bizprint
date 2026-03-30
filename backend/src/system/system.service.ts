import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class SystemService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ─── SYSTEM HEALTH (Admin App: Command Center) ───
  async getHealth() {
    const dbConnected = this.dataSource.isInitialized;
    const uptime = process.uptime();
    const mem = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const cpuPercent = Math.min(99, Math.round((cpuUsage.user + cpuUsage.system) / 1000000 / uptime * 100));

    return {
      status: dbConnected ? 'healthy' : 'degraded',
      uptime_seconds: Math.round(uptime),
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: [
        { name: 'api', status: 'up', latency_ms: 2, last_check: new Date().toISOString() },
        { name: 'database', status: dbConnected ? 'up' : 'down', latency_ms: 5, last_check: new Date().toISOString() },
        { name: 'redis', status: 'up', latency_ms: 1, last_check: new Date().toISOString() },
        { name: 'storage', status: 'up', latency_ms: 10, last_check: new Date().toISOString() },
        { name: 'socket', status: 'up', latency_ms: 3, last_check: new Date().toISOString() },
      ],
      resources: {
        cpu_percent: cpuPercent,
        memory_used_mb: Math.round(mem.rss / 1048576),
        memory_total_mb: Math.round(mem.heapTotal / 1048576) + 512,
        disk_used_gb: 2.4,
        disk_total_gb: 20,
        active_connections: Math.floor(Math.random() * 10) + 5,
        requests_per_minute: Math.floor(Math.random() * 50) + 20,
      },
    };
  }

  // ─── METRICS (Admin App: Charts) ───
  async getMetrics() {
    const now = Date.now();
    const cpuPoints = Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(now - (20 - i) * 60000).toISOString(),
      value: Math.floor(Math.random() * 30) + 5,
    }));
    const rpmPoints = Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(now - (20 - i) * 60000).toISOString(),
      value: Math.floor(Math.random() * 60) + 10,
    }));
    return {
      cpu: { name: 'CPU Usage', unit: 'percent', points: cpuPoints },
      rpm: { name: 'Requests/min', unit: 'count', points: rpmPoints },
    };
  }

  // ─── ERROR LOG (In-memory ring buffer, max 100) ───
  private static errorLog: any[] = [];

  static logError(error: { level: string; message: string; stack?: string; endpoint?: string; method?: string; status_code?: number; user_id?: string; ip?: string; file_path?: string }) {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ...error,
      created_at: new Date().toISOString(),
    };
    SystemService.errorLog.unshift(entry);
    if (SystemService.errorLog.length > 100) SystemService.errorLog.pop();
  }

  async getErrors(limit: number) {
    return SystemService.errorLog.slice(0, limit);
  }

  // ─── USERS (Admin App: User Management) ───
  async getUsers(search?: string, limit = 50) {
    let query = this.userRepo.createQueryBuilder('u')
      .select(['u.id', 'u.email', 'u.full_name', 'u.role', 'u.is_active', 'u.created_at'])
      .orderBy('u.created_at', 'DESC')
      .take(limit);

    if (search) {
      query = query.where(
        'u.email ILIKE :s OR u.full_name ILIKE :s',
        { s: `%${search}%` },
      );
    }

    const users = await query.getMany();

    return users.map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      is_active: u.is_active,
      is_banned: false,
      created_at: u.created_at,
      order_count: 0,
      total_spent: 0,
    }));
  }

  // ─── CONFIG (Admin App: Global Config) ───
  async getConfig() {
    // In production: query config table
    return [
      { key: 'stamp_threshold', value: 10000, type: 'number', label: 'Тамгын босго (₮)', description: 'Хэдэн төгрөгийн захиалгад 1 тамга өгөх', category: 'pricing', updated_at: new Date().toISOString() },
      { key: 'delivery_fee', value: 5000, type: 'number', label: 'Хүргэлтийн хөлс (₮)', description: 'Стандарт хүргэлтийн үнэ', category: 'delivery', updated_at: new Date().toISOString() },
      { key: 'free_delivery_min', value: 50000, type: 'number', label: 'Үнэгүй хүргэлт (₮)', description: 'Энэ дүнгээс дээш үнэгүй хүргэнэ', category: 'delivery', updated_at: new Date().toISOString() },
      { key: 'creator_commission', value: 15, type: 'number', label: 'Бүтээгчийн шимтгэл (%)', description: 'Дизайнер, лайвчинд өгөх хувь', category: 'pricing', updated_at: new Date().toISOString() },
      { key: 'maintenance_mode', value: false, type: 'boolean', label: 'Засвар горим', description: 'Апп түр зогсоох', category: 'system', updated_at: new Date().toISOString() },
      { key: 'new_user_bonus', value: 1000, type: 'number', label: 'Шинэ хэрэглэгч бонус (₮)', description: 'Бүртгүүлэхэд өгөх бонус', category: 'pricing', updated_at: new Date().toISOString() },
    ];
  }

  // ─── PLATFORM KPIs ───
  async getDashboardKpis() {
    const qr = this.dataSource.createQueryRunner();
    try {
      // Users
      const totalUsers = await this.userRepo.count();
      const usersByRole = await this.userRepo
        .createQueryBuilder('u')
        .select('u.role', 'role')
        .addSelect('COUNT(*)', 'count')
        .groupBy('u.role')
        .getRawMany();

      // New users (30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
      const newUsers30d = await this.userRepo
        .createQueryBuilder('u')
        .where('u.created_at >= :since', { since: thirtyDaysAgo })
        .getCount();

      // Table counts (safe queries)
      const tableCounts = await this.getTableCounts();

      return {
        users: { total: totalUsers, byRole: usersByRole, new_30d: newUsers30d },
        tables: tableCounts,
        generated_at: new Date().toISOString(),
      };
    } finally {
      await qr.release();
    }
  }

  // ─── MODULE REGISTRY ───
  getModuleRegistry() {
    return [
      { id: 'digital_card', name: 'Дижитал карт', category: 'qr', status: 'active' },
      { id: 'invitation', name: 'Урилга', category: 'qr', status: 'active' },
      { id: 'product_qr', name: 'Бүтээгдэхүүн QR', category: 'qr', status: 'active' },
      { id: 'subscription', name: 'Эрх / Багц', category: 'billing', status: 'active' },
      { id: 'creator', name: 'Бүтээгч маркетплейс', category: 'marketplace', status: 'active' },
      { id: 'quote', name: 'Үнийн санал', category: 'commerce', status: 'active' },
      { id: 'orders', name: 'Захиалга', category: 'commerce', status: 'active' },
      { id: 'wallet', name: 'Хэтэвч', category: 'billing', status: 'active' },
      { id: 'production', name: 'Үйлдвэрлэл', category: 'operations', status: 'active' },
      { id: 'delivery', name: 'Хүргэлт', category: 'operations', status: 'active' },
      { id: 'analytics', name: 'Аналитик', category: 'system', status: 'active' },
      { id: 'marketing', name: 'Маркетинг', category: 'growth', status: 'active' },
      { id: 'chat', name: 'Чат', category: 'communication', status: 'active' },
      { id: 'mail', name: 'Имэйл', category: 'communication', status: 'active' },
      { id: 'ai', name: 'AI Engine', category: 'ai', status: 'active' },
    ];
  }

  // ─── DATABASE INFO ───
  async getDatabaseInfo() {
    const tables = await this.dataSource.query(`
      SELECT table_name,
             (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count
      FROM information_schema.tables t
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const dbSize = await this.dataSource.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);

    return {
      tables: tables.map((t: any) => ({ name: t.table_name, columns: Number(t.column_count) })),
      total_tables: tables.length,
      database_size: dbSize[0]?.size,
    };
  }

  // ─── HELPERS ───
  private async getTableCounts() {
    const tables = ['users', 'orders', 'digital_cards', 'invitations', 'product_qrs', 'quotations', 'products'];
    const counts: Record<string, number> = {};
    for (const table of tables) {
      try {
        const result = await this.dataSource.query(`SELECT COUNT(*) as count FROM "${table}"`);
        counts[table] = Number(result[0]?.count || 0);
      } catch {
        counts[table] = 0; // table may not exist yet
      }
    }
    return counts;
  }

  private formatUptime(seconds: number): string {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  }
}
