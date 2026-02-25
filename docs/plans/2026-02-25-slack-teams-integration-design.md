# Slack/Teams Webhook Integration — Design

## Problem

The admin UI allows configuring Slack and Teams webhook integrations (webhook URLs, channel override, event subscriptions), and a test endpoint sends test messages. However, no actual event notifications are dispatched — when assets are created, licenses expire, etc., Slack/Teams channels receive nothing.

## Solution

Create a `notifyIntegrations(event, data)` function that:

1. Reads Slack/Teams settings from `system_settings` (cached, 5-min TTL)
2. Checks if each integration is enabled and subscribed to the event
3. Formats messages per platform (Slack blocks, Teams MessageCard)
4. Sends to webhook URLs (fire-and-forget, errors logged)

Call it alongside existing `triggerWebhook()` calls in 13 API route files.

## Architecture

```
API Route (e.g. asset/addAsset)
  ├── triggerWebhook('asset.created', data)     ← existing custom webhooks
  └── notifyIntegrations('asset.created', data)  ← NEW Slack/Teams
        ├── getIntegrationSettings()  ← cached DB read (5-min TTL)
        ├── formatSlackMessage(event, data)
        ├── formatTeamsMessage(event, data)
        └── fetch(webhookUrl, payload)
```

## Event-to-message mapping

| Event                       | Slack/Teams Message                                  |
| --------------------------- | ---------------------------------------------------- |
| `asset.created`             | "Asset **{name}** ({tag}) was created"               |
| `asset.updated`             | "Asset **{name}** ({tag}) was updated"               |
| `asset.deleted`             | "Asset **{name}** ({tag}) was deleted"               |
| `asset.assigned`            | "Asset **{name}** was assigned to {user}"            |
| `consumable.low_stock`      | "Low stock: **{name}** — {qty}/{min} remaining"      |
| `consumable.critical_stock` | "Critical stock: **{name}** — {qty}/{min} remaining" |
| `maintenance.due`           | "Maintenance due: **{title}** for {asset}"           |
| `license.expiring`          | "License expiring: **{name}** on {date}"             |
| `user.created`              | "New user created: **{name}** ({email})"             |
| `import.completed`          | "Import completed: {count} records imported"         |
| `import.failed`             | "Import failed: {error}"                             |

## Settings keys (existing in DB)

- `integrations.slack.enabled` — "true"/"false"
- `integrations.slack.webhookUrl` — Slack incoming webhook URL
- `integrations.slack.channel` — Optional channel override
- `integrations.slack.events` — JSON array of subscribed event names
- `integrations.teams.enabled` — "true"/"false"
- `integrations.teams.webhookUrl` — Teams incoming webhook URL
- `integrations.teams.events` — JSON array of subscribed event names

## Error handling

- Non-blocking: failures logged, never block API response
- No retries for Slack/Teams (unlike custom webhooks)
- Settings cache means a down DB doesn't break every request

## Files to create/modify

**New:**

- `src/lib/integrations/slack-teams.ts` — Core module
- `src/lib/integrations/__tests__/slack-teams.test.ts` — Unit tests

**Modified (add `notifyIntegrations()` call):**

- `src/app/api/asset/route.ts` (2 calls: created, updated)
- `src/app/api/asset/addAsset/route.ts` (1 call: created)
- `src/app/api/asset/deleteAsset/route.ts` (1 call: deleted)
- `src/app/api/asset/updateStatus/route.ts` (1 call: updated)
- `src/app/api/user/route.ts` (1 call: updated)
- `src/app/api/user/addUser/route.ts` (1 call: created)
- `src/app/api/consumable/checkout/route.ts` (2 calls: low/critical stock)
- `src/app/api/maintenance/route.ts` (1 call: due)
- `src/app/api/licence/route.ts` (2 calls: assigned)
- `src/app/api/licence/assign/route.ts` (1 call: assigned)
- `src/app/api/import/route.ts` (1 call: completed/failed)
- `src/app/api/reservations/route.ts` (1 call: reserved)
- `src/app/api/reservations/[id]/route.ts` (1 call: approved)
- `src/app/api/stock-alerts/route.ts` (2 calls: low/critical stock)
