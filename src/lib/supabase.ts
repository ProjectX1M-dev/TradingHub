import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are properly configured
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Check if environment variables are still using placeholder values
if (supabaseUrl.includes('your-project-url') || supabaseAnonKey.includes('your-anon-key')) {
  throw new Error(
    'Supabase configuration error: Please replace the placeholder values in your .env file with actual Supabase project credentials. ' +
    'Get your project URL and anon key from: https://app.supabase.com/project/YOUR_PROJECT/settings/api'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export the URL and anon key for webhook construction and other uses
export { supabaseUrl, supabaseAnonKey };