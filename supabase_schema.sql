-- ==============================================================================
-- MAUREH PERFUMES - SUPABASE DATABASE SCHEMA
-- Run this script in your Supabase SQL Editor: (https://app.supabase.com)
-- ==============================================================================

-- 1. Create Perfumes Table
CREATE TABLE IF NOT EXISTS public.perfumes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  subtitle TEXT,
  gender TEXT DEFAULT 'Unisex',
  category TEXT DEFAULT 'Niche & Haute',
  family TEXT,
  concentration TEXT DEFAULT 'Eau de Parfum',
  price_kes NUMERIC NOT NULL,
  original_price_kes NUMERIC,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 1,
  vendor_id TEXT DEFAULT 'maureh-vault',
  vendor_name TEXT DEFAULT 'Maureh Flagship Vault',
  in_stock BOOLEAN DEFAULT TRUE,
  is_bestseller BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  image TEXT,
  description TEXT,
  notes JSONB DEFAULT '{"top": [], "heart": [], "base": []}'::jsonb,
  performance JSONB DEFAULT '{"sillage": "Strong", "longevity": "12+ Hours", "season": "All-Season", "occasion": "Signature"}'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  accords JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  delivery_area TEXT,
  delivery_address TEXT,
  payment_method TEXT DEFAULT 'M-PESA (STK Push)',
  transaction_ref TEXT,
  status TEXT DEFAULT 'Order Placed & Verified',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_kes NUMERIC NOT NULL,
  discount_kes NUMERIC DEFAULT 0,
  total_kes NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Vendors Table
CREATE TABLE IF NOT EXISTS public.vendors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  badge TEXT,
  verified BOOLEAN DEFAULT TRUE,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  location TEXT,
  dispatch_time TEXT,
  avatar TEXT,
  description TEXT,
  commission_rate NUMERIC DEFAULT 0.15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Public Read Access Policies
CREATE POLICY "Allow public read perfumes" ON public.perfumes FOR SELECT USING (true);
CREATE POLICY "Allow public insert perfumes" ON public.perfumes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update perfumes" ON public.perfumes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete perfumes" ON public.perfumes FOR DELETE USING (true);

CREATE POLICY "Allow public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read vendors" ON public.vendors FOR SELECT USING (true);

-- 5. Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.perfumes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
