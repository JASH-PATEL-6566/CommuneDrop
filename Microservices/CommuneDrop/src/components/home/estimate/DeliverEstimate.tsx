import type React from "react";

interface DeliveryEstimateProps {
  estimatedTime?: {
    text?: string;
  };
  deliveryFee?: {
    text?: string;
  };
}

const DeliveryEstimate: React.FC<DeliveryEstimateProps> = ({
  estimatedTime,
  deliveryFee,
}) => {
  return (
    <div>
      <p>Estimated Delivery Time: {estimatedTime?.text || "25-30 minutes"}</p>
      <p>Delivery Fee: {deliveryFee?.text || "$5.00"}</p>
    </div>
  );
};

export default DeliveryEstimate;
