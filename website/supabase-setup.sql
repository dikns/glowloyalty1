-- ── GlowLoyalty SaaS — Supabase Setup ────────────────────────────────────────

-- Salons table
CREATE TABLE IF NOT EXISTS public.salons (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug                  TEXT UNIQUE NOT NULL,
  salon_name            TEXT NOT NULL,
  owner_email           TEXT NOT NULL,
  owner_name            TEXT NOT NULL,
  logo_url              TEXT,
  primary_color         TEXT DEFAULT '#C9A84C',
  secondary_color       TEXT DEFAULT '#1a1a1a',
  font_family           TEXT DEFAULT 'Cormorant Garamond',
  city                  TEXT,
  phone                 TEXT,
  meta_description      TEXT,
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  plan                  TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'basic', 'pro')),
  active                BOOLEAN DEFAULT false,
  trial_ends_at         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Staff table
CREATE TABLE IF NOT EXISTS public.staff (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id         UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  role             TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'staff')),
  supabase_user_id UUID,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff  ENABLE ROW LEVEL SECURITY;

-- Salons: owners see only their own salon
CREATE POLICY "Salon owner access" ON public.salons
  FOR ALL USING (owner_email = auth.jwt() ->> 'email');

-- Staff: staff see only their salon's records
CREATE POLICY "Staff access own salon" ON public.staff
  FOR ALL USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_email = auth.jwt() ->> 'email')
  );

-- Logos storage bucket (run in Storage dashboard or here)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Grant usage
GRANT ALL ON public.salons TO anon, authenticated;
GRANT ALL ON public.staff  TO anon, authenticated;
