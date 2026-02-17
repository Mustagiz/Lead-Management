import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || ''
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || ''

let supabaseClient;

try {
    if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
        throw new Error('Invalid or missing Supabase URL');
    }
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
} catch (err) {
    console.error('Supabase initialization failed:', err.message)
    // Create a proxy to prevent crashes when accessing properties of undefined supabase
    supabaseClient = new Proxy({}, {
        get: () => () => ({ data: null, error: { message: 'Supabase not initialized' } })
    });
}

export const supabase = supabaseClient
