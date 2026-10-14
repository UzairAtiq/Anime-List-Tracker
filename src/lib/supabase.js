import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://ymaodehnrrcakmswbkyz.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltYW9kZWhucnJjYWttc3dia3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NTA2NzksImV4cCI6MjA4MzQyNjY3OX0.wjCF79XqOYNgdDzQuVfM6jlFOqshQERtPNKacIusBCo';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

