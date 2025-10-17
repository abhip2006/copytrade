"use client";

import { useEffect, useRef, useState } from "react";

export function InteractiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    // Mouse move handler
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Grid settings
    const gridSize = 40;
    const dotRadius = 1.5;
    const highlightRadius = 150;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid dots
      for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
          const dx = mousePos.x - x;
          const dy = mousePos.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Calculate opacity based on distance from mouse
          let opacity = 0.15;
          if (distance < highlightRadius) {
            opacity = 0.6 * (1 - distance / highlightRadius);
          }

          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 102, 255, ${opacity})`;
          ctx.fill();

          // Draw connecting lines to nearby dots
          if (distance < highlightRadius) {
            for (let nx = x; nx < x + gridSize * 2; nx += gridSize) {
              for (let ny = y; ny < y + gridSize * 2; ny += gridSize) {
                if (nx !== x || ny !== y) {
                  const ndx = mousePos.x - nx;
                  const ndy = mousePos.y - ny;
                  const ndistance = Math.sqrt(ndx * ndx + ndy * ndy);

                  if (ndistance < highlightRadius) {
                    const lineOpacity = 0.15 * (1 - distance / highlightRadius) * (1 - ndistance / highlightRadius);
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(nx, ny);
                    ctx.strokeStyle = `rgba(99, 102, 241, ${lineOpacity})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                  }
                }
              }
            }
          }
        }
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mousePos]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: "transparent" }}
    />
  );
}
