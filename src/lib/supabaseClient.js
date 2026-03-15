import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Use fallbacks to prevent crash if env vars are missing (e.g. during build or before config)
const clientUrl = supabaseUrl || "https://placeholder.supabase.co"
const clientKey = supabaseAnonKey || "placeholder"

export const supabase = createClient(clientUrl, clientKey)

export const isConfigured = supabaseUrl && (supabaseUrl.includes("supabase.co") || supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost")) && supabaseAnonKey && supabaseAnonKey.length > 10;