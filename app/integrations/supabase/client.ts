import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = "https://igacfofofodntrsmehdf.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnYWNmb2ZvZm9kbnRyc21laGRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwOTEzMDIsImV4cCI6MjA3MTY2NzMwMn0.2BoRi8dchiBLEB-s-Jdv5Eg8v-CgplRwQpSsu1N9LY8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
