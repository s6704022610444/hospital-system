import React from "react";

interface HospitalLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textColor?: "white" | "dark";
  className?: string;
}

export function HospitalLogo({
  size = "md",
  showText = true,
  textColor = "white",
  className = "",
}: HospitalLogoProps) {
  const sizeClasses = {
    sm: "w-9 h-9",
    md: "w-16 h-16",
    lg: "w-20 h-20",
    xl: "w-28 h-28",
  };

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {/* Hospital Emblem Badge with New Real Hospital Logo */}
      <div
        className={`${sizeClasses[size]} bg-white rounded-2xl p-1.5 shadow-md border border-white/20 flex items-center justify-center overflow-hidden shrink-0`}
      >
        <img
          src="/logo.png"
          alt="โลโก้โรงพยาบาลมหาราชนครราชสีมา"
          className="w-full h-full object-contain select-none"
        />
      </div>

      {showText && (
        <div className="mt-2.5 text-center">
          <span
            className={`block font-bold text-xs tracking-tight leading-tight ${
              textColor === "dark" ? "text-gray-900" : "text-white"
            }`}
          >
            โรงพยาบาลมหาราชนครราชสีมา
          </span>
          <span
            className={`block text-[10px] tracking-wider uppercase font-mono mt-0.5 ${
              textColor === "dark" ? "text-gray-500" : "text-olive-200"
            }`}
          >
            Maharat Nakhon Ratchasima Hospital
          </span>
        </div>
      )}
    </div>
  );
}
