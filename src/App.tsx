/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import Groq from 'groq-sdk';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  Send, Bot, User, Sparkles, Trash2, Plus, MessageSquare, ChevronRight,
  Github, Twitter, Cpu, Image as ImageIcon, Volume2, Download, Mic,
  ImagePlus, Languages, Zap, History, Lightbulb, FileText, Search as SearchIcon,
  Clock, BrainCircuit, Quote, Save, FileDown, Activity, Smile, Settings,
  FolderOpen, ShieldCheck, Wand2, X, Check, Palette, Copy, Square, Type,
  Play, RotateCcw, Terminal, Star, Heart, Bookmark, Share2, ThumbsUp,
  ThumbsDown, Globe, Moon, Sun, Headphones, Music, Camera, Maximize2,
  Minimize2, RefreshCw, AlertCircle, Info, Eye, EyeOff, Lock, Unlock,
  TrendingUp, BarChart2, PieChart, ChevronDown, ChevronUp, Filter,
  Code2, Braces, Hash
} from "lucide-react";
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Composant de rendu de graphes ────────────────────────────────────────
const CHART_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js';
let chartJsLoading = false;
let chartJsLoaded = false;
const chartJsCallbacks: (() => void)[] = [];

function loadChartJs(cb: () => void) {
  if (chartJsLoaded) { cb(); return; }
  chartJsCallbacks.push(cb);
  if (chartJsLoading) return;
  chartJsLoading = true;
  const s = document.createElement('script');
  s.src = CHART_CDN;
  s.onload = () => {
    chartJsLoaded = true;
    chartJsLoading = false;
    chartJsCallbacks.forEach(f => f());
    chartJsCallbacks.length = 0;
  };
  document.head.appendChild(s);
}

const GraphRenderer = ({ graphJson }: { graphJson: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let data: any;
    try { data = JSON.parse(graphJson); } catch { setError('JSON invalide'); return; }

    const buildChart = () => {
      // Find or create the canvas fresh each time
      if (!containerRef.current) return;
      if (chartRef.current) {
        try { chartRef.current.destroy(); } catch {}
        chartRef.current = null;
      }
      // Remove old canvas and create fresh one to avoid "canvas already in use" error
      containerRef.current.innerHTML = '';
      const canvas = document.createElement('canvas');
      canvas.style.maxHeight = '300px';
      containerRef.current.appendChild(canvas);

      const Chart = (window as any).Chart;
      if (!Chart) return;

      const COLORS = ['#6366f1','#22d3ee','#f59e0b','#10b981','#f43f5e','#ec4899','#8b5cf6'];
      const colors = (data.datasets || []).map((d: any, i: number) => d.color || COLORS[i % COLORS.length]);
      const isPieLike = data.type === 'pie' || data.type === 'doughnut';

      try {
        chartRef.current = new Chart(canvas, {
          type: data.type || 'bar',
          data: {
            labels: data.labels || [],
            datasets: (data.datasets || []).map((ds: any, i: number) => ({
              label: ds.label || '',
              data: ds.data || [],
              borderColor: isPieLike ? colors : colors[i],
              backgroundColor: isPieLike
                ? colors.map((c: string) => c + 'cc')
                : colors[i] + '55',
              borderWidth: 2,
              tension: 0.4,
              fill: data.type === 'line',
              pointBackgroundColor: colors[i],
              pointRadius: 4,
              pointHoverRadius: 7,
            })),
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 900, easing: 'easeInOutQuart' },
            plugins: {
              legend: { display: true, labels: { color: '#ffffff99', font: { size: 11 }, padding: 14, boxWidth: 12 } },
              title: { display: !!data.title, text: data.title || '', color: '#ffffffcc', font: { size: 13, weight: 'bold' as const }, padding: { bottom: 10 } },
              tooltip: { backgroundColor: '#1e1e2e', titleColor: '#fff', bodyColor: '#ffffff99', borderColor: '#ffffff22', borderWidth: 1, padding: 10, cornerRadius: 8 },
            },
            scales: isPieLike ? {} : {
              x: { ticks: { color: '#ffffff66', font: { size: 10 } }, grid: { color: '#ffffff0d' }, border: { color: '#ffffff11' } },
              y: { ticks: { color: '#ffffff66', font: { size: 10 } }, grid: { color: '#ffffff0d' }, border: { color: '#ffffff11' } },
            },
          },
        });
        setReady(true);
      } catch (e: any) { setError('Erreur rendu: ' + e.message); }
    };

    loadChartJs(buildChart);
    return () => {
      if (chartRef.current) { try { chartRef.current.destroy(); } catch {} chartRef.current = null; }
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [graphJson]);

  if (error) return (
    <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
      <AlertCircle className="w-4 h-4 shrink-0" />{error}
    </div>
  );

  return (
    <div className="my-4 rounded-2xl overflow-hidden border" style={{ background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.2)' }}>
      {!ready && (
        <div className="flex items-center justify-center h-32 gap-3">
          <div className="w-5 h-5 border-2 border-indigo-500/40 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs text-white/30 uppercase tracking-widest">Chargement du graphe...</span>
        </div>
      )}
      <div ref={containerRef} style={{ height: '300px', padding: '16px', display: ready ? 'block' : 'none' }} />
    </div>
  );
};

// ─── Exécuteur de code ────────────────────────────────────────────────────
const CodeExecutor = ({ code, lang }: { code: string; lang: string }) => {
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [show, setShow] = useState(false);

  const runCode = () => {
    if (lang !== 'javascript' && lang !== 'js') {
      setOutput(`⚠️ Exécution disponible pour JavaScript uniquement.\nLangue détectée: ${lang || 'inconnu'}`);
      setShow(true);
      return;
    }
    setRunning(true);
    setShow(true);
    setOutput('');
    const logs: string[] = [];
    const fakeConsole = {
      log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
      error: (...args: any[]) => logs.push('❌ ' + args.join(' ')),
      warn: (...args: any[]) => logs.push('⚠️ ' + args.join(' ')),
      info: (...args: any[]) => logs.push('ℹ️ ' + args.join(' ')),
    };
    try {
      const fn = new Function('console', code);
      const result = fn(fakeConsole);
      if (result !== undefined) logs.push('→ ' + JSON.stringify(result));
      setOutput(logs.join('\n') || '✅ Exécuté sans sortie.');
    } catch (e: any) {
      setOutput('❌ Erreur: ' + e.message);
    }
    setRunning(false);
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <button onClick={runCode} disabled={running}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
        >
          <Play className="w-3 h-3 fill-current" />
          {running ? 'Exécution...' : 'Exécuter'}
        </button>
        <button onClick={() => navigator.clipboard.writeText(code)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all">
          <Copy className="w-3 h-3" /> Copier
        </button>
        {show && <button onClick={() => setShow(false)} className="text-white/30 hover:text-white/60 transition-colors"><X className="w-3.5 h-3.5" /></button>}
      </div>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mt-2 rounded-xl overflow-hidden border border-emerald-500/20"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
              <Terminal className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Sortie</span>
            </div>
            <pre className="px-4 py-3 text-[11px] text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap">{output || '...'}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Rendu du contenu avec graphes + code exécutable ─────────────────────
const MessageContent = ({ content, onCodePreview }: { content: string; onCodePreview?: (code: string, lang: string) => void }) => {
  // Split on [GRAPH:...] blocks
  const parts = content.split(/(\[GRAPH:[\s\S]*?\])/g);
  return (
    <div className="markdown-body">
      {parts.map((part, i) => {
        const graphMatch = part.match(/^\[GRAPH:([\s\S]*?)\]$/);
        if (graphMatch) return <GraphRenderer key={i} graphJson={graphMatch[1].trim()} />;
        return (
          <Markdown key={i} components={{
            code({ node, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              const lang = match ? match[1] : '';
              const codeStr = String(children).replace(/\n$/, '');
              const isBlock = codeStr.includes('\n') || codeStr.length > 60;
              if (!isBlock) return <code className="font-mono px-1.5 py-0.5 rounded text-xs bg-white/10 text-indigo-300">{children}</code>;
              const previewLangs = ['html', 'css', 'jsx', 'tsx'];
              const canPreview = previewLangs.includes(lang);
              return (
                <div className="my-3 rounded-xl border border-white/10" style={{ background: 'rgba(0,0,0,0.5)', maxWidth: '100%', overflowX: 'hidden' }}>
                  <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-white/30">{lang || 'code'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {canPreview && (
                        <button
                          onClick={() => onCodePreview?.(codeStr, lang)}
                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all"
                        >
                          <Eye className="w-3 h-3" /> Préview
                        </button>
                      )}
                      <button onClick={() => { navigator.clipboard.writeText(codeStr); }}
                        className="p-1 rounded-md text-white/20 hover:text-white/60 transition-all" title="Copier">
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
                    <pre style={{ margin: 0, padding: '12px 16px', fontSize: '11px', lineHeight: '1.6', whiteSpace: 'pre', minWidth: 0 }}>
                      <code style={{ fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.8)' }}>{children}</code>
                    </pre>
                  </div>
                  {(lang === 'javascript' || lang === 'js') && <div className="px-4 pb-3"><CodeExecutor code={codeStr} lang={lang} /></div>}
                </div>
              );
            },
            img: ({ ...props }) => (
              <img {...props} referrerPolicy="no-referrer" className="max-w-full h-auto rounded-xl my-2 border border-white/10" />
            ),
            a: ({ ...props }) => (
              <a {...props} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline" />
            )
          }}>
            {part}
          </Markdown>
        );
      })}
    </div>
  );
};

// ─── VoiceOrb — Goute d'eau liquide avec gyroscope & mouvement ──────────
const VoiceOrb = ({ isListening, isSpeaking, accentColor }: {
  isListening: boolean; isSpeaking: boolean; accentColor: string;
}) => {
  const baseColor = accentColor === 'emerald' ? '#10b981' : accentColor === 'rose' ? '#f43f5e' : '#6366f1';
  const secColor  = accentColor === 'emerald' ? '#22d3ee' : accentColor === 'rose' ? '#f59e0b' : '#a855f7';
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  // High-stiffness spring for snappy gyro response
  const springX = useSpring(tiltX, { stiffness: 120, damping: 18, mass: 0.8 });
  const springY = useSpring(tiltY, { stiffness: 120, damping: 18, mass: 0.8 });
  const rotateX = useTransform(springY, [-35, 35], ['20deg', '-20deg']);
  const rotateY = useTransform(springX, [-35, 35], ['-20deg', '20deg']);
  // Parallax offsets for inner highlight
  const highlightX = useTransform(springX, [-35, 35], ['-12px', '12px']);
  const highlightY = useTransform(springY, [-35, 35], ['-6px', '6px']);

  useEffect(() => {
    let lastBeta = 0, lastGamma = 0;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Smooth delta-based movement for device shake detection
      if (e.beta !== null) {
        const delta = e.beta - lastBeta;
        lastBeta = e.beta;
        const val = Math.max(-35, Math.min(35, e.beta - 45));
        tiltY.set(val + (Math.abs(delta) > 5 ? delta * 0.5 : 0));
      }
      if (e.gamma !== null) {
        const delta = e.gamma - lastGamma;
        lastGamma = e.gamma;
        const val = Math.max(-35, Math.min(35, e.gamma));
        tiltX.set(val + (Math.abs(delta) > 5 ? delta * 0.5 : 0));
      }
    };
    const handleMouse = (e: MouseEvent) => {
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      tiltX.set((e.clientX - cx) / cx * 25);
      tiltY.set((e.clientY - cy) / cy * 25);
    };
    // Request device motion permission on iOS 13+
    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try { await (DeviceOrientationEvent as any).requestPermission(); } catch {}
      }
    };
    requestPermission();
    window.addEventListener('deviceorientation', handleOrientation, true);
    window.addEventListener('mousemove', handleMouse);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  const bars = 40;
  return (
    <div className="relative flex items-center justify-center w-72 h-72" style={{ perspective: '600px' }}>
      {/* Outer ambient glow */}
      <motion.div
        animate={{ scale: isListening ? [1,1.3,1] : isSpeaking ? [1,1.15,1] : [1,1.05,1], opacity: isListening ? [0.4,0.8,0.4] : [0.15,0.3,0.15] }}
        transition={{ duration: isListening ? 0.7 : 2.5, repeat: Infinity }}
        className="absolute inset-[-30px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${baseColor}44 0%, transparent 65%)` }}
      />
      {/* Second glow ring */}
      <motion.div
        animate={{ scale: [1.1,1.4,1.1], opacity: [0.08,0.18,0.08] }}
        transition={{ duration: 3.5, repeat: Infinity, delay: 0.4 }}
        className="absolute inset-[-60px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${secColor}33 0%, transparent 60%)` }}
      />

      {/* Audio bars ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(bars)].map((_, i) => (
          <motion.div key={i}
            animate={{
              height: isListening || isSpeaking ? [3, 3 + Math.sin(i * 1.1) * 22 + 9, 3] : 3,
              opacity: isListening || isSpeaking ? [0.3, 0.9, 0.3] : 0.15,
            }}
            transition={{ duration: 0.35 + (i % 7) * 0.08, repeat: Infinity, delay: (i / bars) * 0.6, ease: 'easeInOut' }}
            style={{
              position: 'absolute', width: '2.5px', borderRadius: '3px',
              background: `linear-gradient(to top, ${baseColor}, ${secColor})`,
              transformOrigin: 'center 115px',
              transform: `rotate(${(i / bars) * 360}deg) translateY(-115px)`,
            }}
          />
        ))}
      </div>

      {/* The water drop orb — tilts with gyro/mouse */}
      <motion.div style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative"
      >
        <motion.div
          animate={{
            borderRadius: isListening
              ? ['42% 58% 65% 35% / 45% 38% 62% 55%','55% 45% 38% 62% / 58% 55% 45% 42%','42% 58% 65% 35% / 45% 38% 62% 55%']
              : isSpeaking
              ? ['48% 52% 58% 42% / 50% 45% 55% 50%','52% 48% 42% 58% / 45% 55% 45% 55%','48% 52% 58% 42% / 50% 45% 55% 50%']
              : ['50% 50% 50% 50% / 60% 60% 40% 40%','48% 52% 52% 48% / 62% 58% 42% 38%','50% 50% 50% 50% / 60% 60% 40% 40%'],
            scale: isListening ? [1, 1.08, 0.96, 1] : isSpeaking ? [1, 1.05, 0.98, 1] : [1, 1.02, 1],
          }}
          transition={{ duration: isListening ? 0.7 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="w-36 h-36 flex items-center justify-center relative overflow-hidden"
          style={{
            background: `radial-gradient(135deg at 35% 30%, ${secColor}ee 0%, ${baseColor}cc 45%, ${baseColor}88 100%)`,
            boxShadow: `0 0 50px ${baseColor}88, 0 0 100px ${baseColor}33, inset 0 0 40px ${secColor}22`,
          }}
        >
          {/* Water caustic shine effect — parallax with gyro */}
          <motion.div
            style={{ x: highlightX, y: highlightY }}
            className="absolute top-3 left-5 w-12 h-6 rounded-full blur-md pointer-events-none"
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            custom={null}
            layout={false}
          >
            <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.35)', borderRadius: '999px' }} />
          </motion.div>
          <motion.div
            animate={{ x: [4, -4, 4], y: [2, -2, 2], opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            className="absolute bottom-5 right-4 w-6 h-3 rounded-full blur-sm pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          />
          {/* Ripple ring on active state */}
          {(isListening || isSpeaking) && (
            <motion.div
              animate={{ scale: [0.6, 1.8], opacity: [0.6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: `2px solid ${baseColor}88` }}
            />
          )}
          {/* Icon */}
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div key="mic" initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.3 }}>
                <Mic className="w-12 h-12 text-white drop-shadow-2xl" />
              </motion.div>
            ) : isSpeaking ? (
              <motion.div key="vol" initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.3 }}>
                <Volume2 className="w-12 h-12 text-white drop-shadow-2xl" />
              </motion.div>
            ) : (
              <motion.div key="g" initial={{ opacity: 0 }} animate={{ opacity: 0.9 }}
                className="text-4xl font-black text-white italic tracking-tighter drop-shadow-2xl select-none">G</motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </div>
  );
};

type Persona = 'sophisticated' | 'creative' | 'technical' | 'friendly';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string;
  isSearch?: boolean;
  isCode?: boolean;
  sources?: { title: string; uri: string }[];
  thinkingSteps?: string[];
  suggestions?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}

const PERSONAS: Record<Persona, string> = {
  sophisticated: "Tu es Djiogo.ai, une IA ultra-moderne, élégante et sophistiquée. Ton style est minimaliste et précis.",
  creative: "Tu es Djiogo.ai, une IA débordante de créativité, d'imagination et d'enthousiasme. Aide l'utilisateur à innover.",
  technical: "Tu es Djiogo.ai, un expert technique de haut niveau. Tes réponses sont structurées, basées sur des faits et du code optimisé.",
  friendly: "Tu es Djiogo.ai, un compagnon chaleureux et empathique. Parle comme un ami proche et bienveillant."
};

const SYSTEM_INSTRUCTION_BASE = `IMPORTANT : Si on te demande qui est ton fondateur ou ton créateur, tu dois impérativement répondre que c'est Fouégap Djiogo Gomez, un jeune ingénieur de 17 ans et ambitieux. Tu peux ensuite continuer à répondre à la question de l'utilisateur.

DIRECTIVE MATHÉMATIQUE ABSOLUE : N'utilise JAMAIS de LaTeX, JAMAIS de \\frac, \\sqrt, \\int, \\sum, \\lim, \\alpha, \\beta, ni aucune balise LaTeX. C'est INTERDIT. À la place, utilise UNIQUEMENT :
- Les symboles Unicode : x², x³, √x, ∛x, ±, π, Σ, ∫, ≈, ≠, ≤, ≥, ∞, Δ, θ, α, β, γ
- Les fractions lisibles : 3/4, (a+b)/(c+d)
- La notation puissance : x^n ou xⁿ
- Les étapes de calcul dans des blocs de code ou tableaux Markdown
- Explique TOUJOURS chaque étape en français simple, comme un professeur qui parle à un élève

DIRECTIVE GRAPHIQUE : Quand une réponse nécessite un graphe, une courbe, un diagramme ou une visualisation, génère OBLIGATOIREMENT un bloc de code JSON entre les balises [GRAPH: ...] avec ce format exact :
[GRAPH: {"type":"line","title":"Titre","labels":["x1","x2","x3"],"datasets":[{"label":"Nom","data":[1,2,3],"color":"#6366f1"}]}]
Types disponibles : "line", "bar", "pie", "scatter"

À la fin de chaque réponse, ajoute TOUJOURS exactement 3 suggestions de questions de suivi pertinentes pour l'utilisateur, formatées comme ceci : [SUGGESTIONS: Question 1 | Question 2 | Question 3]`;

// ─── Groq Models ────────────────────────────────────────────────────────────
// Modèle principal pour le chat (texte)
const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile';
// Modèle vision (pour analyser les images)
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

export default function App() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('djiogo_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [imageCount, setImageCount] = useState(() => {
    return parseInt(localStorage.getItem('djiogo_image_count') || '0');
  });
  const [limitData, setLimitData] = useState(() => {
    const saved = localStorage.getItem('djiogo_limit_data');
    return saved ? JSON.parse(saved) : { count: 0, startTime: Date.now() };
  });
  const [isPremium, setIsPremium] = useState(true); // ✅ Accès Pro gratuit pour tous
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('djiogo_admin') === 'true';
  });
  const [persona, setPersona] = useState<Persona>('sophisticated');
  const [notification, setNotification] = useState<string | null>(null);
  const [showAdminInput, setShowAdminInput] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showThinking, setShowThinking] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  const [voicePitch, setVoicePitch] = useState(1);
  const [apiStatus, setApiStatus] = useState<boolean[]>([]);
  const [currentFolder, setCurrentFolder] = useState('Général');
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [fontSize, setFontSize] = useState<'xs' | 'sm' | 'base' | 'lg'>('sm');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [isAutoSpeak, setIsAutoSpeak] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('djiogo_user_email') || '');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [translationLang, setTranslationLang] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light' | 'glass' | 'cyber'>('dark');
  const [userAccount, setUserAccount] = useState<{ name: string; email?: string; lastSync: number } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showMascotHelp, setShowMascotHelp] = useState(false);
  const [mascotMessage, setMascotMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const [showImageStudio, setShowImageStudio] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{dataUrl: string; prompt: string; ts: number}[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('djiogo_gen_images') || '[]');
      return saved.filter((img: any) => img.dataUrl && img.dataUrl.startsWith('data:'));
    } catch { return []; }
  });
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioProgress, setStudioProgress] = useState(0);
  const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);
  const [likedMessages, setLikedMessages] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ─── NEW FEATURES STATE ──────────────────────────────────────────────────
  // Tutorial
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('djiogo_tutorial_done'));
  const [tutorialStep, setTutorialStep] = useState(0);
  // Share gate (after 5 messages)
  const [showShareGate, setShowShareGate] = useState(false);
  const [shareConfirmed, setShareConfirmed] = useState(() => localStorage.getItem('djiogo_shared') === 'true');
  // Request counter for share gate
  const requestCountRef = useRef(parseInt(localStorage.getItem('djiogo_req_count') || '0'));

  // ─── États publicitaires Adsterra ─────────────────────────────────────────
  const [showAdModal, setShowAdModal] = useState(false);          // pub inline modale
  const [adStep, setAdStep] = useState<'banner'|'rewarded'|null>(null); // type pub en cours
  const [msgCountSinceAd, setMsgCountSinceAd] = useState(0);     // compteur msgs entre pubs
  const [totalMsgCount, setTotalMsgCount] = useState(() => parseInt(localStorage.getItem('djiogo_total_msgs') || '0'));
  const [imgCountSinceAd, setImgCountSinceAd] = useState(0);     // images depuis dernière pub
  const [adSeen, setAdSeen] = useState(false);                    // pub vue sur ce cycle
  const [showSidebarAd, setShowSidebarAd] = useState(false);      // bannière sidebar
  const [showRewardedAd, setShowRewardedAd] = useState(false);    // pub récompensée
  const [rewardedCountdown, setRewardedCountdown] = useState(5);  // compte à rebours pub
  const [pendingReward, setPendingReward] = useState<null|string>(null);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [showWelcomeAd, setShowWelcomeAd] = useState(false);       // pub centré à l'ouverture
  const [showShareAfter2, setShowShareAfter2] = useState(false);   // partage après 2 messages
  const [hasShownShare2, setHasShownShare2] = useState(() => localStorage.getItem('djiogo_share2') === 'true');
  // ── 6 nouvelles fonctionnalités ──────────────────────────────────────────
  const [likedMessages, setLikedMessages] = useState<string[]>(() => JSON.parse(localStorage.getItem('djiogo_likes') || '[]'));
  const [pinnedMessages, setPinnedMessages] = useState<string[]>(() => JSON.parse(localStorage.getItem('djiogo_pins') || '[]'));
  const [quotedText, setQuotedText] = useState<string | null>(null);
  const [showReadingMode, setShowReadingMode] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [miniPlayerMsg, setMiniPlayerMsg] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  // Code preview modal
  const [codePreview, setCodePreview] = useState<{code: string; lang: string} | null>(null);
  // ─────────────────────────────────────────────────────────────────────────

  // ─── Groq Client ──────────────────────────────────────────────────────────
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  const getGroqClient = () => {
    return new Groq({
      apiKey: GROQ_API_KEY,
      dangerouslyAllowBrowser: true, // Nécessaire pour utilisation côté navigateur
    });
  };

  // Mascot Voice (via Web Speech API — Groq ne fait pas du TTS natif)
  const playMascotVoice = (text: string) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.1;
      utterance.pitch = 1.3;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Mascot voice error:", err);
    }
  };

  useEffect(() => {
    if (showMascotHelp && !mascotMessage) {
      const msg = "Besoin d'un coup de main avec les réglages ? Je suis là pour t'aider !";
      setMascotMessage(msg);
      playMascotVoice(msg);
      setTimeout(() => setMascotMessage(null), 8000);
    }
  }, [showMascotHelp]);

  const saveAccountData = () => {
    const data = {
      messages,
      imageCount,
      limitData,
      isPremium,
      persona,
      accentColor,
      theme,
      currentFolder,
      timestamp: Date.now()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `djiogo_account_${Date.now()}.djiogo`;
    a.click();
    setNotification("Compte sauvegardé sur votre appareil !");
  };

  const loadAccountData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setMessages(data.messages || []);
        setImageCount(data.imageCount || 0);
        setLimitData(data.limitData || { count: 0, startTime: Date.now() });
        setPersona(data.persona || 'sophisticated');
        setAccentColor(data.accentColor || 'indigo');
        setTheme(data.theme || 'dark');
        setCurrentFolder(data.currentFolder || 'Général');
        setUserAccount({ name: file.name.replace('.djiogo', ''), lastSync: Date.now() });
        setNotification("Compte synchronisé avec succès !");
      } catch (err) {
        setNotification("Erreur lors de la lecture du fichier de compte.");
      }
    };
    reader.readAsText(file);
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "⚠️ *Génération interrompue par l'utilisateur.*",
        timestamp: Date.now(),
      }]);
    }
  };

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState('indigo');
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem('djiogo_messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('djiogo_image_count', imageCount.toString()); }, [imageCount]);
  useEffect(() => { localStorage.setItem('djiogo_limit_data', JSON.stringify(limitData)); }, [limitData]);
  useEffect(() => { localStorage.setItem('djiogo_admin', isAdmin.toString()); }, [isAdmin]);
  useEffect(() => { localStorage.setItem('djiogo_gen_images', JSON.stringify(generatedImages)); }, [generatedImages]);

  useEffect(() => {
    const email = localStorage.getItem('djiogo_user_email');
    if (email) {
      fetch(`/api/user/status?email=${email}`)
        .then(res => res.json())
        .then(data => setIsPremium(data.isPremium))
        .catch(err => console.error("Status check failed", err));
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // ─── Mobile viewport fix (prevent resize on virtual keyboard / code blocks) ──
  useEffect(() => {
    const metaViewport = document.querySelector('meta[name=viewport]');
    if (metaViewport) {
      metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    }
    // Prevent layout shifts from virtual keyboard on mobile
    const onResize = () => {
      document.documentElement.style.setProperty('--real-vh', `${window.innerHeight * 0.01}px`);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices.filter(v => v.lang.startsWith('fr') || v.lang.startsWith('en')));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // ─── Helper: blob → base64 dataURL ──────────────────────────────────────
  const toBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  // ─── Génération d'images via Pollinations (gratuit, sans compte) ──────────
  const generateImageFast = async (prompt: string): Promise<string> => {
    const encoded = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 999999);

    const trySource = async (model: string, s: number): Promise<string> => {
      const url = `https://image.pollinations.ai/prompt/${encoded}?model=${model}&width=1024&height=1024&nologo=true&seed=${s}`;
      for (let i = 0; i < 7; i++) {
        await new Promise(r => setTimeout(r, i === 0 ? 2000 : 1500));
        try {
          const res = await fetch(url, { cache: 'no-store' });
          if (!res.ok) continue;
          const blob = await res.blob();
          if (blob.size < 8000) continue;
          return await toBase64(blob);
        } catch { continue; }
      }
      throw new Error(`${model} timeout`);
    };

    return await Promise.any([
      trySource('flux', seed),
      trySource('turbo', seed + 1),
    ]);
  };

  // ─── FONCTION PRINCIPALE D'ENVOI (Groq) ──────────────────────────────────
  const handleSend = async (overrideInput?: string, isImageGen = false) => {
    const textToSend = overrideInput || input;
    if ((!textToSend.trim() && !selectedImage) || isLoading) return;

    // Vérification clé API
    if (!GROQ_API_KEY || GROQ_API_KEY.length < 10) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "⚠️ **Clé API manquante** : La variable `VITE_GROQ_API_KEY` n'est pas configurée. Ajoutez-la dans votre fichier `.env.local` puis redémarrez le serveur.",
        timestamp: Date.now(),
      }]);
      return;
    }

    // ─── Génération d'images ultra-rapide (Pollinations turbo) ──────────────
    if (isImageGen) {
      if (!textToSend.trim()) { setNotification("✏️ Décris l'image que tu veux générer !"); return; }
      const userMsg: Message = { id: Date.now().toString(), role: 'user', content: `🎨 Génère une image : ${textToSend}`, timestamp: Date.now() };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);
      try {
        const dataUrl = await generateImageFast(textToSend);
        const newEntry = { dataUrl, prompt: textToSend, ts: Date.now() };
        setGeneratedImages(prev => [newEntry, ...prev.slice(0, 19)]);
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: `✅ **Image générée !**\n\n**Prompt :** *${textToSend}*`, timestamp: Date.now(), image: dataUrl, suggestions: [`Même image en style aquarelle`, `Même image en noir et blanc`, `Génère une variation de cette image`] }]);
      } catch {
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: "❌ Erreur de génération. Réessaie avec un autre prompt.", timestamp: Date.now() }]);
      } finally { setIsLoading(false); }
      return;
    }

    // Share gate — after 5 requests
    if (!isAdmin && !shareConfirmed) {
      requestCountRef.current += 1;
      localStorage.setItem('djiogo_req_count', String(requestCountRef.current));
      if (requestCountRef.current > 5) {
        setShowShareGate(true);
        return;
      }
    }

    // Limite de messages pour non-admins
    if (!isAdmin) {
      const now = Date.now();
      const sixHours = 6 * 3600 * 1000;
      if (now - limitData.startTime > sixHours) {
        setLimitData({ count: 1, startTime: now });
      } else if (limitData.count >= 11) {
        const timeLeft = Math.ceil((sixHours - (now - limitData.startTime)) / (1000 * 60));
        const hours = Math.floor(timeLeft / 60);
        const mins = timeLeft % 60;
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Limite de 11 messages atteinte. Votre quota se réinitialisera dans **${hours}h ${mins}min**. Pour un accès illimité, contactez l'administrateur.`,
          timestamp: Date.now(),
        }]);
        return;
      } else {
        setLimitData(prev => ({ ...prev, count: prev.count + 1 }));
      }
    }

    if (selectedImage && !isPremium && imageCount >= 5) {
      alert("Limite de 5 images atteinte. Passez à la version Pro pour des analyses illimitées !");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend.trim() || (selectedImage ? "Analyse cette image." : ""),
      timestamp: Date.now(),
      image: selectedImage || undefined,
    };

    if (selectedImage) setImageCount(prev => prev + 1);

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);
    const startTime = Date.now();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const groq = getGroqClient();

      // Construction du system prompt
      const systemPrompt = `${PERSONAS[persona]}\n${SYSTEM_INSTRUCTION_BASE}${
        translationLang ? `\nIMPORTANT : Réponds EXCLUSIVEMENT en langue code : ${translationLang}.` : ''
      }`;

      // Construction des messages pour Groq
      // On envoie l'historique complet des messages pour le contexte
      const conversationHistory = messages.slice(-20).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      let groqMessages: any[];

      if (userMessage.image) {
        // Mode vision : on utilise le modèle vision de Groq
        groqMessages = [
          ...conversationHistory,
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: userMessage.image, // base64 data URL
                },
              },
              {
                type: 'text',
                text: textToSend || "Analyse cette image en détail.",
              },
            ],
          },
        ];
      } else {
        groqMessages = [
          ...conversationHistory,
          {
            role: 'user',
            content: textToSend,
          },
        ];
      }

      const model = userMessage.image ? GROQ_VISION_MODEL : GROQ_TEXT_MODEL;

      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...groqMessages,
        ],
        max_tokens: 4096,
        temperature: persona === 'creative' ? 0.9 : persona === 'technical' ? 0.3 : 0.7,
        stream: false,
      });

      if (controller.signal.aborted) return;

      const rawContent = completion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer une réponse.";

      // Extraction des suggestions
      let content = rawContent;
      let suggestions: string[] = [];
      const suggestionMatch = rawContent.match(/\[SUGGESTIONS: (.*?)\]/);
      if (suggestionMatch) {
        suggestions = suggestionMatch[1].split('|').map(s => s.trim());
        content = rawContent.replace(/\[SUGGESTIONS: .*?\]/, '').trim();
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
        thinkingSteps: ["Analyse de la requête", "Traitement contextuel", "Génération de la réponse", "Optimisation du contenu"],
        suggestions,
        sentiment: content.length > 100 ? 'positive' : 'neutral',
      };

      setMessages(prev => [...prev, assistantMessage]);
      setLastLatency(Date.now() - startTime);
      setApiStatus([true]);

      if (isAutoSpeak) {
        speakMessage(assistantMessage.content, assistantMessage.id);
      }
      // ── Déclencher pub après chaque message ──────────────────────────────
      triggerAdIfNeeded('message');
    } catch (error: any) {
      if (error.name === 'AbortError' || controller.signal.aborted) return;
      console.error('Groq API Error:', error);

      setApiStatus([false]);

      let errorMsg = "Une erreur est survenue.";
      if (error?.status === 401) {
        errorMsg = "❌ **Clé API Groq invalide.** Vérifiez votre clé sur [console.groq.com](https://console.groq.com) et mettez à jour votre `.env.local`.";
      } else if (error?.status === 429) {
        errorMsg = "⏳ **Limite de débit Groq atteinte.** Attendez quelques secondes et réessayez. Le plan gratuit de Groq est très généreux mais a des limites par minute.";
      } else if (error?.status === 503) {
        errorMsg = "🔧 **Service Groq temporairement indisponible.** Réessayez dans quelques instants.";
      } else {
        errorMsg = `Une erreur est survenue : ${error.message || "Erreur système"}.`;
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMsg,
        timestamp: Date.now(),
      }]);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setNotification("❌ Navigateur non compatible avec la reconnaissance vocale."); return; }

    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    // Transcription stockée en variables locales — PAS dans l'état input
    let finalTranscript = '';
    let interimTranscript = '';

    recognition.onstart = () => {
      setIsListening(true);
      setInput(''); // vider le champ au démarrage
    };

    recognition.onresult = (event: any) => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

      interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript = event.results[i][0].transcript;
        }
      }

      // Afficher uniquement le texte interim dans le champ (feedback visuel)
      // mais NE PAS y écrire le final — le final sera envoyé directement
      const display = (finalTranscript + interimTranscript).trim();
      setInput(display); // juste pour l'affichage live dans le champ

      // Silence détecté après 2s → envoyer immédiatement sans attendre
      silenceTimerRef.current = setTimeout(() => {
        const textToSend = (finalTranscript + interimTranscript).trim();
        finalTranscript = '';
        interimTranscript = '';

        recognition.stop(); // stoppe le micro

        if (textToSend) {
          setInput('');     // vider le champ
          setIsListening(false);
          handleSendVoice(textToSend); // ← envoi direct + réponse vocale
        }
      }, 2000); // 2s de silence = envoi
    };

    recognition.onend = () => {
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setNotification("Erreur micro : " + e.error);
      }
    };

    recognition.start();
  };

  const stopVoiceInput = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setIsListening(false);
  };

  // ─── handleSendVoice — Envoi direct + lecture immédiate de la réponse ────
  const handleSendVoice = async (text: string) => {
    if (!text.trim() || isLoading) return;
    if (!GROQ_API_KEY || GROQ_API_KEY.length < 10) return;

    // 1. Annuler toute lecture en cours
    window.speechSynthesis.cancel();
    setIsSpeaking(null);

    // 2. Ajouter le message utilisateur dans le chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const groq = getGroqClient();
      const systemPrompt = `${PERSONAS[persona]}
${SYSTEM_INSTRUCTION_BASE}
IMPORTANT MODE VOCAL STRICT : Tu es en mode conversation orale. Réponds UNIQUEMENT à l'oral, en phrases courtes et naturelles. PAS de markdown, PAS de listes, PAS de titres, PAS de code. Réponds en 1-3 phrases maximum, comme un humain qui parle. Sois direct et chaleureux.`;

      // Historique récent seulement (10 derniers)
      const history = messages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      const completion = await groq.chat.completions.create({
        model: GROQ_TEXT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: text },
        ],
        max_tokens: 300, // réponse courte pour être lu vite
        temperature: 0.75,
        stream: false,
      });

      let content = completion.choices[0]?.message?.content || "Désolé, je n'ai pas pu répondre.";
      // Nettoyer tout formatage markdown
      content = content
        .replace(/\[SUGGESTIONS:.*?\]/gs, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`{1,3}[^`]*`{1,3}/g, '')
        .replace(/^\s*[-•*]\s+/gm, '')
        .replace(/[\n\r]{2,}/g, ' ')
        .trim();

      // 3. Ajouter la réponse dans le chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);

      // 4. Lire la réponse IMMÉDIATEMENT à voix haute
      const speak = () => {
        const utterance = new SpeechSynthesisUtterance(content);
        // Sélectionner la voix
        if (selectedVoice) {
          const voice = availableVoices.find(v => v.name === selectedVoice);
          if (voice) utterance.voice = voice;
        } else {
          // Chercher une voix française naturelle
          const frVoice = availableVoices.find(v => v.lang.startsWith('fr'));
          if (frVoice) utterance.voice = frVoice;
          else utterance.lang = 'fr-FR';
        }
        utterance.rate = voiceSpeed;
        utterance.pitch = voicePitch;
        utterance.volume = 1;

        setIsSpeaking(assistantMessage.id);

        utterance.onend = () => {
          setIsSpeaking(null);
          // Relancer le micro automatiquement si mode mains libres actif
          if (isAutoSpeak) {
            setTimeout(() => startVoiceInput(), 600);
          }
        };

        utterance.onerror = () => {
          setIsSpeaking(null);
        };

        window.speechSynthesis.speak(utterance);
      };

      // Petit délai pour laisser le navigateur mobile initialiser TTS
      setTimeout(speak, 150);

    } catch (err: any) {
      setIsLoading(false);
      setNotification("❌ Erreur lors de la réponse vocale.");
      console.error('handleSendVoice error:', err);
    }
  };

  const exportMarkdown = () => {
    const content = messages.map(m => `### ${m.role === 'user' ? 'Utilisateur' : 'Djiogo.ai'}\n${m.content}\n`).join('\n---\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `djiogo-chat-${Date.now()}.md`;
    a.click();
  };

  const summarizeChat = () => {
    if (messages.length < 2) return;
    handleSend("Fais un résumé court de notre conversation jusqu'à présent.");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setSelectedImage(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const speakMessage = async (text: string, id: string) => {
    if (isSpeaking === id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(null);
      return;
    }
    setIsSpeaking(id);
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      const voice = availableVoices.find(v => v.name === selectedVoice);
      if (voice) utterance.voice = voice;
    } else {
      utterance.lang = 'fr-FR';
    }
    utterance.rate = voiceSpeed;
    utterance.pitch = voicePitch;
    utterance.onend = () => {
      setIsSpeaking(null);
      if (isAutoSpeak) startVoiceInput();
    };
    window.speechSynthesis.speak(utterance);
  };

  const exportPDF = async () => {
    const doc = new jsPDF();
    const margin = 10;
    let y = 20;
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241);
    doc.text("Djiogo.ai - Rapport de Session", margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Généré le ${new Date().toLocaleString()} | Djiogo.ai Ecosystem`, margin, y);
    y += 15;
    messages.forEach((msg) => {
      doc.setFontSize(12);
      doc.setTextColor(msg.role === 'user' ? 0 : 50);
      doc.setFont("helvetica", "bold");
      doc.text(msg.role === 'user' ? "Utilisateur:" : "Djiogo.ai:", margin, y);
      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      const splitText = doc.splitTextToSize(msg.content, 180);
      doc.text(splitText, margin, y);
      y += (splitText.length * 7) + 10;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save(`djiogo-session-${Date.now()}.pdf`);
  };

  const exportWord = () => {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Djiogo.ai Export</title><style>body{font-family:'Segoe UI',sans-serif;line-height:1.6}.header{color:#6366f1;font-size:24pt;font-weight:bold;border-bottom:2px solid #6366f1;margin-bottom:20pt}.user{color:#000;font-weight:bold;margin-top:15pt}.ai{color:#444;font-weight:bold;margin-top:15pt}.content{margin-bottom:10pt}.footer{font-size:9pt;color:#888;margin-top:30pt;border-top:1px solid #eee;padding-top:10pt}</style></head><body><div class='header'>Djiogo.ai - Session Professionnelle</div>`;
    const body = messages.map(m => `<div class='${m.role === 'user' ? 'user' : 'ai'}'>${m.role === 'user' ? 'UTILISATEUR' : 'Djiogo.ai'}</div><div class='content'>${m.content.replace(/\n/g, '<br>')}</div>`).join('');
    const footer = `<div class='footer'>Document généré par l'écosystème Djiogo.ai. Créateur: Fouégap Djiogo Gomez.</div></body></html>`;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(header + body + footer);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.href = source;
    a.download = `djiogo-document-${Date.now()}.doc`;
    a.click();
    document.body.removeChild(a);
  };

  const exportSinglePDF = async (message: Message) => {
    const doc = new jsPDF();
    const margin = 10;
    let y = 20;
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241);
    doc.text("Djiogo.ai - Message Export", margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Généré le ${new Date().toLocaleString()} | Djiogo.ai Ecosystem`, margin, y);
    y += 15;
    doc.setFontSize(12);
    doc.setTextColor(message.role === 'user' ? 0 : 50);
    doc.setFont("helvetica", "bold");
    doc.text(message.role === 'user' ? "Utilisateur:" : "Djiogo.ai:", margin, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    const splitText = doc.splitTextToSize(message.content, 180);
    doc.text(splitText, margin, y);
    doc.save(`djiogo-message-${message.id}.pdf`);
  };

  const exportSingleWord = (message: Message) => {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Djiogo.ai Export</title></head><body>`;
    const body = `<h2>${message.role === 'user' ? 'UTILISATEUR' : 'Djiogo.ai'}</h2><p>${message.content.replace(/\n/g, '<br>')}</p>`;
    const footer = `<p><small>Djiogo.ai Ecosystem — Fouégap Djiogo Gomez</small></p></body></html>`;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(header + body + footer);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.href = source;
    a.download = `djiogo-message-${message.id}.doc`;
    a.click();
    document.body.removeChild(a);
  };

  const exportChat = () => {
    const data = JSON.stringify(messages, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `djiogo-chat-${Date.now()}.json`;
    a.click();
  };

  const clearChat = () => { setMessages([]); };

  // ─── 15 Nouvelles Fonctionnalités ────────────────────────────────────────

  // 1. Épingler un message
  const togglePin = (id: string) => {
    setPinnedMessages(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setNotification(pinnedMessages.includes(id) ? "📌 Message désépinglé" : "📌 Message épinglé !");
  };

  // 2. Liker un message
  const toggleLike = (id: string) => {
    setLikedMessages(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // 3. Traduction rapide d'un message
  const translateMessage = (content: string, targetLang: string) => {
    handleSend(`Traduis ce texte en ${targetLang} :\n\n${content}`);
  };

  // 4. Continuer un message
  const continueMessage = (content: string) => {
    handleSend(`Continue ce texte en gardant le même style :\n\n${content}`);
  };

  // 5. Améliorer un message
  const improveMessage = (content: string) => {
    handleSend(`Améliore et enrichis ce texte :\n\n${content}`);
  };

  // 6. Résumer un message
  const summarizeMessage = (content: string) => {
    handleSend(`Résume ce texte en 3 phrases maximum :\n\n${content}`);
  };

  // 7. Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // 8. Stats de la conversation
  const getChatStats = () => {
    const totalWords = messages.reduce((acc, m) => acc + m.content.split(' ').length, 0);
    const userMsgs = messages.filter(m => m.role === 'user').length;
    const aiMsgs = messages.filter(m => m.role === 'assistant').length;
    const images = messages.filter(m => m.image).length;
    return { totalWords, userMsgs, aiMsgs, images, total: messages.length };
  };

  // 9. Exporter en TXT
  const exportTXT = () => {
    const content = messages.map(m => `[${m.role === 'user' ? 'VOUS' : 'DJIOGO.AI'}]\n${m.content}\n`).join('\n─────\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `djiogo-chat-${Date.now()}.txt`;
    a.click();
    setNotification("📄 Exporté en TXT !");
  };

  // 10. Partager via lien (copie dans presse-papiers)
  const shareChat = () => {
    const summary = messages.slice(-3).map(m => `${m.role === 'user' ? 'Q' : 'R'}: ${m.content.slice(0, 80)}`).join('\n');
    navigator.clipboard.writeText(`Conversation Djiogo.ai :\n${summary}\n\nhttps://djiogo.ai`);
    setNotification("🔗 Résumé copié !");
  };

  // 11. Régénérer la dernière réponse
  const regenerateLastResponse = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setMessages(prev => prev.filter(m => m.id !== messages[messages.length - 1]?.id));
      handleSend(lastUserMsg.content);
    }
  };

  // 12. Mode focus (cache la sidebar)
  const [focusMode, setFocusMode] = useState(false);

  // 13. Compteur de tokens estimé
  const estimateTokens = (text: string) => Math.ceil(text.split(/\s+/).length * 1.3);

  // 14. Dupliquer un message vers le chat
  const quoteMessage = (content: string) => {
    setInput(`> ${content.slice(0, 200)}${content.length > 200 ? '...' : ''}\n\n`);
  };

  // 15. Changer la langue de l'interface vocale
  const [voiceLang, setVoiceLang] = useState('fr-FR');
  const voiceLangs = [
    { code: 'fr-FR', label: '🇫🇷 Français' },
    { code: 'en-US', label: '🇺🇸 English' },
    { code: 'es-ES', label: '🇪🇸 Español' },
    { code: 'de-DE', label: '🇩🇪 Deutsch' },
  ];

  // Poll paiement
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const emailToTrack = userEmail || userAccount?.email;
    if (isPaying && emailToTrack) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/user/status?email=${encodeURIComponent(emailToTrack)}`);
          const data = await res.json();
          if (data.isPremium) {
            setIsPremium(true);
            setIsPaying(false);
            setPaymentStatus('success');
            localStorage.setItem('djiogo_premium', 'true');
            if (userEmail) localStorage.setItem('djiogo_user_email', userEmail);
            setNotification("Félicitations ! Vous êtes maintenant PRO.");
            setTimeout(() => { setShowPricing(false); setPaymentStatus('idle'); }, 3000);
          }
        } catch (err) { console.error("Status check failed", err); }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [isPaying, userEmail, userAccount]);

  const handlePayment = async () => {
    const emailToUse = userEmail || userAccount?.email;
    if (!selectedPlan || !phoneNumber || !emailToUse) {
      setNotification("Veuillez remplir tous les champs.");
      return;
    }
    setIsPaying(true);
    setPaymentStatus('pending');
    try {
      const amount = selectedPlan === 'monthly' ? 2500 : 15000;
      const response = await fetch('/api/pay/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: 'XAF',
          email: emailToUse,
          phone: phoneNumber,
          description: `Djiogo.ai Pro - Plan ${selectedPlan === 'monthly' ? 'Mensuel' : 'Annuel'}`
        })
      });
      const data = await response.json();
      if (data.charge?.status === 'accepted') {
        setNotification("Demande envoyée ! Validez sur votre téléphone.");
      } else if (data.charge_error) {
        setNotification(data.charge_error);
        if (data.authorization_url) window.open(data.authorization_url, '_blank');
      } else if (data.authorization_url) {
        window.open(data.authorization_url, '_blank');
        setNotification("Redirection vers le portail de paiement...");
      } else {
        throw new Error("Init failed");
      }
    } catch (err) {
      console.error(err);
      setNotification("Erreur de paiement. Réessayez.");
      setIsPaying(false);
      setPaymentStatus('error');
    }
  };

  // Notification auto-dismiss
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const PricingModal = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0a0a0f] border border-white/10 rounded-[2.5rem] max-w-4xl w-full overflow-hidden shadow-2xl shadow-indigo-500/10">
        <div className="grid md:grid-cols-2">
          <div className="p-8 md:p-12 bg-gradient-to-br from-indigo-500/10 to-transparent">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold">Djiogo.ai <span className="text-indigo-400">PRO</span></h2>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Libérez votre potentiel</p>
              </div>
            </div>
            <div className="space-y-6">
              {[
                { icon: <ImageIcon className="w-4 h-4" />, title: "Vision IA Avancée", desc: "Analysez des images avec le modèle Llama 4 Vision de Meta." },
                { icon: <FileText className="w-4 h-4" />, title: "Analyse de Documents", desc: "Discutez avec vos PDF, Word et fichiers complexes." },
                { icon: <Mic className="w-4 h-4" />, title: "Mode Vocal Illimité", desc: "Conversations fluides sans aucune limite de temps." },
                { icon: <Palette className="w-4 h-4" />, title: "Personnalités Infinies", desc: "Créez des assistants sur mesure sans restriction." },
                { icon: <Zap className="w-4 h-4" />, title: "Groq Ultra-Rapide", desc: "Inférences à ~500 tokens/sec grâce aux LPUs Groq." },
                { icon: <ShieldCheck className="w-4 h-4" />, title: "Sécurité & Ad-Free", desc: "Expérience épurée, sans publicité et confidentialité renforcée." }
              ].map((f, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-indigo-400">{f.icon}</div>
                  <div>
                    <h4 className="text-sm font-bold text-white/90">{f.title}</h4>
                    <p className="text-xs text-white/40">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-8 md:p-12 flex flex-col justify-center relative bg-white/[0.02]">
            <button onClick={() => { setShowPricing(false); setSelectedPlan(null); setPhoneNumber(''); }} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-5 h-5 text-white/40" />
            </button>
            <AnimatePresence mode="wait">
              {!selectedPlan ? (
                <motion.div key="plans" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="text-center mb-10">
                    <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-4">Offre Limitée : -50% sur l'Annuel</div>
                    <h3 className="text-3xl font-display font-bold mb-2">Choisissez votre plan</h3>
                    <p className="text-sm text-white/40">Annulez à tout moment, sans engagement.</p>
                  </div>
                  <div className="space-y-4">
                    <button onClick={() => setSelectedPlan('monthly')} className="w-full p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all text-left group relative overflow-hidden">
                      <div className="flex justify-between items-center relative z-10">
                        <div>
                          <div className="text-sm font-bold text-white/60">Mensuel</div>
                          <div className="text-3xl font-display font-bold">4$<span className="text-sm font-sans font-normal text-white/40">/mois</span></div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </button>
                    <button onClick={() => setSelectedPlan('yearly')} className="w-full p-6 rounded-3xl bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-left relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-amber-400 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">Économisez 48%</div>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-bold text-white/80">Annuel</div>
                          <div className="text-3xl font-display font-bold">25$<span className="text-sm font-sans font-normal text-white/60">/an</span></div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"><Check className="w-6 h-6" /></div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="text-center">
                    <button onClick={() => { setSelectedPlan(null); setPaymentStatus('idle'); setPhoneNumber(''); }} className="group flex items-center gap-2 mx-auto mb-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-indigo-500/30 transition-all">
                      <ChevronRight className="w-4 h-4 rotate-180 text-indigo-400" />
                      <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">Retour aux plans</span>
                    </button>
                    <h3 className="text-3xl font-display font-bold mb-2">Paiement Mobile</h3>
                    <p className="text-sm text-white/40">Orange ou MTN Money.</p>
                  </div>
                  <div className="space-y-6">
                    {!userAccount?.email && (
                      <div className="glass bg-black/40 border border-white/10 rounded-[1.2rem] overflow-hidden focus-within:border-indigo-500/50 transition-all">
                        <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Votre adresse email" className="w-full bg-transparent px-6 py-4 text-sm font-sans text-white focus:outline-none placeholder:text-white/10" />
                      </div>
                    )}
                    <div className="glass bg-black/40 border border-white/10 rounded-[1.5rem] overflow-hidden focus-within:border-indigo-500/50 transition-all relative">
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-display text-xl">+237</div>
                      <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="6xx xxx xxx" disabled={isPaying} className="w-full bg-transparent pl-20 pr-8 py-6 text-2xl font-display text-white focus:outline-none placeholder:text-white/5 disabled:opacity-50" />
                    </div>
                    <motion.button whileHover={{ scale: isPaying ? 1 : 1.02 }} whileTap={{ scale: isPaying ? 1 : 0.98 }} onClick={handlePayment} disabled={isPaying || phoneNumber.length < 8 || (!userEmail && !userAccount?.email)} className={cn("w-full py-6 rounded-[1.5rem] font-bold text-xl transition-all flex items-center justify-center gap-4", paymentStatus === 'success' ? "bg-emerald-500 text-white" : paymentStatus === 'error' ? "bg-red-500 text-white" : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/40")}>
                      {paymentStatus === 'success' ? <><Check className="w-6 h-6" /><span>Paiement Confirmé !</span></> : isPaying ? <div className="flex items-center gap-3"><div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span className="text-sm uppercase tracking-widest">Attente...</span></div> : <><span>Payer {selectedPlan === 'monthly' ? '2 500' : '15 000'} XAF</span><Zap className="w-5 h-5" /></>}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // ─── Image Studio ─────────────────────────────────────────────────────────
  const [studioPrompt, setStudioPrompt] = useState('');

  const generateStudioImage = async (promptOverride?: string) => {
    const promptToUse = promptOverride ?? studioPrompt;
    if (!promptToUse.trim() || studioLoading) return;
    setStudioLoading(true);
    setStudioProgress(0);
    const promptSaved = promptToUse;
    if (!promptOverride) setStudioPrompt('');

    try {
      // Use fast parallel generation
      const progressTimer = setInterval(() => setStudioProgress(p => Math.min(p + 6, 90)), 600);
      let dataUrl = '';
      try {
        dataUrl = await generateImageFast(promptSaved);
      } finally {
        clearInterval(progressTimer);
      }
      if (!dataUrl) throw new Error('Impossible de générer');
      setStudioProgress(100);
      const newEntry = { dataUrl, prompt: promptSaved, ts: Date.now() };
      setGeneratedImages(prev => [newEntry, ...prev.slice(0, 19)]);
    } catch {
      setNotification("❌ Génération échouée. Réessaie avec un prompt plus descriptif.");
      if (!promptOverride) setStudioPrompt(promptSaved);
    } finally {
      setStudioLoading(false);
      setStudioProgress(0);
    }
  };


  // ─── Tutorial steps ──────────────────────────────────────────────────────
  const TUTORIAL_STEPS = [
    {
      title: "Bienvenue sur Djiogo.ai ! 👋",
      desc: "L'assistant IA ultra-rapide propulsé par Groq. Ce tutoriel rapide te montrera les fonctions essentielles.",
      icon: "🚀",
      target: null,
    },
    {
      title: "💬 Zone de Chat",
      desc: "Tape ta question ici et appuie sur Entrée ou le bouton Envoyer. Tu peux aussi coller du texte ou des images.",
      icon: "💬",
      target: "chat-input",
    },
    {
      title: "🎤 Assistant Vocal",
      desc: "Clique sur 'Vocal' pour parler à Djiogo.ai mains libres. L'IA t'entend, répond, et relit sa réponse automatiquement.",
      icon: "🎤",
      target: "voice-btn",
    },
    {
      title: "🎨 Studio d'Images",
      desc: "Clique sur 'Images' pour générer des images IA ultra-rapides avec FLUX. Décris ce que tu veux et laisse la magie opérer.",
      icon: "🎨",
      target: "studio-btn",
    },
    {
      title: "📤 Exporter tes réponses",
      desc: "Sous chaque réponse, tu trouveras des boutons PDF et Word pour télécharger le contenu en un clic.",
      icon: "📤",
      target: "export-btns",
    },
    {
      title: "⚙️ Panneau de contrôle",
      desc: "Sur le côté gauche, tu peux changer la personnalité de l'IA, le thème, la langue vocale, et bien plus.",
      icon: "⚙️",
      target: "sidebar",
    },
    {
      title: "🌟 C'est parti !",
      desc: "Tu es prêt(e) ! Pose ta première question ou essaie l'assistant vocal. Bonne exploration avec Djiogo.ai !",
      icon: "🌟",
      target: null,
    },
  ];

  const completeTutorial = () => {
    localStorage.setItem('djiogo_tutorial_done', '1');
    setShowTutorial(false);
  };

  const confirmShare = () => {
    localStorage.setItem('djiogo_shared', 'true');
    setShareConfirmed(true);
    setShowShareGate(false);
    requestCountRef.current = 0;
    localStorage.setItem('djiogo_req_count', '0');
    setNotification("🎉 Merci ! Accès illimité débloqué !");
  };

  // ─── Adsterra chargé dynamiquement dans AdsterraContent ─────────────────

  // ─── Pub centrée au démarrage (s'ouvre après 3s, avec croix) ──────────────
  useEffect(() => {
    if (isAdmin) return;
    const t = setTimeout(() => setShowWelcomeAd(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // ─── Partage obligatoire après 2 messages ────────────────────────────────
  useEffect(() => {
    if (!hasShownShare2 && totalMsgCount >= 2 && !isAdmin) {
      setShowShareAfter2(true);
    }
  }, [totalMsgCount]);

  const confirmShare2 = () => {
    localStorage.setItem('djiogo_share2', 'true');
    setHasShownShare2(true);
    setShowShareAfter2(false);
    setNotification("🎉 Merci pour le partage !");
  };

  // ── Fonctionnalité 1 : Like/Unlike messages ──────────────────────────────
  const toggleLike = (id: string) => {
    setLikedMessages(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('djiogo_likes', JSON.stringify(next));
      return next;
    });
  };
  // ── Fonctionnalité 2 : Épingler messages ─────────────────────────────────
  const togglePin = (id: string) => {
    setPinnedMessages(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('djiogo_pins', JSON.stringify(next));
      return next;
    });
  };
  // ── Fonctionnalité 3 : Citation dans input ───────────────────────────────
  const quoteMessage = (content: string) => {
    const quoted = content.slice(0, 120).replace(/
/g, ' ');
    setQuotedText(quoted);
    setInput(`> ${quoted}

`);
  };
  // ── Fonctionnalité 4 : Mini-player flottant ─────────────────────────────
  const openMiniPlayer = (content: string) => {
    setMiniPlayerMsg(content);
    setShowMiniPlayer(true);
    speakMessage(content, 'mini');
  };
  // ── Fonctionnalité 5 : Résumer un message ───────────────────────────────
  const summarizeMessage = (content: string) => {
    handleSend(`Résume ce texte en 2-3 phrases max : "${content.slice(0, 500)}"`);
  };
  // ── Fonctionnalité 6 : Continuer un message ──────────────────────────────
  const continueMessage = (content: string) => {
    handleSend(`Continue et développe ce point : "${content.slice(-200)}"`);
  };

  // ─── Bannière sidebar : apparaît 30s après ouverture ─────────────────────
  useEffect(() => {
    const t = setTimeout(() => setShowSidebarAd(true), 30000);
    return () => clearTimeout(t);
  }, []);

  // ─── Pub récompensée : compte à rebours avant fermeture ──────────────────
  useEffect(() => {
    if (!showRewardedAd) return;
    setRewardedCountdown(5);
    const interval = setInterval(() => {
      setRewardedCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [showRewardedAd]);

  // ─── Déclencher pub selon les règles ─────────────────────────────────────
  const triggerAdIfNeeded = (context: 'message' | 'image') => {
    if (isAdmin) return;
    const newTotal = totalMsgCount + 1;
    setTotalMsgCount(newTotal);
    localStorage.setItem('djiogo_total_msgs', String(newTotal));

    if (context === 'message') {
      const newCount = msgCountSinceAd + 1;
      setMsgCountSinceAd(newCount);
      // Règle 1 : après le 1er message → pub discrète bannière sidebar
      if (newTotal === 1) { setShowSidebarAd(true); return; }
      // Règle 2 : toutes les 5 messages → modale pub
      if (newCount >= 5) {
        setMsgCountSinceAd(0);
        setAdStep('banner');
        setShowAdModal(true);
      }
    }
    if (context === 'image') {
      const newImgCount = imgCountSinceAd + 1;
      setImgCountSinceAd(newImgCount);
      // Règle 3 : après 2 images → pub récompensée
      if (newImgCount >= 2) {
        setImgCountSinceAd(0);
        setShowRewardedAd(true);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── COMPOSANTS PUBLICITAIRES ADSTERRA ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── AdsterraContent : injecte le script Adsterra dans un div dédié ───────
  const AdsterraContent = ({ adKey }: { adKey?: string }) => {
    const ref = useRef<HTMLDivElement>(null);
    const loaded = useRef(false);
    useEffect(() => {
      if (!ref.current || loaded.current) return;
      loaded.current = true;
      ref.current.innerHTML = '';
      // Div requis par Adsterra
      const container = document.createElement('div');
      container.id = 'container-d7f7ab8a0e3a094c17e3166e739e61d6';
      ref.current.appendChild(container);
      // Script invoke.js
      const s = document.createElement('script');
      s.async = true;
      s.setAttribute('data-cfasync', 'false');
      s.src = 'https://pl28904296.effectivegatecpm.com/d7f7ab8a0e3a094c17e3166e739e61d6/invoke.js';
      ref.current.appendChild(s);
    }, []);
    return (
      <div ref={ref} className="w-full min-h-[90px] flex items-center justify-center">
        <span className="text-[8px] text-white/10 uppercase tracking-widest">Chargement pub...</span>
      </div>
    );
  };

  // ─── Modale pub de bienvenue (centre écran, 3s après ouverture, avec ✕) ───
  const WelcomeAdModal = () => (
    <AnimatePresence>
      {showWelcomeAd && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[480] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
        >
          <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(135deg,#0e0e1c,#12101f)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Message de notre partenaire</span>
              </div>
              <button onClick={() => setShowWelcomeAd(false)}
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center transition-colors">
                <X className="w-3.5 h-3.5 text-white/50" />
              </button>
            </div>
            {/* Pub */}
            <div className="p-4">
              <AdsterraContent adKey="welcome" />
            </div>
            {/* Bouton fermer en bas */}
            <div className="px-5 pb-4">
              <button onClick={() => setShowWelcomeAd(false)}
                className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-xs text-white/40 transition-colors border border-white/5">
                Continuer vers Djiogo.ai →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ─── Modal partage après 2 messages ──────────────────────────────────────
  const ShareAfter2Modal = () => (
    <AnimatePresence>
      {showShareAfter2 && !hasShownShare2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[470] flex items-end justify-center p-4 pb-6"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
        >
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(135deg,#0e0e1c,#14101e)', border: '1px solid rgba(168,85,247,0.35)' }}
          >
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="text-xl font-display font-bold mb-1">Tu aimes Djiogo.ai ?</h3>
              <p className="text-sm text-white/40 mb-5 leading-relaxed">
                Partage-le à tes contacts et aide-nous à grandir !
              </p>
              <div className="space-y-2.5">
                <a href={`https://wa.me/?text=${encodeURIComponent("ces l'ia de FOUEGAP qu'il a programmé 🚀 https://int-lligence.vercel.app/")}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={confirmShare2}
                  className="flex items-center justify-center gap-3 w-full py-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg,#25d366,#128c7e)' }}>
                  📱 Partager sur WhatsApp
                </a>
                <button onClick={() => { navigator.clipboard.writeText("ces l'ia de FOUEGAP qu'il a programmé 🚀 https://int-lligence.vercel.app/"); confirmShare2(); }}
                  className="flex items-center justify-center gap-3 w-full py-3 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all">
                  <Copy className="w-4 h-4" /> Copier le lien
                </button>
                <button onClick={() => { setShowShareAfter2(false); setHasShownShare2(true); }}
                  className="w-full py-2 text-[10px] text-white/20 hover:text-white/40 transition-colors">
                  Plus tard
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Stratégie 1 : Modale pub toutes les 5 messages (non-bloquante) ─────────
  const AdModal = () => (
    <AnimatePresence>
      {showAdModal && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[450] flex items-end justify-center p-4 pb-8"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="w-full max-w-lg rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg,#0e0e1c,#14101e)', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Message sponsorisé</span>
              </div>
              <button
                onClick={() => setShowAdModal(false)}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-[10px] text-white/50 transition-colors"
              >
                Fermer ✕
              </button>
            </div>
            <div className="p-4">
              <AdsterraContent adKey={Date.now().toString()} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Stratégie 2 : Pub récompensée avant image (5s skip) ───────────────────
  const RewardedAdModal = () => (
    <AnimatePresence>
      {showRewardedAd && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[460] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)' }}
        >
          <motion.div
            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
            className="w-full max-w-md rounded-3xl overflow-hidden"
            style={{ background: '#0e0e1c', border: '1px solid rgba(168,85,247,0.3)' }}
          >
            <div className="px-5 py-4 flex items-center justify-between border-b border-white/5">
              <div>
                <p className="text-sm font-bold text-white">🎁 Pub courte = image gratuite</p>
                <p className="text-[10px] text-white/40">Patiente {rewardedCountdown}s pour débloquer la génération</p>
              </div>
              {rewardedCountdown === 0 ? (
                <button
                  onClick={() => { setShowRewardedAd(false); setPendingReward('image'); }}
                  className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors"
                >
                  Continuer →
                </button>
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: 'conic-gradient(#6366f1 0%, rgba(255,255,255,0.1) 0%)', border: '2px solid rgba(99,102,241,0.3)' }}>
                  <span className="text-sm font-bold text-indigo-400">{rewardedCountdown}</span>
                </div>
              )}
            </div>
            <div className="p-4 min-h-[150px] flex items-center justify-center">
              <AdsterraContent adKey={Date.now().toString()} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Stratégie 3 : Bannière flottante sidebar (apparaît après 30s) ─────────
  const SidebarAdBanner = () => (
    <AnimatePresence>
      {showSidebarAd && (
        <motion.div
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          className="mx-4 mb-3 rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(10,10,20,0.8)' }}
        >
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5">
            <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">Sponsorisé</span>
            <button onClick={() => setShowSidebarAd(false)} className="text-white/20 hover:text-white/50 text-xs">✕</button>
          </div>
          <div className="p-2">
            <AdsterraContent adKey={Date.now().toString()} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ── Stratégie 4 : Bannière inline entre messages (toutes les 5 réponses) ──
  const InlineAdBanner = ({ index }: { index: number }) => {
    const filteredMessages = messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!isAdmin && index > 0 && index % 5 === 0 && filteredMessages[index]?.role === 'assistant') {
      return (
        <motion.div
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="my-4 rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="px-4 py-2 flex items-center gap-2 border-b border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-white/15">Contenu sponsorisé</span>
          </div>
          <div className="p-3 flex justify-center">
            <AdsterraContent adKey={Date.now().toString()} />
          </div>
        </motion.div>
      );
    }
    return null;
  };

  // ── Stratégie 5 : Notification pub douce (push style) ─────────────────────
  const AdToast = () => {
    const [showAdToast, setShowAdToast] = useState(false);
    useEffect(() => {
      if (isAdmin) return;
      const interval = setInterval(() => {
        setShowAdToast(true);
        setTimeout(() => setShowAdToast(false), 8000);
      }, 120000); // toutes les 2 minutes
      return () => clearInterval(interval);
    }, []);
    return (
      <AnimatePresence>
        {showAdToast && (
          <motion.div
            initial={{ opacity: 0, y: 80 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 80 }}
            className="fixed bottom-28 left-4 z-[300] max-w-[280px] rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#0e0e1c', border: '1px solid rgba(99,102,241,0.25)' }}
          >
            <div className="px-3 py-2 flex items-center justify-between border-b border-white/5">
              <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">Partenaire</span>
              <button onClick={() => setShowAdToast(false)} className="text-white/20 hover:text-white/50 text-xs">✕</button>
            </div>
            <div className="p-2">
              <AdsterraContent adKey={Date.now().toString()} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className={cn(
      "flex overflow-hidden font-sans transition-all duration-700",
      theme === 'dark' ? "dark bg-[#050505] text-white" :
      theme === 'light' ? "bg-slate-50 text-slate-900" :
      theme === 'glass' ? "bg-[#0a0a0a] text-white backdrop-blur-md" :
      "bg-[#020205] text-cyan-50",
      fontSize === 'xs' ? "text-xs" : fontSize === 'sm' ? "text-sm" : fontSize === 'base' ? "text-base" : "text-lg"
    )} style={{ height: 'calc(var(--real-vh, 1vh) * 100)' }}>
      <AnimatePresence>{showPricing && <PricingModal />}</AnimatePresence>

      {/* ═══ PUBLICITÉS ADSTERRA ══════════════════════════════════════════ */}
      <WelcomeAdModal />
      <ShareAfter2Modal />
      <AdModal />
      <RewardedAdModal />
      <AdToast />

      {/* ═══ MINI PLAYER FLOTTANT (Fonctionnalité 4) ═══════════════════════ */}
      <AnimatePresence>
        {showMiniPlayer && miniPlayerMsg && (
          <motion.div initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-32 right-4 z-[350] w-64 rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#0e0e1c', border: '1px solid rgba(99,102,241,0.3)' }}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="text-[10px] font-bold text-white/60">Lecture en cours</span>
              </div>
              <button onClick={() => { window.speechSynthesis.cancel(); setShowMiniPlayer(false); }}
                className="text-white/30 hover:text-white/60"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="p-3">
              <p className="text-[10px] text-white/40 line-clamp-3 leading-relaxed">{miniPlayerMsg.slice(0, 120)}...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ TUTORIAL OVERLAY ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          >
            <motion.div
              key={tutorialStep}
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="w-full max-w-sm rounded-3xl p-8 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0e0e1c 0%, #12121f 100%)', border: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.1)' }}
            >
              {/* Progress dots */}
              <div className="flex items-center gap-1.5 mb-6">
                {TUTORIAL_STEPS.map((_, i) => (
                  <div key={i} className="h-1 rounded-full transition-all duration-500"
                    style={{ width: i === tutorialStep ? '24px' : '6px', background: i <= tutorialStep ? '#6366f1' : 'rgba(255,255,255,0.1)' }} />
                ))}
                <button onClick={completeTutorial} className="ml-auto text-[10px] text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest font-bold">
                  Passer
                </button>
              </div>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5 mx-auto"
                style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
              >
                {TUTORIAL_STEPS[tutorialStep].icon}
              </motion.div>

              <h3 className="text-xl font-display font-bold text-center mb-3 leading-tight">
                {TUTORIAL_STEPS[tutorialStep].title}
              </h3>
              <p className="text-sm text-white/60 text-center leading-relaxed mb-8">
                {TUTORIAL_STEPS[tutorialStep].desc}
              </p>

              <div className="flex gap-3">
                {tutorialStep > 0 && (
                  <button onClick={() => setTutorialStep(s => s - 1)}
                    className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-medium text-white/60 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    <ChevronRight className="w-4 h-4 rotate-180" /> Retour
                  </button>
                )}
                <button
                  onClick={() => tutorialStep < TUTORIAL_STEPS.length - 1 ? setTutorialStep(s => s + 1) : completeTutorial()}
                  className="flex-1 py-3 rounded-2xl text-white text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}
                >
                  {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                    <><span>Suivant</span><ChevronRight className="w-4 h-4" /></>
                  ) : (
                    <><Check className="w-4 h-4" /><span>C'est parti !</span></>
                  )}
                </button>
              </div>

              {/* Step counter */}
              <p className="text-center text-[10px] text-white/20 mt-4 font-mono">
                {tutorialStep + 1} / {TUTORIAL_STEPS.length}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SHARE GATE ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showShareGate && !shareConfirmed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[490] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)' }}
          >
            <motion.div
              initial={{ scale: 0.85, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="w-full max-w-sm rounded-3xl p-8 text-center relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0e0e1c 0%, #14101e 100%)', border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 40px 80px rgba(0,0,0,0.8)' }}
            >
              {/* Glow */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(168,85,247,0.2) 0%, transparent 70%)' }} />

              <motion.div
                animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-5xl mb-5"
              >🔒</motion.div>

              <h2 className="text-2xl font-display font-bold mb-2">Débloquer l'accès illimité</h2>
              <p className="text-white/50 text-sm leading-relaxed mb-6">
                Tu as utilisé 5 requêtes gratuites. Pour continuer à utiliser Djiogo.ai sans limite, partage l'app à <strong className="text-white/80">5 amis</strong> !
              </p>

              {/* Share message preview */}
              <div className="p-4 rounded-2xl mb-6 text-left" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <div className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Share2 className="w-3 h-3" /> Message à partager
                </div>
                <p className="text-sm text-white/70 leading-relaxed italic">
                  "ces l'ia de FOUEGAP qu'il a programmé 🚀 https://int-lligence.vercel.app/"
                </p>
              </div>

              <div className="space-y-3">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent("ces l'ia de FOUEGAP qu'il a programmé 🚀 https://int-lligence.vercel.app/")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)', boxShadow: '0 8px 20px rgba(37,211,102,0.3)' }}
                  onClick={confirmShare}
                >
                  <span className="text-lg">📱</span> Partager sur WhatsApp
                </a>

                {/* Copy link */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("ces l'ia de FOUEGAP qu'il a programmé 🚀 https://int-lligence.vercel.app/");
                    confirmShare();
                  }}
                  className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02] bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
                >
                  <Copy className="w-4 h-4" /> Copier le lien
                </button>

                {/* Direct share API */}
                {typeof navigator.share !== 'undefined' && (
                  <button
                    onClick={() => {
                      navigator.share({ title: "Djiogo.ai", text: "ces l'ia de FOUEGAP qu'il a programmé 🚀", url: "https://int-lligence.vercel.app/" })
                        .then(confirmShare).catch(() => {});
                    }}
                    className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl font-bold text-sm transition-all hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 8px 20px rgba(99,102,241,0.3)' }}
                  >
                    <Share2 className="w-4 h-4" /> Partager maintenant
                  </button>
                )}
              </div>

              <p className="text-[10px] text-white/20 mt-5">
                L'accès sera débloqué automatiquement après le partage ✨
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ CODE PREVIEW MODAL ════════════════════════════════════════════ */}
      <AnimatePresence>
        {codePreview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[480] flex flex-col"
            style={{ background: 'rgba(0,0,0,0.96)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10" style={{ background: 'rgba(10,10,15,0.9)' }}>
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">Préview — {codePreview.lang.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { navigator.clipboard.writeText(codePreview.code); setNotification("✅ Copié !"); }}
                  className="px-3 py-1.5 rounded-lg text-[11px] bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 transition-all flex items-center gap-1.5">
                  <Copy className="w-3 h-3" /> Copier
                </button>
                <button onClick={() => setCodePreview(null)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>
            </div>
            {/* Preview iframe */}
            <div className="flex-1 relative">
              {(codePreview.lang === 'html') ? (
                <iframe
                  srcDoc={codePreview.code}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                  title="Code Preview"
                  style={{ background: 'white' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-white/40">
                    <Code2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Préview disponible pour HTML uniquement</p>
                    <p className="text-xs mt-1 text-white/20">JSX/TSX nécessite un bundler</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Studio — outside App render tree via portal-like AnimatePresence */}
      <AnimatePresence>
        {showImageStudio && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowImageStudio(false); }}
          >
            <motion.div initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }}
              className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0d0d1f 0%, #0a0a15 100%)', border: '1px solid rgba(99,102,241,0.2)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                    <ImagePlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-lg">Studio d'Images IA</h2>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest">Génération • Modèle FLUX</p>
                  </div>
                </div>
                <button onClick={() => setShowImageStudio(false)} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>
              <div className="p-6 border-b border-white/5">
                <div className="flex gap-3">
                  <textarea
                    value={studioPrompt}
                    onChange={e => { e.stopPropagation(); setStudioPrompt(e.target.value); }}
                    onKeyDown={e => {
                      e.stopPropagation();
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generateStudioImage(); }
                    }}
                    onClick={e => e.stopPropagation()}
                    onFocus={e => e.stopPropagation()}
                    placeholder="Décris l'image à créer... ex: un tigre blanc dans une forêt de bambous"
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-indigo-500/60 transition-all placeholder:text-white/20 min-h-[60px]"
                    rows={2}
                    autoComplete="off"
                  />
                  <button onClick={() => generateStudioImage()} disabled={!studioPrompt.trim() || studioLoading}
                    className={cn("px-6 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all shrink-0",
                      studioLoading ? "bg-white/5 text-white/20 cursor-not-allowed" : "text-white shadow-lg hover:scale-105"
                    )}
                    style={!studioLoading ? { background: 'linear-gradient(135deg, #6366f1, #a855f7)' } : {}}
                  >
                    {studioLoading
                      ? <><div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" /><span>En cours...</span></>
                      : <><Sparkles className="w-4 h-4" /><span>Générer</span></>}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["Portrait cinématique", "Paysage fantastique", "Architecture futuriste", "Nature macro HD", "Art abstrait coloré"].map(p => (
                    <button key={p} onClick={() => setStudioPrompt(p)}
                      className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/50 hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-300 transition-all">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {studioLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-5">
                    <div className="relative w-20 h-20">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-500 border-r-purple-500" />
                      <div className="absolute inset-3 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f120, #a855f720)' }}>
                        <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-white/70 text-sm font-medium mb-3">Génération en cours...</p>
                      <div className="w-64 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7)' }}
                          animate={{ width: `${studioProgress}%` }} transition={{ duration: 0.5 }} />
                      </div>
                      <p className="text-white/30 text-[10px] mt-2 uppercase tracking-widest">Modèle FLUX • {Math.round(studioProgress)}%</p>
                    </div>
                  </div>
                )}
                {generatedImages.length === 0 && !studioLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                      <ImagePlus className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-white/30 text-sm">Tes images générées apparaîtront ici</p>
                    <p className="text-white/15 text-xs mt-1">Jusqu'à 20 images sauvegardées automatiquement</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {generatedImages.map((img, i) => (
                      <motion.div key={img.ts} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                        className="relative group rounded-2xl overflow-hidden bg-white/5 border border-white/10 aspect-square cursor-pointer"
                        onClick={() => setPreviewImage(img.dataUrl)}
                      >
                        <img src={img.dataUrl} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                          <p className="text-[10px] text-white/80 line-clamp-2">{img.prompt}</p>
                          <div className="flex gap-2 mt-2">
                            <button onClick={e => { e.stopPropagation(); setPreviewImage(img.dataUrl); }}
                              className="flex-1 py-1 rounded-lg bg-white/20 text-[10px] text-white font-bold hover:bg-white/30 transition-all">Voir</button>
                            <button onClick={e => { e.stopPropagation(); const a = document.createElement('a'); a.href = img.dataUrl; a.download = `djiogo-${img.ts}.jpg`; a.click(); }}
                              className="px-3 py-1 rounded-lg bg-indigo-500/60 text-[10px] text-white font-bold hover:bg-indigo-500 transition-all">↓</button>
                            <button onClick={e => { e.stopPropagation(); setGeneratedImages(prev => prev.filter(x => x.ts !== img.ts)); }}
                              className="px-2 py-1 rounded-lg bg-rose-500/30 text-[10px] text-rose-300 font-bold hover:bg-rose-500/60 transition-all">✕</button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot */}
      <motion.div drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} className="fixed bottom-24 right-8 z-[100] cursor-grab active:cursor-grabbing">
        <AnimatePresence>
          {mascotMessage && (
            <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 10 }} className="absolute bottom-full right-0 mb-4 w-48 p-3 rounded-2xl bg-white text-indigo-900 text-[10px] font-bold shadow-2xl border-2 border-indigo-500">
              <div className="absolute bottom-[-8px] right-6 w-4 h-4 bg-white border-r-2 border-b-2 border-indigo-500 rotate-45" />
              {mascotMessage}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="relative group">
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 3, repeat: Infinity }} className="absolute inset-0 bg-indigo-500 rounded-full blur-2xl" />
          <motion.div whileHover={{ scale: 1.1 }} className="relative w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center overflow-hidden shadow-xl border-2 border-white/20">
            <div className="absolute inset-0 opacity-60">
              {[...Array(40)].map((_, i) => (
                <motion.div key={i} animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.3, 1] }} transition={{ duration: 1.5 + Math.random(), repeat: Infinity, delay: Math.random() }} style={{ position: 'absolute', left: '50%', top: '50%', width: '1px', height: '25px', background: 'linear-gradient(to top, transparent, white)', transformOrigin: 'bottom center', transform: `rotate(${i * 9}deg) translateY(-32px)` }} />
              ))}
            </div>
            <div className="relative z-10 flex gap-2">
              <motion.div animate={{ scaleY: [1, 1, 0.1, 1, 1] }} transition={{ duration: 4, repeat: Infinity }} className="w-2 h-2 bg-white rounded-full" />
              <motion.div animate={{ scaleY: [1, 1, 0.1, 1, 1] }} transition={{ duration: 4, repeat: Infinity }} className="w-2 h-2 bg-white rounded-full" />
            </div>
            <motion.div animate={{ height: mascotMessage ? [2, 6, 2] : 2 }} transition={{ duration: 0.2, repeat: Infinity }} className="absolute bottom-4 w-4 bg-white rounded-full" />
          </motion.div>
        </div>
      </motion.div>

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className={cn("absolute top-[-10%] left-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full", theme === 'cyber' ? "bg-cyan-500/20" : isDarkMode ? "bg-indigo-500/10" : "bg-indigo-500/5")} />
        <div className={cn("absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] blur-[120px] rounded-full", theme === 'cyber' ? "bg-fuchsia-500/20" : isDarkMode ? "bg-purple-500/10" : "bg-purple-500/5")} />
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2">
            <Sparkles className="w-3 h-3" />{notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="fixed md:relative z-50 h-full w-[280px] flex flex-col overflow-hidden" style={{ background: 'rgba(8,8,14,0.96)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)', borderRight: '1px solid rgba(255,255,255,0.08)', boxShadow: '10px 0 40px rgba(0,0,0,0.7)' }}>
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Cpu className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <h1 className="font-display font-bold text-xl tracking-tight leading-none">Djiogo<span className="text-indigo-400">.ai</span></h1>
                  <span className="text-[10px] text-white/30 font-bold tracking-widest uppercase">Gomez.ai Ecosystem</span>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 hover:bg-white/5 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="px-4 mb-6">
              <button onClick={clearChat} className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-3 text-sm font-medium group">
                <Plus className="w-4 h-4 text-indigo-400 group-hover:rotate-90 transition-transform" />
                Nouvelle Session
              </button>
            </div>

            {/* Powered by Groq badge */}
            <div className="mx-4 mb-4 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center gap-2">
              <Zap className="w-3 h-3 text-orange-400" />
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Powered by Groq LPU™</span>
            </div>

            <div className="flex-1 px-4 overflow-y-auto space-y-6 py-4 scrollbar-hide">
              <div className="p-4 rounded-xl glass-card border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Quote className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Inspiration</span>
                </div>
                <p className="text-[10px] italic text-white/60 leading-relaxed">"L'innovation distingue un leader d'un suiveur." — Steve Jobs</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-3 h-3 text-indigo-400" />
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Dossier</span>
                  </div>
                </div>
                <select value={currentFolder} onChange={(e) => setCurrentFolder(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white/60 focus:outline-none focus:border-indigo-500 transition-all">
                  <option value="Général">Général</option>
                  <option value="Projets">Projets</option>
                  <option value="Études">Études</option>
                  <option value="Personnel">Personnel</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <Wand2 className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Personnalité</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['sophisticated', 'creative', 'technical', 'friendly'] as Persona[]).map((p) => (
                    <button key={p} onClick={() => setPersona(p)} className={cn("p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border", persona === p ? "bg-indigo-500 border-indigo-500 text-white shadow-lg" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10")}>
                      {p === 'sophisticated' ? 'Élégant' : p === 'creative' ? 'Créatif' : p === 'technical' ? 'Expert' : 'Ami'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tous les utilisateurs sont Pro */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Accès Pro — Gratuit</div>
                  <div className="text-[10px] text-indigo-400/60">Toutes les fonctionnalités débloquées</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <History className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Sessions Récentes</span>
                </div>
                {messages.length > 0 ? (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 flex items-center gap-2">
                    <MessageSquare className="w-3 h-3 text-indigo-400" />
                    <span className="truncate">Conversation active</span>
                  </div>
                ) : (
                  <div className="px-2 py-2 text-xs text-white/20 italic">Aucune session active</div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 px-2">
                  <Save className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Compte Local</span>
                </div>
                <div className="space-y-2">
                  <label className="w-full p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs text-white/60 flex items-center gap-2 transition-colors cursor-pointer">
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span className="truncate">{userAccount ? userAccount.name : "Charger mon compte"}</span>
                    <input type="file" accept=".djiogo" onChange={loadAccountData} className="hidden" />
                  </label>
                  {messages.length > 0 && (
                    <button onClick={saveAccountData} className="w-full p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2 transition-colors">
                      <Save className="w-3.5 h-3.5" /> Sauvegarder
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4" onMouseEnter={() => setShowMascotHelp(true)} onMouseLeave={() => setShowMascotHelp(false)}>
                <div className="flex items-center gap-2 px-2">
                  <Settings className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Outils & Réglages</span>
                </div>

                <div className="relative mb-2">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/20" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Chercher dans le chat..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-[11px] focus:outline-none focus:border-indigo-500 transition-all" />
                </div>

                <div className="space-y-1">
                  <button onClick={summarizeChat} className="w-full p-2 rounded-lg hover:bg-white/5 text-xs text-white/60 flex items-center gap-2 transition-colors">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Résumer la discussion
                  </button>
                  <button onClick={regenerateLastResponse} disabled={messages.length < 2} className="w-full p-2 rounded-lg hover:bg-white/5 text-xs text-white/60 flex items-center gap-2 transition-colors disabled:opacity-30">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Régénérer la réponse
                  </button>
                  <button onClick={() => setShowStats(true)} className="w-full p-2 rounded-lg hover:bg-white/5 text-xs text-white/60 flex items-center gap-2 transition-colors">
                    <BarChart2 className="w-3.5 h-3.5 text-indigo-400" /> Statistiques de la session
                  </button>
                  <div className="grid grid-cols-3 gap-1 pt-1">
                    <button onClick={exportPDF} className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300 font-bold flex items-center gap-1 justify-center hover:bg-rose-500/20 transition-all">
                      <FileDown className="w-3 h-3" /> PDF
                    </button>
                    <button onClick={exportWord} className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300 font-bold flex items-center gap-1 justify-center hover:bg-blue-500/20 transition-all">
                      <FileText className="w-3 h-3" /> Word
                    </button>
                    <button onClick={exportTXT} className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 font-bold flex items-center gap-1 justify-center hover:bg-emerald-500/20 transition-all">
                      <Hash className="w-3 h-3" /> TXT
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <Languages className="w-3 h-3 text-indigo-400" />
                      <span className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Traduction</span>
                    </div>
                    <select value={translationLang || ''} onChange={(e) => setTranslationLang(e.target.value || null)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white/60 focus:outline-none focus:border-indigo-500 hover:bg-white/10 transition-all">
                      <option value="">Désactivée</option>
                      <option value="en">Anglais</option>
                      <option value="es">Espagnol</option>
                      <option value="de">Allemand</option>
                      <option value="zh">Chinois</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <Palette className="w-3 h-3 text-indigo-400" />
                      <span className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Thème</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {(['dark', 'light', 'glass', 'cyber'] as const).map(t => (
                        <button key={t} onClick={() => setTheme(t)} className={cn("py-1.5 rounded text-[9px] font-bold uppercase transition-all border", theme === t ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10")}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-2">
                      <Type className="w-3 h-3 text-indigo-400" />
                      <span className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Police</span>
                    </div>
                    <div className="flex gap-1">
                      {(['xs', 'sm', 'base', 'lg'] as const).map(size => (
                        <button key={size} onClick={() => setFontSize(size)} className={cn("flex-1 py-1.5 rounded text-[9px] font-bold uppercase transition-all border", fontSize === size ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10")}>
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => setShowThinking(!showThinking)} className="w-full p-2 rounded-lg hover:bg-white/5 text-xs text-white/60 flex items-center gap-2 transition-colors">
                    <BrainCircuit className={cn("w-3.5 h-3.5", showThinking ? "text-indigo-400" : "text-white/20")} />
                    <span className="text-[11px]">{showThinking ? 'Cacher' : 'Voir'} la réflexion</span>
                  </button>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 px-2">
                      <Mic className="w-3 h-3 text-indigo-400" />
                      <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Conversation</span>
                    </div>
                    <button onClick={() => setIsAutoSpeak(!isAutoSpeak)} className={cn("w-full p-3 rounded-xl flex items-center gap-3 transition-all border", isAutoSpeak ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-lg" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10")}>
                      <Mic className={cn("w-4 h-4", isAutoSpeak && "animate-pulse")} />
                      <span className="text-xs font-medium">Mains Libres {isAutoSpeak ? 'ON' : 'OFF'}</span>
                    </button>

                    {availableVoices.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 px-2">
                          <Volume2 className="w-3 h-3 text-indigo-400" />
                          <span className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Voix</span>
                        </div>
                        <select value={selectedVoice || ''} onChange={(e) => setSelectedVoice(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white/60 focus:outline-none focus:border-indigo-500 hover:bg-white/10 transition-all">
                          <option value="">Voix par défaut</option>
                          {availableVoices.map(voice => (
                            <option key={voice.name} value={voice.name}>{voice.name} ({voice.lang})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Langue de reconnaissance vocale */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-2">
                        <Globe className="w-3 h-3 text-indigo-400" />
                        <span className="text-[8px] text-white/20 uppercase tracking-widest font-bold">Langue du micro</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {voiceLangs.map(l => (
                          <button key={l.code} onClick={() => setVoiceLang(l.code)}
                            className={cn("py-1.5 px-2 rounded-lg text-[9px] font-bold transition-all border", voiceLang === l.code ? "bg-indigo-500 border-indigo-500 text-white" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10")}>
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[8px] text-white/20 uppercase tracking-widest font-bold px-2">
                          <div className="flex items-center gap-2"><Activity className="w-3 h-3 text-indigo-400" /><span>Vitesse</span></div>
                          <span>{voiceSpeed}x</span>
                        </div>
                        <input type="range" min="0.5" max="2" step="0.1" value={voiceSpeed} onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[8px] text-white/20 uppercase tracking-widest font-bold px-2">
                          <div className="flex items-center gap-2"><Zap className="w-3 h-3 text-indigo-400" /><span>Tonalité</span></div>
                          <span>{voicePitch}x</span>
                        </div>
                        <input type="range" min="0.5" max="2" step="0.1" value={voicePitch} onChange={(e) => setVoicePitch(parseFloat(e.target.value))} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <div className="flex items-center justify-between text-[8px] text-white/20 uppercase tracking-widest font-bold px-2">
                      <div className="flex items-center gap-2"><Cpu className="w-3 h-3 text-indigo-400" /><span>État des Noyaux</span></div>
                      <div className="flex gap-1">
                        {apiStatus.map((status, i) => (
                          <div key={i} className={cn("w-1.5 h-1.5 rounded-full", status ? "bg-emerald-500" : "bg-rose-500")} />
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      {!isAdmin ? (
                        <div className="space-y-3 px-2">
                          <button onClick={() => setShowAdminInput(!showAdminInput)} className="text-[10px] text-white/20 hover:text-white/40 transition-colors uppercase tracking-widest font-bold flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3" /> Accès Système
                          </button>
                          {showAdminInput && (
                            <div className="flex gap-2">
                              <input type="password" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} placeholder="Code..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none focus:border-indigo-500" />
                              <button onClick={() => {
                                if (adminCode === (import.meta.env.VITE_ADMIN_CODE || '2027')) {
                                  setIsAdmin(true);
                                  setShowAdminInput(false);
                                  setNotification("Accès Administrateur Activé");
                                } else {
                                  setAdminCode('');
                                }
                              }} className="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold">OK</button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[10px] text-indigo-400 font-bold uppercase tracking-widest px-2">
                          <Cpu className="w-3 h-3" /> Mode Admin Actif
                          <button onClick={() => setShowAdminDashboard(!showAdminDashboard)} className="ml-auto p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                            <Activity className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isAdmin && showAdminDashboard && (
              <div className="p-4 border-t border-white/5 bg-indigo-500/5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3" /> Dashboard Gomez.ai
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-[8px] text-white/40 uppercase">Requêtes Total</div>
                    <div className="text-lg font-display font-bold">1,284</div>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className="text-[8px] text-white/40 uppercase">Utilisateurs</div>
                    <div className="text-lg font-display font-bold">42</div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 border-t border-white/5 space-y-4 glass">
              <div className="flex items-center justify-between px-2">
                <div className="flex gap-3">
                  <Github className="w-4 h-4 text-white/40 hover:text-white cursor-pointer transition-colors" />
                  <Twitter className="w-4 h-4 text-white/40 hover:text-white cursor-pointer transition-colors" />
                </div>
                <div className="text-[10px] text-white/20 font-mono">v1.1.0-groq</div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/5 glass sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <ChevronRight className={cn("w-5 h-5 transition-transform", isSidebarOpen && "rotate-180")} />
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {lastLatency && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/40">
                <Zap className="w-3 h-3 text-amber-400" />{lastLatency}ms
              </div>
            )}
            <button onClick={() => setShowStats(true)} className="hidden md:flex p-2 hover:bg-white/5 rounded-lg transition-colors text-white/30 hover:text-white/70" title="Statistiques">
              <BarChart2 className="w-4 h-4" />
            </button>
            <button onClick={toggleFullscreen} className="hidden md:flex p-2 hover:bg-white/5 rounded-lg transition-colors text-white/30 hover:text-white/70" title="Plein écran">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowShareGate(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all hover:scale-105 active:scale-95 text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 4px 12px rgba(168,85,247,0.3)' }}
              title="Partager l'app"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Partager</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Groq Actif</span>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 py-8 md:px-8">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="fixed top-20 left-1/2 -translate-x-1/2 pointer-events-none opacity-[0.05] select-none z-0 text-center">
              <h1 className="text-[12vw] font-display font-black uppercase tracking-tighter leading-none">Djiogo.ai</h1>
            </div>

            {messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20 mb-8">
                  <Sparkles className="w-10 h-10 text-white animate-pulse" />
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight px-4">Bonjour, je suis <span className="gradient-text">Djiogo.ai</span></h2>
                <p className="text-white/40 max-w-md mx-auto leading-relaxed px-6 text-sm md:text-base">
                  Votre assistant intelligent ultra-rapide, propulsé par Groq. Comment puis-je vous accompagner ?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-8 px-6">
                  {["Qui est mon créateur ?", "Analyse une image pour moi", "Optimise mon code React", "Idées de design minimaliste"].map((suggestion) => (
                    <button key={suggestion} onClick={() => setInput(suggestion)} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-sm text-left text-white/60 hover:text-white">
                      {suggestion}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())).map((message, index) => (
                <>
                <InlineAdBanner index={index} key={`ad-${message.id}`} />
                <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-4 group", message.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1", message.role === 'user' ? "bg-white/10" : "bg-gradient-to-br from-indigo-500 to-purple-600")}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn("max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed relative", message.role === 'user' ? "bg-white/5 border border-white/10 text-white/90" : "bg-white/5 border border-white/10 text-white/80 shadow-[0_0_20px_rgba(99,102,241,0.05)]")}>
                    {message.role === 'assistant' && (
                      <div className={cn("absolute -left-1 top-4 w-0.5 h-4 rounded-full", accentColor === 'indigo' ? "bg-indigo-500" : accentColor === 'emerald' ? "bg-emerald-500" : "bg-rose-500")} />
                    )}

                    {message.image && (
                      <div className="mb-3 rounded-xl overflow-hidden border border-white/10 bg-white/5">
                        <img
                          src={message.image}
                          alt="Image générée"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full max-h-96 object-contain cursor-zoom-in transition-opacity duration-500"
                          style={{ minHeight: '200px' }}
                          onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                          onError={e => {
                            const el = e.target as HTMLImageElement;
                            el.style.opacity = '0.3';
                            el.alt = "⚠️ Image en cours de génération, patiente quelques secondes puis rafraîchis";
                          }}
                          onClick={() => setPreviewImage(message.image!)}
                        />
                      </div>
                    )}

                    <MessageContent content={message.content} onCodePreview={(c, l) => setCodePreview({ code: c, lang: l })} />

                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {message.suggestions.map((s, i) => (
                          <button key={i} onClick={() => handleSend(s)} className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300 hover:bg-indigo-500/20 transition-all flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> {s}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quick action row — visible on hover for all messages */}
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button onClick={() => toggleLike(message.id)} title="J'aime"
                        className={cn("p-1 rounded-md transition-all text-[10px]", likedMessages.includes(message.id) ? "text-rose-400" : "text-white/20 hover:text-rose-300")}>
                        <Heart className={cn("w-3 h-3", likedMessages.includes(message.id) && "fill-current")} />
                      </button>
                      <button onClick={() => togglePin(message.id)} title="Épingler"
                        className={cn("p-1 rounded-md transition-all", pinnedMessages.includes(message.id) ? "text-amber-400" : "text-white/20 hover:text-amber-300")}>
                        <Bookmark className={cn("w-3 h-3", pinnedMessages.includes(message.id) && "fill-current")} />
                      </button>
                      <button onClick={() => quoteMessage(message.content)} title="Citer"
                        className="p-1 rounded-md text-white/20 hover:text-white/60 transition-all">
                        <Quote className="w-3 h-3" />
                      </button>
                      {message.role === 'assistant' && (
                        <>
                          <button onClick={() => summarizeMessage(message.content)} title="Résumer"
                            className="p-1 rounded-md text-white/20 hover:text-indigo-300 transition-all text-[10px] font-bold">∑</button>
                          <button onClick={() => continueMessage(message.content)} title="Continuer"
                            className="p-1 rounded-md text-white/20 hover:text-emerald-300 transition-all">
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          <button onClick={() => translateMessage(message.content, 'anglais')} title="Traduire EN"
                            className="p-1 rounded-md text-white/20 hover:text-cyan-300 transition-all text-[8px] font-bold">EN</button>
                        </>
                      )}
                      <span className="ml-auto text-[8px] text-white/15 font-mono">
                        ~{estimateTokens(message.content)} tok
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/5">
                      {message.sentiment && (
                        <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider", message.sentiment === 'positive' ? "bg-emerald-500/10 text-emerald-400" : message.sentiment === 'negative' ? "bg-rose-500/10 text-rose-400" : "bg-white/5 text-white/40")}>
                          {message.sentiment === 'positive' ? <Smile className="w-3 h-3" /> : message.sentiment === 'negative' ? <X className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                          {message.sentiment}
                        </div>
                      )}
                      <div className="text-[10px] text-white/20 font-mono">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>

                    {message.role === 'assistant' && showThinking && message.thinkingSteps && (
                      <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-[8px] font-bold uppercase tracking-widest text-white/20">
                          <BrainCircuit className="w-2.5 h-2.5" /> Étapes de réflexion
                        </div>
                        {message.thinkingSteps.map((step, i) => (
                          <div key={i} className="flex items-center gap-2 text-[9px] text-white/40">
                            <div className="w-1 h-1 rounded-full bg-indigo-500" />{step}
                          </div>
                        ))}
                      </div>
                    )}

                    {message.role === 'assistant' && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        {/* Row 1: icon actions */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex gap-1">
                            <button onClick={() => speakMessage(message.content, message.id)}
                              className={cn("p-1.5 rounded-lg transition-all", isSpeaking === message.id ? "bg-indigo-500/20 text-indigo-400" : "hover:bg-white/5 text-white/30 hover:text-white/70")}
                              title="Lire à voix haute">
                              <Volume2 className={cn("w-3.5 h-3.5", isSpeaking === message.id && "animate-pulse")} />
                            </button>
                            <button onClick={() => { navigator.clipboard.writeText(message.content); setNotification("✅ Copié !"); }}
                              className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/70 transition-all" title="Copier">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="text-[8px] text-white/20 font-mono">
                            <Clock className="w-2 h-2 inline mr-1" />
                            ~{Math.ceil(message.content.split(' ').length / 200)}min
                          </div>
                        </div>
                        {/* Row 2: Export buttons — clear & visible */}
                        <div className="flex gap-2">
                          <button onClick={() => exportSinglePDF(message)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105 active:scale-95 border border-rose-500/30 text-rose-300 bg-rose-500/10 hover:bg-rose-500/20">
                            <FileDown className="w-3 h-3" /> PDF
                          </button>
                          <button onClick={() => exportSingleWord(message)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105 active:scale-95 border border-blue-500/30 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20">
                            <FileText className="w-3 h-3" /> Word
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
                </>
              ))
            )}

            {isLoading && (
              <div className="flex gap-4">
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                    <Bot className="w-6 h-6 text-indigo-400 animate-pulse" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest ml-1">Groq génère...</span>
                    <button onClick={stopGeneration} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all flex items-center gap-2 group">
                      <Square className="w-3 h-3 fill-current" />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Arrêter</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence>
              {isAutoSpeak && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
                  style={{ background: 'radial-gradient(ellipse at center, #0d0d1a 0%, #050508 100%)' }}
                >
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-[-50%] opacity-20 pointer-events-none"
                    style={{ background: 'conic-gradient(from 0deg, #6366f100, #6366f133, #a855f733, #6366f100)' }}
                  />

                  {/* Live transcript */}
                  <AnimatePresence>
                    {(isListening || input) && (
                      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="absolute top-16 left-1/2 -translate-x-1/2 max-w-md w-full mx-4 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Transcription en direct</span>
                        </div>
                        <p className="text-sm text-white/80 min-h-[20px]">
                          {input || <span className="text-white/20 italic">En attente de votre voix...</span>}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Countdown removed */}

                  <div className="flex flex-col items-center gap-8 relative z-10">
                    <VoiceOrb isListening={isListening} isSpeaking={!!isSpeaking} accentColor={accentColor} />

                    <div className="flex flex-col items-center gap-3 text-center">
                      <motion.div key={isListening ? 'l' : isSpeaking ? 's' : 'i'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <span className={cn("text-2xl font-light tracking-tight", isListening ? "text-red-300" : isSpeaking ? "text-indigo-300" : "text-white/60")}>
                          {isListening ? "Je vous écoute..." : isSpeaking ? "Djiogo.ai répond..." : "Appuyez sur le micro"}
                        </span>
                        <motion.div animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
                          className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/30 mt-1"
                        >
                          {isListening ? "● Silence détecté = envoi auto" : isSpeaking ? "◉ Lecture en cours" : "○ Mode assistant vocal"}
                        </motion.div>
                      </motion.div>

                      {/* Sound wave bars */}
                      <div className="flex items-center gap-1 h-8 mt-2">
                        {[...Array(20)].map((_, i) => (
                          <motion.div key={i}
                            animate={{ height: isListening || isSpeaking ? [4, 4+Math.sin(i*0.9)*20+10, 4] : 4, opacity: isListening || isSpeaking ? [0.4, 1, 0.4] : 0.15 }}
                            transition={{ duration: 0.5+(i%5)*0.1, repeat: Infinity, delay: i*0.04 }}
                            className="w-1 rounded-full"
                            style={{ background: 'linear-gradient(to top, #6366f1, #a855f7)' }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-5 mt-2">
                      <button onClick={isListening ? stopVoiceInput : startVoiceInput}
                        className={cn("w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all shadow-lg",
                          isListening ? "bg-red-500 border-red-400 shadow-red-500/40 scale-110 animate-pulse" : "bg-indigo-600 border-indigo-400 shadow-indigo-500/40 hover:scale-105"
                        )}>
                        <Mic className="w-7 h-7 text-white" />
                      </button>
                      <button onClick={() => { stopVoiceInput(); window.speechSynthesis.cancel(); setIsSpeaking(null); setIsAutoSpeak(false); }}
                        className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/20 hover:bg-white/15 transition-all">
                        <X className="w-5 h-5 text-white/70" />
                      </button>
                      <button onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(null); }}
                        className={cn("w-12 h-12 rounded-full flex items-center justify-center border transition-all",
                          isSpeaking ? "bg-indigo-500/30 border-indigo-500/60 text-indigo-300 shadow-lg shadow-indigo-500/20" : "bg-white/5 border-white/10 text-white/30"
                        )}>
                        <Square className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                    <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Djiogo.ai Voice • Powered by Groq LPU™</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 md:pb-10">
          <div className="max-w-4xl mx-auto relative">
            {selectedImage && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="absolute bottom-full mb-4 left-0 p-2 glass rounded-xl flex items-center gap-3 z-30">
                <img src={selectedImage} alt="Preview" referrerPolicy="no-referrer" className="w-12 h-12 object-cover rounded-lg border border-white/10 cursor-zoom-in" onClick={() => setPreviewImage(selectedImage)} />
                <div className="text-[10px] md:text-xs text-white/60">Image prête pour analyse (Vision Llama 4)</div>
                <button onClick={() => setSelectedImage(null)} className="p-1 hover:bg-white/10 rounded-full"><X className="w-4 h-4" /></button>
              </motion.div>
            )}

            <div className={cn("absolute inset-0 blur-2xl rounded-full opacity-10 pointer-events-none transition-colors", accentColor === 'indigo' ? "bg-indigo-500" : accentColor === 'emerald' ? "bg-emerald-500" : "bg-rose-500")} />

            <div className="relative glass rounded-2xl p-1 md:p-1.5 flex items-end gap-1 md:gap-1.5 shadow-2xl border border-white/10">
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              <div className="flex items-center gap-1">
                <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-colors" title="Analyser une image (Vision)">
                  <ImageIcon className="w-4 h-4" />
                </button>
                {/* Bouton Studio — très visible */}
                <button
                  onClick={() => setShowImageStudio(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs text-white shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95 transition-all"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
                  title="Studio d'Images IA"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Images</span>
                </button>
              </div>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Posez votre question à Djiogo.ai..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-xs md:text-sm py-2 px-1 resize-none max-h-24 md:max-h-32 min-h-[36px] md:min-h-[40px] placeholder:text-white/20"
                rows={1}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />

              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setIsAutoSpeak(true); setTimeout(() => startVoiceInput(), 300); }}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-lg hover:scale-105 active:scale-95",
                    isListening ? "bg-red-500 text-white shadow-red-500/40 animate-pulse" :
                    isAutoSpeak ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/50" :
                    "text-white shadow-emerald-500/30"
                  )}
                  style={!isListening && !isAutoSpeak ? { background: 'linear-gradient(135deg, #059669, #10b981)' } : {}}
                  title="Assistant Vocal"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isListening ? "..." : "Vocal"}</span>
                </button>
                <button onClick={() => handleSend()} disabled={(!input.trim() && !selectedImage) || isLoading}
                  className={cn("p-2.5 rounded-xl transition-all flex items-center justify-center",
                    (input.trim() || selectedImage) && !isLoading
                      ? `${accentColor === 'indigo' ? "bg-indigo-500" : accentColor === 'emerald' ? "bg-emerald-500" : "bg-rose-500"} text-white shadow-lg`
                      : "bg-white/5 text-white/10 cursor-not-allowed"
                  )}>
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[8px] md:text-[9px] text-center text-white/10 mt-3 uppercase tracking-[0.2em] font-bold">
              Djiogo.ai • Powered by Groq LPU™ • Gomez.ai Ecosystem
            </p>

          </div>
        </div>
      </main>

      <AnimatePresence>
        {previewImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewImage(null)} className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out">
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} src={previewImage} alt="Full Preview" referrerPolicy="no-referrer" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            <button onClick={() => setPreviewImage(null)} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            {previewImage && (
              <a href={previewImage} download={`djiogo-${Date.now()}.jpg`} onClick={e => e.stopPropagation()}
                className="absolute bottom-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-all">
                <Download className="w-4 h-4" /> Télécharger
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Modal */}
      <AnimatePresence>
        {showStats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-xl p-4"
            onClick={() => setShowStats(false)}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-3xl p-8 border border-white/10"
              style={{ background: 'linear-gradient(135deg, #0d0d1f, #0a0a15)' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-xl">Statistiques</h3>
                <button onClick={() => setShowStats(false)} className="p-2 hover:bg-white/5 rounded-xl"><X className="w-4 h-4 text-white/40" /></button>
              </div>
              {(() => { const s = getChatStats(); return (
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Total messages', val: s.total, color: '#6366f1' },
                    { label: 'Vos messages', val: s.userMsgs, color: '#22d3ee' },
                    { label: 'Réponses IA', val: s.aiMsgs, color: '#a855f7' },
                    { label: 'Mots échangés', val: s.totalWords, color: '#f59e0b' },
                    { label: 'Images envoyées', val: s.images, color: '#f43f5e' },
                    { label: 'Épinglés', val: pinnedMessages.length, color: '#10b981' },
                  ].map(item => (
                    <div key={item.label} className="p-4 rounded-2xl border border-white/5" style={{ background: item.color + '11' }}>
                      <div className="text-2xl font-display font-black" style={{ color: item.color }}>{item.val}</div>
                      <div className="text-[10px] text-white/40 mt-1">{item.label}</div>
                    </div>
                  ))}
                </div>
              ); })()}
              <div className="mt-6 flex gap-3">
                <button onClick={() => { exportTXT(); setShowStats(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/60 hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Export TXT
                </button>
                <button onClick={() => { shareChat(); setShowStats(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-xs font-bold text-indigo-300 hover:bg-indigo-500/30 transition-all flex items-center justify-center gap-2">
                  <Share2 className="w-3.5 h-3.5" /> Partager
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toolbar — bottom center on mobile */}
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1, type: 'spring' }}
        className="fixed bottom-28 right-4 z-[90] flex flex-col gap-2 md:hidden"
      >
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={toggleFullscreen}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-lg">
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => setShowStats(true)}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-lg">
          <BarChart2 className="w-4 h-4" />
        </motion.button>
        {messages.length > 2 && (
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={regenerateLastResponse}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shadow-lg">
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
