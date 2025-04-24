"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import NotificationToast from "./NotificationToast";
import io from "socket.io-client";

// Define the standard event structure with consistent outer layer
export interface StandardEvent {
  eventType: string; // Type of event (e.g., "OrderStatusUpdated", "DriverAssigned")
  orderId: string; // ID of the order this event relates to
  timestamp: number; // When the event occurred (milliseconds since epoch)
  data: any; // Event-specific data varies based on eventType
}

// Update the Notification interface to use the standardized event structure
export interface Notification {
  id: string;
  title: string;
  eventType: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
  data?: any; // Raw data associated with the notification
}

// Define the context type
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  sendTestNotification: (
    type: "info" | "success" | "warning" | "error",
    eventType?: string,
    message?: string,
    data?: any
  ) => void;
  // Add a method to send a structured notification
  sendStructuredNotification: (
    type: "info" | "success" | "warning" | "error",
    eventType: string,
    data: any
  ) => void;
}

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// Create the provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [currentNotification, setCurrentNotification] =
    useState<Notification | null>(null);
  const { user, isAuthenticated } = useAuth();

  // Update the useEffect that connects to the WebSocket server to handle connection errors gracefully
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let socketInstance: any = null;
    let connectionAttempts = 0;
    const maxAttempts = 3;

    const connectSocket = () => {
      try {
        // Try to connect to the WebSocket server
        // IMPORTANT: Make sure we're using the user's ID, not email
        const userId = user.id || user.email; // Prefer ID, fall back to email if ID not available

        console.log("Connecting with user ID:", userId, "Type:", typeof userId);

        socketInstance = io(
          import.meta.env.VITE_WEBSOCKET_URL || "http://localhost:3001",
          {
            query: {
              userId: userId, // Use the user's ID instead of email
            },
            reconnection: false, // Disable automatic reconnection
            timeout: 5000, // Set connection timeout to 5 seconds
          }
        );

        // Set up event listeners
        socketInstance.on("connect", () => {
          console.log("Connected to notification server");
        });

        socketInstance.on("disconnect", () => {
          console.log("Disconnected from notification server");
        });

        socketInstance.on("connect_error", (error: any) => {
          console.warn("Socket connection error:", error);
          connectionAttempts++;

          if (connectionAttempts < maxAttempts) {
            console.log(
              `Retrying connection (${connectionAttempts}/${maxAttempts})...`
            );
            setTimeout(connectSocket, 2000); // Retry after 2 seconds
          } else {
            console.error(
              "Failed to connect to notification server after multiple attempts"
            );
            // Continue without WebSocket functionality
            setSocket(null);
          }
        });

        // Update the notification processing to handle structured data better
        socketInstance.on("notification", (notification: any) => {
          console.log("Received notification:", notification);

          // Ensure we have a valid notification object
          if (!notification) return;

          // Create a notification object with the parsed data, ensuring both eventType and title fields are set
          const newNotification = {
            id: notification.id || Date.now().toString(),
            eventType: notification.eventType || notification.title, // Use eventType if available, fall back to title
            title:
              notification.title || notification.eventType || "Notification", // Ensure title is always a string
            message: notification.message || "",
            type: notification.type || "info",
            timestamp: new Date(notification.timestamp || Date.now()),
            read: false,
            data: notification.data || null, // Keep the data as is, don't try to parse it
          };

          console.log("Processed notification:", newNotification);

          // Add the notification to the state
          setNotifications((prev) => [newNotification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show toast for the new notification
          setCurrentNotification(newNotification);
          setShowToast(true);

          // Auto-hide toast after 5 seconds
          setTimeout(() => {
            setShowToast(false);
          }, 5000);
        });

        // Save the socket instance
        setSocket(socketInstance);
      } catch (error) {
        console.error("Error initializing socket connection:", error);
        setSocket(null);
      }
    };

    connectSocket();

    // Clean up on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  // Calculate unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(
      (notification) => !notification.read
    ).length;
    setUnreadCount(count);
  }, [notifications]);

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Update the sendTestNotification to properly set both eventType and title
  const sendTestNotification = (
    type: "info" | "success" | "warning" | "error",
    eventType?: string,
    message?: string,
    data?: any
  ) => {
    const title = eventType || `Test ${type} Notification`;

    if (socket) {
      socket.emit("send-test-notification", {
        type,
        eventType,
        title,
        message,
        data,
      });
    } else {
      // Create a local notification when socket is not available
      const notification = {
        id: Date.now().toString(),
        title: title, // This is already guaranteed to be a string
        eventType: eventType || title,
        message:
          message ||
          `This is a test ${type} notification sent at ${new Date().toLocaleString()}`,
        type,
        timestamp: new Date(),
        read: false,
        data,
      };

      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setCurrentNotification(notification);
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
      }, 5000);

      console.log(
        "Created local notification (socket unavailable):",
        notification
      );
    }
  };

  // Update the sendStructuredNotification method to enforce the standard outer structure
  const sendStructuredNotification = (
    type: "info" | "success" | "warning" | "error",
    eventType: string,
    eventData: any
  ) => {
    // Create the standard event structure
    const standardEvent: StandardEvent = {
      eventType: eventType,
      orderId: eventData.orderId || "unknown",
      timestamp: Date.now(),
      data: eventData.data || {}, // Event-specific data goes here
    };

    // Create a human-readable message
    const message =
      eventData.message ||
      `New ${eventType} notification for order #${standardEvent.orderId}`;

    // Send the notification with the standardized structure
    sendTestNotification(type, eventType, message, standardEvent);
  };

  // Create the context value
  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      sendTestNotification,
      sendStructuredNotification,
    }),
    [notifications, unreadCount]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}

      {/* Toast notification */}
      <AnimatePresence>
        {showToast && currentNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <NotificationToast
              notification={currentNotification}
              onClose={() => setShowToast(false)}
              onMarkAsRead={() => {
                markAsRead(currentNotification.id);
                setShowToast(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};

// Create a hook to use the notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
