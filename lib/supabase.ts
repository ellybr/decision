import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | undefined

function getClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _client
}

// Proxy defers createClient until first actual use, avoiding build-time env var errors
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    const client = getClient()
    const val = client[prop as keyof SupabaseClient]
    return typeof val === 'function' ? (val as (...a: unknown[]) => unknown).bind(client) : val
  },
})

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
