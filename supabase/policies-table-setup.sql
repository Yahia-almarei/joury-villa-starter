-- ======================================
-- POLICIES TABLE SETUP FOR JOURY VILLA
-- ======================================
-- This script creates the policies table for dynamic policy management

-- Create policies table
CREATE TABLE IF NOT EXISTS policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cancellation', 'terms', 'privacy', 'house_rules', 'damage')),
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    effective_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_policies_type ON policies(type);
CREATE INDEX IF NOT EXISTS idx_policies_active ON policies(is_active);
CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policies(created_at);

-- Enable Row Level Security
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for active policies" ON policies;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON policies;
DROP POLICY IF EXISTS "Enable all access for service role" ON policies;

-- Allow everyone to read active policies (for customer display)
CREATE POLICY "Enable read access for active policies" ON policies
    FOR SELECT 
    TO public
    USING (is_active = true);

-- Allow authenticated users (admins) to do everything
CREATE POLICY "Enable all access for authenticated users" ON policies
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create trigger function for updating updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for policies table
DROP TRIGGER IF EXISTS update_policies_updated_at ON policies;
CREATE TRIGGER update_policies_updated_at
    BEFORE UPDATE ON policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample policies for testing
INSERT INTO policies (title, type, content, is_active, version) 
VALUES 
(
    'Cancellation Policy', 
    'cancellation', 
    '<p>Free cancellation within 48 hours of booking. After that:</p>
    <ul>
        <li>7+ days before check-in: 50% refund</li>
        <li>3-6 days before check-in: 25% refund</li>
        <li>Less than 3 days: No refund</li>
    </ul>
    <p>All refunds are processed within 5-7 business days.</p>', 
    true, 
    1
),
(
    'House Rules', 
    'house_rules', 
    '<p>Please respect our property and neighbors:</p>
    <ul>
        <li>Quiet hours: 10:00 PM - 8:00 AM</li>
        <li>No smoking indoors</li>
        <li>No parties or events</li>
        <li>Maximum occupancy as booked</li>
        <li>Clean up after use</li>
    </ul>
    <p>Violation of house rules may result in immediate termination of stay without refund.</p>', 
    true, 
    1
),
(
    'Check-in & Check-out', 
    'terms', 
    '<p><strong>Check-in:</strong> 3:00 PM - 11:00 PM</p>
    <p><strong>Check-out:</strong> 11:00 AM</p>
    <p><strong>Late check-in:</strong> Available by arrangement (additional fee may apply)</p>
    <p><strong>Early check-in:</strong> Subject to availability (additional fee may apply)</p>
    <p>Please coordinate your arrival time with us at least 24 hours in advance.</p>', 
    true, 
    1
)
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON policies TO authenticated;
GRANT SELECT ON policies TO anon;

-- Verify table creation
SELECT 
    'Policies table created successfully!' as message,
    COUNT(*) as total_policies,
    COUNT(*) FILTER (WHERE is_active = true) as active_policies
FROM policies;