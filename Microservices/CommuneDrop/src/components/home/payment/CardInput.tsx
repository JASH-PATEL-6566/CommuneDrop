"use client";

import { CardElement } from "@stripe/react-stripe-js";

interface CardInputProps {
  paymentStatus: "idle" | "processing" | "success" | "error";
}

export default function CardInput({ paymentStatus }: CardInputProps) {
  return (
    <div
      className={`bg-gray-100 p-4 rounded-lg shadow-inner transition-colors duration-300 ${
        paymentStatus === "error"
          ? "bg-red-50"
          : paymentStatus === "success"
          ? "bg-green-50"
          : ""
      }`}
    >
      <CardElement
        options={{
          style: {
            base: {
              fontSize: "16px",
              color: "#333",
              "::placeholder": { color: "#888" },
            },
            invalid: { color: "#e63946" },
          },
        }}
      />
    </div>
  );
}
