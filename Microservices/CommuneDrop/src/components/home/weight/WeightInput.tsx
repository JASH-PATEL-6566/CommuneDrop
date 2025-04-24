"use client";

interface WeightInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function WeightInput({ value, onChange }: WeightInputProps) {
  return (
    <div className="relative">
      <input
        type="number"
        className="w-full p-4 pr-12 bg-gray-50 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Item weight"
        aria-label="Item weight in kilograms"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
        kg
      </span>
    </div>
  );
}
