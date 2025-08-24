import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// نفس إعدادات Supabase المستخدمة في تطبيق الويب
const supabaseUrl = 'https://pblshocqwccbylgsahuj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBibHNob2Nxd2NjYnlsZ3NhaHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzY0MDEsImV4cCI6MjA2ODk1MjQwMX0.FeMLmDa4uLGx_kZzKRTRl6u-NG01kUwAQCTgR2iQDOw';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});