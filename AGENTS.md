# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router entry point; feature folders (e.g. `assets`, `manufacturers`) bundle route handlers, page components, and UI fragments. Shared UI lives in `app/components` and `app/ui`. API handlers reside under `app/api`.
- `app/lib` and `app/utils`: server helpers for data access and formatting; prefer importing via the `@/*` alias (see `jsconfig.json`).
- `prisma/`: schema, migrations, and `seed.js` for seeding. Maintain schema changes here and regenerate the client before committing.
- `public/` holds static assets; `docs/` captures upgrade notes; `sql/` contains legacy queries useful for reference.

## Build, Test, and Development Commands
- `bun install` (or `npm install`) keeps dependencies in sync with `bun.lockb`.
- `bun dev` starts the Next.js dev server with Turbopack and the inspector flag enabled.
- `bun run build` creates the production bundle; `bun run start` serves the optimized build.
- `bun run lint` runs the Next.js ESLint config. Treat warnings as actionable before opening a PR.
- `bun run db:seed` populates seed data; run after `npx prisma migrate dev --name <label>` when schema updates land.

## Coding Style & Naming Conventions
- Use 2-space indentation and keep imports ordered (external, aliases, relative). Prefer arrow functions for components unless async server components are required.
- Name components and files in PascalCase within `app/components`, and route segments in lowercase-hyphen format (e.g. `asset-history`).
- Compose UI with Tailwind utility classes and NextUI primitives; keep shared styles in `app/globals.css`.
- Run `bun run lint` before pushing; add comments sparingly and only when code intent is non-obvious.

## Testing Guidelines
- Automated tests are not yet configured. When adding tests, colocate them in the relevant feature directory using `*.test.(js|ts|tsx)` and document new tooling in `README.md`.
- For now, validate changes via linting plus manual checks of critical flows (login, asset CRUD, QR generation). Capture any new manual test script in the PR description.

## Commit & Pull Request Guidelines
- Follow the existing history: concise, imperative subject lines (`Overhaul asset tables`, `Docs: add upgrade notes`) with optional context in the body.
- Each PR should describe the user-facing impact, note schema or seed changes, and include screenshots for UI updates.
- Reference related issues or linear tasks, mention required env updates, and ensure database migrations are committed alongside schema edits.
