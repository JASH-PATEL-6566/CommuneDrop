"use client";

interface MapErrorProps {
  error: string;
  onRetry: () => void;
}

export default function MapError({ error, onRetry }: MapErrorProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
      <div className="text-center p-4">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-primary text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
