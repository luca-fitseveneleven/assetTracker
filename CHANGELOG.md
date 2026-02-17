# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Freshdesk API integration for IT tickets (Hardware Request, Problem types)
- Freshdesk settings tab in Admin Settings
- IT Tickets page with Freshdesk ticket listing, filtering, and search
- Local ticket system with comments (API + UI)
- Merge of local Prisma ticket CRUD and Freshdesk ticket endpoints

### Previous (pre-changelog)
- Core asset CRUD with QR codes, validation, and bulk operations
- User management with roles, permissions, and profile pages
- Accessories, licenses, and consumables management
- Supporting entities (manufacturers, suppliers, locations, models, status types, categories)
- Dashboard with summary statistics and charts
- Reporting and analytics with CSV/PDF export
- Global search across all entities
- Email notification system (Brevo, SendGrid, Mailgun, Postmark, SES)
- Admin settings panel (general, email, notifications, labels, depreciation, custom fields)
- Audit logging infrastructure and asset history timeline
- Authentication with NextAuth, feature flags, rate limiting
- Docker and Podman deployment support
- Database schema for multi-tenancy, RBAC, webhooks, reservations, maintenance, and more
