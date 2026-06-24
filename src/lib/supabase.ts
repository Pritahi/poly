import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL! || "https://iekpnqoiohmfmzqbauyh.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlla3BucW9pb2htZm16cWJhdXloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNzQxMDEsImV4cCI6MjA5Nzc1MDEwMX0.S5CIfRR0BrhdbLG2UDDwDbu8o13hwfWWX3QZUE4C4t0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
