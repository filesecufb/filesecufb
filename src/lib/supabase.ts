import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Tipos de datos
export interface UserProfile {
  id: string
  email: string
  full_name?: string
  phone?: string
  role: 'client' | 'admin'
  billing_name?: string
  tax_id?: string
  billing_address?: string
  billing_city?: string
  billing_postal_code?: string
  billing_country?: string
  billing_state?: string
  created_at: string
  updated_at: string
}