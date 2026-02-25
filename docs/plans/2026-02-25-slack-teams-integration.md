# Slack/Teams Webhook Notifications Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire up Slack and Teams webhook notifications so real app events (asset created, license expiring, etc.) actually send formatted messages to configured channels.

**Architecture:** A new `src/lib/integrations/slack-teams.ts` module reads integration settings from `system_settings` (cached 5-min TTL), formats event-specific messages for Slack (blocks) and Teams (MessageCard), and sends them via HTTP POST. Called alongside existing `triggerWebhook()` in 13 API route files. Fire-and-forget — never blocks API responses.

**Tech Stack:** Next.js API routes, Prisma (`system_settings` table), `cached()` from `src/lib/cache.ts`, native `fetch`

---

### Task 1: Create integration settings reader with tests

**Files:**

- Create: `src/lib/integrations/slack-teams.ts`
- Create: `src/lib/integrations/__tests__/slack-teams.test.ts`

**Step 1: Write the failing test for settings reader**

Create `src/lib/integrations/__tests__/slack-teams.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    system_settings: {
      findMany: vi.fn(),
    },
  },
}));

import prisma from "@/lib/prisma";
import { getIntegrationSettings } from "../slack-teams";

describe("getIntegrationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed Slack and Teams settings", async () => {
    vi.mocked(prisma.system_settings.findMany).mockResolvedValue([
      {
        id: "1",
        settingKey: "integrations.slack.enabled",
        settingValue: "true",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "2",
        settingKey: "integrations.slack.webhookUrl",
        settingValue: "https://hooks.slack.com/test",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "3",
        settingKey: "integrations.slack.channel",
        settingValue: "#alerts",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "4",
        settingKey: "integrations.slack.events",
        settingValue: "asset.created,user.created",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "5",
        settingKey: "integrations.teams.enabled",
        settingValue: "false",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
    ]);

    const settings = await getIntegrationSettings();

    expect(settings.slack.enabled).toBe(true);
    expect(settings.slack.webhookUrl).toBe("https://hooks.slack.com/test");
    expect(settings.slack.channel).toBe("#alerts");
    expect(settings.slack.events).toEqual(["asset.created", "user.created"]);
    expect(settings.teams.enabled).toBe(false);
  });

  it("returns disabled defaults when no settings exist", async () => {
    vi.mocked(prisma.system_settings.findMany).mockResolvedValue([]);

    const settings = await getIntegrationSettings();

    expect(settings.slack.enabled).toBe(false);
    expect(settings.slack.webhookUrl).toBe("");
    expect(settings.slack.events).toEqual([]);
    expect(settings.teams.enabled).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bunx vitest run src/lib/integrations/__tests__/slack-teams.test.ts`
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

Create `src/lib/integrations/slack-teams.ts`:

```typescript
import prisma from "@/lib/prisma";

interface IntegrationConfig {
  enabled: boolean;
  webhookUrl: string;
  channel: string;
  events: string[];
}

export interface IntegrationSettings {
  slack: IntegrationConfig;
  teams: IntegrationConfig;
}

/**
 * Read integration settings from system_settings table.
 */
export async function getIntegrationSettings(): Promise<IntegrationSettings> {
  const rows = await prisma.system_settings.findMany({
    where: { settingKey: { startsWith: "integrations." } },
  });

  const getValue = (key: string): string =>
    rows.find((r) => r.settingKey === key)?.settingValue || "";

  return {
    slack: {
      enabled: getValue("integrations.slack.enabled") === "true",
      webhookUrl: getValue("integrations.slack.webhookUrl"),
      channel: getValue("integrations.slack.channel"),
      events: getValue("integrations.slack.events")
        ? getValue("integrations.slack.events").split(",")
        : [],
    },
    teams: {
      enabled: getValue("integrations.teams.enabled") === "true",
      webhookUrl: getValue("integrations.teams.webhookUrl"),
      channel: "",
      events: getValue("integrations.teams.events")
        ? getValue("integrations.teams.events").split(",")
        : [],
    },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `bunx vitest run src/lib/integrations/__tests__/slack-teams.test.ts`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/lib/integrations/slack-teams.ts src/lib/integrations/__tests__/slack-teams.test.ts
git commit -m "feat: add integration settings reader for Slack/Teams"
```

---

### Task 2: Add message formatters with tests

**Files:**

- Modify: `src/lib/integrations/slack-teams.ts`
- Modify: `src/lib/integrations/__tests__/slack-teams.test.ts`

**Step 1: Write failing tests for message formatters**

Add to the test file:

```typescript
import { formatSlackMessage, formatTeamsMessage } from "../slack-teams";

describe("formatSlackMessage", () => {
  it("formats asset.created event", () => {
    const result = formatSlackMessage("asset.created", {
      assetName: "MacBook Pro",
      assetTag: "ASSET-001",
    });

    expect(result.blocks).toBeDefined();
    expect(result.blocks[0].text.text).toContain("MacBook Pro");
    expect(result.blocks[0].text.text).toContain("ASSET-001");
  });

  it("formats user.created event", () => {
    const result = formatSlackMessage("user.created", {
      email: "john@example.com",
    });

    expect(result.blocks[0].text.text).toContain("john@example.com");
  });

  it("formats consumable.low_stock event", () => {
    const result = formatSlackMessage("consumable.low_stock", {
      consumableName: "Toner",
      quantity: 3,
      minQuantity: 10,
    });

    expect(result.blocks[0].text.text).toContain("Toner");
  });

  it("includes channel when provided", () => {
    const result = formatSlackMessage(
      "asset.created",
      { assetName: "Test" },
      "#alerts",
    );

    expect(result.channel).toBe("#alerts");
  });

  it("handles unknown event with generic message", () => {
    const result = formatSlackMessage("unknown.event" as string, {
      foo: "bar",
    });

    expect(result.blocks[0].text.text).toContain("unknown.event");
  });
});

describe("formatTeamsMessage", () => {
  it("formats asset.created event", () => {
    const result = formatTeamsMessage("asset.created", {
      assetName: "MacBook Pro",
      assetTag: "ASSET-001",
    });

    expect(result["@type"]).toBe("MessageCard");
    expect(result.sections[0].activityTitle).toContain("Asset Created");
    expect(result.sections[0].activitySubtitle).toContain("MacBook Pro");
  });

  it("formats import.failed event", () => {
    const result = formatTeamsMessage("import.failed", {
      errorCount: 5,
      entityType: "assets",
    });

    expect(result.sections[0].activitySubtitle).toContain("failed");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bunx vitest run src/lib/integrations/__tests__/slack-teams.test.ts`
Expected: FAIL — `formatSlackMessage` is not exported

**Step 3: Add message formatters to implementation**

Add to `src/lib/integrations/slack-teams.ts`:

```typescript
/**
 * Event-to-message mapping.
 * Returns a human-readable title and description for each event.
 */
function getEventMessage(
  event: string,
  data: Record<string, unknown>,
): { title: string; description: string } {
  switch (event) {
    case "asset.created":
      return {
        title: "Asset Created",
        description: `Asset *${data.assetName || "Unknown"}* (${data.assetTag || "no tag"}) was created`,
      };
    case "asset.updated":
      return {
        title: "Asset Updated",
        description: `Asset *${data.assetName || "Unknown"}* (${data.assetTag || "no tag"}) was updated`,
      };
    case "asset.deleted":
      return {
        title: "Asset Deleted",
        description: `Asset *${data.assetName || "Unknown"}* was deleted`,
      };
    case "asset.assigned":
      return {
        title: "Asset Assigned",
        description: `Asset *${data.assetName || "Unknown"}* was assigned`,
      };
    case "consumable.low_stock":
      return {
        title: "Low Stock Alert",
        description: `Low stock: *${data.consumableName || "Unknown"}* — ${data.quantity ?? "?"}/${data.minQuantity ?? "?"} remaining`,
      };
    case "consumable.critical_stock":
      return {
        title: "Critical Stock Alert",
        description: `Critical stock: *${data.consumableName || "Unknown"}* — ${data.quantity ?? "?"}/${data.minQuantity ?? "?"} remaining`,
      };
    case "maintenance.due":
      return {
        title: "Maintenance Due",
        description: `Maintenance due: *${data.maintenanceTitle || data.title || "Unknown"}* for ${data.assetName || "asset"}`,
      };
    case "license.expiring":
      return {
        title: "License Expiring",
        description: `License expiring: *${data.licenseName || "Unknown"}* on ${data.expirationDate || "unknown date"}`,
      };
    case "user.created":
      return {
        title: "User Created",
        description: `New user created: *${data.email || "Unknown"}*`,
      };
    case "import.completed":
      return {
        title: "Import Completed",
        description: `Import completed: ${data.successCount ?? data.totalRows ?? "?"} records imported`,
      };
    case "import.failed":
      return {
        title: "Import Failed",
        description: `Import failed: ${data.errorCount ?? "?"} errors in ${data.entityType || "import"}`,
      };
    default:
      return {
        title: "Notification",
        description: `Event: ${event}`,
      };
  }
}

/**
 * Format a Slack webhook message with blocks.
 */
export function formatSlackMessage(
  event: string,
  data: Record<string, unknown>,
  channel?: string,
): Record<string, unknown> {
  const { title, description } = getEventMessage(event, data);

  return {
    ...(channel ? { channel } : {}),
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Asset Tracker — ${title}*\n${description}`,
        },
      },
    ],
  };
}

/**
 * Format a Microsoft Teams MessageCard.
 */
export function formatTeamsMessage(
  event: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const { title, description } = getEventMessage(event, data);
  // Strip markdown bold (*text*) for Teams plain text
  const plainDescription = description.replace(/\*/g, "");

  return {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    themeColor: "0076D7",
    summary: `Asset Tracker — ${title}`,
    sections: [
      {
        activityTitle: `Asset Tracker — ${title}`,
        activitySubtitle: plainDescription,
        markdown: true,
      },
    ],
  };
}
```

**Step 4: Run test to verify it passes**

Run: `bunx vitest run src/lib/integrations/__tests__/slack-teams.test.ts`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/lib/integrations/slack-teams.ts src/lib/integrations/__tests__/slack-teams.test.ts
git commit -m "feat: add Slack and Teams message formatters"
```

---

### Task 3: Add notifyIntegrations() dispatcher with tests

**Files:**

- Modify: `src/lib/integrations/slack-teams.ts`
- Modify: `src/lib/integrations/__tests__/slack-teams.test.ts`

**Step 1: Write failing tests for the dispatcher**

Add to the test file:

```typescript
import { notifyIntegrations, getIntegrationSettings } from "../slack-teams";

// At the top of the file, add fetch mock:
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("notifyIntegrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("sends Slack notification for subscribed event", async () => {
    vi.mocked(prisma.system_settings.findMany).mockResolvedValue([
      {
        id: "1",
        settingKey: "integrations.slack.enabled",
        settingValue: "true",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "2",
        settingKey: "integrations.slack.webhookUrl",
        settingValue: "https://hooks.slack.com/test",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "3",
        settingKey: "integrations.slack.events",
        settingValue: "asset.created",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
    ]);

    await notifyIntegrations("asset.created", { assetName: "Test" });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://hooks.slack.com/test",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("does not send when event is not subscribed", async () => {
    vi.mocked(prisma.system_settings.findMany).mockResolvedValue([
      {
        id: "1",
        settingKey: "integrations.slack.enabled",
        settingValue: "true",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "2",
        settingKey: "integrations.slack.webhookUrl",
        settingValue: "https://hooks.slack.com/test",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "3",
        settingKey: "integrations.slack.events",
        settingValue: "user.created",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
    ]);

    await notifyIntegrations("asset.created", { assetName: "Test" });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("does not send when integration is disabled", async () => {
    vi.mocked(prisma.system_settings.findMany).mockResolvedValue([
      {
        id: "1",
        settingKey: "integrations.slack.enabled",
        settingValue: "false",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "2",
        settingKey: "integrations.slack.webhookUrl",
        settingValue: "https://hooks.slack.com/test",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "3",
        settingKey: "integrations.slack.events",
        settingValue: "asset.created",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
    ]);

    await notifyIntegrations("asset.created", { assetName: "Test" });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends to both Slack and Teams when both enabled", async () => {
    vi.mocked(prisma.system_settings.findMany).mockResolvedValue([
      {
        id: "1",
        settingKey: "integrations.slack.enabled",
        settingValue: "true",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "2",
        settingKey: "integrations.slack.webhookUrl",
        settingValue: "https://hooks.slack.com/test",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "3",
        settingKey: "integrations.slack.events",
        settingValue: "asset.created",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "4",
        settingKey: "integrations.teams.enabled",
        settingValue: "true",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "5",
        settingKey: "integrations.teams.webhookUrl",
        settingValue: "https://teams.webhook.com/test",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "6",
        settingKey: "integrations.teams.events",
        settingValue: "asset.created",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
    ]);

    await notifyIntegrations("asset.created", { assetName: "Test" });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("does not throw on fetch failure", async () => {
    vi.mocked(prisma.system_settings.findMany).mockResolvedValue([
      {
        id: "1",
        settingKey: "integrations.slack.enabled",
        settingValue: "true",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "2",
        settingKey: "integrations.slack.webhookUrl",
        settingValue: "https://hooks.slack.com/test",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
      {
        id: "3",
        settingKey: "integrations.slack.events",
        settingValue: "asset.created",
        settingType: "string",
        category: "integrations",
        isEncrypted: false,
        updatedAt: new Date(),
      },
    ]);
    mockFetch.mockRejectedValue(new Error("Network error"));

    // Should not throw
    await notifyIntegrations("asset.created", { assetName: "Test" });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `bunx vitest run src/lib/integrations/__tests__/slack-teams.test.ts`
Expected: FAIL — `notifyIntegrations` is not exported

**Step 3: Add notifyIntegrations to implementation**

Add to `src/lib/integrations/slack-teams.ts`:

```typescript
/**
 * Send Slack/Teams notifications for an event.
 * Fire-and-forget: errors are logged, never thrown.
 * Reads settings directly from DB (no caching in this version for simplicity).
 */
export async function notifyIntegrations(
  event: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const settings = await getIntegrationSettings();

    const promises: Promise<void>[] = [];

    // Slack
    if (
      settings.slack.enabled &&
      settings.slack.webhookUrl &&
      settings.slack.events.includes(event)
    ) {
      const payload = formatSlackMessage(
        event,
        data,
        settings.slack.channel || undefined,
      );
      promises.push(
        fetch(settings.slack.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then(() => undefined),
      );
    }

    // Teams
    if (
      settings.teams.enabled &&
      settings.teams.webhookUrl &&
      settings.teams.events.includes(event)
    ) {
      const payload = formatTeamsMessage(event, data);
      promises.push(
        fetch(settings.teams.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then(() => undefined),
      );
    }

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("Integration notification error:", error);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `bunx vitest run src/lib/integrations/__tests__/slack-teams.test.ts`
Expected: PASS (all tests)

**Step 5: Commit**

```bash
git add src/lib/integrations/slack-teams.ts src/lib/integrations/__tests__/slack-teams.test.ts
git commit -m "feat: add notifyIntegrations dispatcher for Slack/Teams"
```

---

### Task 4: Wire notifyIntegrations into asset routes

**Files:**

- Modify: `src/app/api/asset/route.ts` (lines with `triggerWebhook`)
- Modify: `src/app/api/asset/addAsset/route.ts` (line with `triggerWebhook`)
- Modify: `src/app/api/asset/deleteAsset/route.ts` (line with `triggerWebhook`)
- Modify: `src/app/api/asset/updateStatus/route.ts` (line with `triggerWebhook`)

**Step 1: Add import and calls**

For each file, add the import at the top alongside `triggerWebhook`:

```typescript
import { notifyIntegrations } from "@/lib/integrations/slack-teams";
```

Then add `notifyIntegrations(event, data).catch(() => {});` immediately after each `triggerWebhook()` call, passing the same event name and data object.

For example, in `src/app/api/asset/addAsset/route.ts`, after the existing:

```typescript
    triggerWebhook(
      "asset.created",
      {
        assetId: created.assetid,
        assetName: created.assetname,
        assetTag: created.assettag,
      },
      ...
    ).catch(() => {});
```

Add:

```typescript
notifyIntegrations("asset.created", {
  assetName: created.assetname,
  assetTag: created.assettag,
}).catch(() => {});
```

Repeat for all `triggerWebhook` calls in the 4 asset route files.

**Step 2: Verify build**

Run: `bunx vitest run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/app/api/asset/route.ts src/app/api/asset/addAsset/route.ts src/app/api/asset/deleteAsset/route.ts src/app/api/asset/updateStatus/route.ts
git commit -m "feat: wire Slack/Teams notifications into asset routes"
```

---

### Task 5: Wire notifyIntegrations into user, licence, consumable routes

**Files:**

- Modify: `src/app/api/user/route.ts`
- Modify: `src/app/api/user/addUser/route.ts`
- Modify: `src/app/api/licence/route.ts`
- Modify: `src/app/api/licence/assign/route.ts`
- Modify: `src/app/api/consumable/checkout/route.ts`

**Step 1: Add import and calls**

Same pattern as Task 4. Add `import { notifyIntegrations } from "@/lib/integrations/slack-teams";` and add `notifyIntegrations(event, data).catch(() => {});` after each `triggerWebhook()` call.

Event mapping:

- `user/addUser`: `"user.created"` with `{ email }`
- `user/route.ts` PUT: `"user.created"` — note: this fires `user.updated` in webhooks, but the UI only has `user.created` event. Skip this one (no matching UI event).
- `licence/route.ts` and `licence/assign`: `"license.expiring"` — note: these fire `license.assigned`, not `license.expiring`. The UI has `license.expiring` but not `license.assigned`. Skip these for now (the notification cron handles license expiring).
- `consumable/checkout`: `"consumable.low_stock"` and `"consumable.critical_stock"` with `{ consumableName, quantity, minQuantity }`

**Step 2: Verify build**

Run: `bunx vitest run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/app/api/user/addUser/route.ts src/app/api/consumable/checkout/route.ts
git commit -m "feat: wire Slack/Teams notifications into user and consumable routes"
```

---

### Task 6: Wire notifyIntegrations into maintenance, import, reservation, stock-alert routes

**Files:**

- Modify: `src/app/api/maintenance/route.ts`
- Modify: `src/app/api/import/route.ts`
- Modify: `src/app/api/reservations/route.ts`
- Modify: `src/app/api/reservations/[id]/route.ts`
- Modify: `src/app/api/stock-alerts/route.ts`

**Step 1: Add import and calls**

Same pattern. Event mapping:

- `maintenance/route.ts`: `"maintenance.due"` — note: this fires `maintenance.due` which matches the UI event
- `import/route.ts`: `"import.completed"` or `"import.failed"` with `{ successCount, errorCount, entityType }`
- `reservations/route.ts`: fires `asset.reserved` — not in UI events, skip
- `reservations/[id]/route.ts`: fires `asset.reservation_approved` — not in UI events, skip
- `stock-alerts/route.ts`: fires `consumable.low_stock` and `consumable.critical_stock`

**Step 2: Verify build**

Run: `bunx vitest run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/app/api/maintenance/route.ts src/app/api/import/route.ts src/app/api/stock-alerts/route.ts
git commit -m "feat: wire Slack/Teams notifications into maintenance, import, stock-alert routes"
```

---

### Task 7: Final verification

**Step 1: Run full test suite**

Run: `bunx vitest run`
Expected: All tests pass

**Step 2: Run lint**

Run: `bun run lint`
Expected: No new errors (only pre-existing LandingPage.tsx error)

**Step 3: Final commit if any fixes needed**

---

## Route-to-event summary

| Route                   | Webhook Event                        | UI Event Match              | Wire? |
| ----------------------- | ------------------------------------ | --------------------------- | ----- |
| `asset/route.ts` POST   | `asset.created`                      | `asset.created`             | YES   |
| `asset/route.ts` PUT    | `asset.updated`                      | `asset.updated`             | YES   |
| `asset/addAsset`        | `asset.created`                      | `asset.created`             | YES   |
| `asset/deleteAsset`     | `asset.deleted`                      | (not in UI)                 | SKIP  |
| `asset/updateStatus`    | `asset.updated`                      | `asset.updated`             | YES   |
| `user/addUser`          | `user.created`                       | `user.created`              | YES   |
| `user/route.ts` PUT     | `user.updated`                       | (not in UI)                 | SKIP  |
| `licence/route.ts`      | `license.assigned`                   | (not in UI)                 | SKIP  |
| `licence/assign`        | `license.assigned`                   | (not in UI)                 | SKIP  |
| `consumable/checkout`   | `consumable.low_stock`               | `consumable.low_stock`      | YES   |
| `consumable/checkout`   | `consumable.critical_stock`          | `consumable.critical_stock` | YES   |
| `maintenance/route.ts`  | `maintenance.due`                    | `maintenance.due`           | YES   |
| `import/route.ts`       | `import.completed` / `import.failed` | Both in UI                  | YES   |
| `reservations/route.ts` | `asset.reserved`                     | (not in UI)                 | SKIP  |
| `reservations/[id]`     | `asset.reservation_approved`         | (not in UI)                 | SKIP  |
| `stock-alerts/route.ts` | `consumable.low_stock` / `critical`  | Both in UI                  | YES   |
