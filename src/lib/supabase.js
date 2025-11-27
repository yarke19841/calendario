// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fepcnvcvgzxbjaoxnbcc.supabase.co";        // ej: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlcGNudmN2Z3p4Ymphb3huYmNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3OTY2NDQsImV4cCI6MjA3MDM3MjY0NH0.XU27bFFiJKDFddeTK15q8lXBrOVvQtpQkycx9TEjJPE";   // anon public key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
