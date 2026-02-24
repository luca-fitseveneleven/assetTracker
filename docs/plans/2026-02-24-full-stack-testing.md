# Full-Stack Test Coverage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build comprehensive test coverage across unit, API integration, and E2E layers with CI pipeline and coverage reporting.

**Architecture:** Bottom-up approach — unit tests for `src/lib/` pure logic first, then API route integration tests with mocked Prisma + real test DB, then expanded E2E specs with authenticated flows. GitHub Actions CI runs all layers with quality gates.

**Tech Stack:** Vitest 4.x (unit + API tests), Playwright 1.58 (E2E), @vitest/coverage-v8, @testing-library/react, vitest-mock-extended, happy-dom, GitHub Actions

---

## Task 1: Install Test Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install dev dependencies**

Run:
```bash
bun add -d @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest-mock-extended @vitest/coverage-v8 happy-dom
```

**Step 2: Verify installation**

Run: `bun run test:unit`
Expected: Existing 4 unit tests still pass.

**Step 3: Commit**

```bash
git add package.json bun.lockb
git commit -m "test: add testing dependencies for full-stack coverage"
```

---

## Task 2: Create Test Infrastructure — Shared Mocks & Helpers

**Files:**
- Create: `tests/setup/prisma-mock.ts`
- Create: `tests/setup/test-helpers.ts`
- Create: `tests/setup/fixtures/users.ts`
- Create: `tests/setup/fixtures/assets.ts`
- Modify: `vitest.config.ts`

**Step 1: Create Prisma mock factory**

```typescript
// tests/setup/prisma-mock.ts
import { vi } from "vitest";

// Create a deep mock of PrismaClient that returns vi.fn() for all methods
export function createMockPrisma() {
  const mockMethods = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    upsert: vi.fn().mockResolvedValue({}),
    aggregate: vi.fn().mockResolvedValue({}),
  });

  return {
    user: mockMethods(),
    asset: mockMethods(),
    accessory: mockMethods(),
    licence: mockMethods(),
    consumable: mockMethods(),
    organization: mockMethods(),
    role: mockMethods(),
    audit_logs: mockMethods(),
    webhook: mockMethods(),
    webhookDelivery: mockMethods(),
    verification_tokens: mockMethods(),
    user_preferences: mockMethods(),
    notification_preferences: mockMethods(),
    session_tracking: mockMethods(),
    maintenance_schedule: mockMethods(),
    department: mockMethods(),
    ticket: mockMethods(),
    ticket_comment: mockMethods(),
    approval_request: mockMethods(),
    reservation: mockMethods(),
    custom_field: mockMethods(),
    custom_field_value: mockMethods(),
    workflow: mockMethods(),
    stock_alert: mockMethods(),
    team_invitation: mockMethods(),
    dashboard_widget: mockMethods(),
    asset_checkout: mockMethods(),
    $transaction: vi.fn().mockImplementation((fn) =>
      typeof fn === "function" ? fn({}) : Promise.all(fn)
    ),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
}

export type MockPrisma = ReturnType<typeof createMockPrisma>;
```

**Step 2: Create test fixtures**

```typescript
// tests/setup/fixtures/users.ts
export const mockAdminUser = {
  userid: "admin-uuid-001",
  id: "admin-uuid-001",
  username: "admin",
  email: "admin@test.com",
  firstname: "Admin",
  lastname: "User",
  isadmin: true,
  isAdmin: true,
  canrequest: true,
  canRequest: true,
  organizationId: "org-uuid-001",
  departmentId: null,
  permissions: [] as string[],
  mfaPending: false,
};

export const mockRegularUser = {
  userid: "user-uuid-001",
  id: "user-uuid-001",
  username: "regular",
  email: "user@test.com",
  firstname: "Regular",
  lastname: "User",
  isadmin: false,
  isAdmin: false,
  canrequest: true,
  canRequest: true,
  organizationId: "org-uuid-001",
  departmentId: "dept-uuid-001",
  permissions: ["asset:view", "asset:create"],
  mfaPending: false,
};

export const mockOrganization = {
  id: "org-uuid-001",
  name: "Test Organization",
  slug: "test-org",
  maxAssets: 100,
  maxUsers: 50,
  plan: "professional",
  settings: {},
};
```

```typescript
// tests/setup/fixtures/assets.ts
export const mockAsset = {
  assetid: "asset-uuid-001",
  assetname: "MacBook Pro 16",
  assettag: "ASSET-001",
  serialnumber: "SN-ABC-123",
  purchaseprice: 2499.99,
  purchasedate: new Date("2025-06-15"),
  mobile: false,
  organizationId: "org-uuid-001",
  statusId: "status-uuid-001",
  modelId: null,
  manufacturerId: null,
  supplierId: null,
  locationId: null,
  change_date: new Date(),
};

export const mockAssetList = [
  mockAsset,
  {
    ...mockAsset,
    assetid: "asset-uuid-002",
    assetname: "Dell Monitor",
    assettag: "ASSET-002",
    serialnumber: "SN-DEF-456",
    purchaseprice: 599.99,
  },
];
```

**Step 3: Create test helpers**

```typescript
// tests/setup/test-helpers.ts
import { NextRequest } from "next/server";

/**
 * Build a NextRequest for API route testing.
 */
export function createMockRequest(
  url: string,
  options?: {
    method?: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  }
): NextRequest {
  const { method = "GET", body, headers = {} } = options ?? {};

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body && method !== "GET") {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), init);
}

/**
 * Parse a NextResponse body as JSON.
 */
export async function parseResponse<T = unknown>(
  response: Response
): Promise<{ status: number; body: T }> {
  const body = await response.json();
  return { status: response.status, body: body as T };
}
```

**Step 4: Update vitest.config.ts with coverage and setup**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    exclude: ["node_modules", ".next", "tests/e2e"],
    setupFiles: [],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/lib/**/*.ts"],
      exclude: [
        "src/lib/__tests__/**",
        "src/lib/logger/**",
        "src/lib/i18n/**",
        "src/lib/email/templates.ts",
      ],
      thresholds: {
        lines: 50,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Step 5: Add test scripts to package.json**

Add to `scripts`:
```json
"test:unit:coverage": "vitest run --coverage"
```

**Step 6: Run existing tests**

Run: `bun run test:unit`
Expected: 4 existing test files still pass.

**Step 7: Commit**

```bash
git add tests/setup/ vitest.config.ts package.json
git commit -m "test: add test infrastructure — mocks, fixtures, helpers"
```

---

## Task 3: Unit Tests — permissions.ts (P0 Security)

**Files:**
- Create: `src/lib/__tests__/permissions.test.ts`
- Reference: `src/lib/permissions.ts`

**Step 1: Write the tests**

```typescript
// src/lib/__tests__/permissions.test.ts
import { describe, it, expect } from "vitest";
import {
  userHasPermission,
  userCanEditUser,
  userCanDeleteUser,
  PERMISSIONS,
} from "../permissions";

describe("userHasPermission", () => {
  it("returns false for null user", () => {
    expect(userHasPermission(null, PERMISSIONS.ASSET_VIEW)).toBe(false);
  });

  it("returns false for undefined user", () => {
    expect(userHasPermission(undefined, PERMISSIONS.ASSET_VIEW)).toBe(false);
  });

  it("returns true for admin user on any permission", () => {
    const admin = { id: "1", isAdmin: true };
    expect(userHasPermission(admin, PERMISSIONS.ASSET_VIEW)).toBe(true);
    expect(userHasPermission(admin, PERMISSIONS.USER_DELETE)).toBe(true);
    expect(userHasPermission(admin, PERMISSIONS.SETTINGS_MANAGE)).toBe(true);
  });

  it("returns true for any user on view-only permissions", () => {
    const user = { id: "1", isAdmin: false };
    expect(userHasPermission(user, PERMISSIONS.ASSET_VIEW)).toBe(true);
    expect(userHasPermission(user, PERMISSIONS.USER_VIEW)).toBe(true);
  });

  it("returns false for non-admin on admin-only permissions", () => {
    const user = { id: "1", isAdmin: false };
    expect(userHasPermission(user, PERMISSIONS.USER_DELETE)).toBe(false);
    expect(userHasPermission(user, PERMISSIONS.SETTINGS_MANAGE)).toBe(false);
  });

  it("returns true for user with canRequest on request permissions", () => {
    const user = { id: "1", isAdmin: false, canRequest: true };
    expect(userHasPermission(user, PERMISSIONS.RESERVATION_CREATE)).toBe(true);
  });

  it("returns false for user without canRequest on request permissions", () => {
    const user = { id: "1", isAdmin: false, canRequest: false };
    expect(userHasPermission(user, PERMISSIONS.RESERVATION_CREATE)).toBe(false);
  });
});

describe("userCanEditUser", () => {
  it("returns false for null user", () => {
    expect(userCanEditUser(null, "target-id")).toBe(false);
  });

  it("allows admin to edit any user", () => {
    const admin = { id: "admin-1", isAdmin: true };
    expect(userCanEditUser(admin, "other-user")).toBe(true);
  });

  it("allows user to edit self", () => {
    const user = { id: "user-1", isAdmin: false };
    expect(userCanEditUser(user, "user-1")).toBe(true);
  });

  it("denies user from editing others", () => {
    const user = { id: "user-1", isAdmin: false };
    expect(userCanEditUser(user, "user-2")).toBe(false);
  });
});

describe("userCanDeleteUser", () => {
  it("returns false for null user", () => {
    expect(userCanDeleteUser(null, "target-id")).toBe(false);
  });

  it("allows admin to delete other users", () => {
    const admin = { id: "admin-1", isAdmin: true };
    expect(userCanDeleteUser(admin, "user-2")).toBe(true);
  });

  it("prevents admin from deleting self", () => {
    const admin = { id: "admin-1", isAdmin: true };
    expect(userCanDeleteUser(admin, "admin-1")).toBe(false);
  });

  it("prevents non-admin from deleting anyone", () => {
    const user = { id: "user-1", isAdmin: false };
    expect(userCanDeleteUser(user, "user-2")).toBe(false);
  });
});
```

**Step 2: Run test to verify it passes**

Run: `bun run test:unit src/lib/__tests__/permissions.test.ts`
Expected: All tests PASS (these are pure functions, no mocking needed).

**Step 3: Commit**

```bash
git add src/lib/__tests__/permissions.test.ts
git commit -m "test: add unit tests for permissions module"
```

---

## Task 4: Unit Tests — password-validation.ts (P0 Security)

**Files:**
- Create: `src/lib/__tests__/password-validation.test.ts`
- Reference: `src/lib/password-validation.ts`

**Step 1: Write the tests**

```typescript
// src/lib/__tests__/password-validation.test.ts
import { describe, it, expect } from "vitest";
import {
  validatePasswordComplexity,
  getPasswordStrengthLabel,
  passwordsMatch,
  getPasswordRequirements,
  PASSWORD_CONFIG,
} from "../password-validation";

describe("validatePasswordComplexity", () => {
  it("rejects passwords shorter than minLength", () => {
    const result = validatePasswordComplexity("Ab1!");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects password without uppercase", () => {
    const result = validatePasswordComplexity("lowercase123!");
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/uppercase/i)])
    );
  });

  it("rejects password without lowercase", () => {
    const result = validatePasswordComplexity("UPPERCASE123!");
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/lowercase/i)])
    );
  });

  it("rejects password without number", () => {
    const result = validatePasswordComplexity("NoNumbers!!");
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/number/i)])
    );
  });

  it("rejects password without special character", () => {
    const result = validatePasswordComplexity("NoSpecial123");
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringMatching(/special/i)])
    );
  });

  it("accepts a strong password", () => {
    const result = validatePasswordComplexity("Str0ng!Pass#2026");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it("detects common passwords", () => {
    const result = validatePasswordComplexity("password");
    expect(result.valid).toBe(false);
  });

  it("penalizes sequential characters", () => {
    const strong = validatePasswordComplexity("Str0ng!Pass#X");
    const sequential = validatePasswordComplexity("Abcd1234!Pass");
    expect(sequential.score).toBeLessThanOrEqual(strong.score);
  });

  it("returns score between 0 and 4", () => {
    const weak = validatePasswordComplexity("a");
    const strong = validatePasswordComplexity("V3ry$tr0ng!P@ss");
    expect(weak.score).toBeGreaterThanOrEqual(0);
    expect(strong.score).toBeLessThanOrEqual(4);
  });
});

describe("getPasswordStrengthLabel", () => {
  it("returns correct labels for each score", () => {
    expect(getPasswordStrengthLabel(0)).toBe("Very Weak");
    expect(getPasswordStrengthLabel(1)).toBe("Weak");
    expect(getPasswordStrengthLabel(2)).toBe("Fair");
    expect(getPasswordStrengthLabel(3)).toBe("Strong");
    expect(getPasswordStrengthLabel(4)).toBe("Very Strong");
  });
});

describe("passwordsMatch", () => {
  it("returns true for matching passwords", () => {
    expect(passwordsMatch("test123", "test123")).toBe(true);
  });

  it("returns false for non-matching passwords", () => {
    expect(passwordsMatch("test123", "test456")).toBe(false);
  });
});

describe("getPasswordRequirements", () => {
  it("returns array of requirement strings", () => {
    const reqs = getPasswordRequirements();
    expect(Array.isArray(reqs)).toBe(true);
    expect(reqs.length).toBeGreaterThan(0);
    expect(reqs.every((r) => typeof r === "string")).toBe(true);
  });
});
```

**Step 2: Run tests**

Run: `bun run test:unit src/lib/__tests__/password-validation.test.ts`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/lib/__tests__/password-validation.test.ts
git commit -m "test: add unit tests for password validation"
```

---

## Task 5: Unit Tests — mfa.ts (P0 Security)

**Files:**
- Create: `src/lib/__tests__/mfa.test.ts`
- Reference: `src/lib/mfa.ts`

**Step 1: Write the tests**

```typescript
// src/lib/__tests__/mfa.test.ts
import { describe, it, expect } from "vitest";
import {
  generateMfaSecret,
  generateMfaUri,
  verifyMfaToken,
  generateBackupCodes,
  verifyBackupCode,
} from "../mfa";
import { authenticator } from "otplib";

describe("generateMfaSecret", () => {
  it("returns a non-empty string", () => {
    const secret = generateMfaSecret();
    expect(typeof secret).toBe("string");
    expect(secret.length).toBeGreaterThan(0);
  });

  it("generates unique secrets each time", () => {
    const s1 = generateMfaSecret();
    const s2 = generateMfaSecret();
    expect(s1).not.toBe(s2);
  });
});

describe("generateMfaUri", () => {
  it("returns a valid otpauth URI", () => {
    const uri = generateMfaUri("TESTSECRET", "user@test.com");
    expect(uri).toContain("otpauth://totp/");
    expect(uri).toContain("user@test.com");
    expect(uri).toContain("AssetTracker");
  });
});

describe("verifyMfaToken", () => {
  it("accepts a valid TOTP token", () => {
    const secret = generateMfaSecret();
    const token = authenticator.generate(secret);
    expect(verifyMfaToken(secret, token)).toBe(true);
  });

  it("rejects an invalid token", () => {
    const secret = generateMfaSecret();
    expect(verifyMfaToken(secret, "000000")).toBe(false);
  });

  it("rejects empty token", () => {
    const secret = generateMfaSecret();
    expect(verifyMfaToken(secret, "")).toBe(false);
  });
});

describe("generateBackupCodes", () => {
  it("generates the default count of codes", () => {
    const codes = generateBackupCodes();
    expect(codes).toHaveLength(8);
  });

  it("generates the requested count of codes", () => {
    const codes = generateBackupCodes(4);
    expect(codes).toHaveLength(4);
  });

  it("generates unique codes", () => {
    const codes = generateBackupCodes(10);
    const unique = new Set(codes);
    expect(unique.size).toBe(10);
  });

  it("generates hex-formatted codes", () => {
    const codes = generateBackupCodes();
    codes.forEach((code) => {
      expect(code).toMatch(/^[0-9A-F]+$/);
    });
  });
});

describe("verifyBackupCode", () => {
  it("validates a correct backup code", () => {
    const codes = ["ABCD1234", "EFGH5678"];
    const result = verifyBackupCode(codes, "ABCD1234");
    expect(result.valid).toBe(true);
    expect(result.remainingCodes).toEqual(["EFGH5678"]);
  });

  it("rejects an invalid backup code", () => {
    const codes = ["ABCD1234", "EFGH5678"];
    const result = verifyBackupCode(codes, "WRONGCODE");
    expect(result.valid).toBe(false);
    expect(result.remainingCodes).toEqual(codes);
  });

  it("is case-insensitive", () => {
    const codes = ["ABCD1234"];
    const result = verifyBackupCode(codes, "abcd1234");
    expect(result.valid).toBe(true);
  });

  it("handles empty codes array", () => {
    const result = verifyBackupCode([], "ANYTHING");
    expect(result.valid).toBe(false);
    expect(result.remainingCodes).toEqual([]);
  });
});
```

**Step 2: Run tests**

Run: `bun run test:unit src/lib/__tests__/mfa.test.ts`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/lib/__tests__/mfa.test.ts
git commit -m "test: add unit tests for MFA module"
```

---

## Task 6: Unit Tests — pagination.ts (P1 Business)

**Files:**
- Create: `src/lib/__tests__/pagination.test.ts`
- Reference: `src/lib/pagination.ts`

**Step 1: Write the tests**

```typescript
// src/lib/__tests__/pagination.test.ts
import { describe, it, expect } from "vitest";
import {
  parsePaginationParams,
  buildPrismaArgs,
  buildPaginatedResponse,
} from "../pagination";

describe("parsePaginationParams", () => {
  it("returns defaults for empty params", () => {
    const params = new URLSearchParams();
    const result = parsePaginationParams(params);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
    expect(result.sortOrder).toBe("asc");
  });

  it("parses valid page and pageSize", () => {
    const params = new URLSearchParams({ page: "3", pageSize: "50" });
    const result = parsePaginationParams(params);
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });

  it("clamps pageSize to 1-100 range", () => {
    const tooSmall = parsePaginationParams(
      new URLSearchParams({ pageSize: "0" })
    );
    expect(tooSmall.pageSize).toBeGreaterThanOrEqual(1);

    const tooLarge = parsePaginationParams(
      new URLSearchParams({ pageSize: "999" })
    );
    expect(tooLarge.pageSize).toBeLessThanOrEqual(100);
  });

  it("defaults page to 1 for invalid values", () => {
    const nan = parsePaginationParams(
      new URLSearchParams({ page: "abc" })
    );
    expect(nan.page).toBe(1);

    const negative = parsePaginationParams(
      new URLSearchParams({ page: "-5" })
    );
    expect(negative.page).toBeGreaterThanOrEqual(1);
  });

  it("parses sortBy, sortOrder, and search", () => {
    const params = new URLSearchParams({
      sortBy: "name",
      sortOrder: "desc",
      search: "macbook",
    });
    const result = parsePaginationParams(params);
    expect(result.sortBy).toBe("name");
    expect(result.sortOrder).toBe("desc");
    expect(result.search).toBe("macbook");
  });
});

describe("buildPrismaArgs", () => {
  it("calculates correct skip and take", () => {
    const result = buildPrismaArgs(
      { page: 3, pageSize: 10, sortOrder: "asc" },
      []
    );
    expect(result.skip).toBe(20);
    expect(result.take).toBe(10);
  });

  it("only sorts by allowed fields", () => {
    const result = buildPrismaArgs(
      { page: 1, pageSize: 25, sortBy: "name", sortOrder: "asc" },
      ["name", "date"]
    );
    expect(result.orderBy).toEqual({ name: "asc" });
  });

  it("ignores sortBy not in allowed list", () => {
    const result = buildPrismaArgs(
      { page: 1, pageSize: 25, sortBy: "malicious_field", sortOrder: "asc" },
      ["name", "date"]
    );
    expect(result.orderBy).toBeUndefined();
  });
});

describe("buildPaginatedResponse", () => {
  it("calculates totalPages correctly", () => {
    const result = buildPaginatedResponse(
      [{ id: 1 }],
      100,
      { page: 1, pageSize: 25, sortOrder: "asc" }
    );
    expect(result.total).toBe(100);
    expect(result.totalPages).toBe(4);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
  });

  it("handles zero total", () => {
    const result = buildPaginatedResponse(
      [],
      0,
      { page: 1, pageSize: 25, sortOrder: "asc" }
    );
    expect(result.totalPages).toBe(0);
    expect(result.data).toEqual([]);
  });

  it("handles non-even division", () => {
    const result = buildPaginatedResponse(
      [{ id: 1 }],
      26,
      { page: 1, pageSize: 25, sortOrder: "asc" }
    );
    expect(result.totalPages).toBe(2);
  });
});
```

**Step 2: Run tests**

Run: `bun run test:unit src/lib/__tests__/pagination.test.ts`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/lib/__tests__/pagination.test.ts
git commit -m "test: add unit tests for pagination module"
```

---

## Task 7: Unit Tests — sanitize.ts (P1 Security)

**Files:**
- Create: `src/lib/__tests__/sanitize.test.ts`
- Reference: `src/lib/sanitize.ts`

**Step 1: Write the tests**

```typescript
// src/lib/__tests__/sanitize.test.ts
import { describe, it, expect } from "vitest";
import { sanitizeHtml, sanitizeObject } from "../sanitize";

describe("sanitizeHtml", () => {
  it("strips HTML tags", () => {
    expect(sanitizeHtml("<script>alert('xss')</script>")).not.toContain(
      "<script>"
    );
  });

  it("strips nested HTML tags", () => {
    expect(sanitizeHtml("<div><b>bold</b></div>")).toBe("bold");
  });

  it("decodes HTML entities", () => {
    expect(sanitizeHtml("&amp; &lt; &gt;")).toBe("& < >");
  });

  it("preserves plain text", () => {
    expect(sanitizeHtml("Hello World")).toBe("Hello World");
  });

  it("handles empty string", () => {
    expect(sanitizeHtml("")).toBe("");
  });

  it("strips event handlers in attributes", () => {
    const result = sanitizeHtml('<img onerror="alert(1)" src="x">');
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("alert");
  });
});

describe("sanitizeObject", () => {
  it("sanitizes specified fields only", () => {
    const input = {
      name: "<b>Test</b>",
      description: "<script>xss</script>",
      id: 123,
    };
    const result = sanitizeObject(input, ["name", "description"]);
    expect(result.name).toBe("Test");
    expect(result.description).not.toContain("<script>");
    expect(result.id).toBe(123);
  });

  it("does not modify unspecified fields", () => {
    const input = { safe: "hello", unsafe: "<b>bold</b>" };
    const result = sanitizeObject(input, ["unsafe"]);
    expect(result.safe).toBe("hello");
  });

  it("returns a shallow copy", () => {
    const input = { name: "test" };
    const result = sanitizeObject(input, ["name"]);
    expect(result).not.toBe(input);
  });
});
```

**Step 2: Run tests**

Run: `bun run test:unit src/lib/__tests__/sanitize.test.ts`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/lib/__tests__/sanitize.test.ts
git commit -m "test: add unit tests for sanitize module"
```

---

## Task 8: Unit Tests — rbac.ts (P0 Security — Mocked Prisma)

**Files:**
- Create: `src/lib/__tests__/rbac.test.ts`
- Reference: `src/lib/rbac.ts`

**Step 1: Write the tests**

```typescript
// src/lib/__tests__/rbac.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing rbac
vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import {
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getAllPermissions,
  PERMISSIONS,
} from "../rbac";
import prisma from "@/lib/prisma";

const mockPrisma = vi.mocked(prisma);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getUserPermissions", () => {
  it("returns empty set for nonexistent user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const perms = await getUserPermissions("nonexistent");
    expect(perms.size).toBe(0);
  });

  it("returns all permissions for admin user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      isadmin: true,
      roles: [],
    } as any);
    const perms = await getUserPermissions("admin-id");
    expect(perms.size).toBeGreaterThan(0);
    // Admin should have all permissions
    const allPerms = getAllPermissions();
    allPerms.forEach((p) => {
      expect(perms.has(p.key)).toBe(true);
    });
  });

  it("aggregates permissions from roles", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      isadmin: false,
      roles: [
        { permissions: ["asset:view", "asset:create"] },
        { permissions: ["user:view"] },
      ],
    } as any);
    const perms = await getUserPermissions("user-id");
    expect(perms.has("asset:view")).toBe(true);
    expect(perms.has("asset:create")).toBe(true);
    expect(perms.has("user:view")).toBe(true);
    expect(perms.has("user:delete")).toBe(false);
  });
});

describe("hasPermission", () => {
  it("returns true when user has the permission", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      isadmin: false,
      roles: [{ permissions: ["asset:view"] }],
    } as any);
    expect(await hasPermission("user-id", "asset:view")).toBe(true);
  });

  it("returns false when user lacks the permission", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      isadmin: false,
      roles: [{ permissions: ["asset:view"] }],
    } as any);
    expect(await hasPermission("user-id", "asset:delete")).toBe(false);
  });
});

describe("hasAnyPermission", () => {
  it("returns true when user has at least one permission", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      isadmin: false,
      roles: [{ permissions: ["asset:view"] }],
    } as any);
    expect(
      await hasAnyPermission("user-id", ["asset:view", "asset:delete"])
    ).toBe(true);
  });

  it("returns false when user has none of the permissions", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      isadmin: false,
      roles: [{ permissions: ["asset:view"] }],
    } as any);
    expect(
      await hasAnyPermission("user-id", ["asset:delete", "user:delete"])
    ).toBe(false);
  });
});

describe("hasAllPermissions", () => {
  it("returns true when user has all permissions", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      isadmin: false,
      roles: [{ permissions: ["asset:view", "asset:create"] }],
    } as any);
    expect(
      await hasAllPermissions("user-id", ["asset:view", "asset:create"])
    ).toBe(true);
  });

  it("returns false when user is missing any permission", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      isadmin: false,
      roles: [{ permissions: ["asset:view"] }],
    } as any);
    expect(
      await hasAllPermissions("user-id", ["asset:view", "asset:create"])
    ).toBe(false);
  });
});

describe("getAllPermissions", () => {
  it("returns array of permission objects", () => {
    const all = getAllPermissions();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(0);
    all.forEach((p) => {
      expect(p).toHaveProperty("key");
      expect(p).toHaveProperty("description");
    });
  });
});
```

**Step 2: Run tests**

Run: `bun run test:unit src/lib/__tests__/rbac.test.ts`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/lib/__tests__/rbac.test.ts
git commit -m "test: add unit tests for RBAC module"
```

---

## Task 9: Unit Tests — validation.ts (P1 Business)

**Files:**
- Create: `src/lib/__tests__/validation.test.ts`
- Reference: `src/lib/validation.ts`

**Step 1: Write the tests**

```typescript
// src/lib/__tests__/validation.test.ts
import { describe, it, expect } from "vitest";
import {
  createAssetSchema,
  createUserSchema,
  createAccessorySchema,
  createLicenseSchema,
  createConsumableSchema,
} from "../validation";

describe("createAssetSchema", () => {
  const validAsset = {
    assetname: "MacBook Pro",
    assettag: "ASSET-001",
  };

  it("accepts valid asset data", () => {
    const result = createAssetSchema.safeParse(validAsset);
    expect(result.success).toBe(true);
  });

  it("rejects missing assetname", () => {
    const result = createAssetSchema.safeParse({ assettag: "ASSET-001" });
    expect(result.success).toBe(false);
  });

  it("rejects empty assetname", () => {
    const result = createAssetSchema.safeParse({
      assetname: "",
      assettag: "ASSET-001",
    });
    expect(result.success).toBe(false);
  });

  it("rejects assetname exceeding max length", () => {
    const result = createAssetSchema.safeParse({
      assetname: "x".repeat(256),
      assettag: "ASSET-001",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = createAssetSchema.safeParse({
      ...validAsset,
      serialnumber: "SN-123",
      purchaseprice: 999.99,
    });
    expect(result.success).toBe(true);
  });
});

describe("createUserSchema", () => {
  const validUser = {
    username: "testuser",
    password: "SecurePass123!",
    email: "test@example.com",
    firstname: "Test",
    lastname: "User",
  };

  it("accepts valid user data", () => {
    const result = createUserSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email format", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects username too short", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      username: "ab",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password too short", () => {
    const result = createUserSchema.safeParse({
      ...validUser,
      password: "short",
    });
    expect(result.success).toBe(false);
  });
});

describe("createAccessorySchema", () => {
  it("accepts valid accessory data", () => {
    const result = createAccessorySchema.safeParse({
      accessoryname: "USB Keyboard",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = createAccessorySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("createLicenseSchema", () => {
  it("accepts valid license data", () => {
    const result = createLicenseSchema.safeParse({
      licencename: "Office 365",
    });
    expect(result.success).toBe(true);
  });
});

describe("createConsumableSchema", () => {
  it("accepts valid consumable data", () => {
    const result = createConsumableSchema.safeParse({
      consumablename: "Printer Toner",
    });
    expect(result.success).toBe(true);
  });
});
```

**Step 2: Run tests**

Run: `bun run test:unit src/lib/__tests__/validation.test.ts`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/lib/__tests__/validation.test.ts
git commit -m "test: add unit tests for Zod validation schemas"
```

---

## Task 10: Unit Tests — tenant-limits.ts + cache.ts + webhooks.ts (P1/P2)

**Files:**
- Create: `src/lib/__tests__/tenant-limits.test.ts`
- Create: `src/lib/__tests__/cache.test.ts`
- Reference: `src/lib/tenant-limits.ts`, `src/lib/cache.ts`

**Step 1: Write tenant-limits tests**

```typescript
// src/lib/__tests__/tenant-limits.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    organization: { findUnique: vi.fn() },
    asset: { count: vi.fn() },
    user: { count: vi.fn() },
  },
}));

vi.mock("@/lib/organization-context", () => ({
  getOrganizationContext: vi.fn(),
}));

import { checkAssetLimit, checkUserLimit } from "../tenant-limits";
import prisma from "@/lib/prisma";
import { getOrganizationContext } from "@/lib/organization-context";

const mockPrisma = vi.mocked(prisma);
const mockGetOrgContext = vi.mocked(getOrganizationContext);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkAssetLimit", () => {
  it("allows when no organization context", async () => {
    mockGetOrgContext.mockResolvedValue(null);
    const result = await checkAssetLimit();
    expect(result.allowed).toBe(true);
  });

  it("allows when org has unlimited assets (maxAssets = -1)", async () => {
    mockGetOrgContext.mockResolvedValue({
      organization: { id: "org-1", maxAssets: -1 },
    } as any);
    mockPrisma.asset.count.mockResolvedValue(9999);
    const result = await checkAssetLimit();
    expect(result.allowed).toBe(true);
  });

  it("allows when under limit", async () => {
    mockGetOrgContext.mockResolvedValue({
      organization: { id: "org-1", maxAssets: 100 },
    } as any);
    mockPrisma.organization.findUnique.mockResolvedValue({
      maxAssets: 100,
    } as any);
    mockPrisma.asset.count.mockResolvedValue(50);
    const result = await checkAssetLimit();
    expect(result.allowed).toBe(true);
  });

  it("blocks when at limit", async () => {
    mockGetOrgContext.mockResolvedValue({
      organization: { id: "org-1", maxAssets: 100 },
    } as any);
    mockPrisma.organization.findUnique.mockResolvedValue({
      maxAssets: 100,
    } as any);
    mockPrisma.asset.count.mockResolvedValue(100);
    const result = await checkAssetLimit();
    expect(result.allowed).toBe(false);
  });
});

describe("checkUserLimit", () => {
  it("allows when no organization context", async () => {
    mockGetOrgContext.mockResolvedValue(null);
    const result = await checkUserLimit();
    expect(result.allowed).toBe(true);
  });
});
```

**Step 2: Write cache tests**

```typescript
// src/lib/__tests__/cache.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Reset module for clean state
let cacheModule: typeof import("../cache");

beforeEach(async () => {
  vi.resetModules();
  cacheModule = await import("../cache");
});

describe("server cache", () => {
  it("returns null for missing keys", () => {
    const result = cacheModule.getCache("nonexistent");
    expect(result).toBeNull();
  });

  it("stores and retrieves values", () => {
    cacheModule.setCache("test-key", { data: "hello" });
    const result = cacheModule.getCache("test-key");
    expect(result).toEqual({ data: "hello" });
  });

  it("invalidates a specific key", () => {
    cacheModule.setCache("key1", "value1");
    cacheModule.invalidateCache("key1");
    expect(cacheModule.getCache("key1")).toBeNull();
  });
});
```

**Step 3: Run tests**

Run: `bun run test:unit src/lib/__tests__/tenant-limits.test.ts src/lib/__tests__/cache.test.ts`
Expected: All tests PASS.

**Step 4: Commit**

```bash
git add src/lib/__tests__/tenant-limits.test.ts src/lib/__tests__/cache.test.ts
git commit -m "test: add unit tests for tenant limits and cache modules"
```

---

## Task 11: Run Full Unit Suite + Coverage Report

**Step 1: Run all unit tests with coverage**

Run: `bun run test:unit:coverage`
Expected: All tests pass, coverage report generated in `./coverage/`.

**Step 2: Review coverage gaps**

Check console output for `src/lib/` coverage percentages. Target: >50% lines overall.

**Step 3: Commit coverage config if needed**

Add `coverage/` to `.gitignore` if not already present.

```bash
echo "coverage/" >> .gitignore
git add .gitignore
git commit -m "chore: add coverage directory to gitignore"
```

---

## Task 12: API Integration Test Infrastructure

**Files:**
- Create: `src/app/api/__tests__/setup.ts`

**Step 1: Create API test setup with common mocks**

```typescript
// src/app/api/__tests__/setup.ts
import { vi } from "vitest";

// Common mocks for all API route tests
export function setupApiMocks() {
  // Mock auth module
  vi.mock("@/auth", () => ({
    auth: vi.fn(),
  }));

  // Mock prisma
  vi.mock("@/lib/prisma", () => {
    const { createMockPrisma } = require("../../tests/setup/prisma-mock");
    return { default: createMockPrisma() };
  });

  // Mock logger
  vi.mock("@/lib/logger", () => ({
    default: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      rateLimitExceeded: vi.fn(),
    },
  }));

  // Mock audit log
  vi.mock("@/lib/audit-log", () => ({
    createAuditLog: vi.fn(),
    createAuditLogWithDiff: vi.fn(),
  }));

  // Mock webhooks
  vi.mock("@/lib/webhooks", () => ({
    triggerWebhook: vi.fn(),
  }));

  // Mock organization context
  vi.mock("@/lib/organization-context", () => ({
    getOrganizationContext: vi.fn(),
    scopeToOrganization: vi.fn((where, orgId) => ({
      ...where,
      organizationId: orgId,
    })),
  }));
}
```

**Step 2: Commit**

```bash
git add src/app/api/__tests__/setup.ts
git commit -m "test: add API integration test setup with common mocks"
```

---

## Task 13: API Tests — Auth Register Route

**Files:**
- Create: `src/app/api/__tests__/auth-register.test.ts`
- Reference: `src/app/api/auth/register/route.ts`

**Step 1: Write the tests**

```typescript
// src/app/api/__tests__/auth-register.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse } from "../../../tests/setup/test-helpers";

// Setup mocks before imports
vi.mock("@/lib/prisma", () => ({
  default: {
    user: { findFirst: vi.fn(), create: vi.fn() },
    organization: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/api-auth", () => ({
  requireNotDemoMode: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/rate-limit", () => ({
  getClientIP: vi.fn().mockReturnValue("127.0.0.1"),
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
  createRateLimitResponse: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("bcryptjs", () => ({
  hash: vi.fn().mockResolvedValue("hashed_password"),
}));

import { POST } from "@/app/api/auth/register/route";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const mockPrisma = vi.mocked(prisma);
const mockCheckRateLimit = vi.mocked(checkRateLimit);

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockResolvedValue({ success: true });
});

describe("POST /api/auth/register", () => {
  const validBody = {
    email: "test@example.com",
    username: "testuser",
    password: "SecurePass123!",
    firstname: "Test",
    lastname: "User",
    organizationName: "Test Corp",
  };

  it("returns 201 on successful registration", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.$transaction.mockResolvedValue([{}, {}]);

    const req = createMockRequest("/api/auth/register", {
      method: "POST",
      body: validBody,
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(201);
  });

  it("returns 409 for duplicate email", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({ userid: "existing" } as any);

    const req = createMockRequest("/api/auth/register", {
      method: "POST",
      body: validBody,
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(409);
  });

  it("returns 400 for missing required fields", async () => {
    const req = createMockRequest("/api/auth/register", {
      method: "POST",
      body: { email: "test@example.com" },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);
    expect(status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({
      success: false,
      retryAfter: 3600,
    } as any);

    const { createRateLimitResponse } = await import("@/lib/rate-limit");
    vi.mocked(createRateLimitResponse).mockReturnValue(
      new Response(JSON.stringify({ error: "Rate limited" }), { status: 429 })
    );

    const req = createMockRequest("/api/auth/register", {
      method: "POST",
      body: validBody,
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
```

**Step 2: Run tests**

Run: `bun run test:unit src/app/api/__tests__/auth-register.test.ts`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/app/api/__tests__/auth-register.test.ts
git commit -m "test: add API integration tests for auth register route"
```

---

## Task 14: API Tests — Asset CRUD Route

**Files:**
- Create: `src/app/api/__tests__/asset-crud.test.ts`
- Reference: `src/app/api/asset/route.ts`

**Step 1: Write the tests**

```typescript
// src/app/api/__tests__/asset-crud.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockRequest, parseResponse } from "../../../tests/setup/test-helpers";
import { mockAdminUser, mockRegularUser } from "../../../tests/setup/fixtures/users";
import { mockAsset, mockAssetList } from "../../../tests/setup/fixtures/assets";

// Mock all dependencies
vi.mock("@/lib/prisma", () => ({
  default: {
    asset: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api-auth", () => ({
  requireNotDemoMode: vi.fn().mockReturnValue(null),
  requirePermission: vi.fn(),
}));

vi.mock("@/lib/organization-context", () => ({
  getOrganizationContext: vi.fn().mockResolvedValue({
    organization: { id: "org-uuid-001" },
    userId: "admin-uuid-001",
    isAdmin: true,
  }),
  scopeToOrganization: vi.fn((where, orgId) => ({
    ...where,
    organizationId: orgId,
  })),
}));

vi.mock("@/lib/tenant-limits", () => ({
  checkAssetLimit: vi.fn().mockResolvedValue({ allowed: true, current: 5, max: 100 }),
}));

vi.mock("@/lib/webhooks", () => ({ triggerWebhook: vi.fn() }));
vi.mock("@/lib/audit-log", () => ({ createAuditLog: vi.fn() }));
vi.mock("@/lib/logger", () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { GET, POST, PUT } from "@/app/api/asset/route";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/api-auth";

const mockPrisma = vi.mocked(prisma);
const mockRequirePermission = vi.mocked(requirePermission);

beforeEach(() => {
  vi.clearAllMocks();
  mockRequirePermission.mockResolvedValue(mockAdminUser as any);
});

describe("GET /api/asset", () => {
  it("returns paginated assets", async () => {
    mockPrisma.asset.findMany.mockResolvedValue(mockAssetList as any);
    mockPrisma.asset.count.mockResolvedValue(2);

    const req = createMockRequest("/api/asset?page=1&pageSize=25");
    const res = await GET(req);
    const { status, body } = await parseResponse<any>(res);

    expect(status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.total).toBe(2);
  });

  it("returns single asset by id", async () => {
    mockPrisma.asset.findUnique.mockResolvedValue(mockAsset as any);

    const req = createMockRequest("/api/asset?id=asset-uuid-001");
    const res = await GET(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(200);
  });

  it("returns 401 when not authenticated", async () => {
    mockRequirePermission.mockRejectedValue(
      Object.assign(new Error("Unauthorized"), { status: 401 })
    );

    const req = createMockRequest("/api/asset");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});

describe("POST /api/asset", () => {
  it("creates an asset with valid data", async () => {
    mockPrisma.asset.create.mockResolvedValue({
      ...mockAsset,
      assetid: "new-asset-uuid",
    } as any);

    const req = createMockRequest("/api/asset", {
      method: "POST",
      body: {
        assetname: "New Asset",
        assettag: "NEW-001",
      },
    });
    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(201);
    expect(mockPrisma.asset.create).toHaveBeenCalled();
  });

  it("returns 400 for invalid data", async () => {
    const req = createMockRequest("/api/asset", {
      method: "POST",
      body: { assetname: "" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 403 when asset limit reached", async () => {
    const { checkAssetLimit } = await import("@/lib/tenant-limits");
    vi.mocked(checkAssetLimit).mockResolvedValue({
      allowed: false,
      current: 100,
      max: 100,
    });

    const req = createMockRequest("/api/asset", {
      method: "POST",
      body: { assetname: "Over Limit", assettag: "OL-001" },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});
```

**Step 2: Run tests**

Run: `bun run test:unit src/app/api/__tests__/asset-crud.test.ts`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/app/api/__tests__/asset-crud.test.ts
git commit -m "test: add API integration tests for asset CRUD routes"
```

---

## Task 15: API Tests — User Route + Roles Route

**Files:**
- Create: `src/app/api/__tests__/user-crud.test.ts`
- Create: `src/app/api/__tests__/roles.test.ts`

Write tests following the same pattern as Tasks 13-14. Key test cases:

**user-crud.test.ts:**
- GET returns current user profile
- GET returns user list with pagination (requires user:view permission)
- PUT updates user (admin can update anyone, user can only update self)
- PUT blocks non-admin from changing isadmin field
- Returns 401 when not authenticated

**roles.test.ts:**
- GET returns roles for admin users
- POST creates a role with valid permissions
- POST rejects invalid permission names
- Returns 403 for non-admin users

**Step 1: Write tests following the patterns established in Tasks 13-14.**

**Step 2: Run tests**

Run: `bun run test:unit src/app/api/__tests__/user-crud.test.ts src/app/api/__tests__/roles.test.ts`
Expected: All tests PASS.

**Step 3: Commit**

```bash
git add src/app/api/__tests__/user-crud.test.ts src/app/api/__tests__/roles.test.ts
git commit -m "test: add API integration tests for user and roles routes"
```

---

## Task 16: E2E — Auth Setup + Login Flow

**Files:**
- Create: `tests/e2e/auth.setup.ts`
- Create: `tests/e2e/auth-flow.spec.js`
- Modify: `playwright.config.js`

**Step 1: Add auth setup project to Playwright config**

Add to `playwright.config.js` projects array (before other projects):

```javascript
{
  name: 'setup',
  testMatch: /.*\.setup\.ts/,
},
```

Update other projects to depend on setup:
```javascript
{
  name: 'chromium',
  use: { ...devices['Desktop Chrome'], storageState: 'tests/e2e/.auth/user.json' },
  dependencies: ['setup'],
},
```

**Step 2: Create auth setup that saves login state**

```typescript
// tests/e2e/auth.setup.ts
import { test as setup, expect } from '@playwright/test';

const authFile = 'tests/e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="username"]', process.env.TEST_USERNAME || 'admin');
  await page.fill('input[name="password"]', process.env.TEST_PASSWORD || 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/);
  await page.context().storageState({ path: authFile });
});
```

**Step 3: Create auth flow E2E tests**

```javascript
// tests/e2e/auth-flow.spec.js
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // No pre-auth

  test('shows login page for unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('login form has required fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|log in/i })).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'wronguser');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible();
  });
});
```

**Step 4: Add .auth to gitignore**

```bash
echo "tests/e2e/.auth/" >> .gitignore
```

**Step 5: Commit**

```bash
git add tests/e2e/auth.setup.ts tests/e2e/auth-flow.spec.js playwright.config.js .gitignore
git commit -m "test: add E2E auth setup and login flow tests"
```

---

## Task 17: E2E — Asset Lifecycle Tests

**Files:**
- Create: `tests/e2e/asset-lifecycle.spec.js`

**Step 1: Write authenticated asset lifecycle tests**

```javascript
// tests/e2e/asset-lifecycle.spec.js
import { test, expect } from '@playwright/test';

test.describe('Asset Lifecycle', () => {
  test('can navigate to assets page', async ({ page }) => {
    await page.goto('/assets');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*assets/);
  });

  test('can navigate to create asset form', async ({ page }) => {
    await page.goto('/assets');
    await page.click('a[href="/assets/create"], button:has-text("Add"), button:has-text("Create")');
    await expect(page).toHaveURL(/.*assets\/create/);
  });

  test('create asset form has required fields', async ({ page }) => {
    await page.goto('/assets/create');
    await expect(page.locator('input[name="assetname"], #assetname')).toBeVisible();
    await expect(page.locator('input[name="assettag"], #assettag')).toBeVisible();
  });

  test('dashboard shows asset statistics', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // Dashboard should show stat cards
    const statCards = page.locator('[class*="stat"], [class*="card"]');
    await expect(statCards.first()).toBeVisible();
  });
});
```

**Step 2: Commit**

```bash
git add tests/e2e/asset-lifecycle.spec.js
git commit -m "test: add E2E asset lifecycle tests"
```

---

## Task 18: GitHub Actions CI Pipeline

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run format:check

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run test:unit:coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: coverage/
          retention-days: 14

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, unit-tests]
    env:
      DATABASE_URL: "postgresql://fake:fake@localhost:5432/fake"
      NEXTAUTH_SECRET: "ci-test-secret-not-real"
      NEXTAUTH_URL: "http://localhost:3000"
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx prisma generate
      - run: bun run build

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: [build]
    if: false # Enable when test DB is available in CI
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx playwright install --with-deps chromium
      - run: bun run build
      - run: bunx playwright test --project=chromium
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

**Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions pipeline with lint, unit tests, and build"
```

---

## Task 19: Final Verification + Coverage Checkpoint

**Step 1: Run full unit test suite with coverage**

Run: `bun run test:unit:coverage`
Expected: All tests pass, coverage report shows >50% for `src/lib/`.

**Step 2: Run build**

Run: `bun run build`
Expected: Build succeeds — tests don't break production.

**Step 3: Run lint**

Run: `bun run lint`
Expected: No new errors from test files.

**Step 4: Review coverage report**

Open `coverage/index.html` in browser. Identify remaining low-coverage modules for future work.

**Step 5: Final commit with summary**

```bash
git add -A
git commit -m "test: full-stack test coverage foundation complete

- 12+ unit test files covering security, business logic, and utilities
- API integration tests for auth, asset CRUD, user, and roles routes
- E2E auth setup with login state persistence
- E2E tests for auth flow and asset lifecycle
- GitHub Actions CI with lint, unit tests, build, and E2E gates
- Coverage reporting with v8 provider"
```
