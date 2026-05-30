import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error('CRITICAL: Supabase environment variables are missing or invalid.');
  console.log('Project URL:', supabaseUrl);
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      fetch: (...args) => {
        const fetchWithRetry = async (retries = 5, delay = 1000): Promise<Response> => {
          try {
            return await fetch(...args);
          } catch (err) {
            // TypeError is usually what 'Failed to fetch' manifests as
            const isNetworkError = err instanceof TypeError || (err as any).name === 'TypeError' || (err as any).message === 'Failed to fetch';
            
            if (retries > 0 && isNetworkError) {
              console.warn(`Supabase network failure, retrying in ${delay}ms... (${retries} attempts left)`);
              await new Promise(resolve => setTimeout(resolve, delay));
              // Exponential backoff
              return fetchWithRetry(retries - 1, delay * 1.5);
            }
            throw err;
          }
        };
        return fetchWithRetry();
      }
    }
  }
);
