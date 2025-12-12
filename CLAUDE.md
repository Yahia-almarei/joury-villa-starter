# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (Next.js)
- `npm run dev:clean` - Clean .next cache and start dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run clean` - Clean .next and node_modules cache
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check with TypeScript (no emit)
- `npm test` - Run tests with Vitest

## Database Commands

- Database is managed through **Supabase** web interface and SQL migrations
- Migration files are in `supabase/migrations/` folder
- TypeScript types are in `types/supabase.ts`
- `npm run supabase:start` - Start local Supabase
- `npm run supabase:stop` - Stop local Supabase
- `npm run supabase:reset` - Reset local database
- `npm run supabase:migrate` - Push migrations to database
- `npm run supabase:types` - Generate TypeScript types

## Project Architecture

This is a **fully functional Next.js 14 vacation rental booking platform** for Joury Villa in Jericho, Palestinian Territories. The project uses the App Router and TypeScript throughout with complete booking, admin, and user management systems.

### Core Technology Stack
- **Framework**: Next.js 14.2.5 with App Router
- **Database**: PostgreSQL with Supabase
- **Authentication**: NextAuth v5.0.0-beta.20 with Google OAuth
- **Styling**: Tailwind CSS with custom coral theme
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **Email**: Resend integration
- **Testing**: Vitest
- **Icons**: Lucide React
- **Internationalization**: English and Arabic (RTL support)

### Database Schema (Supabase)
Complete schema with 7 migrations:
- **User Management**: Users, CustomerProfiles with role-based access (ADMIN/CUSTOMER)
- **Property System**: Property settings, custom pricing, blocked periods
- **Booking Flow**: Reservations with full status workflow
- **Business Logic**: Coupons (public/private), audit logs
- **House Rules**: Multi-language house rules system
- **Reviews**: Customer review and rating system
- **Analytics**: Revenue tracking and reporting

### Application Structure

#### Public Pages
- `app/page.tsx` - Landing page with hero, amenities, and booking widget
- `app/availability/page.tsx` - Real-time availability checking
- `app/overview/page.tsx` - Property overview and details
- `app/gallery/page.tsx` - Photo gallery
- `app/policies/page.tsx` - Terms, cancellation, and policies
- `app/reviews/page.tsx` - Customer reviews display
- `app/contact/page.tsx` - Contact information
- `app/map/page.tsx` - Location and map

#### Booking System
- `app/book/page.tsx` - Multi-step booking form
- `app/checkout/page.tsx` - Payment and confirmation
- `app/verify-booking/page.tsx` - Email verification flow

#### Authentication
- `app/auth/signin/page.tsx` - Sign in with Google OAuth
- `app/auth/signup/page.tsx` - User registration
- `app/auth/phone-setup/page.tsx` - Required phone verification for customers
- `app/auth/callback-handler/page.tsx` - OAuth callback processing
- `app/auth/verify/page.tsx` - Email verification
- `app/admin-login/page.tsx` - Admin-specific login page

#### Customer Portal
- `app/account/page.tsx` - Account dashboard and bookings
- `app/account/profile/page.tsx` - Profile management with phone verification

#### Admin Dashboard (Role-based access)
- `app/admin/page.tsx` - Main dashboard with analytics
- `app/admin/calendar/page.tsx` - Booking calendar management
- `app/admin/reservations/page.tsx` - Reservation management
- `app/admin/reservations/[id]/page.tsx` - Individual reservation details
- `app/admin/pricing/page.tsx` - Dynamic pricing management
- `app/admin/coupons/page.tsx` - Coupon management
- `app/admin/users/page.tsx` - User management and blocking
- `app/admin/policies/page.tsx` - Policy management
- `app/admin/reviews/page.tsx` - Review moderation
- `app/admin/reports/page.tsx` - Analytics and reporting
- `app/admin/settings/page.tsx` - Property settings

### API Endpoints

#### Public APIs
- `GET /api/availability` - Check date availability
- `POST /api/quote` - Get pricing quotes
- `GET /api/house-rules` - Get house rules
- `GET /api/reviews` - Get approved reviews
- `GET /api/ical` - iCalendar feed for bookings

#### Booking APIs
- `POST /api/checkout` - Create reservation
- `POST /api/verify-booking` - Verify booking via email
- `POST /api/validate-coupon` - Validate coupon codes

#### Authentication APIs
- `POST /api/auth/signup` - User registration
- `POST /api/auth/verify` - Email verification
- `POST /api/profile` - Profile management
- `POST /api/save-phone` - Phone number verification
- `POST /api/signout` - Custom sign out (bypasses NextAuth issues)

#### Admin APIs
- Complete CRUD operations for all resources
- `GET /api/admin/analytics` - Dashboard analytics
- `GET /api/admin/reservations` - Reservation management
- `POST /api/admin/users/[id]` - User blocking/unblocking
- Reservation workflow: approve, decline, cancel, reschedule

### Components Architecture

#### Admin Components
- `components/admin/sidebar.tsx` - Admin navigation sidebar
- `components/admin/header.tsx` - Admin header with user menu
- `components/admin/dashboard-content.tsx` - Dashboard widgets
- `components/admin/calendar.tsx` - Booking calendar
- `components/admin/pending-reservations.tsx` - Approval workflow
- Complete dialog system for all admin actions

#### UI Components
- Full Radix UI component library in `components/ui/`
- Custom calendar components with availability checking
- Responsive design with mobile-first approach
- RTL language support for Arabic

### Configuration & Features

#### Authentication System
- Google OAuth integration with NextAuth v5
- Role-based access control (ADMIN/CUSTOMER)
- Phone number verification required for customers
- Email verification workflow
- Session management with JWT strategy
- Automatic user creation and role assignment

#### Business Logic
- **Property**: Jericho, Palestinian Territories location
- **Pricing**: Base rate + cleaning fees, seasonal overrides
- **Booking Rules**: 2-night minimum, 14-night maximum
- **Admin Approval**: Optional workflow for reservations
- **Coupon System**: Public and private discount codes
- **Review System**: Customer feedback with moderation
- **Audit Logging**: Complete admin action tracking

#### Multi-language Support
- English and Arabic translations
- RTL support for Arabic interface
- Dynamic language switching
- Translation files in `translations/` directory

#### Current Status
This is a **production-ready booking platform** with:
- ✅ Complete user authentication and authorization
- ✅ Full booking workflow with payment integration hooks
- ✅ Admin dashboard with all management features
- ✅ Real-time availability checking
- ✅ Customer review and rating system
- ✅ Multi-language support (EN/AR)
- ✅ Responsive design for all devices
- ✅ House rules management system
- ✅ Comprehensive analytics and reporting

### Known Issues & Recent Fixes
- **Sign Out Issue**: Fixed NextAuth signout loop by implementing custom `/api/signout` endpoint
- **Jest Worker Errors**: Resolved by server restart when compilation issues occur
- **Phone Verification**: Required for all customer accounts before booking

### Development Notes
- Uses custom coral color scheme throughout
- All forms use React Hook Form with Zod validation
- Database operations through Supabase client
- Middleware handles role-based route protection
- Custom translation hook for internationalization
- PayPal payment integration ready for webhook completion