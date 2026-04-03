import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)

export type Salon = {
  id: string
  slug: string
  salon_name: string
  owner_email: string
  owner_name: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  font_family: string
  city: string | null
  phone: string | null
  meta_description: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: 'trial' | 'basic' | 'pro'
  active: boolean
  trial_ends_at: string
  created_at: string
}
