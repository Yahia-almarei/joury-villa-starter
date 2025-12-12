-- Create reviews table (simplified without timestamps)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    stay_date DATE,
    approved BOOLEAN DEFAULT false NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON public.reviews (approved);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews table
-- Allow public to read approved reviews (without email)
CREATE POLICY "Allow public to read approved reviews" ON public.reviews
    FOR SELECT USING (approved = true);

-- Allow authenticated users to insert reviews
CREATE POLICY "Allow authenticated users to insert reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow admins to do everything
CREATE POLICY "Allow admins full access to reviews" ON public.reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );