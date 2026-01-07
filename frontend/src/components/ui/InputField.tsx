import React from "react";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function InputField({ label, error, className = "", ...props }: InputFieldProps) {
  return (
    <div className="mb-4 w-full">
      <label className="block text-slate-700 mb-1 font-medium">{label}</label>
      <input
        className={`w-full px-4 py-2 rounded-lg bg-white/60 border border-slate-200 focus:border-indigo-500 focus:bg-white/80 transition-all duration-200 outline-none ${error ? 'border-red-400' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
    </div>
  );
}
