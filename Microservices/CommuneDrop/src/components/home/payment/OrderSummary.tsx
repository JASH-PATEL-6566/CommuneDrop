"use client";

interface OrderSummaryProps {
  deliveryFee?: string;
  serviceFee?: string;
  total?: string;
  pricingDetails?: {
    cost?: number;
    tax?: number;
    rider_commission?: number;
    total_cost?: number;
  };
}

export default function OrderSummary({
  deliveryFee,
  serviceFee,
  total,
  pricingDetails,
}: OrderSummaryProps) {
  const cost =
    pricingDetails?.cost !== undefined
      ? pricingDetails.cost.toFixed(2)
      : deliveryFee;
  const tax =
    pricingDetails?.tax !== undefined
      ? pricingDetails.tax.toFixed(2)
      : serviceFee;
  const riderCommission =
    pricingDetails?.rider_commission !== undefined
      ? pricingDetails.rider_commission.toFixed(2)
      : "0.00";
  const totalCost =
    pricingDetails?.total_cost !== undefined
      ? pricingDetails.total_cost.toFixed(2)
      : total;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-bold mb-4">Order Summary</h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Delivery Fee</span>
          <span className="font-medium">${cost}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Tax</span>
          <span className="font-medium">${tax}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-600">Rider Commission</span>
          <span className="font-medium">${riderCommission}</span>
        </div>

        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg">Total</span>
            <span className="text-xl font-bold">${totalCost}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
