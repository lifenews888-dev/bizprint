import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import * as fs from 'fs'
import * as path from 'path'
import { createHash } from 'crypto'

/**
 * MigrationsRunnerService — runs pending SQL migrations from
 * `backend/migrations/*.sql` BEFORE the app accepts traffic.
 *
 * Why this exists: TypeORM `synchronize` is unsafe in production (it can
 * silently drop columns, rewrite types, lose data). Disabling it stops
 * those risks but means we have to apply schema changes ourselves every
 * deploy. Doing that by hand caused us to crash production multiple times
 * in a single week. This runner makes schema changes safe and automatic:
 *
 *   1. Add a new .sql file to backend/migrations/ (filename determines order:
 *      YYYY-MM-DD-NN-description.sql).
 *   2. Push to main. Railway redeploys.
 *   3. On boot, runner reads the migrations folder, compares against the
 *      `_schema_migrations` table, and applies any new files inside a
 *      transaction. Each file is hashed; if the same filename comes back
 *      with a different hash we abort (someone edited an applied
 *      migration — that's never safe).
 *   4. Server starts serving traffic only after migrations succeed.
 *
 * If a migration fails, the app crashes loudly with the full error and the
 * deploy is rolled back by Railway — much louder + safer than running
 * silently with mismatched schema.
 *
 * Idempotency: SQL files should themselves use `IF NOT EXISTS` etc so a
 * partially-applied migration on retry still works.
 */
@Injectable()
export class MigrationsRunnerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MigrationsRunnerService.name)

  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async onApplicationBootstrap() {
    if (process.env.SKIP_MIGRATIONS === '1') {
      this.logger.warn('SKIP_MIGRATIONS=1 — schema migrations skipped')
      return
    }

    const folder = this.resolveMigrationsFolder()
    if (!folder) {
      this.logger.warn('No migrations folder found — skipping')
      return
    }

    await this.ensureTrackingTable()

    const files = fs.readdirSync(folder)
      .filter(f => f.toLowerCase().endsWith('.sql'))
      .sort()

    if (!files.length) {
      this.logger.log('No SQL migration files present')
      return
    }

    const applied = await this.loadApplied()
    let ranCount = 0

    for (const file of files) {
      const filepath = path.join(folder, file)
      const sql = fs.readFileSync(filepath, 'utf-8')
      const hash = createHash('sha256').update(sql).digest('hex')

      const existing = applied.get(file)
      if (existing) {
        if (existing.checksum && existing.checksum !== hash) {
          // Applied migrations are immutable — editing one in-place would
          // mean different environments end up with different schemas.
          // Crash the boot so the operator notices instead of papering over.
          throw new Error(
            `Migration ${file} was already applied with checksum ${existing.checksum.slice(0, 12)} ` +
            `but the file on disk now hashes to ${hash.slice(0, 12)}. ` +
            `Don't edit applied migrations — create a new one instead.`,
          )
        }
        continue
      }

      this.logger.log(`Applying migration ${file} ...`)
      const start = Date.now()
      const queryRunner = this.ds.createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction()
      try {
        await queryRunner.query(sql)
        await queryRunner.query(
          `INSERT INTO _schema_migrations (filename, checksum, applied_at) VALUES ($1, $2, NOW())`,
          [file, hash],
        )
        await queryRunner.commitTransaction()
        ranCount++
        this.logger.log(`✅ ${file} — applied in ${Date.now() - start}ms`)
      } catch (e: any) {
        await queryRunner.rollbackTransaction()
        this.logger.error(`❌ Migration ${file} FAILED — rolling back`, e)
        throw new Error(`Migration ${file} failed: ${e.message}`)
      } finally {
        await queryRunner.release()
      }
    }

    if (ranCount > 0) {
      this.logger.log(`Migrations complete — ${ranCount} applied, ${files.length - ranCount} already current`)
    } else {
      this.logger.log(`Schema is up to date (${files.length} migrations on disk, all applied)`)
    }
  }

  /** Locate the migrations/ folder relative to either dist/ or src/ runtime. */
  private resolveMigrationsFolder(): string | null {
    const candidates = [
      path.resolve(process.cwd(), 'migrations'),
      path.resolve(process.cwd(), 'backend/migrations'),
      path.resolve(__dirname, '../../../migrations'),
    ]
    for (const p of candidates) {
      try { if (fs.existsSync(p) && fs.statSync(p).isDirectory()) return p } catch {}
    }
    return null
  }

  private async ensureTrackingTable() {
    await this.ds.query(`
      CREATE TABLE IF NOT EXISTS _schema_migrations (
        filename   varchar PRIMARY KEY,
        checksum   varchar,
        applied_at timestamp NOT NULL DEFAULT NOW()
      )
    `)
  }

  private async loadApplied(): Promise<Map<string, { checksum: string }>> {
    const rows = await this.ds.query(`SELECT filename, checksum FROM _schema_migrations`)
    const map = new Map<string, { checksum: string }>()
    for (const r of rows) map.set(r.filename, { checksum: r.checksum })
    return map
  }
}
