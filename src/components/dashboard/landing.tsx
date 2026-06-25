"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Zap,
  ArrowRight,
  Shield,
  Eye,
  GitBranch,
  Cpu,
  Database,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Play,
  RotateCcw,
  Terminal,
  Sparkles,
  ChevronRight,
  Bug,
  Wrench,
  Github,
  BookOpen,
  MessageCircle,
  ExternalLink,
  Server,
  Activity,
  BarChart3,
  TrendingUp,
  Bell,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PolyMascot } from "@/components/dashboard/poly-mascot";

/* ──────────────────────── Animation Helpers ──────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

function ScrollReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ──────────────────────── CountUp Hook ──────────────────────── */
function useCountUp(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number;
    let raf: number;
    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [end, duration, start]);
  return count;
}

function StatItem({
  value,
  label,
  suffix = "",
  inView,
}: {
  value: number;
  label: string;
  suffix?: string;
  inView: boolean;
}) {
  const count = useCountUp(value, 2000, inView);
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs sm:text-sm text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

/* ──────────────────────── Simulation Types ──────────────────────── */
type SimStep =
  | "idle"
  | "request"
  | "response"
  | "drift"
  | "cloud"
  | "patch"
  | "done";

interface SimPhase {
  id: SimStep;
  title: string;
  sub: string;
  code?: { label: string; lines: string[] };
}

const PHASES: SimPhase[] = [
  {
    id: "request",
    title: "Your app calls an API",
    sub: "Normal request — nothing special yet",
    code: {
      label: "your-app.ts",
      lines: [
        'const res = await axios.get("/api/users/42")',
        "const name = res.data.name",
      ],
    },
  },
  {
    id: "response",
    title: "SDK intercepts the response",
    sub: "Poly wraps your HTTP client silently",
    code: {
      label: "poly-sdk (interceptor)",
      lines: [
        "// Response received from upstream",
        '{ "full_name": "John Doe", "email": "..." }',
      ],
    },
  },
  {
    id: "drift",
    title: "Schema drift detected",
    sub: `"name" field is now "full_name" — your code would break`,
    code: {
      label: "drift-detection",
      lines: [
        "EXPECTED: { name: string }",
        "GOT:      { full_name: string }",
        "DRIFT:    field-renamed  [HIGH]",
      ],
    },
  },
  {
    id: "cloud",
    title: "AI analyzes the change",
    sub: "Only schema metadata sent — your data stays local",
    code: {
      label: "poly-cloud (ai-engine)",
      lines: [
        "Analyzing: field-renamed",
        "Confidence: 0.97",
        "Mapping: full_name → name  ✓",
      ],
    },
  },
  {
    id: "patch",
    title: "Patch applied in-memory",
    sub: "Response is transformed before your code sees it",
    code: {
      label: "result",
      lines: [
        "// Your code sees the ORIGINAL shape:",
        "console.log(res.data.name)",
        '// → "John Doe"  ✓  (auto-patched!)',
      ],
    },
  },
  {
    id: "done",
    title: "Zero downtime. No deploy needed.",
    sub: "Your code keeps working while you fix it properly",
  },
];

/* ──────────────────────── Code Block Component ──────────────────────── */
function CodeBlock({
  label,
  lines,
}: {
  label: string;
  lines: string[];
}) {
  return (
    <div className="rounded-xl bg-[#09090b] border border-white/[0.06] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
        <div className="flex gap-1.5" aria-hidden="true">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/40" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500/40" />
        </div>
        <span className="text-[10px] text-zinc-600 font-mono ml-2">
          {label}
        </span>
      </div>
      <pre className="p-4 text-xs sm:text-sm font-mono leading-relaxed">
        {lines.map((line, i) => {
          let colorClass = "text-zinc-400";
          if (
            line.includes("undefined") ||
            line.includes("DRIFT") ||
            line.includes("CRASH")
          )
            colorClass = "text-red-400";
          else if (
            line.includes("✓") ||
            line.includes("✅") ||
            line.includes("WORKS") ||
            line.includes("John Doe")
          )
            colorClass = "text-emerald-400";
          else if (
            line.includes("EXPECTED") ||
            line.includes("GOT") ||
            line.includes("Analyzing") ||
            line.includes("Confidence") ||
            line.includes("Mapping")
          )
            colorClass = "text-purple-300";
          return (
            <div key={i} className="flex">
              <span
                className="text-zinc-700 w-8 shrink-0 select-none text-right mr-4"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className={colorClass}>{line}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}

/* ──────────────────────── Architecture Diagram ──────────────────────── */
function ArchitectureDiagram() {
  const boxes = [
    { label: "Your App", icon: <Layers className="h-4 w-4" />, color: "border-blue-500/30 bg-blue-500/5 text-blue-400" },
    { label: "Poly SDK", icon: <Shield className="h-4 w-4" />, color: "border-purple-500/30 bg-purple-500/10 text-purple-400" },
    { label: "Intercept", icon: <Activity className="h-4 w-4" />, color: "border-amber-500/30 bg-amber-500/5 text-amber-400" },
    { label: "Detect Drift", icon: <Eye className="h-4 w-4" />, color: "border-red-500/30 bg-red-500/5 text-red-400" },
    { label: "AI Cloud", icon: <Cpu className="h-4 w-4" />, color: "border-purple-500/30 bg-purple-500/5 text-purple-400" },
    { label: "Patch", icon: <Wrench className="h-4 w-4" />, color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" },
    { label: "Your Code", icon: <CheckCircle2 className="h-4 w-4" />, color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  ];

  return (
    <div className="relative py-6">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {boxes.map((box, i) => (
          <div key={box.label} className="flex items-center gap-2 sm:gap-3">
            <div className={`flex items-center gap-2 rounded-xl border ${box.color} px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium backdrop-blur-sm transition-all hover:scale-105`}>
              {box.icon}
              <span>{box.label}</span>
            </div>
            {i < boxes.length - 1 && (
              <ArrowRight className="h-4 w-4 text-zinc-700 shrink-0" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>
      {/* Data boundary line */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <div className="h-px flex-1 max-w-[200px] bg-gradient-to-r from-transparent via-amber-500/30 to-amber-500/50" />
        <span className="text-[10px] text-amber-500/70 font-mono whitespace-nowrap">only schema metadata</span>
        <div className="h-px flex-1 max-w-[200px] bg-gradient-to-l from-transparent via-amber-500/30 to-amber-500/50" />
      </div>
    </div>
  );
}

/* ──────────────────────── Landing Page ──────────────────────── */
export function LandingPage({
  onEnterDashboard,
}: {
  onEnterDashboard: () => void;
}) {
  const [simStep, setSimStep] = useState<SimStep>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const simRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });

  const startSim = useCallback(() => {
    setSimStep("request");
    setIsPlaying(true);
    setAutoPlay(true);
  }, []);

  const resetSim = useCallback(() => {
    setSimStep("idle");
    setIsPlaying(false);
    setAutoPlay(false);
  }, []);

  useEffect(() => {
    if (!autoPlay || !isPlaying) return;
    const order: SimStep[] = [
      "request",
      "response",
      "drift",
      "cloud",
      "patch",
      "done",
    ];
    const idx = order.indexOf(simStep);
    if (idx < order.length - 1) {
      const t = setTimeout(() => setSimStep(order[idx + 1]), 1100);
      return () => clearTimeout(t);
    }
    if (simStep === "done") {
      const t = setTimeout(() => {
        setIsPlaying(false);
        setAutoPlay(false);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [simStep, autoPlay, isPlaying]);

  const phaseIdx = PHASES.findIndex((p) => p.id === simStep);
  const activePhase = PHASES[phaseIdx] ?? null;

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-[#fafafa] overflow-x-hidden">
      {/* ───────── Skip to content (a11y) ───────── */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-purple-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>

      {/* ───────── Header / Navbar ───────── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#09090b]/70 border-b border-white/[0.06]">
        <nav
          aria-label="Primary navigation"
          className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between"
        >
          <a
            href="#"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-md"
            aria-label="Poly home"
          >
            <img
              src="/logo.svg"
              alt=""
              className="h-7 w-7 rounded-md"
              aria-hidden="true"
            />
            <span className="font-bold text-lg tracking-tight">Poly</span>
          </a>

          <div className="flex items-center gap-3">
            <code
              className="hidden sm:inline text-xs text-zinc-400 bg-white/[0.06] px-3 py-2 rounded-lg font-mono select-all"
              aria-label="Install command: npm i poly-sdk"
            >
              npm i poly-sdk
            </code>
            <Button
              size="sm"
              onClick={onEnterDashboard}
              aria-label="Open Poly Dashboard"
              className="bg-[#a78bfa] hover:bg-[#8b5cf6] text-[#09090b] font-semibold rounded-lg px-4 h-11 min-w-[44px]"
            >
              Dashboard
              <ChevronRight className="h-3.5 w-3.5 ml-1" aria-hidden="true" />
            </Button>
          </div>
        </nav>
      </header>

      {/* ───────── Main Content ───────── */}
      <main id="main-content" className="flex-1 pt-14 sm:pt-16">
        {/* ───────── Hero Section ───────── */}
        <section
          aria-label="Introduction"
          className="relative pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6"
        >
          {/* Glow orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-600/[0.07] blur-[120px]" />
            <div className="absolute -top-20 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.05] blur-[100px]" />
          </div>

          <div className="relative max-w-4xl mx-auto text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="flex flex-col items-center"
            >
              <motion.div variants={fadeUp} custom={0}>
                <Badge
                  variant="outline"
                  className="border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium mb-8 px-4 py-1.5 rounded-full"
                >
                  <Zap className="h-3 w-3 mr-1.5" aria-hidden="true" />
                  V1 — Now Live on npm
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
              >
                Third-party APIs break.
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Your code doesn&apos;t have to.
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
              >
                Poly detects schema drift, generates safe mappings with AI, and
                patches responses{" "}
                <em className="text-zinc-300 not-italic font-medium">
                  locally in-memory
                </em>{" "}
                — zero proxy, zero latency, zero downtime.
              </motion.p>

              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
              >
                <Button
                  size="lg"
                  onClick={onEnterDashboard}
                  aria-label="Open the Poly Dashboard"
                  className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500 text-white font-semibold text-base rounded-xl px-8 h-12 min-h-[44px] shadow-lg shadow-purple-500/20 transition-all hover:shadow-purple-500/30 hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
                >
                  Open Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
                <div
                  className="flex items-center gap-2 text-sm text-zinc-500"
                  aria-label="Your traffic never passes through Poly servers"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  Your traffic never touches our servers
                </div>
              </motion.div>
            </motion.div>

            {/* ───────── Stats Bar ───────── */}
            <div ref={statsRef} className="max-w-2xl mx-auto">
              <div className="grid grid-cols-3 gap-3 sm:gap-6 py-5 px-4 sm:px-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
                <StatItem value={25000} suffix="+" label="APIs monitored" inView={statsInView} />
                <StatItem value={99.7} suffix="%" label="Drift catch rate" inView={statsInView} />
                <StatItem value={5} suffix="ms" label="Latency overhead" inView={statsInView} />
              </div>
            </div>
          </div>
        </section>

        {/* ───────── Problem vs Solution ───────── */}
        <section
          aria-label="Problem and solution comparison"
          className="px-4 sm:px-6 pb-20 sm:pb-24"
        >
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Without Poly */}
              <ScrollReveal>
                <article
                  className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5 sm:p-8 h-full"
                  aria-label="Without Poly: what happens when APIs break"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <Bug className="h-4 w-4 text-red-400" />
                    </div>
                    <h2 className="font-bold text-red-400 text-lg">
                      Without Poly
                    </h2>
                  </div>
                  <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
                    <p>
                      Third-party API renames a field from{" "}
                      <code className="text-red-300 bg-red-500/10 px-1.5 py-0.5 rounded text-xs">
                        name
                      </code>{" "}
                      to{" "}
                      <code className="text-red-300 bg-red-500/10 px-1.5 py-0.5 rounded text-xs">
                        full_name
                      </code>
                      . Your app crashes in production at 3 AM.
                    </p>
                    <div className="bg-[#0c0c0e] rounded-xl p-4 border border-white/[0.06]">
                      <CodeBlock
                        label="crash.log"
                        lines={[
                          "// API response changed silently",
                          "const user = res.data",
                          "console.log(user.name)",
                          "// → undefined  💥 CRASH",
                        ]}
                      />
                    </div>
                    <ul
                      className="space-y-2 text-xs text-zinc-500"
                      aria-label="Consequences of API breakage"
                    >
                      <li className="flex items-center gap-2.5">
                        <span
                          className="text-red-400 font-bold"
                          aria-hidden="true"
                        >
                          ✗
                        </span>
                        Page breaks for all users
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span
                          className="text-red-400 font-bold"
                          aria-hidden="true"
                        >
                          ✗
                        </span>
                        Emergency deploys at midnight
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span
                          className="text-red-400 font-bold"
                          aria-hidden="true"
                        >
                          ✗
                        </span>
                        Angry customers, lost revenue
                      </li>
                    </ul>
                  </div>
                </article>
              </ScrollReveal>

              {/* With Poly */}
              <ScrollReveal delay={0.1}>
                <article
                  className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 sm:p-8 h-full"
                  aria-label="With Poly: automatic drift detection and patching"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"
                      aria-hidden="true"
                    >
                      <Wrench className="h-4 w-4 text-emerald-400" />
                    </div>
                    <h2 className="font-bold text-emerald-400 text-lg">
                      With Poly
                    </h2>
                  </div>
                  <div className="space-y-3 text-sm text-zinc-400 leading-relaxed">
                    <p>
                      Poly&apos;s SDK detects the drift, asks AI for a safe
                      mapping, and patches the response{" "}
                      <span className="text-emerald-300 font-medium">
                        before your code even sees it
                      </span>
                      .
                    </p>
                    <div className="bg-[#0c0c0e] rounded-xl p-4 border border-white/[0.06]">
                      <CodeBlock
                        label="output.log"
                        lines={[
                          "// Poly patches response in-memory",
                          "const user = res.data",
                          "console.log(user.name)",
                          '// → "John Doe"  ✓ WORKS',
                        ]}
                      />
                    </div>
                    <ul
                      className="space-y-2 text-xs text-zinc-500"
                      aria-label="Benefits of using Poly"
                    >
                      <li className="flex items-center gap-2.5">
                        <span
                          className="text-emerald-400 font-bold"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                        Zero downtime, instant fix
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span
                          className="text-emerald-400 font-bold"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                        No deploy needed
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span
                          className="text-emerald-400 font-bold"
                          aria-hidden="true"
                        >
                          ✓
                        </span>
                        Users never notice anything
                      </li>
                    </ul>
                  </div>
                </article>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ───────── Interactive Demo (MOVED UP) ───────── */}
        <section
          ref={simRef}
          aria-labelledby="demo-heading"
          className="px-4 sm:px-6 pb-20 sm:pb-24"
        >
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-10">
            {/* Mascot — left side on desktop, top on mobile */}
            <div className="hidden lg:flex shrink-0 pt-20">
              <PolyMascot currentStep={simStep} />
            </div>
            <div className="flex-1 min-w-0">
            <ScrollReveal className="text-center mb-8 sm:mb-10">
              <h2
                id="demo-heading"
                className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3"
              >
                See it in action
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base">
                Watch Poly detect a breaking change and fix it — step by
                step
              </p>
            </ScrollReveal>

            {/* Controls */}
            <div
              className="flex items-center justify-center gap-3 mb-6 sm:mb-8"
              role="toolbar"
              aria-label="Demo controls"
            >
              <Button
                onClick={startSim}
                disabled={isPlaying}
                size="lg"
                aria-label={isPlaying ? "Simulation is running" : "Run the drift detection demo"}
                className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500 text-white rounded-xl h-11 min-h-[44px] px-6 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
              >
                <Play className="h-4 w-4 mr-2" aria-hidden="true" />
                {isPlaying ? "Running..." : "Run Demo"}
              </Button>
              <AnimatePresence>
                {simStep !== "idle" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      onClick={resetSim}
                      variant="outline"
                      size="lg"
                      aria-label="Reset simulation"
                      className="rounded-xl h-11 min-h-[44px] px-6 border-white/[0.1] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] focus-visible:ring-2 focus-visible:ring-purple-400"
                    >
                      <RotateCcw
                        className="h-4 w-4 mr-2"
                        aria-hidden="true"
                      />
                      Reset
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Demo Panel */}
            <div
              className="rounded-2xl border border-white/[0.08] bg-[#0c0c0e] overflow-hidden"
              role="region"
              aria-label="Drift detection simulation"
              aria-live="polite"
            >
              {/* Flow progress bar */}
              <div
                className="flex items-center border-b border-white/[0.06] px-3 sm:px-4 py-3 gap-1 overflow-x-auto"
                aria-label="Simulation progress"
                role="tablist"
              >
                {PHASES.filter((p) => p.id !== "done").map((phase, i) => {
                  const pIdx = PHASES.findIndex((p) => p.id === simStep);
                  const isActive = phase.id === simStep;
                  const isDone = i < pIdx;
                  return (
                    <div
                      key={phase.id}
                      className="flex items-center gap-1 shrink-0"
                    >
                      <div
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`${phase.title} - ${isDone ? "completed" : isActive ? "in progress" : "pending"}`}
                        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all duration-500 ${
                          isActive
                            ? phase.id === "drift"
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                            : isDone
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "text-zinc-600"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2
                            className="h-3 w-3"
                            aria-hidden="true"
                          />
                        ) : (
                          <span
                            className={`h-2 w-2 rounded-full ${
                              isActive
                                ? phase.id === "drift"
                                  ? "bg-red-400 animate-pulse"
                                  : "bg-purple-400 animate-pulse"
                                : "bg-zinc-700"
                            }`}
                            aria-hidden="true"
                          />
                        )}
                        <span className="hidden sm:inline">
                          {phase.title}
                        </span>
                        <span className="sm:hidden">
                          {phase.title.split(" ")[0]}
                        </span>
                      </div>
                      {i < 4 && (
                        <ChevronRight
                          className="h-3 w-3 text-zinc-700 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Content area */}
              <div className="p-5 sm:p-8 min-h-[280px] flex flex-col items-center justify-center">
                {simStep === "idle" ? (
                  <div className="text-center space-y-3 py-4">
                    <div
                      className="h-16 w-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4"
                      aria-hidden="true"
                    >
                      <Play className="h-7 w-7 text-purple-400" />
                    </div>
                    <p className="text-zinc-400 text-sm px-4">
                      Click{" "}
                      <strong className="text-zinc-200">
                        &quot;Run Demo&quot;
                      </strong>{" "}
                      to see Poly detect and fix a real API breaking change
                    </p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={simStep}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="w-full max-w-2xl space-y-5"
                    >
                      {/* Phase title + icon */}
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div
                          className={`h-10 w-10 rounded-xl shrink-0 flex items-center justify-center ${
                            simStep === "drift"
                              ? "bg-red-500/15"
                              : simStep === "done"
                              ? "bg-emerald-500/15"
                              : "bg-purple-500/15"
                          }`}
                          aria-hidden="true"
                        >
                          {simStep === "drift" ? (
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                          ) : simStep === "done" ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          ) : (
                            <Terminal className="h-5 w-5 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <h3
                            className={`text-base sm:text-lg font-bold ${
                              simStep === "drift"
                                ? "text-red-400"
                                : simStep === "done"
                                ? "text-emerald-400"
                                : "text-white"
                            }`}
                          >
                            {activePhase?.title}
                          </h3>
                          <p className="text-sm text-zinc-400 mt-0.5">
                            {activePhase?.sub}
                          </p>
                        </div>
                      </div>

                      {/* Code block */}
                      {activePhase?.code && (
                        <CodeBlock
                          label={activePhase.code.label}
                          lines={activePhase.code.lines}
                        />
                      )}

                      {/* Done success banner */}
                      {simStep === "done" && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="flex items-center gap-3 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl px-4 sm:px-5 py-4"
                          role="status"
                        >
                          <CheckCircle2
                            className="h-5 w-5 text-emerald-400 shrink-0"
                            aria-hidden="true"
                          />
                          <div>
                            <p className="text-sm font-semibold text-emerald-300">
                              Patch applied successfully
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              The patch is now cached. Future responses with
                              this schema are patched instantly — no AI
                              call needed.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
            </div>{/* close mascot flex wrapper */}
            {/* Mobile mascot (below demo) */}
            <div className="flex lg:hidden justify-center mt-8">
              <PolyMascot currentStep={simStep} />
            </div>
            </div>
          </div>
        </section>

        {/* ───────── Architecture + How It Works ───────── */}
        <section
          aria-labelledby="how-it-works-heading"
          className="px-4 sm:px-6 pb-20 sm:pb-24"
        >
          <div className="max-w-5xl mx-auto">
            <ScrollReveal className="text-center mb-10 sm:mb-14">
              <h2
                id="how-it-works-heading"
                className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3"
              >
                How Poly sits in your stack
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
                Poly runs entirely in your process. Only schema metadata (not
                your data) reaches Poly Cloud for AI analysis.
              </p>
            </ScrollReveal>

            {/* Architecture Diagram */}
            <ScrollReveal delay={0.1} className="mb-12 sm:mb-16">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-10">
                <ArchitectureDiagram />
              </div>
            </ScrollReveal>

            {/* 3 Steps */}
            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              {(
                [
                  {
                    num: "01",
                    icon: <Eye className="h-5 w-5" />,
                    title: "Detect",
                    color: "text-amber-400",
                    bg: "bg-amber-500/10",
                    border: "border-amber-500/20",
                    desc: "SDK intercepts every API response and compares it against the learned schema baseline. Detects 7 types of drift — field renames, type changes, removals, and more.",
                  },
                  {
                    num: "02",
                    icon: <Cpu className="h-5 w-5" />,
                    title: "Analyze",
                    color: "text-purple-400",
                    bg: "bg-purple-500/10",
                    border: "border-purple-500/20",
                    desc: "Only schema metadata is sent to Poly Cloud. AI generates a safe mapping with a confidence score. Protected fields like prices and auth tokens are never touched.",
                  },
                  {
                    num: "03",
                    icon: <GitBranch className="h-5 w-5" />,
                    title: "Patch",
                    color: "text-cyan-400",
                    bg: "bg-cyan-500/10",
                    border: "border-cyan-500/20",
                    desc: "The response is transformed locally in-memory before your application code sees it. The patch is cached — no repeated AI calls. Your code keeps working.",
                  },
                ] as const
              ).map((step, idx) => (
                <ScrollReveal key={step.num} delay={idx * 0.1}>
                  <div
                    className={`relative rounded-2xl border ${step.border} bg-white/[0.02] p-5 sm:p-8 transition-all hover:bg-white/[0.04] focus-within:ring-2 focus-within:ring-purple-400/50 h-full`}
                    tabIndex={0}
                    role="article"
                    aria-label={`Step ${step.num}: ${step.title}`}
                  >
                    <span
                      className="text-5xl font-black text-white/[0.04] absolute top-4 right-6"
                      aria-hidden="true"
                    >
                      {step.num}
                    </span>
                    <div
                      className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl ${step.bg} flex items-center justify-center ${step.color} mb-4 sm:mb-5`}
                      aria-hidden="true"
                    >
                      {step.icon}
                    </div>
                    <h3
                      className={`text-base sm:text-lg font-bold ${step.color} mb-2`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── Quick Install ───────── */}
        <section
          aria-label="Installation guide"
          className="px-4 sm:px-6 pb-20 sm:pb-24"
        >
          <ScrollReveal className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-3">
              Setup in 30 seconds
            </h2>
            <p className="text-zinc-400 text-sm mb-6 sm:mb-8">
              Wrap your existing HTTP client. That&apos;s the only change you
              need.
            </p>
            <CodeBlock
              label="app.ts"
              lines={[
                'import { Poly } from "pritpolytt-sdk"',
                'import axios from "axios"',
                "",
                "// Initialize with your API key",
                'Poly.init({ apiKey: "poly_live_xxx" })',
                "",
                "// Wrap your HTTP client — that's it!",
                "Poly.wrap(axios)",
              ]}
            />
          </ScrollReveal>
        </section>

        {/* ───────── Features Grid (Bento Layout) ───────── */}
        <section
          aria-labelledby="features-heading"
          className="px-4 sm:px-6 pb-20 sm:pb-24"
        >
          <div className="max-w-5xl mx-auto">
            <ScrollReveal className="text-center mb-10 sm:mb-14">
              <h2
                id="features-heading"
                className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3"
              >
                Built for production
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
                Every design decision prioritizes reliability, security, and
                developer experience.
              </p>
            </ScrollReveal>

            {/* Bento Grid — alternating layouts */}
            <div className="space-y-4">
              {/* Row 1: 2 large cards */}
              <div className="grid md:grid-cols-2 gap-4">
                <ScrollReveal>
                  <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 transition-all hover:bg-white/[0.04] hover:border-white/[0.12] h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shrink-0">
                        <Eye className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">7 Drift Types</h3>
                        <span className="text-[10px] text-zinc-600">Auto-detected</span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed flex-1">
                      Field renames, type changes, removals, additions, nested
                      shifts, enum changes, and structure reordering — Poly
                      catches them all before they crash your app.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {["rename", "type", "remove", "nested", "enum", "order", "add"].map((t) => (
                        <span key={t} className="text-[9px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400/80 font-mono">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.05}>
                  <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 transition-all hover:bg-white/[0.04] hover:border-white/[0.12] h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform shrink-0">
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">Protected Fields</h3>
                        <span className="text-[10px] text-zinc-600">Zero data leaks</span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed flex-1">
                      Mark prices, payments, auth tokens, or any field as
                      protected. Poly will never include them in AI analysis —
                      guaranteed.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-[10px] text-red-400/70 font-mono bg-red-500/[0.06] rounded-lg px-3 py-2 border border-red-500/10">
                      <Lock className="h-3 w-3 shrink-0" />
                      protected_fields: [&quot;price&quot;, &quot;token&quot;, &quot;ssn&quot;]
                    </div>
                  </div>
                </ScrollReveal>
              </div>

              {/* Row 2: 1 wide + 2 small */}
              <div className="grid md:grid-cols-3 gap-4">
                <ScrollReveal delay={0.1}>
                  <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:bg-white/[0.04] hover:border-white/[0.12] h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                        <Lock className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">Zero Proxy</h3>
                        <span className="text-[10px] text-zinc-600">Locally runs</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Your traffic never routes through Poly servers. The SDK
                      runs entirely in your process — intercepting and patching
                      locally.
                    </p>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.15}>
                  <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:bg-white/[0.04] hover:border-white/[0.12] h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform shrink-0">
                        <Database className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">Patch Cache</h3>
                        <span className="text-[10px] text-zinc-600">Instant reuse</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Identical drift patterns are fixed instantly from local
                      cache — no repeated AI calls needed.
                    </p>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.2}>
                  <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:bg-white/[0.04] hover:border-white/[0.12] h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shrink-0">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">Confidence Scores</h3>
                        <span className="text-[10px] text-zinc-600">AI-powered</span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Every patch scored 0–100%. Set thresholds to auto-apply
                      high-confidence patches, review the rest.
                    </p>
                  </div>
                </ScrollReveal>
              </div>

              {/* Row 3: 1 large card centered */}
              <ScrollReveal delay={0.25}>
                <div className="max-w-2xl mx-auto">
                  <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8 transition-all hover:bg-white/[0.04] hover:border-white/[0.12]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform shrink-0">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">Rule Engine</h3>
                        <span className="text-[10px] text-zinc-600">Full control</span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      Override AI with custom rules. Force specific field
                      mappings, block changes on critical endpoints, or
                      whitelist trusted APIs — you&apos;re in control.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ───────── Trust / Security Section ───────── */}
        <section
          aria-labelledby="trust-heading"
          className="px-4 sm:px-6 pb-20 sm:pb-24"
        >
          <div className="max-w-5xl mx-auto">
            <ScrollReveal className="text-center mb-10 sm:mb-14">
              <h2
                id="trust-heading"
                className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3"
              >
                Your data stays yours
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto">
                Poly was designed with privacy as a first principle. Here&apos;s exactly what happens.
              </p>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-6">
              <ScrollReveal>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] p-6 sm:p-8 h-full">
                  <h3 className="text-sm font-bold text-emerald-400 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Stays in your process
                  </h3>
                  <ul className="space-y-3 text-xs sm:text-sm text-zinc-400">
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                      <span>Full API response payloads — <strong className="text-zinc-300">never leave your machine</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                      <span>User data, PII, business logic — <strong className="text-zinc-300">stays local</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                      <span>Auth tokens, API keys, secrets — <strong className="text-zinc-300">never transmitted</strong></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                      <span>Patches apply in-memory — <strong className="text-zinc-300">zero latency</strong></span>
                    </li>
                  </ul>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={0.1}>
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.02] p-6 sm:p-8 h-full">
                  <h3 className="text-sm font-bold text-purple-400 mb-4 flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    Sent to Poly Cloud (only)
                  </h3>
                  <ul className="space-y-3 text-xs sm:text-sm text-zinc-400">
                    <li className="flex items-start gap-2.5">
                      <span className="text-purple-400 mt-0.5 shrink-0">→</span>
                      <span>Field names and types — <code className="text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded text-xs">full_name → name</code></span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-purple-400 mt-0.5 shrink-0">→</span>
                      <span>Schema structure — nesting, arrays, enums</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-purple-400 mt-0.5 shrink-0">→</span>
                      <span>Drift type classification — rename, remove, etc.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-purple-400 mt-0.5 shrink-0">→</span>
                      <span><strong className="text-zinc-300">No values, no payloads</strong> — just shapes</span>
                    </li>
                  </ul>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ───────── Pricing / Beta Callout ───────── */}
        <section
          aria-label="Pricing"
          className="px-4 sm:px-6 pb-20 sm:pb-24"
        >
          <ScrollReveal className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/[0.04] to-transparent p-8 sm:p-10 text-center">
              <Badge
                variant="outline"
                className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-medium mb-5 px-4 py-1.5 rounded-full"
              >
                <Sparkles className="h-3 w-3 mr-1.5" aria-hidden="true" />
                Free during beta
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                $0<span className="text-zinc-500 text-lg font-normal">/month</span>
              </h2>
              <p className="text-zinc-400 text-sm mb-6">
                No credit card. No limits. We&apos;re building in public and want your feedback.
              </p>
              <div className="inline-flex flex-col sm:flex-row items-center gap-3 text-xs text-zinc-500 mb-6">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Unlimited API calls
                </span>
                <span className="hidden sm:inline text-zinc-700">·</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Unlimited endpoints
                </span>
                <span className="hidden sm:inline text-zinc-700">·</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Priority support
                </span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button
                  size="lg"
                  onClick={onEnterDashboard}
                  className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500 text-white font-semibold rounded-xl px-8 h-12 min-h-[44px]"
                >
                  Get started free
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ───────── Final CTA ───────── */}
        <section aria-label="Get started" className="px-4 sm:px-6 pb-20 sm:pb-24">
          <ScrollReveal className="max-w-3xl mx-auto text-center">
            <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-b from-purple-500/[0.06] to-transparent p-8 sm:p-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Stop fearing API changes.
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base mb-8 max-w-lg mx-auto">
                Install Poly, wrap your HTTP client, and never deal with a
                breaking API change again.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  onClick={onEnterDashboard}
                  aria-label="Open the Poly Dashboard"
                  className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-400 hover:to-violet-500 text-white font-semibold text-base rounded-xl px-8 h-12 min-h-[44px] shadow-lg shadow-purple-500/20 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
                >
                  Open Dashboard
                  <ArrowRight
                    className="h-4 w-4 ml-2"
                    aria-hidden="true"
                  />
                </Button>
                <code className="text-xs text-zinc-500 bg-white/[0.05] px-4 py-2.5 rounded-lg font-mono border border-white/[0.08] select-all">
                  npm i poly-sdk
                </code>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      {/* ───────── Footer (Enhanced) ───────── */}
      <footer className="mt-auto border-t border-white/[0.06] pt-10 sm:pt-14 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Product
              </h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Dashboard</a></li>
                <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">SDK Docs</a></li>
                <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">API Reference</a></li>
                <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Changelog</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Resources
              </h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Documentation</a></li>
                <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Quick Start</a></li>
                <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Examples</a></li>
                <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Company
              </h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">About</a></li>
                <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Terms of Service</a></li>
                <li><a href="mailto:hello@poly.dev" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Community
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1.5">
                    <MessageCircle className="h-3.5 w-3.5" />
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Twitter / X
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/[0.04]">
            <div className="flex items-center gap-2">
              <img
                src="/logo.svg"
                alt=""
                className="h-5 w-5 rounded"
                aria-hidden="true"
              />
              <span className="text-sm text-zinc-500">
                Poly — Survive Third-Party API Changes
              </span>
            </div>
            <p className="text-xs text-zinc-600">
              © {new Date().getFullYear()} Poly · MIT License · v1.0.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
