"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Globe,
} from "lucide-react";

// Remove the userService import since it's only used for the delete account functionality
// import { userService } from "../../services/user-service";

interface SettingsSectionProps {
  onLogout: () => void;
}

export default function SettingsSection({ onLogout }: SettingsSectionProps) {
  // Remove the state variables related to account deletion
  // const [isDeleting, setIsDeleting] = useState(false);
  // const [deleteError, setDeleteError] = useState<string | null>(null);
  // const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const settingsCategories = [
    {
      title: "Account",
      items: [
        {
          id: "notifications",
          icon: <Bell className="w-5 h-5 text-blue-500" />,
          title: "Notifications",
          description: "Manage your notification preferences",
          action: () => console.log("Notifications clicked"),
          showToggle: false,
          toggleState: false,
        },
        {
          id: "security",
          icon: <Shield className="w-5 h-5 text-green-500" />,
          title: "Privacy & Security",
          description: "Manage your account security settings",
          action: () => console.log("Security clicked"),
          showToggle: false,
          toggleState: false,
        },
        {
          id: "appearance",
          icon: darkMode ? (
            <Moon className="w-5 h-5 text-indigo-500" />
          ) : (
            <Sun className="w-5 h-5 text-amber-500" />
          ),
          title: "Appearance",
          description: `${
            darkMode ? "Dark" : "Light"
          } mode is currently active`,
          action: () => setDarkMode(!darkMode),
          showToggle: true,
          toggleState: darkMode,
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          id: "help",
          icon: <HelpCircle className="w-5 h-5 text-purple-500" />,
          title: "Help & Support",
          description: "Get help with your account",
          action: () => console.log("Help clicked"),
          showToggle: false,
          toggleState: false,
        },
        {
          id: "language",
          icon: <Globe className="w-5 h-5 text-teal-500" />,
          title: "Language",
          description: "English (US)",
          action: () => console.log("Language clicked"),
          showToggle: false,
          toggleState: false,
        },
      ],
    },
  ];

  // Remove the handleDeleteAccount function
  // const handleDeleteAccount = async () => {
  //   setIsDeleting(true);
  //   setDeleteError(null);

  //   try {
  //     const response = await userService.deleteAccount();

  //     if (response.success) {
  //       onLogout();
  //     } else {
  //       setDeleteError(response.message || "Failed to delete account");
  //     }
  //   } catch (error) {
  //     setDeleteError("An unexpected error occurred. Please try again.");
  //   } finally {
  //     setIsDeleting(false);
  //     setShowDeleteConfirm(false);
  //   }
  // };
  const Toggle = ({
    isOn,
    onToggle,
  }: {
    isOn: boolean;
    onToggle: () => void;
  }) => (
    <div
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isOn ? "bg-primary" : "bg-gray-200"
      }`}
      onClick={onToggle}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isOn ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </div>
  );

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
      {settingsCategories.map((category, categoryIndex) => (
        <div key={category.title} className="mb-8">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            {category.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.items.map((item, itemIndex) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  delay: itemIndex * 0.08 + categoryIndex * 0.1,
                }}
                whileHover={{
                  y: -4,
                  boxShadow:
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                  transition: { type: "spring", stiffness: 400, damping: 15 },
                }}
                className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm transition-shadow h-full"
              >
                <div className="flex items-center justify-between h-full">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-gray-50">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {item.showToggle ? (
                      <Toggle isOn={item.toggleState} onToggle={item.action} />
                    ) : (
                      <button
                        onClick={item.action}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors"
                      >
                        <ChevronRight size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-700 mb-4">
          Account Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <motion.button
            onClick={onLogout}
            className="flex items-center gap-3 w-full p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            whileHover={{
              scale: 1.02,
              y: -4,
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <div className="p-2 rounded-full bg-gray-50">
              <LogOut className="w-5 h-5 text-gray-500" />
            </div>
            <span className="font-medium text-gray-900">Log Out</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
