import React from "react";

export default function GlassCard({ children, className = "" }) {
  return (
    <div className={`glass p-8 shadow-lg ${className}`}>
      {children}
    </div>
  );
}
