"use client";

import { motion, AnimatePresence } from "framer-motion";

/* ──────────────────────── Mascot States ──────────────────────── */
type MascotMood = "idle" | "watching" | "curious" | "shocked" | "thinking" | "focused" | "celebrating";

interface MascotProps {
  currentStep: string;
}

function getMood(step: string): MascotMood {
  switch (step) {
    case "request": return "watching";
    case "response": return "curious";
    case "drift": return "shocked";
    case "cloud": return "thinking";
    case "patch": return "focused";
    case "done": return "celebrating";
    default: return "idle";
  }
}

const moodEmoji: Record<MascotMood, string> = {
  idle: "👋",
  watching: "👀",
  curious: "🤔",
  shocked: "😱",
  thinking: "🧠",
  focused: "🔧",
  celebrating: "🎉",
};

const moodColor: Record<MascotMood, string> = {
  idle: "from-indigo-400 to-violet-400",
  watching: "from-blue-400 to-cyan-400",
  curious: "from-amber-400 to-yellow-400",
  shocked: "from-red-400 to-orange-400",
  thinking: "from-purple-400 to-violet-400",
  focused: "from-emerald-400 to-green-400",
  celebrating: "from-emerald-400 to-green-400",
};

const moodBorder: Record<MascotMood, string> = {
  idle: "border-indigo-300",
  watching: "border-blue-300",
  curious: "border-amber-300",
  shocked: "border-red-300",
  thinking: "border-purple-300",
  focused: "border-emerald-300",
  celebrating: "border-emerald-300",
};

const moodGlow: Record<MascotMood, string> = {
  idle: "shadow-lg shadow-indigo-200/40",
  watching: "shadow-lg shadow-blue-200/40",
  curious: "shadow-lg shadow-amber-200/40",
  shocked: "shadow-lg shadow-red-200/40",
  thinking: "shadow-lg shadow-purple-200/40",
  focused: "shadow-lg shadow-emerald-200/40",
  celebrating: "shadow-lg shadow-emerald-200/40",
};

/* Eye positions for different moods */
function Eyes({ mood }: { mood: MascotMood }) {
  // Shocked: wide open, centered
  if (mood === "shocked") {
    return (
      <div className="flex gap-2.5 justify-center mt-3">
        <motion.div
          className="h-3.5 w-3.5 rounded-full bg-gray-900 border border-gray-700"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
        />
        <motion.div
          className="h-3.5 w-3.5 rounded-full bg-gray-900 border border-gray-700"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 0.6 }}
        />
      </div>
    );
  }

  // Thinking: looking up-right
  if (mood === "thinking") {
    return (
      <div className="flex gap-2.5 justify-center mt-3">
        <div className="h-2.5 w-2 rounded-full bg-gray-900 relative">
          <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-white" />
        </div>
        <div className="h-2.5 w-2 rounded-full bg-gray-900 relative">
          <div className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-white" />
        </div>
      </div>
    );
  }

  // Default: blinking
  return (
    <div className="flex gap-2.5 justify-center mt-3">
      <motion.div
        className="h-2.5 w-2.5 rounded-full bg-gray-900"
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
      />
      <motion.div
        className="h-2.5 w-2.5 rounded-full bg-gray-900"
        animate={{ scaleY: [1, 0.1, 1] }}
        transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
      />
    </div>
  );
}

function Mouth({ mood }: { mood: MascotMood }) {
  if (mood === "shocked") {
    return (
      <motion.div
        className="mt-1 mx-auto h-2 w-2.5 rounded-full bg-gray-700"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 0.5 }}
      />
    );
  }
  if (mood === "celebrating") {
    return (
      <motion.div className="mt-1 mx-auto" animate={{ rotate: [0, -5, 5, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>
        <svg className="h-2.5 w-3.5" viewBox="0 0 14 10" fill="none">
          <path d="M1 5C1 5 3 9 7 9C11 9 13 5 13 5" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.div>
    );
  }
  // Default: small smile
  return (
    <div className="mt-1 mx-auto">
      <svg className="h-1.5 w-3" viewBox="0 0 12 6" fill="none">
        <path d="M1 5C1 5 3 1 6 1C9 1 11 5 11 5" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function SpeechBubble({ mood }: { mood: MascotMood }) {
  const phrases: Record<MascotMood, string> = {
    idle: "I'm watching your APIs!",
    watching: "A request? Let's see...",
    curious: "Hmm, what's the response?",
    shocked: "FIELD RENAMED! 😱",
    thinking: "AI on it... analyzing...",
    focused: "Patching in-memory...",
    celebrating: "All safe! No crash! 🎉",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -5, scale: 0.9 }}
      key={mood}
      className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white border border-gray-700 rounded-xl px-3 py-2 text-[10px] whitespace-nowrap font-medium shadow-lg"
    >
      {phrases[mood]}
      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 h-2 w-2 bg-gray-900 border-r border-b border-gray-700 rotate-45" />
    </motion.div>
  );
}

export function PolyMascot({ currentStep }: MascotProps) {
  const mood = getMood(currentStep);

  return (
    <div className="relative flex flex-col items-center">
      {/* Speech bubble */}
      <AnimatePresence mode="wait">
        <SpeechBubble mood={mood} />
      </AnimatePresence>

      {/* Hexagon body */}
      <motion.div
        className={`relative w-20 h-[72px] bg-gradient-to-br ${moodColor[mood]} border ${moodBorder[mood]} shadow-lg ${moodGlow[mood]} transition-all duration-500`}
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }}
        animate={
          mood === "celebrating"
            ? { y: [0, -8, 0], rotate: [0, -5, 5, 0] }
            : mood === "shocked"
            ? { scale: [1, 1.05, 1] }
            : { y: [0, -3, 0] }
        }
        transition={
          mood === "celebrating"
            ? { repeat: Infinity, duration: 0.6 }
            : mood === "shocked"
            ? { repeat: Infinity, duration: 0.5 }
            : { repeat: Infinity, duration: 2, ease: "easeInOut" }
        }
      >
        {/* Face inside hexagon */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Eyes mood={mood} />
          <Mouth mood={mood} />
        </div>

        {/* Highlight */}
        <div className="absolute top-2 left-3 h-2 w-1.5 rounded-full bg-white/30 rotate-12" />
      </motion.div>

      {/* Little feet */}
      <div className="flex gap-4 mt-0.5">
        <motion.div
          className="h-1.5 w-2.5 rounded-full bg-gray-300"
          animate={mood === "celebrating" ? { y: [0, -2, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.3, repeatType: "reverse" }}
        />
        <motion.div
          className="h-1.5 w-2.5 rounded-full bg-gray-300"
          animate={mood === "celebrating" ? { y: [0, -2, 0] } : {}}
          transition={{ repeat: Infinity, duration: 0.3, repeatType: "reverse", delay: 0.15 }}
        />
      </div>

      {/* Name tag */}
      <span className="text-[10px] text-gray-500 font-semibold mt-1.5 tracking-wider uppercase">
        Poly
      </span>

      {/* Mood label */}
      <AnimatePresence mode="wait">
        <motion.span
          key={mood}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          className="text-[10px] text-gray-600 mt-0.5 font-medium"
        >
          {moodEmoji[mood]} {mood}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
