"use client";

import { motion } from "framer-motion";

interface SearchStagesProps {
  stages: string[];
  currentStage: number;
  progress: number;
}

export default function SearchStages({
  stages,
  currentStage,
}: SearchStagesProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-shrink-0">
          <div className="w-3 h-3 bg-primary rounded-full" />
          <motion.div
            className="absolute inset-0 bg-primary rounded-full"
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 2 }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
            }}
          />
        </div>
        <span className="font-medium text-gray-800">
          {stages[currentStage]}
        </span>
      </div>
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <motion.div
            key={stage}
            className="flex items-center gap-3"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: index <= currentStage ? 1 : 0.5 }}
          >
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${
                index <= currentStage ? "bg-primary" : "bg-gray-300"
              }`}
            />
            <div className="flex-1 h-[2px] bg-gray-100" />
            <span className="text-sm text-gray-600 flex-shrink-0">{stage}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
