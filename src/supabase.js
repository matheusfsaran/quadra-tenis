import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tbzjxcdaxmvgjjlukncw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiemp4Y2RheG12Z2pqbHVrbmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODE3MjksImV4cCI6MjA5NDE1NzcyOX0.27Jj18oqizAa3Hq24dh5Qxh5imy1ceUJQg-oSLzeA-I'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: { schema: 'public' },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
})
