# Supabase Setup Guide for Joury Villa

This guide walks you through setting up Supabase for the Joury Villa booking platform.

## Prerequisites

1. **Supabase CLI**: Install the Supabase CLI
   ```bash
   npm install -g supabase
   ```

2. **Docker**: Required for local development
   - Install Docker Desktop from https://www.docker.com/products/docker-desktop/

3. **Supabase Account**: Create a free account at https://supabase.com

## Local Development Setup

### 1. Initialize Supabase Locally

```bash
# Start Supabase services locally
npm run supabase:start
```

This will start:
- PostgreSQL database (port 54322)
- Supabase API (port 54321)
- Supabase Studio (port 54323)
- Email testing server (port 54324)

### 2. Apply Database Schema

```bash
# Apply the initial migration
npm run supabase:migrate
```

### 3. Seed the Database

```bash
# Seed with initial data
npm run supabase:seed
```

### 4. Update Environment Variables

Copy `.env.example` to `.env.local` and update:

```env
# Local development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Get these from: npm run supabase:status
```

### 5. Generate TypeScript Types

```bash
# Generate types from your database schema
npm run supabase:types
```

## Production Setup

### 1. Create a Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose your organization and set project details
4. Wait for the project to be created

### 2. Configure Database

1. In your Supabase dashboard, go to **Database > SQL Editor**
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Run the SQL to create all tables and policies

### 3. Seed Production Data

1. In SQL Editor, run the contents of `supabase/seed.sql`
2. **Important**: Change the admin password after first login!

### 4. Configure Authentication

1. Go to **Authentication > Settings**
2. Configure your site URL and redirect URLs
3. Enable email confirmations
4. Set up email templates if needed

### 5. Set Row Level Security

RLS policies are already included in the migration. Review them in **Database > Policies**.

### 6. Environment Variables

Update your production environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get these from your Supabase project settings.

## Database Schema Overview

### Core Tables

1. **users** - User accounts with role-based access
2. **customer_profiles** - Customer details and preferences
3. **properties** - Rental property information
4. **reservations** - Booking records with pricing
5. **payments** - Payment transaction history
6. **seasons** - Seasonal pricing configuration
7. **blocked_periods** - Unavailable date ranges
8. **coupons** - Discount codes and promotions
9. **verification_tokens** - Email verification tokens
10. **audit_logs** - System activity tracking

### Default Data

The seed file creates:

- **Admin user**: `admin@jouryvilla.com` (password: `admin123`)
- **Demo customer**: `demo@example.com` (password: `customer123`)
- **Property**: Joury Villa with seasonal pricing
- **Sample reservation**: Completed booking example
- **Active coupons**: WELCOME10, LONGSTAY15, EARLYBIRD20

## Development Commands

```bash
# Start local Supabase
npm run supabase:start

# Stop local Supabase
npm run supabase:stop

# Check status
npm run supabase:status

# Reset database (careful in production!)
npm run supabase:reset

# Generate TypeScript types
npm run supabase:types

# Seed database
npm run supabase:seed
```

## Migration from Prisma

If you're migrating from the Prisma version:

1. **Backup your data** - Export important records
2. **Stop using Prisma** - The database adapter in `lib/database.ts` replaces Prisma calls
3. **Update imports** - Replace `PrismaClient` imports with the database adapter
4. **Test thoroughly** - Verify all functionality works with Supabase

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled with policies for:
- Users can only access their own data
- Admins have full access via service role
- Public read access for properties, seasons, and blocked periods
- Authenticated access for creating reservations

### API Keys

- **Anon Key**: Safe for frontend use, respects RLS policies
- **Service Role Key**: Backend only, bypasses RLS - keep secure!

### Environment Variables

Never commit these to version control:
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`
- `RESEND_API_KEY`

## Monitoring and Maintenance

### Database Monitoring

1. **Dashboard**: Monitor usage in Supabase dashboard
2. **Logs**: Check database logs for errors
3. **Performance**: Monitor query performance and optimize as needed

### Backups

Supabase automatically backs up your database. For production:

1. Enable point-in-time recovery
2. Set up automated backups
3. Test backup restoration procedures

### Scaling

Supabase automatically scales, but monitor:

1. **Database size** - Upgrade plan if needed
2. **API requests** - Monitor rate limits
3. **Storage usage** - If using file uploads

## Troubleshooting

### Common Issues

1. **Connection errors**: Check environment variables
2. **Permission denied**: Verify RLS policies
3. **Type errors**: Regenerate types after schema changes
4. **Seed fails**: Check for existing data conflicts

### Getting Help

1. **Supabase Docs**: https://supabase.com/docs
2. **Discord Community**: https://discord.supabase.com
3. **GitHub Issues**: Report bugs in the project repository

## Next Steps

After setting up Supabase:

1. **Test the application** - Verify all features work
2. **Customize settings** - Adjust pricing, properties, etc.
3. **Set up monitoring** - Configure alerts and logging
4. **Deploy to production** - Follow deployment guide
5. **Train administrators** - Show them the admin dashboard

For more information, see the main README.md file.