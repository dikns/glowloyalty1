-- ============================================================
-- GlowLoyalty – Supabase Database Setup
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Users table (customers + staff)
CREATE TABLE IF NOT EXISTS public.users (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT        NOT NULL,
  email         TEXT        UNIQUE NOT NULL,
  phone         TEXT        DEFAULT '',
  password_hash TEXT        NOT NULL,
  role          TEXT        DEFAULT 'customer' CHECK (role IN ('customer', 'staff')),
  points        INTEGER     DEFAULT 0,
  tier          TEXT        DEFAULT 'Bronasta',
  qr_token      TEXT        UNIQUE,
  birth_date    DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Add birth_date to existing deployments
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Visits table
CREATE TABLE IF NOT EXISTS public.visits (
  id             BIGSERIAL PRIMARY KEY,
  customer_id    BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
  staff_id       BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  service        TEXT    NOT NULL,
  amount         REAL    DEFAULT 0,
  points_awarded INTEGER DEFAULT 0,
  notes          TEXT    DEFAULT '',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email     ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_qr_token  ON public.users(qr_token);
CREATE INDEX IF NOT EXISTS idx_users_role      ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_visits_customer ON public.visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_visits_staff    ON public.visits(staff_id);
CREATE INDEX IF NOT EXISTS idx_visits_created  ON public.visits(created_at DESC);

-- Disable RLS (app uses its own JWT auth, not Supabase Auth)
ALTER TABLE public.users  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits DISABLE ROW LEVEL SECURITY;

-- Grant access to anon role (for the publishable key)
GRANT ALL ON public.users  TO anon, authenticated;
GRANT ALL ON public.visits TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.users_id_seq  TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.visits_id_seq TO anon, authenticated;

-- Services table
CREATE TABLE IF NOT EXISTS public.services (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT    NOT NULL,
  price      REAL    DEFAULT 0,
  duration   TEXT    DEFAULT '',
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(active);
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.services TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.services_id_seq TO anon, authenticated;

-- Blocked times table (staff availability rules)
-- type: 'weekday' (recurring day-of-week block), 'date' (specific date), 'hours' (time range on a date or weekday)
CREATE TABLE IF NOT EXISTS public.blocked_times (
  id         BIGSERIAL PRIMARY KEY,
  type       TEXT NOT NULL CHECK (type IN ('weekday', 'date', 'hours')),
  weekday    INTEGER,           -- 0=Mon..6=Sun, used for type='weekday' and type='hours' with no date
  date       DATE,              -- specific date, used for type='date' and type='hours' with a date
  hour_from  TEXT,              -- e.g. '12:00', used for type='hours'
  hour_to    TEXT,              -- e.g. '14:00', used for type='hours'
  label      TEXT DEFAULT '',   -- optional note
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blocked_times DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.blocked_times TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.blocked_times_id_seq TO anon, authenticated;

-- Staff push subscriptions (for notifying staff)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id           BIGSERIAL PRIMARY KEY,
  user_id      TEXT        NOT NULL UNIQUE,
  subscription TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.push_subscriptions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.push_subscriptions TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.push_subscriptions_id_seq TO anon, authenticated;

-- Customer push subscriptions (for notifying customers from staff portal)
CREATE TABLE IF NOT EXISTS public.customer_push_subscriptions (
  id           BIGSERIAL PRIMARY KEY,
  user_id      TEXT        NOT NULL UNIQUE,
  subscription TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.customer_push_subscriptions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.customer_push_subscriptions TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.customer_push_subscriptions_id_seq TO anon, authenticated;

-- Customer messages inbox (messages sent from staff to customer)
CREATE TABLE IF NOT EXISTS public.customer_messages (
  id          BIGSERIAL PRIMARY KEY,
  customer_id TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_messages_customer ON public.customer_messages(customer_id);
ALTER TABLE public.customer_messages DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.customer_messages TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.customer_messages_id_seq TO anon, authenticated;
