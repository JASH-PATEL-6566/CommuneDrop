"use client";

import type React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState, useRef, useEffect, useMemo } from "react";
import { DEFAULT_AVATAR_IMAGE } from "../utils/tokenStorage";
import { supabase } from "../lib/supabase";
import NotificationBell from "./notifications/NotificationBell";

export default function Navbar() {
  const { user, userProfile, logout, refreshUserProfile } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Memoize the profile image to prevent unnecessary re-renders
  const profileImage = useMemo(() => {
    // First check if we have a profile image from Google or other OAuth provider
    if (
      userProfile?.profileImage &&
      userProfile.profileImage !== DEFAULT_AVATAR_IMAGE &&
      !userProfile.profileImage.includes("placeholder.svg")
    ) {
      return userProfile.profileImage;
    }
    // Otherwise use our data URI
    return DEFAULT_AVATAR_IMAGE;
  }, [userProfile?.profileImage]);

  // Memoize the display name to prevent unnecessary re-renders
  const displayName = useMemo(
    () =>
      userProfile?.name ||
      user?.name ||
      user?.email?.split("@")[0] ||
      "Account",
    [userProfile?.name, user?.name, user?.email]
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleLogoClick = () => {
    navigate("/home");
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  // Add this function to handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log("Image failed to load:", e.currentTarget.src);
    // Prevent infinite loop by checking if the src is already the default
    if (e.currentTarget.src !== DEFAULT_AVATAR_IMAGE) {
      e.currentTarget.src = DEFAULT_AVATAR_IMAGE;
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Inside the Navbar component, add this effect to listen for auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Refresh user profile when auth state changes
        if (session?.user) {
          refreshUserProfile();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshUserProfile]);

  return (
    <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 bg-black text-white shadow-md h-[72px]">
      <button
        onClick={handleLogoClick}
        className="text-2xl font-bold cursor-pointer"
      >
        Commune Drop
      </button>
      <div className="flex items-center space-x-6">
        <NotificationBell />
        <button
          onClick={handleProfileClick}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="hidden md:block text-sm text-gray-300">
            {displayName}
          </div>
          <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
            <img
              src={profileImage || DEFAULT_AVATAR_IMAGE}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="eager"
              fetchPriority="high"
            />
          </div>
        </button>
        <div className="relative" ref={menuRef}>
          <button
            className="md:hidden text-white hover:text-gray-300 transition"
            onClick={() => setShowMenu(!showMenu)}
            aria-expanded={showMenu}
            aria-label="Menu"
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
              <button
                onClick={() => {
                  navigate("/profile");
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
              >
                <LogOut size={16} className="mr-2" aria-hidden="true" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
