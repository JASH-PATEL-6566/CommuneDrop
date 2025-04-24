"use client";

import { MapPin, ChevronRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface DeliveryHistoryItemProps {
  delivery: {
    id: string;
    date: string;
    from: string;
    to: string;
    status: string;
    price: string;
    carrier: string;
  };
  index: number;
}

export default function DeliveryHistoryItem({
  delivery,
  index,
}: DeliveryHistoryItemProps) {
  return (
    <motion.div
      className="p-4 hover:bg-gray-50 transition-colors"
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
        delay: index * 0.08,
        mass: 0.7,
      }}
      whileHover={{
        y: -3,
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)",
        transition: { type: "spring", stiffness: 400, damping: 15 },
      }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{delivery.id}</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {delivery.status}
          </span>
        </div>
        <span className="text-gray-500 text-sm">{delivery.date}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">From</div>
          <div className="text-sm flex items-start">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
            {delivery.from}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-1">To</div>
          <div className="text-sm flex items-start">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-1 flex-shrink-0" />
            {delivery.to}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3">
        <div className="text-sm text-gray-600">
          {delivery.carrier} • {delivery.price}
        </div>
        <button className="text-primary text-sm font-medium hover:underline flex items-center">
          View Details
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </motion.div>
  );
}
