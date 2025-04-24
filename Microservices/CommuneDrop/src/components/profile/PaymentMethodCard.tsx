"use client";

import { Check, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

// Update the CARD_TYPES object to include more detailed styling and detection patterns
const CARD_TYPES = {
  visa: {
    name: "Visa",
    icon: "VISA",
    color: "text-blue-700",
    bg: "bg-gray-100",
    pattern: /^4/,
  },
  mastercard: {
    name: "Mastercard",
    icon: "MC",
    color: "text-red-600",
    bg: "bg-gray-100",
    pattern: /^5[1-5]/,
  },
  amex: {
    name: "American Express",
    icon: "AMEX",
    color: "text-green-700",
    bg: "bg-gray-100",
    pattern: /^3[47]/,
  },
  discover: {
    name: "Discover",
    icon: "DISC",
    color: "text-orange-600",
    bg: "bg-gray-100",
    pattern: /^6(?:011|5)/,
  },
  jcb: {
    name: "JCB",
    icon: "JCB",
    color: "text-green-600",
    bg: "bg-gray-100",
    pattern: /^35/,
  },
  diners: {
    name: "Diners Club",
    icon: "DC",
    color: "text-blue-500",
    bg: "bg-gray-100",
    pattern: /^3(?:0[0-5]|[68])/,
  },
  unionpay: {
    name: "UnionPay",
    icon: "UP",
    color: "text-red-500",
    bg: "bg-gray-100",
    pattern: /^62/,
  },
};

interface PaymentMethodCardProps {
  method: {
    id: string;
    type: string;
    last4: string;
    cardholderName: string;
    expiryDate: string;
    isDefault: boolean;
  };
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
}

// Update the detectCardType function to properly detect card types based on the card number
const detectCardType = (
  cardType: string,
  last4: string
): keyof typeof CARD_TYPES => {
  // First check if we have a valid card type string provided directly
  if (
    cardType &&
    typeof cardType === "string" &&
    Object.keys(CARD_TYPES).includes(cardType.toLowerCase())
  ) {
    return cardType.toLowerCase() as keyof typeof CARD_TYPES;
  }

  // If last4 is undefined or null, default to visa
  if (!last4) return "visa";

  // For Mastercard, check if it starts with 5 and the second digit is between 1-5
  if (last4.startsWith("5") && ["1", "2", "3", "4", "5"].includes(last4[1])) {
    return "mastercard";
  }

  // For Amex, check if it starts with 3 and the second digit is 4 or 7
  if (last4.startsWith("3") && ["4", "7"].includes(last4[1])) {
    return "amex";
  }

  // For Discover, check if it starts with 6
  if (last4.startsWith("6")) {
    return "discover";
  }

  // For JCB, check if it starts with 35
  if (last4.startsWith("3") && last4[1] === "5") {
    return "jcb";
  }

  // For Diners Club, check if it starts with 3 and the second digit is 0, 6, or 8
  if (last4.startsWith("3") && ["0", "6", "8"].includes(last4[1])) {
    return "diners";
  }

  // For UnionPay, check if it starts with 62
  if (last4.startsWith("6") && last4[1] === "2") {
    return "unionpay";
  }

  // Default to visa for cards starting with 4 or if we can't determine the type
  if (last4.startsWith("4") || !last4) {
    return "visa";
  }

  return "visa"; // Default fallback
};

// Update the component to handle potential undefined values
export default function PaymentMethodCard({
  method,
  onSetDefault,
  onDelete,
}: PaymentMethodCardProps) {
  // Ensure method properties are defined with fallbacks
  const safeMethod = {
    id: method?.id || "",
    type: method?.type || "",
    last4: method?.last4 || "",
    cardholderName: method?.cardholderName || "",
    expiryDate: method?.expiryDate || "",
    isDefault: method?.isDefault || false,
  };

  // Determine card type using the detection function with safe values
  const cardTypeKey = detectCardType(safeMethod.type, safeMethod.last4);
  const cardType = CARD_TYPES[cardTypeKey];

  // Add state to track delete button loading state
  // const [isDeleting, setIsDeleting] = useState(false)

  // Handle delete with confirmation
  const handleDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete this ${cardType.name} card ending in ${safeMethod.last4}?`
      )
    ) {
      await onDelete(safeMethod.id);
    }
  };

  return (
    <motion.div
      className={`p-4 border rounded-lg flex items-center justify-between ${
        safeMethod.isDefault ? "border-black" : "border-gray-200"
      }`}
      whileHover={{
        scale: 1.02,
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        borderColor: safeMethod.isDefault
          ? "rgba(0, 0, 0, 0.8)"
          : "rgba(0, 0, 0, 0.2)",
        y: -3,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 20,
        mass: 0.6,
      }}
      layout
    >
      <div className="flex items-center gap-3">
        <motion.div
          className={`w-12 h-8 ${cardType.bg} rounded flex items-center justify-center`}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 500 }}
        >
          <span className={`font-bold text-sm ${cardType.color}`}>
            {cardType.icon}
          </span>
        </motion.div>
        <div>
          <p className="font-medium text-gray-900">
            {cardType.name} •••• {safeMethod.last4}
          </p>
          <p className="text-xs text-gray-500">
            {safeMethod.cardholderName} • Expires {safeMethod.expiryDate}
          </p>
          {safeMethod.isDefault && (
            <motion.span
              className="text-xs text-black"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              Default
            </motion.span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <>
          {!safeMethod.isDefault && (
            <motion.button
              onClick={() => onSetDefault(safeMethod.id)}
              className="p-2 text-gray-500 hover:text-black rounded-full transition-colors"
              title="Set as default"
              whileHover={{
                scale: 1.1,
                backgroundColor: "rgba(0, 0, 0, 0.05)",
              }}
              whileTap={{ scale: 0.9 }}
            >
              <Check size={16} />
            </motion.button>
          )}
          <motion.button
            onClick={handleDelete}
            className="p-2 text-gray-500 hover:text-red-500 rounded-full transition-colors"
            title="Delete card"
            whileHover={{
              scale: 1.1,
              backgroundColor: "rgba(239, 68, 68, 0.05)",
            }}
            whileTap={{ scale: 0.9 }}
          >
            <Trash2 size={16} />
          </motion.button>
        </>
      </div>
    </motion.div>
  );
}
