# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Show/hide password toggle on login** — eye-icon button reveals or hides the typed password on the sign-in form, matching the toggle already used on the user-edit form. Toggle is keyboard-skipped (`tabIndex={-1}`) and labelled for screen readers
- **Role-based dashboard** — non-admin users see "My Dashboard" with their assigned assets, pending requests, and open tickets
- **Reservation notifications** — admins receive email when users request assets; requesters receive email on approval/rejection
- **Ticket notifications** — email notifications on ticket assignment, comments, and status changes
- **Dashboard widgets** — Expiring Licences (color-coded by urgency) and Cost Overview (total value, average) widgets now functional
- **Checkout history on user profile** — shows last 20 checkout/checkin events with status badges
- **Bulk CSV import** for accessories, consumables, licences, and users (previously only assets and locations)
- **QR scanner action panel** — scanning shows asset details card with View Details, Check Out, and Scan Another buttons
- **Report charts** — Cost by Category and Asset Age Distribution added to the Breakdown tab
- **Maintenance completion notification** — emails assigned user with next due date after task completion
- **Accessory and licence detail pages** — `/accessories/[id]` and `/licences/[id]` with breadcrumbs and status badges
- **Not-found pages** for accessory, licence, and consumable detail/edit routes
- **Typed error classes** — `AppError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ValidationError`, `RateLimitError`
- **`getBaseUrl()` helper** — centralized URL resolution that throws in production if no URL env var is set
- **Database migration** — new indexes for audit_logs, maintenance_schedules, custom_field_definitions, notification_queue
- **Audit scan workflow** — live QR scan page for active audit campaigns with progress bar, continuous scanning, manual tag entry fallback, and found/missing reconciliation
- **Item templates** — `AssetTemplate` model with CRUD API; "From Template" dropdown on asset create form pre-fills category, manufacturer, model, status, location, supplier, specs, notes
- **Parametric search** — advanced search page at `/search` with entity type selector, dynamic filter rows (field + operator + value), custom field support, and paginated results
- **Booking calendar** — month-view grid calendar showing reservations as colored bars (green=approved, yellow=pending, red=rejected) at `/reservations`
- **Self-service user role** — non-admin users see only their assigned assets/accessories/licences on list pages; Maintenance, Audits, Import hidden from non-admin nav
- **Programmable label templates** — `{{placeholder}}` syntax with `{{#if field}}...{{/if}}` conditionals, live preview in admin settings, backward compatible with old field-array templates
- **Serial number auto-detect** — identifies Apple/Dell/Lenovo from serial patterns, auto-selects manufacturer and category on asset create form
- **Event log with revert** — `createAuditLogWithSnapshot` stores before/after JSON diffs; revert API restores previous state; revert button in audit log viewer for UPDATE actions
- **Sub-locations** — hierarchical parent-child locations with expandable tree table, parent dropdown in create/edit forms
- **Supplier website** — URL field on supplier model, clickable link in table
- **Smart auto-tags** — generates tags from `CATEGORY-MANUFACTURER-MODEL-0001`
- **Asset location map** — MapLibre GL map with auto-geocoding (OpenStreetMap Nominatim), emerald markers sized by asset count, stats overlay, dark/light theme
- **Recently Modified dashboard widget** — shows last 5 edited assets with relative timestamps
- **Quick Create dropdown** — sidebar button to create assets, accessories, consumables, licences, users, locations
- **Cross-browser QR scanning** — jsQR library replaces BarcodeDetector API for Safari/Firefox support
- **Umami analytics** — self-hosted tracking via `next/script` with `afterInteractive` strategy

### Changed

- **Notification dropdown — instant UI via `useOptimistic`** — mark-as-read, delete, mark-all-read, and delete-all now apply to the UI in the same frame the user clicks, instead of waiting for the server round-trip. Failed mutations auto-revert with a toast (rollback is automatic via React 19's `useOptimistic` when the surrounding transition ends without committing). Internally collapses the prior `notifications` + `unreadCount` `useState` pair into one source-of-truth `NotifState` driven by a typed reducer with four action variants, eliminating a class of dual-write desync bugs. "Mark all read" now fires one optimistic update + a single `Promise.allSettled` fan-out instead of N independent state updates that flickered the list. `unreadCount` is adjusted (not derived) because it represents the true server total, which can exceed the displayed limit of 10
- **Performance** — parallelized data fetching with `Promise.all()` on assets, asset detail, and user settings pages
- **Performance** — added 2-minute PostgreSQL cache to 10+ data functions (assets, accessories, consumables, licences, users, categories)
- **Performance** — reduced Sentry trace sampling from 100% to 10% in production
- **Performance** — optimized `pg.Pool` for serverless (max=3 connections, 10s idle timeout, 5s connection timeout, 30s statement timeout)
- **Performance** — deduplicated `orgWhere()` and `ensureCacheTable()` calls on cold starts
- **Performance** — dashboard `StatsWidget` now uses server-fetched counts instead of 3 full API calls
- **Database** — converted `rate_limits` table to UNLOGGED for reduced write overhead
- **Database** — schema-qualified all raw SQL table references (`"assettool"."cache"`, `"assettool"."rate_limits"`)
- **Database** — self-healing table creation if cache/rate_limits tables are missing
- **Accessories filter UI** — compact single-row layout replacing the multi-row filter design
- **Admin settings** — sidebar is now sticky with independent scroll
- **Compliance dashboard** — stub items show "Not Yet Available" instead of misleading "Needs Review"
- **CRON_SECRET** — now required in production (was optional)
- **Validation schemas** — consolidated `validation.ts` and `validations.ts` into single file with stricter schemas
- **API handler types** — added `NextRequest` type annotations to 64 handler functions across 31 files

### Fixed

- **Search injection** — replaced `to_tsquery` with `websearch_to_tsquery` in all 6 search routes
- **QR codes** — replaced hardcoded `192.168.0.81` with `NEXT_PUBLIC_APP_URL`
- **Date serialization** — cached dates (strings from JSONB) no longer crash `.toISOString()` calls
- **Referential integrity** — deleting a manufacturer/location/supplier/status/model referenced by assets returns 409 with count
- **Admin session staleness** — 3 admin settings routes now use `requireApiAdmin()` instead of cached cookie check
- **SCIM privilege escalation** — PATCH handler whitelist prevents setting `isadmin` via SCIM Operations
- **Import security** — CSV user import now generates random bcrypt password hash (was null)
- **Localhost fallbacks** — removed all `|| "http://localhost:3000"` patterns from SSO, invite, and magic link URLs
- **Dead code** — removed `/sentry-example-page`, unused `postData()` export, and `testData` import

### Security

- **Organization scoping** — added `scopeToOrganization` to all write endpoints (POST/PUT/PATCH) for assets, accessories, consumables
- **Ownership verification** — update/delete operations verify the record belongs to the caller's organization
- **Cross-tenant data leaks** — fixed advanced reports, stock alerts, checkout history, kits, components, licence seats, and organizations endpoints
- **Query limits** — added `take: 1000` to unbounded `findMany` in `getAsset` and `getUser` routes
- **DB_SCHEMA validation** — environment variable validated against `[a-zA-Z0-9_]` to prevent SQL injection
- **Webhook OPTIONS** — added authentication to previously unauthenticated endpoint
