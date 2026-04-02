"use client";

import { useEffect, useRef } from "react";
import styles from "./CelebrationStep.module.css";

/* ------------------------------------------------------------------ */
/*  Confetti — dynamically imported, lightweight canvas burst           */
/* ------------------------------------------------------------------ */

function fireConfetti(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = ["#dc2626", "#F5A623", "#34C759", "#3b82f6", "#a855f7"];
  const PARTICLE_COUNT = 60;
  const GRAVITY = 0.003;
  const DRAG = 0.98;

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    size: number;
    rotation: number;
    rotationSpeed: number;
    life: number;
  }

  const particles: Particle[] = [];
  const cx = canvas.width / 2;
  const cy = canvas.height * 0.35;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.7;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 4 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      life: 1,
    });
  }

  let animId: number;
  function draw() {
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;

    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += GRAVITY;
      p.vx *= DRAG;
      p.vy *= DRAG;
      p.rotation += p.rotationSpeed;
      p.life -= 0.008;

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rotation);
      ctx!.globalAlpha = Math.max(0, p.life);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx!.restore();
    }

    if (alive) {
      animId = requestAnimationFrame(draw);
    }
  }

  animId = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(animId);
}

/* ------------------------------------------------------------------ */
/*  CelebrationStep                                                    */
/* ------------------------------------------------------------------ */

interface CelebrationStepProps {
  isLastShow: boolean;
  onAdvance: () => void;
}

export default function CelebrationStep({
  isLastShow,
  onAdvance,
}: CelebrationStepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fire confetti on mount
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced || !canvasRef.current) return;

    const cancel = fireConfetti(canvasRef.current);
    return cancel;
  }, []);

  const handleNext = () => {
    onAdvance();
  };

  return (
    <div className={styles.celebration}>
      {/* Confetti canvas */}
      <canvas ref={canvasRef} className={styles.confettiCanvas} />

      {/* Animated checkmark */}
      <div className={styles.checkmarkWrap}>
        <svg className={styles.checkmarkSvg} viewBox="0 0 80 80">
          <circle
            className={styles.checkmarkCircle}
            cx="40"
            cy="40"
            r="36"
          />
          <polyline
            className={styles.checkmarkTick}
            points="26,42 36,52 54,30"
          />
        </svg>
      </div>

      {/* Message */}
      <p className={styles.message}>הביקורת שלכם פורסמה!</p>

      {/* Next button */}
      <button className={styles.nextButton} onClick={handleNext}>
        {isLastShow ? "סיום" : "הבא"}
      </button>
    </div>
  );
}
