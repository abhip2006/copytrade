"use client";

export function AnimatedGrid() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Vertical lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: `repeating-linear-gradient(
          90deg,
          rgba(0, 255, 240, 0.03) 0px,
          rgba(0, 255, 240, 0.03) 1px,
          transparent 1px,
          transparent 100px
        )`,
        animation: "grid-move-x 20s linear infinite",
      }} />

      {/* Horizontal lines */}
      <div className="absolute inset-0" style={{
        backgroundImage: `repeating-linear-gradient(
          0deg,
          rgba(0, 255, 240, 0.03) 0px,
          rgba(0, 255, 240, 0.03) 1px,
          transparent 1px,
          transparent 100px
        )`,
        animation: "grid-move-y 20s linear infinite",
      }} />

      {/* Diagonal accent lines */}
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: `repeating-linear-gradient(
          45deg,
          rgba(124, 58, 237, 0.02) 0px,
          rgba(124, 58, 237, 0.02) 1px,
          transparent 1px,
          transparent 150px
        )`,
        animation: "grid-pulse 8s ease-in-out infinite",
      }} />

      {/* Pulsing corner accents */}
      <div className="absolute top-0 left-0 w-64 h-64 border-t-2 border-l-2 border-[#00FFF020] animate-pulse-glow" />
      <div className="absolute top-0 right-0 w-64 h-64 border-t-2 border-r-2 border-[#7C3AED20] animate-pulse-glow" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-0 left-0 w-64 h-64 border-b-2 border-l-2 border-[#FF00FF20] animate-pulse-glow" style={{ animationDelay: "2s" }} />
      <div className="absolute bottom-0 right-0 w-64 h-64 border-b-2 border-r-2 border-[#00FF8820] animate-pulse-glow" style={{ animationDelay: "3s" }} />
    </div>
  );
}
