"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Eye,
  GitBranch,
  Cpu,
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
  Layers,
  Activity,
  BarChart3,
  Zap,
  Database,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PolyMascot } from "@/components/dashboard/poly-mascot";

/* ──────────────── Animation Helpers ──────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: "easeOut" },
  }),
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

function ScrollReveal({ children, className = "", delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      className={className}
    >{children}</motion.div>
  );
}

/* ──────────────── CountUp ──────────────── */
function useCountUp(end: number, dur = 2000, start = false) {
  const [c, setC] = useState(0);
  useEffect(() => {
    if (!start) return;
    let st: number, raf: number;
    const anim = (ts: number) => {
      if (!st) st = ts;
      setC(Math.min(Math.floor(((ts - st) / dur) * end), end));
      if (ts - st < dur) raf = requestAnimationFrame(anim);
    };
    raf = requestAnimationFrame(anim);
    return () => cancelAnimationFrame(raf);
  }, [end, dur, start]);
  return c;
}

function StatItem({ value, label, suffix = "", inView }: {
  value: number; label: string; suffix?: string; inView: boolean;
}) {
  const count = useCountUp(value, 2000, inView);
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

/* ──────────────── Simulation ──────────────── */
type SimStep = "idle" | "request" | "response" | "drift" | "cloud" | "patch" | "done";

interface SimPhase {
  id: SimStep; title: string; sub: string; icon: React.ReactNode;
  code?: { label: string; lines: string[] };
}

const PHASES: SimPhase[] = [
  {
    id: "request", title: "Your app calls an API",
    sub: "Normal request — nothing special yet",
    icon: <Activity className="h-5 w-5" />,
    code: { label: "your-app.ts", lines: [
      'const res = await axios.get("/api/users/42")',
      "const name = res.data.name",
    ]},
  },
  {
    id: "response", title: "SDK intercepts the response",
    sub: "Poly wraps your HTTP client silently",
    icon: <Shield className="h-5 w-5" />,
    code: { label: "poly-sdk (interceptor)", lines: [
      "// Response received from upstream",
      '{ "full_name": "John Doe", "email": "..." }',
    ]},
  },
  {
    id: "drift", title: "Schema drift detected",
    sub: `"name" field is now "full_name" — your code would break`,
    icon: <AlertTriangle className="h-5 w-5" />,
    code: { label: "drift-detection", lines: [
      "EXPECTED: { name: string }",
      "GOT:      { full_name: string }",
      "DRIFT:    field-renamed  [HIGH]",
    ]},
  },
  {
    id: "cloud", title: "AI analyzes the change",
    sub: "Only schema metadata sent — your data stays local",
    icon: <Cpu className="h-5 w-5" />,
    code: { label: "poly-cloud (ai-engine)", lines: [
      "Analyzing: field-renamed",
      "Confidence: 0.97",
      "Mapping: full_name → name  ✓",
    ]},
  },
  {
    id: "patch", title: "Patch applied in-memory",
    sub: "Response is transformed before your code sees it",
    icon: <Wrench className="h-5 w-5" />,
    code: { label: "result", lines: [
      "// Your code sees the ORIGINAL shape:",
      "console.log(res.data.name)",
      '// → "John Doe"  ✓  (auto-patched!)',
    ]},
  },
  {
    id: "done", title: "Zero downtime. No deploy needed.",
    sub: "Your code keeps working while you fix it properly",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
];

/* ──────────────── Code Block ──────────────── */
function CodeBlock({ label, lines }: { label: string; lines: string[] }) {
  return (
    <div className="rounded-xl bg-transparent p-0 border border-gray-800 overflow-hidden shadow-lg">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800">
        <div className="flex gap-1.5" aria-hidden="true">
          <Circle className="h-2.5 w-2.5 fill-red-500 text-red-500" />
          <Circle className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
          <Circle className="h-2.5 w-2.5 fill-emerald-500 text-emerald-500" />
        </div>
        <span className="text-[10px] text-muted-foreground font-mono ml-2">{label}</span>
      </div>
      <pre className="p-4 text-xs sm:text-sm font-mono leading-relaxed">
        {lines.map((line, i) => {
          let cls = "text-gray-300";
          if (line.includes("undefined") || line.includes("DRIFT") || line.includes("CRASH")) cls = "text-rose-400";
          else if (line.includes("✓") || line.includes("John Doe") || line.includes("WORKS")) cls = "text-emerald-400";
          else if (line.includes("EXPECTED") || line.includes("GOT") || line.includes("Analyzing") || line.includes("Confidence") || line.includes("Mapping")) cls = "text-sky-300";
          else if (line.startsWith("//")) cls = "text-muted-foreground italic";
          return (
            <div key={i} className="flex">
              <span className="text-gray-700 w-8 shrink-0 select-none text-right mr-4">{i + 1}</span>
              <span className={cls}>{line}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}

/* ──────────────── Architecture Flow ──────────────── */
function ArchitectureFlow() {
  const boxes = [
    { label: "Your App", icon: <Layers className="h-4 w-4" />, color: "border-teal-200 bg-teal-50 text-teal-700" },
    { label: "Poly SDK", icon: <Shield className="h-4 w-4" />, color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    { label: "Intercept", icon: <Activity className="h-4 w-4" />, color: "border-amber-200 bg-amber-50 text-amber-700" },
    { label: "Detect Drift", icon: <Eye className="h-4 w-4" />, color: "border-rose-200 bg-rose-50 text-rose-700" },
    { label: "AI Cloud", icon: <Cpu className="h-4 w-4" />, color: "border-violet-200 bg-violet-50 text-violet-700" },
    { label: "Patch", icon: <Wrench className="h-4 w-4" />, color: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    { label: "Your Code", icon: <CheckCircle2 className="h-4 w-4" />, color: "border-teal-200 bg-teal-100 text-teal-700" },
  ];
  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {boxes.map((box, i) => (
          <div key={box.label} className="flex items-center gap-2 sm:gap-3">
            <div className={`flex items-center gap-2 rounded-xl border ${box.color} px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold shadow-sm`}>
              {box.icon} <span>{box.label}</span>
            </div>
            {i < boxes.length - 1 && <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-3">
        <div className="h-px flex-1 max-w-[200px] bg-gradient-to-r from-transparent via-amber-300 to-amber-400" />
        <span className="text-[10px] text-amber-600 font-mono whitespace-nowrap">only schema metadata</span>
        <div className="h-px flex-1 max-w-[200px] bg-gradient-to-l from-transparent via-amber-300 to-amber-400" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════ */
export function LandingPage({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  const [simStep, setSimStep] = useState<SimStep>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const simRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-60px" });

  const startSim = useCallback(() => { setSimStep("request"); setIsPlaying(true); setAutoPlay(true); }, []);
  const resetSim = useCallback(() => { setSimStep("idle"); setIsPlaying(false); setAutoPlay(false); }, []);

  useEffect(() => {
    if (!autoPlay || !isPlaying) return;
    const order: SimStep[] = ["request","response","drift","cloud","patch","done"];
    const idx = order.indexOf(simStep);
    if (idx < order.length - 1) {
      const t = setTimeout(() => setSimStep(order[idx + 1]), 2000);
      return () => clearTimeout(t);
    }
    if (simStep === "done") {
      const t = setTimeout(() => { setIsPlaying(false); setAutoPlay(false); }, 1500);
      return () => clearTimeout(t);
    }
  }, [simStep, autoPlay, isPlaying]);

  const phaseIdx = PHASES.findIndex(p => p.id === simStep);
  const activePhase = PHASES[phaseIdx] ?? null;
  const isDrift = simStep === "drift";
  const isDone = simStep === "done";

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 overflow-x-hidden">

      {/* ───── Navbar ───── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-border">
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 rounded-md" aria-label="Poly home">
            <div className="h-8 w-8 rounded-lg bg-transparent p-0 flex items-center justify-center text-primary-foreground font-bold text-sm">P</div>
            <span className="font-bold text-lg tracking-tight text-gray-900">Poly</span>
          </a>
          <div className="flex items-center gap-3">
            <code className="hidden sm:inline text-xs text-muted-foreground bg-muted px-3 py-2 rounded-lg font-mono border border-border select-all">
              npm i github:Pritahi/poly-sdk
            </code>
            <Button size="sm" onClick={onEnterDashboard}
              className="bg-transparent p-0 hover:bg-transparent p-0/90 text-primary-foreground font-semibold rounded-xl px-4 h-10">
              Dashboard <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </nav>
      </header>

      <main id="main-content" className="flex-1 pt-14 sm:pt-16">

        {/* ═══════════ HERO ═══════════ */}
        <section className="relative pt-24 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden">
          {/* Subtle bg decoration */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-teal-100/60 blur-[120px]" />
            <div className="absolute -top-16 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-100/40 blur-[100px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[250px] h-[250px] rounded-full bg-emerald-100/50 blur-[70px]" />
          </div>
          <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />

          <div className="relative max-w-4xl mx-auto text-center">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="flex flex-col items-center">

              <motion.div variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 bg-teal-50 border border-teal-200 px-4 py-1.5 rounded-full mb-8">
                  <Zap className="h-3 w-3" /> V1 — Now Live
                </span>
              </motion.div>

              <motion.h1 variants={fadeUp} custom={1}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.06] mb-6 text-gray-900">
                APIs break.
                <br />
                <span className="bg-gradient-to-r from-[#6b8cce] via-[#8b9ef0] to-[#7bade0] bg-clip-text text-transparent">
                  Your code doesn&apos;t have to.
                </span>
              </motion.h1>

              <motion.p variants={fadeUp} custom={2}
                className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                Poly detects schema drift, generates safe mappings with AI, and patches
                responses <strong className="text-gray-700 font-semibold">locally in-memory</strong>
                {" "}— zero proxy, zero latency, zero downtime.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
                <Button size="lg" onClick={onEnterDashboard}
                  className="bg-transparent p-0 hover:bg-transparent p-0/90 text-primary-foreground font-semibold text-base rounded-xl px-8 h-12 shadow-lg shadow-gray-200 hover:shadow-gray-300 transition-all hover:scale-[1.02]">
                  Open Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" /> Your traffic never touches our servers
                </div>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <div ref={statsRef} className="max-w-2xl mx-auto">
              <div className="grid grid-cols-3 gap-3 sm:gap-6 py-5 px-4 sm:px-8 rounded-2xl border border-border bg-muted/80">
                <StatItem value={25000} suffix="+" label="APIs monitored" inView={statsInView} />
                <StatItem value={99} suffix=".7%" label="Drift catch rate" inView={statsInView} />
                <StatItem value={5} suffix="ms" label="Latency overhead" inView={statsInView} />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ PROBLEM vs SOLUTION ═══════════ */}
        <section className="px-4 sm:px-6 pb-20 sm:pb-28">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              <ScrollReveal>
                <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 sm:p-8 h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center"><Bug className="h-4 w-4 text-rose-600" /></div>
                    <h2 className="font-bold text-rose-600 text-lg">Without Poly</h2>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <p>Third-party API renames <code className="text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded text-xs font-mono">name</code>{" "}
                      to <code className="text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded text-xs font-mono">full_name</code>.
                      Your app crashes in production at 3 AM.</p>
                    <div className="rounded-xl"><CodeBlock label="crash.log" lines={[
                      "// API response changed silently",
                      "const user = res.data",
                      "console.log(user.name)",
                      "// → undefined  💥 CRASH",
                    ]} /></div>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      <li className="flex items-center gap-2"><span className="text-rose-500 font-bold">✗</span> Page breaks for all users</li>
                      <li className="flex items-center gap-2"><span className="text-rose-500 font-bold">✗</span> Emergency deploys at midnight</li>
                      <li className="flex items-center gap-2"><span className="text-rose-500 font-bold">✗</span> Angry customers, lost revenue</li>
                    </ul>
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 sm:p-8 h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Wrench className="h-4 w-4 text-emerald-600" /></div>
                    <h2 className="font-bold text-emerald-600 text-lg">With Poly</h2>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <p>Poly&apos;s SDK detects the drift, asks AI for a safe mapping, and patches the
                      response <span className="text-emerald-600 font-semibold">before your code even sees it</span>.</p>
                    <div className="rounded-xl"><CodeBlock label="output.log" lines={[
                      "// Poly patches response in-memory",
                      "const user = res.data",
                      "console.log(user.name)",
                      '// → "John Doe"  ✓ WORKS',
                    ]} /></div>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Zero downtime, instant fix</li>
                      <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> No deploy needed</li>
                      <li className="flex items-center gap-2"><span className="text-emerald-500 font-bold">✓</span> Users never notice anything</li>
                    </ul>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ═══════════ INTERACTIVE DEMO ═══════════ */}
        <section ref={simRef} className="px-4 sm:px-6 pb-20 sm:pb-28">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 text-gray-900">
                See it in action
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
                Watch Poly detect a breaking API change and fix it — step by step, live in your browser.
              </p>
            </ScrollReveal>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
              <Button onClick={startSim} disabled={isPlaying} size="lg"
                className="bg-transparent p-0 hover:bg-transparent p-0/90 text-primary-foreground rounded-xl h-11 px-6 shadow-lg shadow-gray-200 disabled:opacity-50">
                <Play className="h-4 w-4 mr-2" /> {isPlaying ? "Running..." : "Run Demo"}
              </Button>
              <AnimatePresence>
                {simStep !== "idle" && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                    <Button onClick={resetSim} variant="outline" size="lg"
                      className="rounded-xl h-11 px-6 border-border text-muted-foreground hover:text-gray-700 hover:bg-muted">
                      <RotateCcw className="h-4 w-4 mr-2" /> Reset
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Demo Panel */}
            <div className="rounded-2xl border border-border bg-white shadow-xl shadow-gray-100 overflow-hidden">
              {/* Progress bar */}
              <div className="flex items-center border-b border-border px-3 sm:px-5 py-3 gap-1 overflow-x-auto bg-muted/50">
                {PHASES.filter(p => p.id !== "done").map((phase, i) => {
                  const pIdx = PHASES.findIndex(p => p.id === simStep);
                  const isActive = phase.id === simStep;
                  const isPast = i < pIdx;
                  return (
                    <div key={phase.id} className="flex items-center gap-1 shrink-0">
                      <div className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-500 ${
                        isActive ? (phase.id === "drift" ? "bg-rose-100 text-rose-700 border border-rose-200" : "bg-teal-100 text-teal-700 border border-teal-200")
                        : isPast ? "bg-emerald-50 text-emerald-600"
                        : "text-muted-foreground"
                      }`}>
                        {isPast ? <CheckCircle2 className="h-3 w-3" /> : <span className={`h-2 w-2 rounded-full ${isActive ? (phase.id==="drift"?"bg-rose-500 animate-pulse":"bg-teal-500 animate-pulse") : "bg-gray-300"}`} />}
                        <span className="hidden sm:inline">{phase.title.split(" ")[0]}</span>
                        <span className="sm:hidden">{phase.title.charAt(0)}</span>
                      </div>
                      {i < 4 && <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Content */}
              <div className="p-6 sm:p-10 min-h-[380px] flex flex-col items-center justify-center bg-muted/30">
                {simStep === "idle" ? (
                  <div className="text-center space-y-4 py-4">
                    <div className="h-16 w-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-2">
                      <Play className="h-7 w-7 text-teal-600" />
                    </div>
                    <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                      Click <strong className="text-gray-800">"Run Demo"</strong> to see Poly detect and fix a real API breaking change — all before your code notices.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div key={simStep}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="w-full max-w-2xl space-y-5"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className={`h-10 w-10 rounded-xl shrink-0 flex items-center justify-center ${
                          isDrift ? "bg-rose-100 text-rose-600" : isDone ? "bg-emerald-100 text-emerald-600" : "bg-teal-100 text-teal-600"
                        }`}>
                          {activePhase?.icon}
                        </div>
                        <div>
                          <h3 className={`text-base sm:text-lg font-bold ${isDrift ? "text-rose-600" : isDone ? "text-emerald-600" : "text-gray-900"}`}>
                            {activePhase?.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{activePhase?.sub}</p>
                        </div>
                      </div>
                      {<div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
                      {activePhase?.code && <div className="flex-1 w-full"><CodeBlock label={activePhase.code.label} lines={activePhase.code.lines} /></div>}
                      <div className="shrink-0">
                        <PolyMascot currentStep={simStep} />
                      </div>
                    </div>}
                      {isDone && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                          className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-emerald-700">Patch applied successfully</p>
                            <p className="text-xs text-emerald-600/80 mt-0.5">The patch is now cached. Future responses with this schema are patched instantly — no AI call needed.</p>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ HOW IT WORKS ═══════════ */}
        <section className="px-4 sm:px-6 pb-20 sm:pb-28">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 text-gray-900">
                How Poly sits in your stack
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
                Poly runs entirely in your process. Only schema metadata reaches Poly Cloud for AI analysis — never your data.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.1} className="mb-12 sm:mb-16">
              <div className="rounded-2xl border border-border bg-muted/50 p-6 sm:p-10">
                <ArchitectureFlow />
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
              {[
                { num: "01", icon: <Eye className="h-5 w-5" />, title: "Detect", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200",
                  desc: "SDK intercepts every API response and compares it against the learned schema baseline. Detects 7 types of drift." },
                { num: "02", icon: <Cpu className="h-5 w-5" />, title: "Analyze", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200",
                  desc: "Only schema metadata goes to Poly Cloud. AI generates a safe mapping. Protected fields like prices and tokens are never touched." },
                { num: "03", icon: <GitBranch className="h-5 w-5" />, title: "Patch", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200",
                  desc: "Response is transformed locally in-memory before your code sees it. Patch is cached — no repeated AI calls." },
              ].map((step, idx) => (
                <ScrollReveal key={step.num} delay={idx * 0.1}>
                  <div className={`relative rounded-2xl border ${step.border} bg-white p-5 sm:p-8 shadow-sm hover:shadow-md transition-all h-full`}>
                    <span className="text-5xl font-black text-gray-50 absolute top-4 right-6 select-none">{step.num}</span>
                    <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl ${step.bg} flex items-center justify-center ${step.color} mb-4 sm:mb-5`}>
                      {step.icon}
                    </div>
                    <h3 className={`text-base sm:text-lg font-bold ${step.color} mb-2`}>{step.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ QUICK INSTALL ═══════════ */}
        <section className="px-4 sm:px-6 pb-20 sm:pb-28">
          <ScrollReveal className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-3 text-gray-900">
              Setup in 30 seconds
            </h2>
            <p className="text-muted-foreground text-sm mb-6 sm:mb-8">
              Wrap your existing HTTP client. That&apos;s the only change you need.
            </p>
            <CodeBlock label="app.ts" lines={[
              'import { Poly } from "pritpolytt-sdk"',
              'import axios from "axios"',
              "",
              "// Initialize with your API key",
              'Poly.init({ apiKey: "poly_live_xxx" })',
              "",
              "// Wrap your HTTP client — that's it!",
              "Poly.wrap(axios)",
            ]} />
          </ScrollReveal>
        </section>

        {/* ═══════════ FEATURES BENTO ═══════════ */}
        <section className="px-4 sm:px-6 pb-20 sm:pb-28">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 text-gray-900">Built for production</h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">Every design decision prioritizes reliability, security, and developer experience.</p>
            </ScrollReveal>

            <div className="space-y-4">
              {/* Row 1 */}
              <div className="grid md:grid-cols-2 gap-4">
                <ScrollReveal>
                  <div className="group rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm hover:shadow-md hover:border-border transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform"><Eye className="h-5 w-5" /></div>
                      <div><h3 className="text-sm font-bold text-gray-900">7 Drift Types</h3><span className="text-[10px] text-muted-foreground">Auto-detected</span></div>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                      Field renames, type changes, removals, additions, nested shifts, enum changes, and structure reordering — caught before they crash your app.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {["rename","type","remove","nested","enum","order","add"].map(t => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 font-mono font-medium">{t}</span>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
                <ScrollReveal delay={0.05}>
                  <div className="group rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm hover:shadow-md hover:border-border transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform"><Shield className="h-5 w-5" /></div>
                      <div><h3 className="text-sm font-bold text-gray-900">Protected Fields</h3><span className="text-[10px] text-muted-foreground">Zero data leaks</span></div>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-4">
                      Mark prices, payments, auth tokens, or any field as protected. Poly will never include them in AI analysis — guaranteed.
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-rose-500 font-mono bg-rose-50 rounded-lg px-3 py-2 border border-rose-100">
                      <Lock className="h-3 w-3" /> protected: ["price", "token", "ssn"]
                    </div>
                  </div>
                </ScrollReveal>
              </div>
              {/* Row 2 */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: <Lock className="h-5 w-5" />, color: "text-emerald-600", bg: "bg-emerald-50", title: "Zero Proxy", sub: "Runs locally",
                    desc: "Your traffic never routes through Poly servers. The SDK runs entirely in your process — intercepting and patching locally." },
                  { icon: <Database className="h-5 w-5" />, color: "text-sky-600", bg: "bg-sky-50", title: "Patch Cache", sub: "Instant reuse",
                    desc: "Identical drift patterns are fixed instantly from local cache — no repeated AI calls needed." },
                  { icon: <BarChart3 className="h-5 w-5" />, color: "text-violet-600", bg: "bg-violet-50", title: "Confidence Scores", sub: "AI-powered",
                    desc: "Every patch scored 0–100%. Set thresholds to auto-apply high-confidence patches, review the rest." },
                ].map((f, i) => (
                  <ScrollReveal key={f.title} delay={0.1 + i * 0.05}>
                    <div className="group rounded-2xl border border-border bg-white p-6 shadow-sm hover:shadow-md hover:border-border transition-all h-full">
                      <div className={`h-10 w-10 rounded-xl ${f.bg} flex items-center justify-center ${f.color} group-hover:scale-110 transition-transform mb-3`}>{f.icon}</div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">{f.title}</h3>
                      <span className="text-[10px] text-muted-foreground">{f.sub}</span>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-2">{f.desc}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
              {/* Row 3 */}
              <ScrollReveal delay={0.25}>
                <div className="max-w-2xl mx-auto">
                  <div className="group rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm hover:shadow-md text-center transition-all">
                    <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform mx-auto mb-4"><Sparkles className="h-5 w-5" /></div>
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Rule Engine</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                      Override AI with custom rules. Force specific field mappings, block changes on critical endpoints, or whitelist trusted APIs — you&apos;re in control.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ═══════════ TRUST / SECURITY ═══════════ */}
        <section className="px-4 sm:px-6 pb-20 sm:pb-28">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal className="text-center mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 text-gray-900">Your data stays yours</h2>
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">Poly was designed with privacy as a first principle. Here&apos;s exactly what happens.</p>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 gap-6">
              <ScrollReveal>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-6 sm:p-8 h-full">
                  <h3 className="text-sm font-bold text-emerald-700 mb-4 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Stays in your process</h3>
                  <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-start gap-2.5"><span className="text-emerald-500 mt-0.5">✓</span> Full API response payloads — <strong className="text-gray-800">never leave your machine</strong></li>
                    <li className="flex items-start gap-2.5"><span className="text-emerald-500 mt-0.5">✓</span> User data, PII, business logic — <strong className="text-gray-800">stays local</strong></li>
                    <li className="flex items-start gap-2.5"><span className="text-emerald-500 mt-0.5">✓</span> Auth tokens, API keys, secrets — <strong className="text-gray-800">never transmitted</strong></li>
                    <li className="flex items-start gap-2.5"><span className="text-emerald-500 mt-0.5">✓</span> Patches apply in-memory — <strong className="text-gray-800">zero latency</strong></li>
                  </ul>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <div className="rounded-2xl border border-violet-200 bg-violet-50/30 p-6 sm:p-8 h-full">
                  <h3 className="text-sm font-bold text-violet-700 mb-4 flex items-center gap-2"><Cpu className="h-4 w-4" /> Sent to Poly Cloud (only)</h3>
                  <ul className="space-y-3 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-start gap-2.5"><span className="text-violet-500 mt-0.5">→</span> Field names and types — <code className="text-violet-600 bg-violet-100 px-1.5 py-0.5 rounded text-xs font-mono">full_name → name</code></li>
                    <li className="flex items-start gap-2.5"><span className="text-violet-500 mt-0.5">→</span> Schema structure — nesting, arrays, enums</li>
                    <li className="flex items-start gap-2.5"><span className="text-violet-500 mt-0.5">→</span> Drift type classification — rename, remove, etc.</li>
                    <li className="flex items-start gap-2.5"><span className="text-violet-500 mt-0.5">→</span> <strong className="text-gray-800">No values, no payloads</strong> — just shapes</li>
                  </ul>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ═══════════ PRICING ═══════════ */}
        <section className="px-4 sm:px-6 pb-20 sm:pb-28">
          <ScrollReveal className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-border bg-gradient-to-b from-gray-50 to-white p-8 sm:p-10 text-center shadow-sm">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted border border-border px-4 py-1.5 rounded-full mb-5">
                <Sparkles className="h-3 w-3" /> Free during beta
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-2">
                $0<span className="text-muted-foreground text-lg font-normal">/month</span>
              </h2>
              <p className="text-muted-foreground text-sm mb-6">No credit card. No limits. We&apos;re building in public and want your feedback.</p>
              <div className="inline-flex flex-col sm:flex-row items-center gap-3 text-xs text-muted-foreground mb-6">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Unlimited API calls</span>
                <span className="hidden sm:inline text-gray-300">·</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Unlimited endpoints</span>
                <span className="hidden sm:inline text-gray-300">·</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Priority support</span>
              </div>
              <Button size="lg" onClick={onEnterDashboard}
                className="bg-transparent p-0 hover:bg-transparent p-0/90 text-primary-foreground font-semibold rounded-xl px-8 h-12 shadow-lg shadow-gray-200">
                Get started free <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </ScrollReveal>
        </section>

        {/* ═══════════ FINAL CTA ═══════════ */}
        <section className="px-4 sm:px-6 pb-20 sm:pb-28">
          <ScrollReveal className="max-w-3xl mx-auto text-center">
            <div className="rounded-3xl border border-border bg-gradient-to-b from-gray-50 to-white p-8 sm:p-14 shadow-sm">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 text-gray-900">
                Stop fearing API changes.
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base mb-8 max-w-lg mx-auto">
                Install Poly, wrap your HTTP client, and never deal with a breaking API change again.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" onClick={onEnterDashboard}
                  className="bg-transparent p-0 hover:bg-transparent p-0/90 text-primary-foreground font-semibold text-base rounded-xl px-8 h-12 shadow-lg shadow-gray-200">
                  Open Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <code className="text-xs text-muted-foreground bg-muted px-4 py-2.5 rounded-lg font-mono border border-border select-all">
                  npm i github:Pritahi/poly-sdk
                </code>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      {/* ───── Footer ───── */}
      <footer className="mt-auto border-t border-border pt-10 sm:pt-14 pb-8 px-4 sm:px-6 bg-muted">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2.5">
                {["Dashboard","SDK Docs","API Reference","Changelog"].map(l => <li key={l}><a href="#" className="text-sm text-muted-foreground hover:text-gray-800 transition-colors">{l}</a></li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-2.5">
                {["Documentation","Quick Start","Examples","Blog"].map(l => <li key={l}><a href="#" className="text-sm text-muted-foreground hover:text-gray-800 transition-colors">{l}</a></li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Company</h4>
              <ul className="space-y-2.5">
                {["About","Privacy Policy","Terms of Service"].map(l => <li key={l}><a href="#" className="text-sm text-muted-foreground hover:text-gray-800 transition-colors">{l}</a></li>)}
                <li><a href="mailto:hello@poly.dev" className="text-sm text-muted-foreground hover:text-gray-800 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Community</h4>
              <ul className="space-y-2.5">
                {["Discord","Twitter / X"].map(l => <li key={l}><a href="#" className="text-sm text-muted-foreground hover:text-gray-800 transition-colors">{l}</a></li>)}
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-transparent p-0 flex items-center justify-center text-primary-foreground text-[10px] font-bold">P</div>
              <span className="text-sm text-muted-foreground">Poly — Survive Third-Party API Changes</span>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Poly · MIT License · v1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
