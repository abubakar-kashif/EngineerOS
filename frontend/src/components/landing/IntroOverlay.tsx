/**
 * Cinematic landing intro: a glowing particle field "charges", converges along
 * curved paths into the EngineerOS bolt, powers up circuit traces, then hands
 * off to the real hero.
 *
 * Constraints honoured here:
 * - canvas particles draw with additive sprites (no per-particle shadow cost)
 * - Framer Motion elements animate opacity / transform / pathLength only
 * - skippable by click, tap, key, wheel or touch
 * - single rAF loop, always cancelled on unmount
 */
import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BOLT_PATH, BOLT_VIEWBOX, sampleBoltOutline } from "./boltGeometry";
import { EASE_OUT, INTRO_TIMING } from "./landingMotion";

const PARTICLE_COUNT = 120;
const SPRITE_SIZE = 32;

type Particle = {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  cx: number;
  cy: number;
  size: number;
  cyan: boolean;
  phase: number;
  drift: number;
};

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function makeGlowSprite(rgb: string): HTMLCanvasElement {
  const sprite = document.createElement("canvas");
  sprite.width = SPRITE_SIZE;
  sprite.height = SPRITE_SIZE;
  const ctx = sprite.getContext("2d");
  if (ctx) {
    const mid = SPRITE_SIZE / 2;
    const gradient = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid);
    gradient.addColorStop(0, `rgba(${rgb},1)`);
    gradient.addColorStop(0.25, `rgba(${rgb},0.55)`);
    gradient.addColorStop(0.6, `rgba(${rgb},0.14)`);
    gradient.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  }
  return sprite;
}

function buildParticles(width: number, height: number): Particle[] {
  const boltHeight = Math.min(height * 0.38, 260);
  const boltWidth = (BOLT_VIEWBOX.width / BOLT_VIEWBOX.height) * boltHeight;
  const targets = sampleBoltOutline(
    PARTICLE_COUNT,
    width / 2,
    height / 2 - boltHeight * 0.08,
    boltWidth,
    boltHeight,
  );

  return targets.map((target, i) => {
    const sx = Math.random() * width;
    const sy = Math.random() * height;
    const midX = (sx + target.x) / 2;
    const midY = (sy + target.y) / 2;
    const dx = target.x - sx;
    const dy = target.y - sy;
    // Perpendicular offset bends the path into an arc, alternating per particle.
    const bend = (i % 2 === 0 ? 1 : -1) * 0.18;

    return {
      sx,
      sy,
      tx: target.x,
      ty: target.y,
      cx: midX - dy * bend,
      cy: midY + dx * bend,
      size: 5 + Math.random() * 5,
      cyan: i % 3 === 0,
      phase: Math.random() * Math.PI * 2,
      drift: 4 + Math.random() * 6,
      };
  });
}

interface IntroOverlayProps {
  onFinish: () => void;
}

function IntroOverlay({ onFinish }: IntroOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  }, [onFinish]);

  /* Particle field: one rAF loop, additive sprites, cleaned up on unmount. */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const blue = makeGlowSprite("147,197,253");
    const cyan = makeGlowSprite("103,232,249");

    let width = window.innerWidth;
    let height = window.innerHeight;
    let particles = buildParticles(width, height);
    let frame = 0;
    const start = performance.now();

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = buildParticles(width, height);
    };

    resize();

    const draw = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = "lighter";

      for (const p of particles) {
        let x: number;
        let y: number;
        let alpha: number;
        let scale: number;

        if (t < INTRO_TIMING.chargeEnd) {
          // Phase 1 — charge: scattered static drifting in the air.
          const wobble = Math.sin(t / 420 + p.phase) * p.drift;
          x = p.sx + wobble;
          y = p.sy + Math.cos(t / 520 + p.phase) * p.drift;
          alpha = (t / INTRO_TIMING.chargeEnd) * 0.5;
          scale = 0.55;
        } else if (t < INTRO_TIMING.convergeEnd) {
          // Phase 2 — convergence: quadratic curve toward the bolt outline.
          const raw =
            (t - INTRO_TIMING.chargeEnd) /
            (INTRO_TIMING.convergeEnd - INTRO_TIMING.chargeEnd);
          const e = easeInOutCubic(Math.min(1, raw));
          const inv = 1 - e;
          x = inv * inv * p.sx + 2 * inv * e * p.cx + e * e * p.tx;
          y = inv * inv * p.sy + 2 * inv * e * p.cy + e * e * p.ty;
          alpha = 0.5 + e * 0.5;
          scale = 0.55 + e * 0.55;
        } else {
          // Phase 3 — hold on the logo, then fade the field out.
          const held = t - INTRO_TIMING.convergeEnd;
          x = p.tx + Math.sin(held / 180 + p.phase) * 1.2;
          y = p.ty + Math.cos(held / 200 + p.phase) * 1.2;
          const fade = Math.max(
            0,
            1 - held / (INTRO_TIMING.revealEnd - INTRO_TIMING.convergeEnd),
          );
          alpha = fade;
          scale = 1.1 * fade + 0.2;
        }

        const sprite = p.cyan ? cyan : blue;
        const size = p.size * 3.2 * scale;
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      if (t < INTRO_TIMING.revealEnd) {
        frame = requestAnimationFrame(draw);
      }
    };

    frame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  /* Auto-advance to the handoff, and allow skipping via any intent to interact. */
  useEffect(() => {
    const timer = window.setTimeout(finish, INTRO_TIMING.revealEnd);

    const skip = () => finish();
    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("pointerdown", skip, opts);
    window.addEventListener("keydown", skip);
    window.addEventListener("wheel", skip, opts);
    window.addEventListener("touchstart", skip, opts);
    window.addEventListener("touchmove", skip, opts);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
      window.removeEventListener("touchmove", skip);
      document.body.style.overflow = previousOverflow;
    };
  }, [finish]);

  const convergeAt = INTRO_TIMING.convergeEnd / 1000;
  const words = ["Learn", "Electrical", "Engineering", "by"];
  const accentWords = ["Building", "It."];

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#05070D]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.985 }}
      transition={{ duration: INTRO_TIMING.handoff, ease: EASE_OUT }}
    >
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* circuit traces powering on from the centre */}
      <motion.svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: convergeAt - 0.35, duration: 0.3 }}
      >
        <g fill="none" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round">
          {[
            "M500 300 L500 120 L300 120 L300 40",
            "M500 300 L500 480 L720 480 L720 560",
            "M500 300 L280 300 L280 200 L60 200",
            "M500 300 L740 300 L740 380 L960 380",
            "M500 300 L360 440 L160 440",
            "M500 300 L660 160 L880 160",
          ].map((d) => (
            <motion.path
              key={d}
              d={d}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.85 }}
              transition={{ delay: convergeAt - 0.3, duration: 0.75, ease: EASE_OUT }}
            />
          ))}
        </g>
      </motion.svg>

      {/* power-on flash behind the mark */}
      <motion.div
        className="pointer-events-none absolute h-[520px] w-[520px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.55) 0%, rgba(37,99,235,0.18) 40%, rgba(5,7,13,0) 70%)",
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 0.95, 0.35], scale: [0.6, 1.15, 1] }}
        transition={{ delay: convergeAt - 0.12, duration: 0.7, ease: EASE_OUT }}
      />

      <div className="relative flex flex-col items-center px-6">
        <motion.svg
          width={Math.round((BOLT_VIEWBOX.width / BOLT_VIEWBOX.height) * 132)}
          height={132}
          viewBox={`0 0 ${BOLT_VIEWBOX.width} ${BOLT_VIEWBOX.height}`}
          aria-hidden="true"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 1, 1], scale: [0.9, 1.08, 1] }}
          transition={{ delay: convergeAt - 0.1, duration: 0.55, ease: EASE_OUT }}
        >
          <defs>
            <linearGradient id="eos-intro-bolt" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#93C5FD" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <path d={BOLT_PATH} fill="url(#eos-intro-bolt)" />
        </motion.svg>

        <p className="mt-8 flex max-w-3xl flex-wrap justify-center gap-x-3 gap-y-1 text-center text-2xl font-bold tracking-tight text-white sm:text-4xl">
          {words.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: convergeAt + 0.05 + i * 0.07,
                duration: 0.4,
                ease: EASE_OUT,
              }}
            >
              {word}
            </motion.span>
          ))}
          {accentWords.map((word, i) => (
            <motion.span
              key={word}
              className="text-[#3B82F6]"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: convergeAt + 0.34 + i * 0.08,
                duration: 0.45,
                ease: EASE_OUT,
              }}
            >
              {word}
            </motion.span>
          ))}
        </p>
      </div>

      <button
        type="button"
        onClick={finish}
        className="absolute bottom-8 right-8 rounded-full border border-[#1F2937]/70 bg-[#0D1117]/80 px-4 py-2 text-xs font-medium text-[#9CA3AF] transition hover:border-[#3B82F6] hover:text-white focus-visible:ring-2 focus-visible:ring-[#3B82F6]"
      >
        Skip intro
      </button>
    </motion.div>
  );
}

export default IntroOverlay;
