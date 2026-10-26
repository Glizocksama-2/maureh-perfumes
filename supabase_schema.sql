-- ==============================================================================
-- MAUREH PERFUMES - PRODUCTION SUPABASE DATABASE SCHEMA & RLS SECURITY POLICIES
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

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.perfumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors  ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "Public can read perfumes" ON public.perfumes;
DROP POLICY IF EXISTS "Authenticated users can insert perfumes" ON public.perfumes;
DROP POLICY IF EXISTS "Authenticated users can update perfumes" ON public.perfumes;
DROP POLICY IF EXISTS "Authenticated users can delete perfumes" ON public.perfumes;

DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can read orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can update orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated admin can read orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated admin can update orders" ON public.orders;

DROP POLICY IF EXISTS "Public can read vendors" ON public.vendors;
DROP POLICY IF EXISTS "Authenticated admin can mutate vendors" ON public.vendors;

-- ── PERFUMES POLICIES ──────────────────────────────────────────────────────────
-- Public: Anyone (authenticated or anonymous) can view the perfume catalog
CREATE POLICY "Public can read perfumes"
  ON public.perfumes FOR SELECT
  USING (true);

-- Admin writes: Only logged-in admin users (authenticated role) can add/edit/delete fragrances
CREATE POLICY "Authenticated users can insert perfumes"
  ON public.perfumes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update perfumes"
  ON public.perfumes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete perfumes"
  ON public.perfumes FOR DELETE
  TO authenticated
  USING (true);

-- ── ORDERS POLICIES ───────────────────────────────────────────────────────────
-- Public: Any customer can submit/insert their order at checkout
CREATE POLICY "Public can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Admin & Service Role: Only logged in Admin can view or update customer orders (protects PII)
CREATE POLICY "Authenticated admin can read orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated admin can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── VENDORS POLICIES ──────────────────────────────────────────────────────────
-- Public can read vendor profiles
CREATE POLICY "Public can read vendors"
  ON public.vendors FOR SELECT
  USING (true);

-- Admin can mutate vendors
CREATE POLICY "Authenticated admin can mutate vendors"
  ON public.vendors FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Enable Realtime Replication for instant storefront updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'perfumes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.perfumes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;

-- ==============================================================================
-- FRONTEND SECURITY ARCHITECTURE NOTE:
-- * Frontend utilizes STRICTLY the Supabase "anon" public key (eyJ...).
-- * The Supabase "service_role" secret key is NEVER bundled or exposed on client.
-- * Row Level Security (RLS) guarantees that anonymous users cannot alter catalog
--   data or harvest other customers' orders.
-- ==============================================================================
