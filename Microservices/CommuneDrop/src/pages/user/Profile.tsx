"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PersonalInfoSection from "../../components/profile/PersonalInfoSection";
import PaymentMethodsSection from "../../components/profile/PaymentMethodsSection";
import DeliveryHistorySection from "../../components/profile/DeliveryHistorySection";
import SettingsSection from "../../components/profile/SettingsSection";
import { useAuth } from "../../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Truck, CreditCard, Settings, Loader } from "lucide-react";
import Navbar from "../../components/Navbar";
import type { SavedLocation } from "../../services/user-service";
import { cardService, type Card } from "../../services/card-service";
import {
  deliveryService,
  type DeliveryHistoryItem,
} from "../../services/delivery-service";

export type TabType = "profile" | "deliveries" | "payment" | "settings";

export default function Profile() {
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const { logout, user, userProfile, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState({
    name: userProfile?.name || user?.name || "User",
    email: userProfile?.email || user?.email || "",
    phone: userProfile?.phoneNumber || "",
    address: userProfile?.address || "",
    joinDate: userProfile?.joinDate || "January 2023",
    deliveriesCompleted: userProfile?.deliveriesCompleted || 0,
    rating: userProfile?.rating || 0,
    profileImage:
      userProfile?.profileImage || "/placeholder.svg?height=150&width=150",
    paymentMethods: [] as Card[],
    savedLocations: [] as SavedLocation[],
  });
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryHistoryItem[]>(
    []
  );

  // Update userData when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setUserData((prevData) => ({
        ...prevData,
        name: userProfile.name,
        email: userProfile.email,
        phone: userProfile.phoneNumber || "",
        address: userProfile.address || "",
        joinDate: userProfile.joinDate || "January 2023",
        deliveriesCompleted: userProfile.deliveriesCompleted || 0,
        rating: userProfile.rating || 0,
        profileImage:
          userProfile.profileImage || "/placeholder.svg?height=150&width=150",
      }));
    }
  }, [userProfile]);

  // Fetch additional data (payment methods, delivery history)
  useEffect(() => {
    let isMounted = true;
    const fetchAdditionalData = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      try {
        // Only refresh user profile if we don't already have it
        if (!userProfile || !userProfile.name) {
          await refreshUserProfile();
        }

        // Only fetch payment methods and delivery history if we're on those tabs
        if (activeTab === "payment") {
          const paymentMethodsResponse = await cardService.getUserCards();
          if (isMounted && paymentMethodsResponse.success) {
            setUserData((prevData) => ({
              ...prevData,
              paymentMethods: paymentMethodsResponse.data,
            }));
          }
        }

        if (activeTab === "deliveries") {
          const deliveryHistoryResponse = await deliveryService.getHistory();
          if (isMounted && deliveryHistoryResponse.success) {
            setDeliveryHistory(deliveryHistoryResponse.data);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching user data:", err);
          setError("Failed to load user data. Please try again later.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAdditionalData();
    return () => {
      isMounted = false;
    };
  }, [refreshUserProfile, userProfile, activeTab]);

  // Replace the useEffect that handles tab changes with this improved version
  // that uses a more subtle loading approach
  useEffect(() => {
    // When tab changes, fetch data specific to that tab
    const fetchTabData = async () => {
      if (activeTab === "payment" && userData.paymentMethods.length === 0) {
        try {
          // Don't set global loading state, we'll use component-level loading
          const response = await cardService.getUserCards();
          if (response.success) {
            setUserData((prev) => ({
              ...prev,
              paymentMethods: response.data,
            }));
          }
        } catch (error) {
          console.error("Error fetching payment methods:", error);
        }
      } else if (activeTab === "deliveries" && deliveryHistory.length === 0) {
        try {
          // Don't set global loading state, we'll use component-level loading
          const response = await deliveryService.getHistory();
          if (response.success) {
            setDeliveryHistory(response.data);
          }
        } catch (error) {
          console.error("Error fetching delivery history:", error);
        }
      }
    };

    fetchTabData();
  }, [activeTab, userData.paymentMethods.length, deliveryHistory.length]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Update the tabs array to include colorful icons with background circles
  const tabs = [
    {
      id: "profile",
      label: "Profile",
      icon: (isActive: boolean) => (
        <div
          className={`p-2 rounded-full ${
            isActive ? "bg-blue-100" : "bg-blue-50"
          }`}
        >
          <Home size={18} className="text-blue-500" />
        </div>
      ),
    },
    {
      id: "deliveries",
      label: "Deliveries",
      icon: (isActive: boolean) => (
        <div
          className={`p-2 rounded-full ${
            isActive ? "bg-green-100" : "bg-green-50"
          }`}
        >
          <Truck size={18} className="text-green-500" />
        </div>
      ),
    },
    {
      id: "payment",
      label: "Payment",
      icon: (isActive: boolean) => (
        <div
          className={`p-2 rounded-full ${
            isActive ? "bg-purple-100" : "bg-purple-50"
          }`}
        >
          <CreditCard size={18} className="text-purple-500" />
        </div>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      icon: (isActive: boolean) => (
        <div
          className={`p-2 rounded-full ${
            isActive ? "bg-orange-100" : "bg-orange-50"
          }`}
        >
          <Settings size={18} className="text-orange-500" />
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-6 bg-white shadow rounded-lg">
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Replace the main content section with this improved version that doesn't
  // show a full loading screen when switching tabs
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <div className="flex flex-1">
        {/* Sidebar navigation section */}
        <aside className="w-64 border-r bg-white sticky top-[72px] self-start h-[calc(100vh-72px)] hidden md:block">
          <nav className="py-6">
            <ul className="space-y-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <li key={tab.id}>
                    <button
                      className={`w-full px-6 py-3 text-left font-medium rounded-none flex items-center ${
                        isActive
                          ? "bg-gray-100 text-black"
                          : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                      onClick={() => setActiveTab(tab.id as TabType)}
                    >
                      <span className="mr-4">{tab.icon(isActive)}</span>
                      {tab.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Mobile tabs section */}
        <div className="md:hidden w-full border-b bg-white sticky top-[72px] z-10">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`flex-1 min-w-[80px] px-4 py-3 text-center font-medium flex flex-col items-center justify-center ${
                    isActive ? "bg-gray-100 text-black" : "text-gray-500"
                  }`}
                  onClick={() => setActiveTab(tab.id as TabType)}
                >
                  {tab.icon(isActive)}
                  <span className="text-xs mt-1">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === "profile" && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  mass: 0.5,
                }}
              >
                <PersonalInfoSection
                  userData={userData}
                  onProfileUpdated={refreshUserProfile}
                />
              </motion.div>
            )}
            {activeTab === "deliveries" && (
              <motion.div
                key="deliveries"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  mass: 0.5,
                }}
              >
                <DeliveryHistorySection />
              </motion.div>
            )}
            {activeTab === "payment" && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  mass: 0.5,
                }}
              >
                <PaymentMethodsSection
                  isInitialLoading={userData.paymentMethods.length === 0}
                />
              </motion.div>
            )}
            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  mass: 0.5,
                }}
              >
                <SettingsSection onLogout={handleLogout} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
