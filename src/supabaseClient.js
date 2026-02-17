import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

let supabaseClient;

const createMockSupabase = () => {
    const mock = () => ({
        data: null,
        error: { message: 'Supabase not initialized' },
        then: (cb) => Promise.resolve({ data: { session: null }, error: null }).then(cb),
        unsubscribe: () => { }
    });
    return new Proxy(mock, {
        get: (target, prop) => {
            if (prop === 'onAuthStateChange') return () => ({ data: { subscription: { unsubscribe: () => { } } } });
            if (prop === 'auth') return createMockSupabase();
            return createMockSupabase();
        }
    });
};

try {
    if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
        throw new Error('Invalid or missing Supabase URL');
    }
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
} catch (err) {
    console.error('Supabase initialization failed:', err.message)
    supabaseClient = createMockSupabase();
}

export const supabase = supabaseClient
