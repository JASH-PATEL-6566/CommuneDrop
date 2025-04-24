"use client";

import { motion } from "framer-motion";

export default function DeliveryHistorySkeleton() {
  return (
    <motion.div
      className="p-4 border rounded-lg animate-pulse"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className="h-5 w-24 bg-gray-200 rounded"></div>
          <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <div>
          <div className="h-3 w-10 bg-gray-200 rounded mb-1"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
        </div>

        <div>
          <div className="h-3 w-10 bg-gray-200 rounded mb-1"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-3">
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
        <div className="h-4 w-24 bg-gray-200 rounded"></div>
      </div>
    </motion.div>
  );
}
