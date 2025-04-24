"use client";

import { motion } from "framer-motion";

export default function SuccessConfetti() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-green-500"
          initial={{
            opacity: 1,
            x: "50%",
            y: "50%",
          }}
          animate={{
            opacity: 0,
            x: `${50 + (Math.random() - 0.5) * 100}%`,
            y: `${50 + (Math.random() - 0.5) * 100}%`,
            scale: 0,
          }}
          transition={{
            duration: 1,
            delay: i * 0.02,
            ease: "easeOut",
          }}
          style={{
            borderRadius: "50%",
          }}
        />
      ))}
    </div>
  );
}
