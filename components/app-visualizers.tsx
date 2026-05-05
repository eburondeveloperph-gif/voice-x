import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Loader2, Power } from 'lucide-react';

export function OneLineStreamingTranscript({
  text,
  role,
  name,
}: {
  text: string;
  role: 'user' | 'model';
  name: string;
}) {
  return (
    <motion.div
      key={`${role}-${text}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.12 }}
      className="w-full overflow-hidden px-4"
      style={{ fontFamily: 'Roboto, system-ui, sans-serif' }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 overflow-hidden whitespace-nowrap rounded-full border border-lime-300/15 bg-black/35 px-5 py-3 shadow-2xl backdrop-blur-2xl">
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] ${
            role === 'user' ? 'border border-sky-400/20 bg-sky-500/10 text-sky-300' : 'border border-lime-300/25 bg-lime-400/10 text-lime-300'
          }`}
        >
          {role === 'user' ? 'You' : name}
        </span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className={`truncate text-left text-lg font-medium leading-none tracking-tight md:text-2xl ${role === 'user' ? 'text-sky-100' : 'text-lime-50'}`}>
            {text}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function LimeVoiceOrb({
  isActive,
  isAgentSpeaking,
  speakerLevel,
  speakerBands,
}: {
  isActive: boolean;
  isAgentSpeaking: boolean;
  speakerLevel: number;
  speakerBands: number[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const levelRef = useRef(0);
  const bandsRef = useRef<number[]>(Array(20).fill(0));
  const activeRef = useRef(false);
  const speakingRef = useRef(false);

  useEffect(() => {
    levelRef.current = speakerLevel;
    bandsRef.current = speakerBands;
    activeRef.current = isActive;
    speakingRef.current = isAgentSpeaking;
  }, [isActive, isAgentSpeaking, speakerBands, speakerLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let frame = 0;
    let raf = 0;
    let displayLevel = 0;

    const fitCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return {
        width: width / dpr,
        height: height / dpr,
      };
    };

    const makeOrbPath = (cx: number, cy: number, radius: number, pulse: number, time: number) => {
      const path = new Path2D();
      const points: Array<{ x: number; y: number }> =[];
      const bands = bandsRef.current.length ? bandsRef.current : Array(20).fill(0);
      const live = activeRef.current && speakingRef.current;
      const count = 112;

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const band = bands[i % bands.length] || 0;
        const surface =
          Math.sin(angle * 2.1 + time * 0.95) * (live ? 2.5 : 0.9) +
          Math.sin(angle * 3.7 - time * 0.68) * (live ? 1.7 : 0.55) +
          band * (live ? 8.5 : 1.8);
        const r = radius + pulse * 8 + surface;

        points.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
        });
      }

      points.forEach((point, index) => {
        const next = points[(index + 1) % points.length];
        const midX = (point.x + next.x) / 2;
        const midY = (point.y + next.y) / 2;

        if (index === 0) {
          path.moveTo(midX, midY);
        } else {
          path.quadraticCurveTo(point.x, point.y, midX, midY);
        }
      });

      path.closePath();
      return path;
    };

    const drawGlow = (cx: number, cy: number, radius: number, inner: string, outer: string) => {
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, inner);
      gradient.addColorStop(1, outer);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = () => {
      const { width, height } = fitCanvas();
      const cx = width / 2;
      const cy = height / 2;
      const time = frame / 60;
      const rawLevel = activeRef.current ? Math.max(levelRef.current, speakingRef.current ? 0.035 : 0) : 0;
      displayLevel += (rawLevel - displayLevel) * 0.16;
      const bands = bandsRef.current.length ? bandsRef.current : Array(20).fill(0);
      const bandEnergy = bands.reduce((sum, band) => sum + band, 0) / Math.max(bands.length, 1);
      const pulse = Math.min(1, Math.max(displayLevel, bandEnergy * 1.25));
      const live = activeRef.current && speakingRef.current;
      const baseRadius = 93;

      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.globalAlpha = activeRef.current ? 0.42 + pulse * 0.28 : 0.24;
      ctx.filter = 'blur(34px)';
      drawGlow(cx, cy, 118 + pulse * 22, 'rgba(190,242,100,0.42)', 'rgba(22,101,52,0)');
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = activeRef.current ? 0.24 + pulse * 0.26 : 0.12;
      ctx.strokeStyle = 'rgba(190,242,100,0.34)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 116 + pulse * 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      const orbPath = makeOrbPath(cx, cy, baseRadius, pulse, time);

      ctx.save();
      ctx.shadowColor = 'rgba(190,242,100,0.38)';
      ctx.shadowBlur = 38 + pulse * 28;
      const bodyGradient = ctx.createRadialGradient(cx - 38, cy - 48, 8, cx, cy, 126);
      bodyGradient.addColorStop(0, 'rgba(236,252,203,0.76)');
      bodyGradient.addColorStop(0.27, 'rgba(163,230,53,0.58)');
      bodyGradient.addColorStop(0.58, 'rgba(34,197,94,0.46)');
      bodyGradient.addColorStop(1, 'rgba(5,46,22,0.96)');
      ctx.fillStyle = bodyGradient;
      ctx.fill(orbPath);
      ctx.restore();

      ctx.save();
      ctx.clip(orbPath);
      ctx.globalCompositeOperation = 'screen';
      drawGlow(
        cx - 38 + Math.sin(time * 0.7) * 12,
        cy - 34 + Math.cos(time * 0.55) * 10,
        78 + pulse * 12,
        'rgba(236,252,203,0.52)',
        'rgba(236,252,203,0)'
      );
      drawGlow(
        cx + 40 + Math.cos(time * 0.62) * 14,
        cy + 24 + Math.sin(time * 0.75) * 12,
        90 + pulse * 18,
        'rgba(16,185,129,0.44)',
        'rgba(16,185,129,0)'
      );
      drawGlow(
        cx - 6 + Math.sin(time * 0.5) * 18,
        cy + 34 + Math.cos(time * 0.46) * 10,
        98,
        'rgba(132,204,22,0.22)',
        'rgba(132,204,22,0)'
      );
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = \`rgba(217,249,157,\${0.16 + pulse * 0.26})\`;
      ctx.lineWidth = 1.4;
      ctx.stroke(orbPath);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = live ? 0.14 + pulse * 0.18 : 0.06;
      ctx.fillStyle = 'rgba(255,255,255,0.58)';
      ctx.beginPath();
      ctx.ellipse(cx - 36, cy - 46, 24 + pulse * 6, 11 + pulse * 3, -0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      frame += 1;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  },[]);

  return (
    <div className="relative flex h-72 w-72 items-center justify-center">
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
    </div>
  );
}

export function StartIconMicVisualizer({
  isActive,
  connecting,
  isMuted,
  micLevel,
  micBands,
  onClick,
}: {
  isActive: boolean;
  connecting: boolean;
  isMuted: boolean;
  micLevel: number;
  micBands?: number[];
  onClick: () => void;
}) {
  const innerBands = micBands?.length
    ? micBands.slice(5, 14)
    :[0.35, 0.5, 0.72, 0.9, 1, 0.82, 0.64, 0.46, 0.32].map(n => n * micLevel);

  return (
    <button
      onClick={onClick}
      disabled={connecting}
      aria-label={isActive ? 'Stop voice session' : 'Start voice session'}
      className="group relative flex h-20 w-20 items-center justify-center"
    >
      <motion.div
        animate={{ opacity: isActive ? 0.16 + micLevel * 0.3 : 0.08 }}
        transition={{ duration: 0.045 }}
        className={\`absolute inset-0 rounded-full \${isMuted ? 'bg-red-500/20' : 'bg-lime-300/30'}\`}
      />

      <div
        className={\`relative flex h-20 w-20 items-center justify-center rounded-full border bg-[#0A0A0B] shadow-2xl transition-all \${
          isActive
            ? isMuted
              ? 'border-red-500/35'
              : 'border-lime-300/60'
            : 'border-white/10 group-hover:border-lime-300/50'
        }\`}
      >
        {connecting ? (
          <Loader2 className="h-7 w-7 animate-spin text-lime-300" />
        ) : isActive ? (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
            <div className="flex h-12 items-center gap-1">
              {innerBands.map((band, i) => {
                const liveBand = isMuted ? 0 : Math.max(band, micLevel * 0.4);
                return (
                  <motion.div
                    key={i}
                    animate={{
                      height: Math.max(5, liveBand * 42),
                      opacity: isMuted ? 0.2 : Math.max(0.32, liveBand + 0.18),
                    }}
                    transition={{ duration: 0.035 }}
                    className={\`w-1 rounded-full \${
                      isMuted ? 'bg-red-500' : 'bg-lime-300 shadow-[0_0_10px_rgba(190,242,100,0.75)]'
                    }\`}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <Power className="h-8 w-8 text-lime-300 transition-colors" />
        )}
      </div>
    </button>
  );
}
