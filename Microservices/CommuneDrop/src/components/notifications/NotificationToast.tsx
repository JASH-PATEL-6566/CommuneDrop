"use client";

import type React from "react";
import { motion } from "framer-motion";
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";
import type { Notification } from "./NotificationProvider";

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onMarkAsRead: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onMarkAsRead,
}) => {
  // Get the appropriate icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // Get the appropriate background color based on notification type
  const getBgColor = () => {
    switch (notification.type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "warning":
        return "bg-amber-50 border-amber-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "info":
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <motion.div
      className={`p-4 rounded-lg shadow-lg border ${getBgColor()} max-w-md`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">{getIcon()}</div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">
            {notification.eventType || notification.title}
          </h4>
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          <div className="mt-2 flex justify-between items-center">
            <button
              onClick={onMarkAsRead}
              className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
            >
              Mark as read
            </button>
            <span className="text-xs text-gray-400">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default NotificationToast;
