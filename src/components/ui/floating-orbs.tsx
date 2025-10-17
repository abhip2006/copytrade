"use client";

export function FloatingOrbs() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Subtle blue gradient mesh */}
      <div
        className="absolute w-[800px] h-[800px] rounded-full opacity-30 blur-[120px] animate-float"
        style={{
          background: "radial-gradient(circle, rgba(0,102,255,0.15) 0%, transparent 60%)",
          top: "0%",
          left: "20%",
          animationDelay: "0s",
          animationDuration: "25s",
        }}
      />

      {/* Indigo accent */}
      <div
        className="absolute w-[700px] h-[700px] rounded-full opacity-25 blur-[120px] animate-float"
        style={{
          background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 60%)",
          top: "40%",
          right: "10%",
          animationDelay: "8s",
          animationDuration: "30s",
        }}
      />

      {/* Purple subtle accent */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[100px] animate-float"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 60%)",
          bottom: "5%",
          left: "40%",
          animationDelay: "15s",
          animationDuration: "28s",
        }}
      />
    </div>
  );
}
