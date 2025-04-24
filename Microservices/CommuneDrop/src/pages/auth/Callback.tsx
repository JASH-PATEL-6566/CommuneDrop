"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Loader } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Get the session from the URL
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting auth session:", error);
        navigate("/login");
        return;
      }

      if (data?.session) {
        // Successfully authenticated
        navigate("/home");
      } else {
        // No session found, redirect to login
        navigate("/login");
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
