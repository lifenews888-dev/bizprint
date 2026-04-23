# Database migrations

This folder is the **single source of truth** for production schema changes.
Every `.sql` file here is run automatically on backend boot in alphabetical
order, exactly once. After it succeeds it's recorded in the
`_schema_migrations` table and never run again.

## Why

Production runs `synchronize: false` — TypeORM does NOT auto-create or
modify tables. Without migrations, every schema change crashes
production until someone manually runs SQL on the Postgres console.
That happened multiple times this week. This system fixes it for good.

## How to add a schema change

1. **Create a new file** in `backend/migrations/` named:

   ```
   YYYY-MM-DD-NN-short-description.sql
   ```

   - `YYYY-MM-DD` — today's date (sorts run-order chronologically)
   - `NN` — two-digit sequence inside the day (`01`, `02`, …)
   - `short-description` — what changes, e.g. `add-user-locale-column`

   Example: `2026-05-12-01-add-user-locale-column.sql`

2. **Write idempotent SQL** so re-running is harmless. Use:
   - `IF NOT EXISTS` on `CREATE TABLE`, `CREATE INDEX`, `ADD COLUMN`
   - `DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;` for
     `CREATE TYPE`
   - `ALTER TABLE … ADD COLUMN IF NOT EXISTS` for new columns

3. **Update the matching TypeORM entity** in `backend/src/<module>/`
   so the code expects the new schema.

4. **Push to main**.

5. Railway auto-deploys. On boot the migration runner:
   - Connects to Postgres
   - Reads every `.sql` file
   - Runs the ones not yet in `_schema_migrations`
   - Crashes the deploy loudly (and Railway rolls back) if anything fails

That's it. No more manual SQL pasting in the Railway console.

## Rules

- **Never edit an applied migration.** The runner stores a SHA-256 of each
  applied file. If the on-disk hash changes, boot fails on purpose. To fix
  a bad migration, write a new one that undoes / corrects it.

- **Never delete an applied migration.** Same reason — environments would
  diverge.

- **One concern per file.** Easier to review, easier to roll back later.

- **Idempotent always.** Production might retry boot, restart mid-run, etc.

- **Local dev** can stay on `synchronize: true` (default when
  `NODE_ENV !== 'production'`); migrations still run on top of that
  without conflict because they all use `IF NOT EXISTS`.

## Skip migrations (emergency)

If you ever need the backend to boot without running migrations (e.g. to
inspect a broken DB), set the env var on Railway:

```
SKIP_MIGRATIONS=1
```

The runner logs a warning and continues. Remove the var to re-enable.
