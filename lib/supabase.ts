import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function getCurrentUserRole() {
  const { data, error } = await supabase.rpc('get_current_user_role')
  if (error) throw error
  return data
}

export async function updateUserRole(userId: string, role: 'admin' | 'provider' | 'billing_staff') {
  const { data, error } = await supabase
    .from('auth.users')
    .update({ role })
    .eq('id', userId)
  if (error) throw error
  return data
}

// ... (keep existing functions)

export async function signUp(email: string, password: string, role: 'admin' | 'provider' | 'billing_staff' = 'billing_staff') {
  const { user, error } = await supabase.auth.signUp({ 
    email, 
    password,
    options: {
      data: { role }
    }
  })
  if (error) throw error
  return user
}

// ... (keep other existing functions)
