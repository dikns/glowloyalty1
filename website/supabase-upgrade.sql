-- ── GlowLoyalty SaaS — ADD-ON tables (run in Supabase SQL Editor)
-- Safe to run on existing database — uses IF NOT EXISTS

CREATE TABLE IF NOT EXISTS public.salons (
  id                     UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug                   TEXT UNIQUE NOT NULL,
  salon_name             TEXT NOT NULL,
  owner_email            TEXT NOT NULL,
  owner_name             TEXT NOT NULL,
  logo_url               TEXT,
  primary_color          TEXT DEFAULT '#C9A84C',
  secondary_color        TEXT DEFAULT '#1a1a1a',
  font_family            TEXT DEFAULT 'Cormorant Garamond',
  city                   TEXT,
  phone                  TEXT,
  meta_description       TEXT,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  plan                   TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'basic', 'pro')),
  active                 BOOLEAN DEFAULT false,
  trial_ends_at          TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saas_staff (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id         UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  role             TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'staff')),
  supabase_user_id UUID,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.salons    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_staff ENABLE ROW LEVEL SECURITY;

-- Salon owners see only their own salon
DROP POLICY IF EXISTS "Salon owner access" ON public.salons;
CREATE POLICY "Salon owner access" ON public.salons
  FOR ALL USING (owner_email = auth.jwt() ->> 'email');

-- Staff see only their salon
DROP POLICY IF EXISTS "Staff access own salon" ON public.saas_staff;
CREATE POLICY "Staff access own salon" ON public.saas_staff
  FOR ALL USING (
    salon_id IN (SELECT id FROM public.salons WHERE owner_email = auth.jwt() ->> 'email')
  );

-- Grants
GRANT ALL ON public.salons     TO anon, authenticated;
GRANT ALL ON public.saas_staff TO anon, authenticated;

-- Storage bucket for logos (run separately if it doesn't exist)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true)
-- ON CONFLICT (id) DO NOTHING;
