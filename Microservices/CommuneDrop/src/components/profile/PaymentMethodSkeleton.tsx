"use client";

export default function PaymentMethodSkeleton() {
  return (
    <div className="p-6 border rounded-lg animate-pulse mb-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-8 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            <div className="h-5 w-32 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="h-8 w-20 bg-gray-200 rounded"></div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full"></div>
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="h-2 w-full bg-gray-200 rounded-full"></div>
        <div className="flex justify-between">
          <div className="h-4 w-28 bg-gray-200 rounded"></div>
          <div className="h-4 w-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}
