// src/lib/supabase/index.ts
// Create a single instance of the Supabase client
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database-types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)