# Cron Jobs + GDPR Audit Log Retention — Design

## Problem

The project has 3 fully implemented cron endpoints that never run because they're not scheduled in `vercel.json`:

1. **Session cleanup** (`/api/cron/sessions`) — deletes expired sessions from the database
2. **Notifications** (`/api/cron/notifications`) — checks for expiring warranties, licenses, maintenance due, and low stock; processes email queue
3. **Workflows** (`/api/cron/workflows`) — evaluates time-based automation rules (warranty expiring, maintenance due, license expiring, stock low)

Additionally, GDPR retention settings are configurable (audit log retention: 365 days) but nothing enforces them — audit logs grow indefinitely.

## Solution

1. Schedule all 3 existing cron endpoints in `vercel.json`
2. Create a new `/api/cron/gdpr-retention` endpoint that purges old audit logs based on configured retention period
3. Schedule the new endpoint in `vercel.json`
4. Write unit tests for the new GDPR retention logic

## Architecture

Follows the existing cron pattern exactly:

- Each cron endpoint is a Next.js route handler at `src/app/api/cron/[name]/route.ts`
- All endpoints verify `CRON_SECRET` via `Authorization: Bearer <token>` header
- Each delegates to a focused library function for the actual work
- Vercel schedules the endpoints via `vercel.json` crons array

## Cron Schedules

| Endpoint                   | Schedule      | Frequency                |
| -------------------------- | ------------- | ------------------------ |
| `/api/cron/sessions`       | `0 */6 * * *` | Every 6 hours            |
| `/api/cron/notifications`  | `0 * * * *`   | Every hour               |
| `/api/cron/workflows`      | `0 * * * *`   | Every hour               |
| `/api/cron/gdpr-retention` | `0 3 * * *`   | Daily at 3 AM            |
| `/api/cron/demo-reset`     | `0 */4 * * *` | Every 4 hours (existing) |

## New GDPR Retention Endpoint

The new endpoint will:

1. Read GDPR settings via `getGDPRSettings()` (filesystem-based, falls back to defaults)
2. Calculate cutoff date: `now - auditLogRetentionDays`
3. Delete all `audit_logs` records where `createdAt < cutoff`
4. Return count of deleted records

## Out of Scope (for now)

- Migrating GDPR settings from filesystem to database
- Adding `isAnonymized`/`anonymizedAt` fields to user model
- Enforcing `deletedUserRetentionDays` (requires schema changes)
- Enforcing `exportRetentionDays` (exports are transient downloads, not persisted)
