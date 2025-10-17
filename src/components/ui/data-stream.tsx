"use client";

import { useEffect, useRef } from "react";

export function DataStream() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    // Stream particle class
    class StreamParticle {
      x: number;
      y: number;
      speed: number;
      opacity: number;
      char: string;
      size: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height;
        this.speed = Math.random() * 2 + 1;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.size = Math.random() * 12 + 10;

        // Random characters: numbers, letters, symbols
        const chars = "01${}[]<>+-*/=ABCDEFabcdef";
        this.char = chars[Math.floor(Math.random() * chars.length)];
      }

      update() {
        this.y += this.speed;

        // Reset when off screen
        if (this.y > canvas.height + 20) {
          this.y = -20;
          this.x = Math.random() * canvas.width;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.font = `${this.size}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = `rgba(0, 102, 255, ${this.opacity})`;
        ctx.fillText(this.char, this.x, this.y);
      }
    }

    // Create particles
    const particles: StreamParticle[] = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push(new StreamParticle());
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", setCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none opacity-40"
      style={{ background: "transparent" }}
    />
  );
}
