-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE role_type AS ENUM ('ADMIN', 'CUSTOMER');
CREATE TYPE user_state_type AS ENUM ('active', 'blocked');
CREATE TYPE reservation_status_type AS ENUM ('PENDING', 'AWAITING_APPROVAL', 'APPROVED', 'PAID', 'CANCELLED', 'REFUNDED', 'FAILED');
CREATE TYPE payment_status_type AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified TIMESTAMP,
    password_hash VARCHAR(255) NOT NULL,
    role role_type DEFAULT 'CUSTOMER' NOT NULL,
    state user_state_type DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Customer profiles table
CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    country VARCHAR(100),
    notes TEXT
);

-- Properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    timezone VARCHAR(100) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    base_price_night INTEGER NOT NULL,
    price_per_adult INTEGER DEFAULT 0 NOT NULL,
    price_per_child INTEGER DEFAULT 0 NOT NULL,
    cleaning_fee INTEGER DEFAULT 0 NOT NULL,
    vat_percent INTEGER DEFAULT 0 NOT NULL,
    min_nights INTEGER DEFAULT 2 NOT NULL,
    max_nights INTEGER DEFAULT 14 NOT NULL,
    max_adults INTEGER DEFAULT 6 NOT NULL,
    max_children INTEGER DEFAULT 6 NOT NULL
);

-- Seasons table
CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price_per_night_override INTEGER
);

-- Blocked periods table
CREATE TABLE blocked_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(500)
);

-- Reservations table
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    nights INTEGER NOT NULL,
    adults INTEGER NOT NULL,
    children INTEGER NOT NULL,
    subtotal INTEGER NOT NULL,
    fees INTEGER DEFAULT 0 NOT NULL,
    taxes INTEGER DEFAULT 0 NOT NULL,
    total INTEGER NOT NULL,
    status reservation_status_type DEFAULT 'PENDING' NOT NULL,
    hold_expires_at TIMESTAMP,
    cancellation_reason TEXT,
    approved_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL,
    amount INTEGER NOT NULL,
    currency VARCHAR(10) NOT NULL,
    tx_ref VARCHAR(255),
    status payment_status_type DEFAULT 'PENDING' NOT NULL,
    raw JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Coupons table
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    percent_off INTEGER,
    amount_off INTEGER,
    valid_from TIMESTAMP,
    valid_to TIMESTAMP,
    min_nights INTEGER,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Verification tokens table
CREATE TABLE verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'email_verification', 'password_reset'
    expires TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    payload JSONB,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_state ON users(role, state);

CREATE INDEX idx_customer_profiles_user_id ON customer_profiles(user_id);

CREATE INDEX idx_seasons_property_dates ON seasons(property_id, start_date, end_date);

CREATE INDEX idx_blocked_periods_property_dates ON blocked_periods(property_id, start_date, end_date);

CREATE INDEX idx_reservations_property_dates_status ON reservations(property_id, check_in, check_out, status);
CREATE INDEX idx_reservations_user_status ON reservations(user_id, status);
CREATE INDEX idx_reservations_status_hold ON reservations(status, hold_expires_at);
CREATE INDEX idx_reservations_checkin ON reservations(check_in);

CREATE INDEX idx_payments_reservation ON payments(reservation_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider_txref ON payments(provider, tx_ref);

CREATE INDEX idx_coupons_code_active ON coupons(code, is_active);

CREATE INDEX idx_verification_tokens_email_type ON verification_tokens(email, type);
CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX idx_verification_tokens_expires ON verification_tokens(expires);

CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create triggers to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Basic policies (will be refined based on auth setup)
-- Allow users to read their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own customer profile" ON customer_profiles FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own customer profile" ON customer_profiles FOR UPDATE USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own customer profile" ON customer_profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Allow everyone to read properties (public information)
CREATE POLICY "Anyone can view properties" ON properties FOR SELECT TO authenticated, anon USING (true);

-- Allow everyone to read seasons and blocked periods (needed for availability)
CREATE POLICY "Anyone can view seasons" ON seasons FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "Anyone can view blocked periods" ON blocked_periods FOR SELECT TO authenticated, anon USING (true);

-- Users can view and manage their own reservations
CREATE POLICY "Users can view own reservations" ON reservations FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own reservations" ON reservations FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can update own reservations" ON reservations FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (
    auth.uid()::text IN (
        SELECT user_id::text FROM reservations WHERE id = reservation_id
    )
);

-- Allow reading of active coupons
CREATE POLICY "Anyone can view active coupons" ON coupons FOR SELECT TO authenticated, anon USING (is_active = true);

-- Admin policies (will need to be implemented with proper admin role checking)
-- For now, allowing service role to do everything
CREATE POLICY "Service role can manage all data" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all customer profiles" ON customer_profiles FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all properties" ON properties FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all seasons" ON seasons FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all blocked periods" ON blocked_periods FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all reservations" ON reservations FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all payments" ON payments FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all coupons" ON coupons FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all verification tokens" ON verification_tokens FOR ALL TO service_role USING (true);
CREATE POLICY "Service role can manage all audit logs" ON audit_logs FOR ALL TO service_role USING (true);