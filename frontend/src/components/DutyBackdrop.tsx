import { useEffect, useRef } from "react";

type Mote = { x: number; y: number; z: number; r: number; s: number; a: number };

/**
 * Canvas duty backdrop: a slow perspective grid horizon, gently drifting
 * ambient dust motes and a soft brass haze. Pure 2D canvas, DPR-aware,
 * pauses when the tab is hidden and stops entirely for reduced-motion users.
 */
export function DutyBackdrop({ intensity = 1 }: { intensity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let motes: Mote[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(150, (w * h) / 12000));
      motes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: 0.25 + Math.random() * 0.75,
        r: 0.4 + Math.random() * 1.8,
        s: 0.06 + Math.random() * 0.5,
        a: Math.random() * Math.PI * 2,
      }));
    };

    const onPointer = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth;
      pointer.ty = e.clientY / window.innerHeight;
    };

    const drawGrid = (t: number, px: number, py: number) => {
      const horizon = h * (0.68 + py * 0.03);
      ctx.save();
      ctx.strokeStyle = "rgba(222, 186, 108, 0.4)";
      ctx.lineWidth = 1;

      // Receding horizontal rails
      for (let i = 1; i <= 16; i++) {
        const k = i / 16;
        const y = horizon + Math.pow(k, 2.4) * (h - horizon) * 1.35 + ((t * 0.012) % 12);
        if (y > h + 2) continue;
        ctx.globalAlpha = 0.1 + k * 0.55;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Converging verticals
      const vpx = w * (0.5 + px * 0.06);
      for (let i = -14; i <= 14; i++) {
        const x = vpx + i * (w / 12);
        ctx.globalAlpha = 0.3 - Math.min(0.24, Math.abs(i) * 0.018);
        ctx.beginPath();
        ctx.moveTo(vpx + i * 6, horizon);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      ctx.restore();
    };

    const render = (t: number) => {
      if (!running) return;
      const boost = intensityRef.current;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      const px = pointer.x - 0.5;
      const py = pointer.y - 0.5;

      ctx.clearRect(0, 0, w, h);

      // Brass haze pooled near the vanishing point
      const haze = ctx.createRadialGradient(
        w * (0.5 + px * 0.1),
        h * (0.34 + py * 0.08),
        0,
        w * 0.5,
        h * 0.4,
        Math.max(w, h) * 0.72,
      );
      haze.addColorStop(0, `rgba(198, 158, 84, ${0.2 * boost})`);
      haze.addColorStop(0.45, "rgba(38, 56, 100, 0.3)");
      haze.addColorStop(1, "rgba(6, 10, 22, 0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);

      drawGrid(t, px, py);

      // Ambient dust motes with a slow, gentle twinkle
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (const m of motes) {
        m.y -= m.s * m.z * (reduced ? 0 : 1);
        m.a += 0.004 * m.z;
        if (m.y < -6) {
          m.y = h + 6;
          m.x = Math.random() * w;
        }
        const drift = Math.sin(m.a) * 12 * m.z;
        const x = m.x + drift - px * 42 * m.z;
        const y = m.y - py * 26 * m.z;
        const twinkle = 0.5 + 0.5 * Math.sin(t * 0.001 * (0.6 + m.z) + m.a * 3);
        const alpha = (0.05 + twinkle * 0.22) * m.z * boost;
        ctx.beginPath();
        ctx.fillStyle = `rgba(240, 214, 160, ${alpha})`;
        ctx.arc(x, y, m.r * (0.7 + twinkle * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Fine scan lines
      ctx.save();
      ctx.globalAlpha = 0.055;
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1;
      for (let y = ((t * 0.02) % 4) - 4; y < h; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();

      raf = window.requestAnimationFrame(render);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        window.cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = window.requestAnimationFrame(render);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    raf = window.requestAnimationFrame(render);

    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
