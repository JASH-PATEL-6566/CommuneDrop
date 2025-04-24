"use client";

import { motion } from "framer-motion";
import { CheckCircle, Clock, Truck, Package } from "lucide-react";
import type { OrderStatusUpdate } from "../../../context/TrackingContext";

interface OrderStatusBannerProps {
  status: OrderStatusUpdate;
}

export default function OrderStatusBanner({ status }: OrderStatusBannerProps) {
  // Get the appropriate icon and color based on status
  const getStatusInfo = () => {
    switch (status.status) {
      case "CONFIRMED":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: "bg-green-500",
          textColor: "text-green-50",
          message: "Order confirmed",
        };
      case "DRIVER_ASSIGNED":
        return {
          icon: <Truck className="w-5 h-5" />,
          color: "bg-blue-500",
          textColor: "text-blue-50",
          message: "Driver assigned",
        };
      case "DRIVER_PICKUP":
        return {
          icon: <Package className="w-5 h-5" />,
          color: "bg-indigo-500",
          textColor: "text-indigo-50",
          message: "Driver at pickup",
        };
      case "IN_TRANSIT":
        return {
          icon: <Truck className="w-5 h-5" />,
          color: "bg-purple-500",
          textColor: "text-purple-50",
          message: "In transit",
        };
      case "ARRIVING":
        return {
          icon: <Clock className="w-5 h-5" />,
          color: "bg-amber-500",
          textColor: "text-amber-50",
          message: "Arriving soon",
        };
      case "DELIVERED":
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: "bg-green-600",
          textColor: "text-green-50",
          message: "Delivered",
        };
      default:
        return {
          icon: <Truck className="w-5 h-5" />,
          color: "bg-gray-700",
          textColor: "text-gray-50",
          message: status.status,
        };
    }
  };

  const { icon, color, textColor, message } = getStatusInfo();

  return (
    <motion.div
      className={`absolute top-4 left-1/2 transform -translate-x-1/2 z-20 ${color} ${textColor} px-4 py-2 rounded-full shadow-lg flex items-center gap-2`}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {icon}
      <span className="font-medium">
        {message}{" "}
        {status.estimatedArrival ? `• ${status.estimatedArrival}` : ""}
      </span>
    </motion.div>
  );
}
