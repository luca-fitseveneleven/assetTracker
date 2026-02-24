# Full-Stack Test Coverage Design

**Date:** 2026-02-24
**Status:** Approved
**Approach:** Bottom-Up (Unit -> API -> Component -> E2E -> CI)

## Context

The assettTracker project has 70+ API routes, 40+ library modules, and 6 basic E2E specs but minimal test coverage. Only 4 unit test files exist (account-lockout, encryption, env-validation, rate-limit). No API integration tests, no component tests, no CI pipeline, no coverage reporting.

## Architecture

Three test layers with a layered database strategy:

| Layer | Tool | Speed | DB Strategy | Scope |
|-------|------|-------|-------------|-------|
| Unit | Vitest | <10s | Mocked Prisma | `src/lib/` utilities, hooks, pure logic |
| API Integration | Vitest | ~30s | Real test DB | API route handlers — auth, validation, CRUD, permissions |
| E2E | Playwright | ~2min | Real seeded DB | Full user flows — login, asset lifecycle, admin workflows |

## File Structure

```
src/lib/__tests__/              # Unit tests (expand from 4 to ~20 files)
src/app/api/__tests__/          # API integration tests (new)
tests/e2e/                      # E2E tests (expand from 6 specs)
tests/setup/
  prisma-mock.ts                # Prisma mock factory for unit tests
  db-setup.ts                   # Test DB setup/teardown for integration tests
  test-helpers.ts               # Auth helpers, request builders
  fixtures/                     # Test data factories
```

## Dependencies

```
@testing-library/react          # Component testing
@testing-library/jest-dom       # DOM assertions
@testing-library/user-event     # User interaction simulation
vitest-mock-extended            # Prisma mock factory
@vitest/coverage-v8             # Coverage reporting
happy-dom                       # Lightweight DOM for component tests
```

## Layer 1: Unit Tests

Expand from 4 to ~20 test files. Priority order:

### P0 (Security-critical)
- `permissions.ts` / `rbac.ts` — 35 permissions, role checks
- `auth-guards.ts` / `api-auth.ts` — Auth guard logic
- `password-validation.ts` — Password policy enforcement
- `mfa.ts` — TOTP verification

### P1 (Business-critical)
- `pagination.ts` — Used by 18+ endpoints
- `validation.ts` / `validations.ts` — Input validation
- `tenant-limits.ts` — Billing enforcement
- `workflow-engine.ts` — Condition evaluation
- `sanitize.ts` — XSS prevention

### P2 (Important)
- `depreciation.ts` — Financial calculations
- `formatting.ts` — Display logic
- `cache.ts` — TTL/eviction
- `webhooks.ts` — Delivery/retry
- `session-tracking.ts` — Session lifecycle

## Layer 2: API Integration Tests

Test route handlers directly: import handler, pass mock NextRequest, assert NextResponse.

### Test DB Setup
- Separate `DATABASE_URL_TEST` pointing to test schema
- `prisma db push` before test suite
- Seed minimal fixtures per test file
- Truncate between test files (not between individual tests)

### Route Coverage (~30 critical routes)

| Group | Routes | Focus |
|-------|--------|-------|
| Auth | register, login, forgot-password, reset-password, MFA | Auth flow, validation, rate limiting |
| Assets | CRUD, checkout, attachments, reservations, transfers | Full lifecycle, permissions, org scoping |
| Users | CRUD, assign/unassign | Permissions, org scoping |
| Admin | roles, permissions, workflows, custom fields, settings | Admin-only guards |
| Billing | checkout, webhooks | Stripe integration, plan enforcement |

## Layer 3: E2E Tests

### Auth Setup
- `tests/e2e/auth.setup.ts` — Login and save storage state
- All specs use authenticated state by default

### New Specs
- `auth-flow.spec.ts` — Login, logout, MFA, password reset
- `asset-lifecycle.spec.ts` — Create, edit, checkout, checkin, delete
- `admin-workflows.spec.ts` — Roles, permissions, settings
- `permissions.spec.ts` — Regular user vs admin access

## CI Pipeline (GitHub Actions)

```yaml
on: [push, pull_request]

jobs:
  lint:        # ESLint + Prettier check (~30s)
  unit-tests:  # Vitest unit + coverage (~30s)
  api-tests:   # Vitest API tests with test DB (~1min)
  build:       # next build (~2min)
  e2e-tests:   # Playwright on built app (~3min)
```

### Quality Gates
- Lint must pass
- Unit test coverage >70% for `src/lib/`
- All API tests pass
- Build succeeds
- E2E tests pass (Chromium only in CI)

## Coverage

- `@vitest/coverage-v8` for line/branch coverage
- Threshold: 70% lines for `src/lib/`
- HTML coverage report as CI artifact
