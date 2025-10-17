"use client";

import { useEffect, useRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export function AnimatedMetrics() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 200;

    const dataPoints: number[] = [];
    const maxPoints = 50;
    let time = 0;

    const animate = () => {
      time += 0.05;

      // Generate realistic trading data (sine wave with noise)
      const baseValue = 100 + Math.sin(time) * 20;
      const noise = (Math.random() - 0.5) * 10;
      const newPoint = baseValue + noise;

      dataPoints.push(newPoint);
      if (dataPoints.length > maxPoints) {
        dataPoints.shift();
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines
      ctx.strokeStyle = "rgba(229, 231, 235, 0.5)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const y = (canvas.height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw line chart
      if (dataPoints.length > 1) {
        const xStep = canvas.width / (maxPoints - 1);

        // Gradient for line
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "rgba(0, 102, 255, 1)");
        gradient.addColorStop(1, "rgba(99, 102, 241, 1)");

        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        dataPoints.forEach((point, index) => {
          const x = index * xStep;
          const y = canvas.height - ((point - 50) / 100) * canvas.height;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();

        // Draw fill area
        const fillGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        fillGradient.addColorStop(0, "rgba(0, 102, 255, 0.2)");
        fillGradient.addColorStop(1, "rgba(0, 102, 255, 0.01)");

        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fillStyle = fillGradient;
        ctx.fill();

        // Draw glow point at the end
        const lastPoint = dataPoints[dataPoints.length - 1];
        const lastX = (dataPoints.length - 1) * xStep;
        const lastY = canvas.height - ((lastPoint - 50) / 100) * canvas.height;

        ctx.beginPath();
        ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#0066FF";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(lastX, lastY, 8, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 102, 255, 0.3)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-gray-600 font-medium">Live Performance</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">+24.5%</div>
        </div>
        <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
          <TrendingUp className="w-4 h-4" />
          <span>+12.3%</span>
        </div>
      </div>
      <canvas ref={canvasRef} className="w-full h-auto" />
      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
        <span>Last 24h</span>
        <span>Updated 2s ago</span>
      </div>
    </div>
  );
}
