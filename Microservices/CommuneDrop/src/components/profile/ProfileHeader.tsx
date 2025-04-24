"use client";

import { Star, Package, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface ProfileHeaderProps {
  userData: {
    name: string;
    email: string;
    rating: number;
    deliveriesCompleted: number;
    joinDate: string;
    profileImage: string;
  };
}

export default function ProfileHeader({ userData }: ProfileHeaderProps) {
  return (
    <motion.div
      className="bg-white border-b shadow-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        mass: 0.8,
      }}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-6">
          {/* Profile Image */}
          <div className="relative">
            <motion.div
              className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-md"
              whileHover={{
                scale: 1.05,
                rotate: 5,
                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 15,
              }}
            >
              <img
                src={
                  userData.profileImage || "/placeholder.svg?height=80&width=80"
                }
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 15,
                delay: 0.3,
              }}
            >
              <span className="text-white text-xs">✓</span>
            </motion.div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <motion.h1
              className="text-2xl font-bold text-gray-900"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: 0.1,
              }}
            >
              {userData.name}
            </motion.h1>
            <motion.p
              className="text-gray-600"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                delay: 0.2,
              }}
            >
              {userData.email}
            </motion.p>
            <div className="flex flex-wrap gap-4 mt-2">
              <motion.div
                className="flex items-center gap-1 text-gray-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: 0.3,
                }}
                whileHover={{ scale: 1.05 }}
              >
                <Star size={16} className="text-yellow-500" />
                <span>{userData.rating} Rating</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-1 text-gray-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: 0.4,
                }}
                whileHover={{ scale: 1.05 }}
              >
                <Package size={16} />
                <span>{userData.deliveriesCompleted} Deliveries</span>
              </motion.div>
              <motion.div
                className="flex items-center gap-1 text-gray-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                  delay: 0.5,
                }}
                whileHover={{ scale: 1.05 }}
              >
                <Calendar size={16} />
                <span>Since {userData.joinDate}</span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
