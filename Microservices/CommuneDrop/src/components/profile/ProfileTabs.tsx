"use client";

import type { TabType } from "../../pages/user/Profile";
import { motion } from "framer-motion";

interface ProfileTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function ProfileTabs({
  activeTab,
  setActiveTab,
}: ProfileTabsProps) {
  const tabs: { id: TabType; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "deliveries", label: "Deliveries" },
    { id: "payment", label: "Payment" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="border-b">
      <div className="container mx-auto px-6">
        <div className="flex">
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              className={`px-6 py-4 font-medium text-center whitespace-nowrap relative ${
                activeTab === tab.id
                  ? "text-black"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              onClick={() => setActiveTab(tab.id)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: index * 0.05,
                mass: 0.6,
              }}
              whileHover={{
                y: -2,
                transition: { type: "spring", stiffness: 400, damping: 15 },
              }}
              whileTap={{ y: 0 }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                  layoutId="activeTab"
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 30,
                  }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
