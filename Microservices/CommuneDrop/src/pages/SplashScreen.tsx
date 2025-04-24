"use client";

import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import SplashScreenButton from "../components/splash_screen/SplashScreenButton";

export default function SplashScreen() {
  const navigate = useNavigate();

  const handleGetStarted = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 space-y-8">
      <h1 className="text-6xl md:text-7xl font-bold text-white tracking-tighter text-center">
        Commune Drop
      </h1>
      <SplashScreenButton buttonText="Get Started" onClick={handleGetStarted} />
    </div>
  );
}
