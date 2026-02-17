# Database Update Guide (Schema Behind Codebase)

This guide helps you safely bring a PostgreSQL database up to date with the current Prisma schema and migrations in this repo.

## Recommended Path (Prisma Migrations)
1. Back up the database:
   - `pg_dump -Fc -f backup.dump "$DATABASE_URL"`
2. Review migration status:
   - `npx prisma migrate status`
3. Apply pending migrations:
   - `npx prisma migrate deploy`
4. Regenerate Prisma client:
   - `npx prisma generate`
5. Optional: run seeds if needed:
   - `bun run db:seed` or `npm run db:seed`

If the database is behind, Prisma will apply:
- `20260129151226_add_ticket_system`
- `20260129165029_multi_tanancy`

## Manual Path (Safe SQL Script)
Use this if you cannot run Prisma migrations directly (restricted environments).

### Steps
1. Back up the database.
2. Run the safe upgrade script:
   - `psql "$DATABASE_URL" -f sql/upgrade/2026-02-17-safe-upgrade.sql`
3. Mark migrations as applied in Prisma:
   - `npx prisma migrate resolve --applied 20260129151226_add_ticket_system`
   - `npx prisma migrate resolve --applied 20260129165029_multi_tanancy`
4. Regenerate Prisma client:
   - `npx prisma generate`

### Notes
- The script is idempotent: it uses `IF NOT EXISTS` and checks for constraints.
- It does not drop or rename existing columns.
- Run in a maintenance window if possible.

## Verification
Run basic checks after upgrade:
- `npx prisma migrate status`
- Verify tables exist:
  - `SELECT * FROM tickets LIMIT 1;`
  - `SELECT * FROM organizations LIMIT 1;`
  - `SELECT * FROM stock_alerts LIMIT 1;`
- Run the app and hit a few key pages (assets, users, tickets).
