"use client";

export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative w-12 h-12">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-[spin_3s_linear_infinite]" />

        {/* Middle ring */}
        <div className="absolute inset-2 border-4 border-t-primary border-l-primary/50 border-b-primary/30 border-r-primary/10 rounded-full animate-[spin_2s_linear_infinite_reverse]" />

        {/* Inner ring */}
        <div className="absolute inset-4 border-4 border-r-primary border-t-primary/50 border-l-primary/30 border-b-primary/10 rounded-full animate-[spin_1s_linear_infinite]" />

        {/* Center dot */}
        <div className="absolute inset-[22px] bg-primary rounded-full animate-pulse" />
      </div>
    </div>
  );
}
