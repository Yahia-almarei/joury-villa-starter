# Joury Villa - Luxury Villa Booking Platform

A comprehensive booking platform for Joury Villa, a luxury vacation rental in historic Jericho, Palestinian Territories. Built with Next.js 14, TypeScript, Supabase, and modern web technologies.

## 🌟 Features

### 🏠 Property Management
- **Comprehensive Booking System**: Per-night pricing with seasonal rates
- **Advanced Availability Engine**: Real-time availability checking with conflict resolution
- **Flexible Pricing**: Base rates, seasonal pricing, cleaning fees, and VAT calculation
- **Booking Rules**: Minimum/maximum nights, guest limits, and hold periods

### 👥 User Management  
- **Role-Based Access**: Admin and customer roles with appropriate permissions
- **Email Verification**: Required email verification for bookings
- **Account Management**: User profiles, booking history, and account blocking
- **Audit Logging**: Complete activity tracking for security and compliance

### 📧 Email System
- **Multilingual Templates**: Email templates in English, Arabic
- **Automated Notifications**: Booking confirmations, approvals, reminders
- **Calendar Integration**: .ics file attachments for easy calendar import
- **Localized Content**: RTL support and culturally appropriate messaging

### 🌍 Internationalization
- **Multi-Language Support**: English, Arabic 
- **Cultural Localization**: Proper date formats, currency, and cultural preferences
- **Dynamic Language Switching**: Client-side language selection with persistence
- **RTL Layout Support**: Complete right-to-left layout adjustments

### 🎯 SEO & Performance
- **Structured Data**: Schema.org markup for search engines
- **Optimized Meta Tags**: Open Graph, Twitter Cards, and social media optimization
- **PWA Support**: Web app manifest and offline capabilities
- **Sitemap & Robots**: Automated sitemap generation and SEO configuration

### 🔐 Security & Compliance
- **NextAuth Integration**: Secure authentication with session management
- **Row-Level Security**: Supabase RLS policies for data protection
- **CSRF Protection**: Built-in security measures
- **Input Validation**: Comprehensive validation with Zod schemas

## 🛠 Tech Stack

### Frontend
- **Next.js 14**: App Router with TypeScript
- **React 18**: Latest React features with hooks
- **Tailwind CSS**: Utility-first CSS framework with RTL support
- **shadcn/ui**: Beautiful, accessible component library
- **Lucide Icons**: Modern icon library

### Backend & Database
- **Supabase**: PostgreSQL database with real-time features and RLS
- **NextAuth**: Authentication and session management
- **Resend**: Email delivery service with template support
- **Zod**: Schema validation and type safety

### Development Tools
- **TypeScript**: Full type safety and IntelliSense
- **ESLint**: Code linting and formatting
- **Vitest**: Fast unit testing framework
- **Tailwind**: CSS framework with RTL support

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**: Required for Next.js 14
- **npm or yarn**: Package manager
- **Supabase Account**: For database and authentication
- **Resend Account**: For email functionality
- **Docker** (optional): For local Supabase development

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/joury-villa.git
   cd joury-villa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment variables**
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # NextAuth Configuration  
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=http://localhost:3000

   # Email Configuration
   RESEND_API_KEY=your-resend-api-key

   # Application Configuration
   SITE_URL=http://localhost:3000
   CURRENCY=ILS
   TZ=Asia/Jerusalem
   REQUIRES_ADMIN_APPROVAL=true
   ```

### Local Development

#### Option 1: Local Supabase (Recommended)
```bash
# Start local Supabase (requires Docker)
npm run supabase:start

# Apply migrations and seed data
npm run supabase:migrate
npm run supabase:seed

# Start development server
npm run dev
```

#### Option 2: Remote Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and keys from the dashboard
3. Run the SQL from `supabase/migrations/001_initial_schema.sql` in your Supabase SQL editor
4. Run the SQL from `supabase/seed.sql` to add sample data
5. Update your `.env.local` with the remote credentials
6. Start the development server: `npm run dev`

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Default Accounts

After seeding, you can use these accounts:

- **Admin**: `admin@jouryvilla.com` / `admin123`
- **Customer**: `demo@example.com` / `customer123`

## 📖 Project Structure

```
joury-villa/
├── app/                    # Next.js App Router
│   ├── account/           # Customer account pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   │   ├── availability/  # Availability checking
│   │   ├── auth/          # Authentication endpoints
│   │   ├── checkout/      # Booking creation
│   │   ├── ical/          # Calendar export
│   │   ├── quote/         # Pricing calculations
│   │   └── payment/       # Payment webhooks
│   ├── auth/              # Authentication pages
│   ├── book/              # Booking flow
│   └── policies/          # Terms and policies
├── components/            # React components
│   ├── providers/         # Context providers (Language, etc.)
│   ├── seo/              # SEO and structured data components
│   └── ui/               # UI components (shadcn/ui)
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── booking.ts        # Booking logic and calculations
│   ├── database.ts       # Supabase database adapter
│   ├── email-templates.ts # Email templates and sending
│   ├── i18n.ts           # Internationalization setup
│   ├── metadata.ts       # SEO metadata configuration
│   └── supabase.ts       # Supabase client configuration
├── supabase/             # Supabase configuration
│   ├── migrations/       # Database schema migrations
│   ├── config.toml      # Local development config
│   └── seed.sql         # Sample data
├── types/                # TypeScript type definitions
│   └── supabase.ts      # Generated database types
└── __tests__/            # Test files
```

## 🔧 Configuration

### Booking Configuration

The booking system supports flexible configuration in `lib/booking.ts`:

```typescript
export const BOOKING_CONFIG = {
  DEFAULT_MIN_NIGHTS: 2,
  DEFAULT_MAX_NIGHTS: 14,
  HOLD_PERIOD_HOURS: 24,
  VAT_RATE: 0.17, // 17% VAT
  CANCELLATION_WINDOW: 48 // hours
}
```

### Pricing Structure

- **Base Price**: Per night rate (500 ILS default)
- **Per-Adult Pricing**: Additional cost per adult guest (150 ILS)
- **Per-Child Pricing**: Additional cost per child guest (75 ILS)  
- **Seasonal Rates**: Override pricing for specific date ranges
- **Cleaning Fee**: One-time fee per reservation (200 ILS)
- **VAT**: 17% tax rate (configurable)

### Email Templates

The email system includes templates for:
- **Booking Confirmations**: With .ics calendar attachments
- **Admin Notifications**: For pending approvals
- **Reminders**: Pre-arrival notifications
- **Verification**: Email verification for new accounts

All templates support English, Arabic (RTL), and Hebrew (RTL).

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test

# Type checking
npm run typecheck

# Lint code
npm run lint

# Build check
npm run build
```

### Test Coverage
- **Booking Logic**: Comprehensive pricing and availability tests
- **Authentication**: User flow and security tests
- **API Endpoints**: Request/response validation
- **Email Templates**: Template rendering and localization

## 📚 Documentation

### Setup Guides
- **[Supabase Setup](./SUPABASE_SETUP.md)**: Complete database configuration guide

### Key Features Documentation

#### Booking System
The booking system implements sophisticated pricing logic:
- Calculates per-night rates with seasonal adjustments
- Adds per-adult and per-child pricing
- Applies cleaning fees and VAT
- Validates availability against existing bookings and blocked periods

#### Email System
Multilingual email templates with:
- RTL support for Arabic and Hebrew
- .ics calendar attachments
- Responsive HTML design
- Automated sending via Resend

#### Admin Dashboard
Comprehensive admin interface with:
- Pending approval workflow
- Revenue and booking analytics
- User management and blocking
- Audit log tracking

#### Internationalization
Full i18n support featuring:
- Dynamic language switching
- RTL layout adjustments
- Localized email templates
- Cultural date/currency formatting

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**
   - Set production Supabase credentials
   - Configure Resend API key
   - Set secure NextAuth secret
   - Update SITE_URL

2. **Database Setup**
   - Create production Supabase project
   - Run migrations: Copy SQL from `supabase/migrations/`
   - Add initial data: Run SQL from `supabase/seed.sql`
   - Configure Row Level Security policies

3. **Verification Setup**
   - Add site verification codes to metadata
   - Configure social media meta tags
   - Test email delivery
   - Verify structured data with Google

### Deployment Platforms

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Other Platforms
- **Netlify**: Static site deployment
- **Railway**: Full-stack deployment
- **DigitalOcean App Platform**: Container deployment

## 🔒 Security

### Implemented Security Measures

- **Row-Level Security**: Supabase RLS policies protect user data
- **Input Validation**: Zod schemas validate all inputs
- **CSRF Protection**: Built-in Next.js security
- **Email Verification**: Required for all bookings
- **Audit Logging**: Track all user actions
- **Role-Based Access**: Admin/customer role separation

### Security Best Practices

- Never store secrets in client code
- Use environment variables for all sensitive data
- Validate all user inputs on the server
- Implement proper error handling
- Use HTTPS in production
- Regular security updates

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the coding standards
4. Test your changes: `npm run test && npm run typecheck`
5. Commit with conventional commit messages
6. Push and create a Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for Next.js and React
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Standardized commit messages

## 🆘 Support

### Common Issues

1. **Database Connection**: Check Supabase credentials in `.env.local`
2. **Email Not Sending**: Verify Resend API key and domain setup
3. **Build Errors**: Clear `.next` folder and reinstall dependencies
4. **Type Errors**: Run `npm run typecheck` for detailed error messages

### Getting Help

- Check the [Supabase Setup Guide](./SUPABASE_SETUP.md) for database issues
- Review environment variables in `.env.example`
- Open a GitHub issue for bugs
- Check the console for detailed error messages

## 🎯 Roadmap

### Completed Features ✅
- Complete booking system with advanced pricing
- Supabase database with RLS policies
- NextAuth authentication with email verification
- Multilingual email templates with .ics attachments
- RTL internationalization support
- Admin dashboard with analytics
- SEO optimization with structured data
- Comprehensive test coverage

### Future Enhancements
- [ ] **Payment Integration**: Online payment processing
- [ ] **Multi-Property Support**: Manage multiple properties
- [ ] **Mobile App**: React Native companion app
- [ ] **Advanced Analytics**: Detailed booking insights
- [ ] **Guest Communication**: In-app messaging system
- [ ] **Maintenance Management**: Property upkeep tracking

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing React framework
- **Supabase**: For the incredible backend-as-a-service platform
- **shadcn**: For the beautiful and accessible UI components
- **Vercel**: For the seamless deployment platform

---

**Joury Villa** - Experience luxury and comfort in historic Jericho 🏛️
