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

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    const client = getClient()
    const val = client[prop as keyof SupabaseClient]
    return typeof val === 'function' ? (val as (...a: unknown[]) => unknown).bind(client) : val
  },
})

export type Member = {
  id: string
  name: string
  color: number
}

export type VoteOption = {
  memberId: string
  text: string
}

export type DecisionResult = {
  text: string
  message: string
  voters: number
  total: number
}

export type Space = {
  id: string
  name: string
  topic: string
  members: Member[]
  options: VoteOption[]
  result: DecisionResult | null
}
