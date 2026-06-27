import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Room = {
  id: string
  p1_name: string
  p2_name: string
  p1_options: string[]
  p2_options: string[]
  p1_theme: number
  p2_theme: number
  result: { food: string; message: string; isMatch: boolean } | null
}
