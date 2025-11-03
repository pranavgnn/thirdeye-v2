"use client";

export function DottedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Main dotted pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1.5px, transparent 1.5px)`,
          backgroundSize: "50px 50px",
          backgroundPosition: "0 0",
          opacity: 0.15,
        }}
      />

      {/* Subtle radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background/10" />
    </div>
  );
}
