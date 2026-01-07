import React from "react";

export default function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`bg-indigo-500 text-white px-6 py-2 rounded-xl shadow-md transition-all duration-200 hover:bg-indigo-600 hover:scale-105 focus:ring-2 focus:ring-cyan-400 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
