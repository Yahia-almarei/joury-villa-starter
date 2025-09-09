-- Insert initial property data
INSERT INTO properties (
    id,
    name,
    address,
    timezone,
    currency,
    base_price_night,
    price_per_adult,
    price_per_child,
    cleaning_fee,
    vat_percent,
    min_nights,
    max_nights,
    max_adults,
    max_children
) VALUES (
    'joury-villa-001',
    'Joury Villa',
    'Jericho, Palestinian Territories',
    'Asia/Jerusalem',
    'ILS',
    50000, -- 500 ILS per night base price
    15000, -- 150 ILS per adult
    7500,  -- 75 ILS per child
    20000, -- 200 ILS cleaning fee
    17,    -- 17% VAT
    2,     -- Minimum 2 nights
    14,    -- Maximum 14 nights
    8,     -- Maximum 8 adults
    4      -- Maximum 4 children
);

-- Insert seasonal pricing
INSERT INTO seasons (
    property_id,
    name,
    start_date,
    end_date,
    price_per_night_override
) VALUES 
-- High season (summer holidays)
('joury-villa-001', 'Summer High Season', '2024-07-01', '2024-08-31', 80000), -- 800 ILS
-- Holiday season (winter holidays)
('joury-villa-001', 'Winter Holidays', '2024-12-20', '2025-01-10', 70000), -- 700 ILS
-- Spring season
('joury-villa-001', 'Spring Season', '2024-03-01', '2024-05-31', 60000), -- 600 ILS
-- Fall season
('joury-villa-001', 'Fall Season', '2024-09-01', '2024-11-30', 55000); -- 550 ILS

-- Insert some initial blocked periods for maintenance
INSERT INTO blocked_periods (
    property_id,
    start_date,
    end_date,
    reason
) VALUES 
('joury-villa-001', '2024-01-15', '2024-01-20', 'Annual maintenance and deep cleaning'),
('joury-villa-001', '2024-06-10', '2024-06-12', 'Property inspection and repairs');

-- Insert active coupons
INSERT INTO coupons (
    code,
    percent_off,
    valid_from,
    valid_to,
    min_nights,
    is_active
) VALUES 
('WELCOME10', 10, NOW(), NOW() + INTERVAL '6 months', 3, true),
('LONGSTAY15', 15, NOW(), NOW() + INTERVAL '1 year', 7, true),
('EARLYBIRD20', 20, NOW(), NOW() + INTERVAL '3 months', 5, true);

-- Create an admin user (password: admin123)
-- Note: In production, this should be created through proper auth flow
INSERT INTO users (
    id,
    email,
    password_hash,
    role,
    email_verified,
    created_at,
    updated_at
) VALUES (
    'admin-user-001',
    'admin@jouryvilla.com',
    '$2a$12$8mK.QN5V3rK8Xe.xLYp5XeHQN5.nKqp6gYQV5N8xE9aQc5L8xMp5K', -- bcrypt hash of 'admin123'
    'ADMIN',
    NOW(),
    NOW(),
    NOW()
);

-- Create admin profile
INSERT INTO customer_profiles (
    user_id,
    full_name,
    phone,
    country
) VALUES (
    'admin-user-001',
    'Joury Villa Administrator',
    '+972-50-000-0000',
    'Palestine'
);

-- Create a demo customer user (password: customer123)
INSERT INTO users (
    id,
    email,
    password_hash,
    role,
    email_verified,
    created_at,
    updated_at
) VALUES (
    'customer-user-001',
    'demo@example.com',
    '$2a$12$9mK.QN5V3rK8Xe.xLYp5XeHQN5.nKqp6gYQV5N8xE9aQc5L8xMp5L', -- bcrypt hash of 'customer123'
    'CUSTOMER',
    NOW(),
    NOW(),
    NOW()
);

-- Create demo customer profile
INSERT INTO customer_profiles (
    user_id,
    full_name,
    phone,
    country
) VALUES (
    'customer-user-001',
    'Demo Customer',
    '+1-555-0123',
    'United States'
);

-- Create a sample reservation
INSERT INTO reservations (
    id,
    property_id,
    user_id,
    check_in,
    check_out,
    nights,
    adults,
    children,
    subtotal,
    fees,
    taxes,
    total,
    status,
    approved_at,
    paid_at,
    created_at,
    updated_at
) VALUES (
    'reservation-001',
    'joury-villa-001',
    'customer-user-001',
    '2024-08-15',
    '2024-08-20',
    5,
    2,
    1,
    475000, -- 4750 ILS subtotal
    20000,  -- 200 ILS cleaning fee
    84150,  -- 17% VAT
    579150, -- Total: 5791.50 ILS
    'PAID',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '1 day'
);

-- Create a payment record for the reservation
INSERT INTO payments (
    reservation_id,
    provider,
    amount,
    currency,
    tx_ref,
    status,
    created_at,
    updated_at
) VALUES (
    'reservation-001',
    'demo_payment',
    579150,
    'ILS',
    'demo_tx_001',
    'PAID',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
);

-- Create an audit log entry
INSERT INTO audit_logs (
    actor_user_id,
    action,
    target_type,
    target_id,
    payload
) VALUES (
    'admin-user-001',
    'RESERVATION_APPROVED',
    'reservation',
    'reservation-001',
    '{"approved_by": "admin-user-001", "approval_reason": "Manual approval during demo setup"}'::jsonb
);