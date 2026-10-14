/** @fileoverview Configures and instantiates the Supabase JavaScript client instance. */

import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://ymaodehnrrcakmswbkyz.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltYW9kZWhucnJjYWttc3dia3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NTA2NzksImV4cCI6MjA4MzQyNjY3OX0.wjCF79XqOYNgdDzQuVfM6jlFOqshQERtPNKacIusBCo';

/**
 * Resolved Supabase project endpoint URL.
 * Prefers VITE_SUPABASE_URL environment variable over hardcoded default.
 * @type {string}
 */
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;

/**
 * Resolved Supabase anonymous public API key.
 * Prefers VITE_SUPABASE_ANON_KEY environment variable over hardcoded default.
 * @type {string}
 */
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultKey;

/**
 * Initialized Supabase client instance.
 * @type {import('@supabase/supabase-js').SupabaseClient}
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
