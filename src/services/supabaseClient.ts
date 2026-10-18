import { createClient } from '@supabase/supabase-js';

export const SUPABASE_PROJECT_ID = 'xuyyzwejrzhrymqhecsm';
export const SUPABASE_URL =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  `https://${SUPABASE_PROJECT_ID}.supabase.co`;
export const SUPABASE_ANON_KEY =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1eXl6d2VqcnpocnltcWhlY3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzMjM2MjgsImV4cCI6MjEwNjg5OTYyOH0.NWOlOkk5l7STSG5xlq5cztjM9L-77JUgMTttsdnFcG8';
export const SUPABASE_TABLE =
  (import.meta as any).env?.VITE_SUPABASE_TABLE ||
  '2570-ระบบติดตามเอกสาร';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
