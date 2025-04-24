"use client";

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader } from "lucide-react";

interface ProtectedRouteProps {
  redirectPath?: string;
}

export default function ProtectedRoute({
  redirectPath = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader
            className="w-10 h-10 text-primary animate-spin mb-4"
            aria-hidden="true"
          />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to={redirectPath} replace />;
}
