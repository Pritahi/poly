import { createClient } from "@supabase/supabase-js";

// Hardcoded for Vercel deployment (no env vars needed)
// Falls back to env vars for local development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://idyspefcwqpdnpvqrjtv.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkeXNwZWZjd3FwZG5wdnFyanR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjM4MzIsImV4cCI6MjA5Nzc5OTgzMn0.Xwy6VjOUcK87Dl4QYobGat_a6ayQ-D9ndDNQrkQgNa8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
