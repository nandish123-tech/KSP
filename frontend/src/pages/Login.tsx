// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, KeyRound, User, Eye, EyeOff, Fingerprint } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { DutyBackdrop } from "../components/DutyBackdrop";
import officerFilm from "../assets/officer-cap-removal-clean.webm";
import officerFilmMp4 from "../assets/officer-cap-removal-clean.mp4";
import officerPoster from "../assets/officer-video-start.jpg";
import emblemImage from "../assets/police-emblem.png";
import soudhaImage from "../assets/vidhana-soudha-night.jpg";

const CLIP_SECONDS = 10.125;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
const range = (value: number, start: number, end: number) =>
  clamp((value - start) / (end - start));
const smoothstep = (value: number) => value * value * (3 - 2 * value);

export default function Login() {
  // ── ORIGINAL AUTH LOGIC (unchanged) ──────────────────────────────
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Local auth: any username + password `ksp@123`
    if (password !== "ksp@123") {
      setTimeout(() => {
        setError("Authentication failed. Hint: use password ksp@123");
        setLoading(false);
      }, 600);
      return;
    }

    const role = /admin/i.test(username)
      ? "Admin"
      : /inspector/i.test(username)
        ? "Inspector"
        : /constable/i.test(username)
          ? "Constable"
          : "Sub Inspector";

    setTimeout(() => {
      login({
        username: username || "Officer",
        role,
        token: "local-" + Date.now(),
        badgeNumber: "KSP-" + Math.floor(1000 + Math.random() * 9000),
      });
      navigate("/");
    }, 700);
  };
  // ─────────────────────────────────────────────────────────────────

  // ── Scroll-driven duty-terminal reveal (new theme) ───────────────
  const sequenceRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);

  // Paint the scrubbed film into a canvas and remove its near-black studio
  // backdrop per pixel (exact pipeline from the source CapRevealLogin).
  useEffect(() => {
    let raf = 0;
    const paint = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (video && canvas && context && video.videoWidth) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const frame = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = frame.data;
        for (let index = 0; index < pixels.length; index += 4) {
          const red = pixels[index] ?? 0;
          const green = pixels[index + 1] ?? 0;
          const blue = pixels[index + 2] ?? 0;
          const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
          const brightest = Math.max(red, green, blue);
          const darkest = Math.min(red, green, blue);
          const chroma = brightest - darkest;
          const foregroundSignal = luminance + Math.max(0, chroma - 20) * 1.2;
          if (foregroundSignal <= 10) {
            pixels[index + 3] = 0;
            continue;
          }
          if (foregroundSignal >= 16) {
            pixels[index + 3] = 255;
            continue;
          }
          const edge = (foregroundSignal - 10) / 6;
          pixels[index + 3] = Math.round(255 * edge * edge * (3 - 2 * edge));
        }

        // Interior fill: flood the transparent region inward from the frame
        // border so dark hair / belt inside the officer stays solid.
        const width = canvas.width;
        const height = canvas.height;
        const pixelCount = width * height;
        const outside = new Uint8Array(pixelCount);
        const stack = new Int32Array(pixelCount);
        let top = 0;
        const push = (position: number) => {
          if (outside[position] === 0 && (pixels[position * 4 + 3] ?? 0) < 24) {
            outside[position] = 1;
            stack[top++] = position;
          }
        };
        for (let x = 0; x < width; x += 1) {
          push(x);
          push((height - 1) * width + x);
        }
        for (let y = 0; y < height; y += 1) {
          push(y * width);
          push(y * width + width - 1);
        }
        while (top > 0) {
          const position = stack[--top] ?? 0;
          const x = position % width;
          const y = (position - x) / width;
          if (x > 0) push(position - 1);
          if (x < width - 1) push(position + 1);
          if (y > 0) push(position - width);
          if (y < height - 1) push(position + width);
        }
        for (let position = 0; position < pixelCount; position += 1) {
          const alphaIndex = position * 4 + 3;
          if (outside[position] === 1) {
            pixels[alphaIndex] = 0;
          } else if ((pixels[alphaIndex] ?? 0) < 24) {
            pixels[alphaIndex] = 255;
          }
        }

        context.putImageData(frame, 0, 0);
      }
      raf = window.requestAnimationFrame(paint);
    };
    raf = window.requestAnimationFrame(paint);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let frame = 0;
    let target = 0;
    let rendered = 0;
    const durationMs = 3500; // Time to complete animation
    let startTime = 0;

    const render = (time: number) => {
      if (!startTime) startTime = time + 800; // initial delay

      if (time > startTime) {
         target = Math.min(1, (time - startTime) / durationMs);
      }

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      rendered += (target - rendered) * (reducedMotion ? 1 : 0.05);
      if (Math.abs(target - rendered) < 0.0002) rendered = target;
      setProgress(rendered);

      // Scrub the officer film with auto progress
      const video = videoRef.current;
      if (video && video.readyState >= 1) {
        const duration = Number.isFinite(video.duration) ? video.duration : CLIP_SECONDS;
        const filmProgress = smoothstep(range(rendered, 0.06, 0.62));
        const nextTime = filmProgress * Math.max(0, duration - 0.08);
        if (Math.abs(video.currentTime - nextTime) > 0.016) video.currentTime = nextTime;
      }

      if (rendered < 1 || target < 1) {
        frame = window.requestAnimationFrame(render);
      }
    };

    frame = window.requestAnimationFrame(render);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);



  // Live IST clock (duty-network flourish)
  const [clock, setClock] = useState("");
  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const reveal = smoothstep(range(progress, 0.42, 0.78));
  const intro = 1 - smoothstep(range(progress, 0.03, 0.16));
  const officerShift = smoothstep(range(progress, 0.58, 0.9));

  return (
    <div ref={sequenceRef} className="relative h-dvh duty-surface overflow-hidden">
      <div className="absolute inset-0 h-dvh min-h-[640px] overflow-hidden">
        {/* ── Vidhana Soudha backdrop with scroll parallax ── */}
        <div
          className="pointer-events-none absolute inset-0 will-change-transform"
          style={{
            transform: `translate3d(0, ${progress * -6}%, 0) scale(${1.1 + progress * 0.06})`,
          }}
          aria-hidden
        >
          <img
            src={soudhaImage}
            alt=""
            width={1920}
            height={1088}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              objectPosition: "50% 35%",
              filter: `saturate(0.82) brightness(${0.92 - progress * 0.28}) blur(${1 + progress * 4}px)`,
            }}
          />
        </div>
        <div className="soudha-grade absolute inset-0" aria-hidden />

        {/* ── Animated duty backdrop ── */}
        <DutyBackdrop />
        <div className="duty-architecture absolute inset-0" aria-hidden />
        <div className="duty-light absolute inset-0" aria-hidden />

        {/* ── Officer avatar (chroma-keyed film, scrubbed by scroll) ── */}
        <div
          className="pointer-events-none absolute inset-0 z-10 will-change-transform"
          style={{
            transform: `translate3d(${officerShift * -18}vw, 0, 0) scale(${1 - officerShift * 0.05})`,
            opacity: 1 - reveal * 0.06,
          }}
          aria-hidden
        >
          <video
            ref={videoRef}
            poster={officerPoster}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            className="pointer-events-none absolute h-px w-px opacity-0"
          >
            <source src={officerFilm} type="video/webm" />
            <source src={officerFilmMp4} type="video/mp4" />
          </video>
          <canvas
            ref={canvasRef}
            className="officer-canvas absolute inset-0 h-full w-full object-contain"
            style={{ objectPosition: "bottom" }}
          />
        </div>

        {/* ── Top bar ── */}
        <header className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-5 sm:px-9 sm:py-6">
          <div className="flex items-center gap-3">
            <img
              src={emblemImage}
              alt="Karnataka State Police emblem"
              className="h-11 w-11 rounded-full object-contain sm:h-14 sm:w-14"
              style={{
                border: "1px solid var(--duty-border)",
                background: "color-mix(in oklab, var(--duty-navy-deep) 55%, transparent)",
                boxShadow: "0 0 24px color-mix(in oklab, var(--duty-gold) 18%, transparent)",
              }}
            />
            <div>
              <p className="font-display text-sm font-semibold text-gold-soft sm:text-base">
                ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್
              </p>
              <p className="mt-1 text-[0.58rem] uppercase tracking-[0.24em] text-slate-400">
                Secure Duty Network
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-4 text-[0.62rem] uppercase tracking-[0.22em] text-slate-400 sm:flex">
            <span className="flex items-center gap-2"><span className="status-dot" /> Protected connection</span>
            <span className="font-mono tabular-nums text-gold-soft">{clock} IST</span>
          </div>
        </header>


        <div className="duty-vignette absolute inset-0 z-20" aria-hidden />

        {/* ── Terminal panel (ORIGINAL form, themed skin) ── */}
        <div
          ref={panelRef}
          className="absolute inset-y-0 right-0 z-40 flex w-full items-center px-4 py-24 sm:px-8 lg:w-[54%] lg:px-12 xl:px-20"
          style={{
            opacity: reveal,
            transform: `translate3d(${(1 - reveal) * 72}px, 0, 0)`,
            pointerEvents: reveal > 0.8 ? "auto" : "none",
          }}
        >
          <div className="terminal-panel mx-auto w-full max-w-md animate-rise-in">
            {/* Card header — original branding, new skin */}
            <div
              className="animate-rise-in relative flex flex-col items-center gap-3 overflow-hidden px-7 pb-5 pt-7 text-center"
              style={{
                borderBottom: "1px solid var(--duty-border)",
                background:
                  "radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--duty-gold) 12%, transparent), transparent 70%)",
              }}
            >
              <div className="relative">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{
                    background: "color-mix(in oklab, oklch(1 0 0) 5%, transparent)",
                    border: "1px solid color-mix(in oklab, var(--duty-gold) 45%, transparent)",
                    boxShadow: "0 0 30px color-mix(in oklab, var(--duty-gold) 22%, transparent)",
                  }}
                >
                  <ShieldAlert className="h-8 w-8 text-gold" />
                </div>
                <div
                  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: "var(--duty-gold)" }}
                >
                  <Fingerprint className="h-3 w-3" style={{ color: "var(--duty-navy-deep)" }} />
                </div>
              </div>
              <div>
                <h2 className="font-display text-xl font-bold tracking-widest text-gold-soft">
                  KSP CRIME INTELLIGENCE HUB
                </h2>
                <p className="mt-1 text-xs tracking-wider text-slate-400">
                  Law Enforcement Secure Authentication Entryway
                </p>
              </div>
              <div className="mt-1 flex items-center gap-4 text-[9px] font-mono uppercase tracking-widest">
                <div className="flex items-center gap-1 text-emerald-400">
                  <span className="status-dot" style={{ background: "#34d399", boxShadow: "0 0 0 4px rgba(52,211,153,0.14)" }} />
                  System Online
                </div>
                <span className="text-slate-600">·</span>
                <div className="flex items-center gap-1 text-sky-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                  426,496 FIRs Active
                </div>
              </div>
            </div>

            <div className="hairline-gold mx-6" aria-hidden />

            {/* Form — EXACT original fields & logic */}
            <form onSubmit={handleSubmit} className="animate-rise-in rise-d2 space-y-5 p-8">
              {error && (
                <div
                  className="flex items-center gap-2 rounded-xl border p-3 text-xs font-medium"
                  style={{
                    borderColor: "oklch(0.58 0.19 27 / 45%)",
                    background: "color-mix(in oklab, oklch(0.58 0.19 27) 12%, transparent)",
                    color: "#fda4af",
                  }}
                >
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                  {error}
                </div>
              )}

              {/* Username */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Officer Username / Badge Context
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g., Inspector Patil"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="duty-field pl-10 font-mono"
                  />
                </div>
                <p className="mt-1 font-mono text-[10px] text-slate-500">
                  Enter title (Admin / Inspector / Constable) to shape your role workspace
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Security Core Passcode
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="duty-field pl-10 pr-10 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-gold-soft"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="bg-brass shine-host relative w-full rounded-xl py-3 text-sm font-bold tracking-wide transition-all duration-300 hover:-translate-y-0.5"
                style={{ boxShadow: loading ? "none" : "0 12px 30px -10px oklch(0.78 0.128 84 / 45%)" }}
              >
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Decrypting Token Vault…
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="h-4 w-4" />
                      Establish Secure Session
                    </>
                  )}
                </span>
              </button>

              {/* Hint */}
              <p className="text-center font-mono text-[10px] text-slate-500">
                Demo: any username · password{" "}
                <span className="rounded border px-1.5 py-0.5 font-bold text-gold"
                  style={{ borderColor: "var(--duty-border)", background: "color-mix(in oklab, var(--duty-gold) 8%, transparent)" }}>
                  ksp@123
                </span>
              </p>
            </form>

            <footer
              className="animate-rise-in rise-d3 flex items-center justify-between px-8 py-3 text-[0.58rem] uppercase tracking-[0.12em] text-slate-500"
              style={{ borderTop: "1px solid var(--duty-border)" }}
            >
              <span>AES-256 encrypted</span>
              <span>Session monitored</span>
            </footer>
          </div>
        </div>

        {/* ── Scroll progress rail ── */}
        <div className="absolute inset-x-0 bottom-0 z-50 h-0.5 bg-white/5" aria-hidden>
          <div className="bg-brass h-full" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
