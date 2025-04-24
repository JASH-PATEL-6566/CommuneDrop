"use client";

import { motion } from "framer-motion";
import { Check, Loader2, RefreshCcw } from "lucide-react";

interface PaymentButtonProps {
  paymentStatus: "idle" | "processing" | "success" | "error";
  isDisabled: boolean;
  amount: string;
  onClick: () => void;
  orderId?: string;
}

export default function PaymentButton({
  paymentStatus,
  isDisabled,
  amount,
  onClick,
}: PaymentButtonProps) {
  const buttonVariants = {
    idle: {
      backgroundColor: "#000000",
      color: "#ffffff",
    },
    processing: {
      backgroundColor: "#4B5563",
      color: "#ffffff",
    },
    success: {
      backgroundColor: "#059669",
      color: "#ffffff",
    },
    error: {
      backgroundColor: "#DC2626",
      color: "#ffffff",
    },
  };

  const iconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { scale: 1, opacity: 1 },
  };

  return (
    <motion.button
      className="w-full py-4 rounded-lg text-lg font-semibold relative overflow-hidden"
      variants={buttonVariants}
      animate={paymentStatus}
      whileHover={paymentStatus === "idle" ? { scale: 1.02 } : undefined}
      whileTap={paymentStatus === "idle" ? { scale: 0.98 } : undefined}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={`Pay ${amount}`}
    >
      {paymentStatus === "idle" && (
        <motion.span
          key="idle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          Pay ${amount}
        </motion.span>
      )}
      {paymentStatus === "processing" && (
        <motion.span
          key="processing"
          className="flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </motion.span>
      )}
      {paymentStatus === "success" && (
        <motion.span
          key="success"
          className="flex items-center justify-center gap-2"
          initial="hidden"
          animate="visible"
          variants={iconVariants}
        >
          <Check className="w-5 h-5" />
          Payment Successful!
        </motion.span>
      )}
      {paymentStatus === "error" && (
        <motion.span
          key="error"
          className="flex items-center justify-center gap-2"
          initial="hidden"
          animate="visible"
          variants={iconVariants}
        >
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RefreshCcw className="w-5 h-5" />
            Try Again
          </motion.div>
        </motion.span>
      )}
    </motion.button>
  );
}
