import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Normale client: staff / POS / admin / kitchen. Houdt de ingelogde auth-sessie
// bij (persistSession / autoRefreshToken / detectSessionInUrl = default true).
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Aparte client uitsluitend voor de publieke customer/QR-flow.
//
// Als er in dezelfde browser een staff/admin ingelogd is, zou de normale
// `supabase` client die sessie als `authenticated` meesturen bij een customer
// order INSERT -> "permission denied for table orders" (er is bewust GEEN
// authenticated INSERT-policy voor customer orders).
//
// Deze client mag daarom NOOIT een bestaande sessie oppakken. `persistSession`
// alleen is niet genoeg: de auth-lib leest bij init nog steeds de opgeslagen
// sessie uit storage (zelfde storageKey = zelfde project). Een lege in-memory
// storage garandeert dat er niets wordt gelezen én niets wordt geschreven.
const noopAuthStorage = {
  getItem: (_key: string): string | null => null,
  setItem: (_key: string, _value: string): void => {},
  removeItem: (_key: string): void => {},
}

export const customerSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: noopAuthStorage,
    storageKey: 'teashop-customer-anon',
  },
})
