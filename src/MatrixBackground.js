import React, { useRef, useEffect } from "react";

export default function MatrixBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const fontSize = 20;
    const columns = Math.floor(width / fontSize);
    const drops = Array(columns).fill(1);
    const characters = "アァカサタナハマヤラガザABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, width, height);
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = "#00ff55";
      ctx.shadowColor = "#00ff55";
      ctx.shadowBlur = 8;
      drops.forEach((y, index) => {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        ctx.fillText(text, index * fontSize, y * fontSize);
        drops[index] = y * fontSize > height && Math.random() > 0.975 ? 0 : y + 1;
      });
      ctx.shadowBlur = 0; // reset for next frame
    };

    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 1,
        width: "100%",
        height: "100%",
        background: "#0d0d0d",
      }}
    />
  );
} 