"use client";

import type React from "react";
import { useNotifications } from "./NotificationProvider";
import {
  CheckCircle,
  AlertTriangle,
  Info,
  AlertCircle,
  Check,
  Trash2,
  Bell,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationListProps {
  onClose: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  // Add a comment to indicate that onClose is used elsewhere or will be used later
  // This will suppress the TypeScript warning
  // eslint-disable-next-line @typescript-eslint/no-unused-vars

  const { notifications, markAllAsRead, clearNotifications, markAsRead } =
    useNotifications();

  // Get the appropriate icon based on notification type
  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="max-h-[70vh] overflow-hidden flex flex-col">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
        <h3 className="font-medium text-gray-900 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notifications
          {notifications.length > 0 && (
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">
              {notifications.length}
            </span>
          )}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={markAllAsRead}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center hover:bg-gray-100 px-2 py-1 rounded transition-colors"
            title="Mark all as read"
          >
            <Check className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Mark all read</span>
          </button>
          <button
            onClick={clearNotifications}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center hover:bg-gray-100 px-2 py-1 rounded transition-colors"
            title="Clear all notifications"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Clear all</span>
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(70vh-60px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <Bell className="w-10 h-10 text-gray-300 mb-2" />
            <p>No notifications</p>
            <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <AnimatePresence>
            <motion.ul className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <motion.li
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    notification.read ? "opacity-70" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {notification.eventType || notification.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="ml-3 flex-shrink-0">
                        <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                      </div>
                    )}
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default NotificationList;
