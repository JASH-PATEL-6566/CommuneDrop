import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing Supabase environment variables. Authentication features may not work properly."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add any missing exports that are used in your components
export const refreshUserProfile = async () => {
  // Implementation can be added later
  console.log("User profile refresh called");
  return null;
};

export default supabase;
