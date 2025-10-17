/**
 * Input Component - Premium form inputs with focus glow
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-xl px-4",
            "border-2 border-[#00FFF030] bg-black",
            "text-sm text-white placeholder:text-gray-500",
            "transition-all duration-200",
            "focus:outline-none focus:border-[#00FFF0] focus:shadow-[0_0_30px_rgba(0,255,240,0.3)]",
            "hover:border-[#00FFF050]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-[#FF3366] focus:border-[#FF3366] focus:shadow-[0_0_30px_rgba(255,51,102,0.3)]",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-2 text-xs text-[#FF3366] font-semibold">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
