import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://uikcvjadwfcoxwrigsiy.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_bX5q70jnGbs3LfEOP-1O7A_GFgtexZ4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
