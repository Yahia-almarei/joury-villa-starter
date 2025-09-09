# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (Next.js)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check with TypeScript (no emit)
- `npm test` - Run tests with Vitest

## Database Commands

- `npm run db:migrate` - Run Prisma database migrations
- `npm run db:seed` - Seed database with sample data using `prisma/seed.ts`
- `npx prisma generate` - Generate Prisma client (runs automatically on postinstall)
- `npx prisma studio` - Open Prisma Studio for database browsing

## Project Architecture

This is a **Next.js 14 vacation rental booking platform** built as a starter for a Lodgify-inspired direct booking site. The project uses the App Router and TypeScript throughout.

### Core Technology Stack
- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth v5 (beta)
- **Email**: Resend
- **Testing**: Vitest
- **Payments**: PayPal (primary, extensible for PayTabs/HyperPay)

### Database Schema (Prisma)
The schema in `prisma/schema.prisma` defines the complete booking system:
- **User Management**: Users, CustomerProfile with role-based access (ADMIN/CUSTOMER)
- **Property System**: Property with configurable pricing, seasons, blocked periods
- **Booking Flow**: Reservations with status tracking (PENDING → AWAITING_APPROVAL → APPROVED → PAID)
- **Payment Processing**: Payment records with provider tracking and webhook support
- **Business Logic**: Coupons, audit logs for compliance

### Application Structure
- `app/` - Next.js App Router pages and API routes
  - `app/page.tsx` - Landing page with hero and quick booking widget
  - `app/book/page.tsx` - Booking form and availability checking
  - `app/admin/page.tsx` - Admin dashboard (requires ADMIN role)
  - `app/account/page.tsx` - Customer account management
  - `app/policies/page.tsx` - Terms and cancellation policies
  - `app/api/` - API routes for booking flow
- `components/` - Reusable React components
- `lib/` - Utility functions and business logic
  - `lib/booking.ts` - Core booking logic (currently placeholder, needs DB integration)

### API Endpoints Structure
- `POST /api/quote` - Get pricing quote for dates/guests
- `GET /api/availability` - Check availability for date range
- `POST /api/checkout` - Create reservation and payment intent
- `POST /api/payment/webhook` - Handle payment provider webhooks
- `GET /api/ical` - Generate iCalendar feed for reservations

### Configuration
- **Path aliases**: `@/*` maps to project root for clean imports
- **TypeScript**: Strict mode enabled, ES2022 target
- **Environment**: Uses `.env.local` (copy from `.env.example`)
- **Internationalization**: Planned for English, Arabic (RTL), Hebrew (RTL)

### Business Rules
- Property configured for Jericho, Israel (Asia/Jerusalem timezone)
- Pricing: Base rate + per-adult/child supplements + cleaning fee + VAT
- Minimum 2 nights, maximum 14 nights by default
- Seasonal pricing overrides supported via Season model
- Admin approval workflow when `REQUIRES_ADMIN_APPROVAL=true`

### Development Workflow
The booking flow is designed to be implemented incrementally:
1. **Quote system** - Replace placeholder in `lib/booking.ts` with DB-backed logic
2. **Payment integration** - Complete PayPal checkout and webhook handling
3. **User authentication** - Implement NextAuth with email verification
4. **Admin features** - Build reservation management, seasonal pricing, user blocking
5. **Email notifications** - Confirmation, reminders, cancellations with .ics attachments

### Key Implementation Notes
- All pricing stored as integers (cents/agorot) to avoid floating point issues
- Reservation holds expire automatically to prevent inventory locking
- Audit logs track all administrative actions for compliance
- Payment webhooks must be idempotent and verify signatures
- Server Actions enabled for form handling (`next.config.mjs`)