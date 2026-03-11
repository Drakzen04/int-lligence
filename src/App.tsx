/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import Groq from 'groq-sdk';
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Trash2, 
  Plus, 
  MessageSquare,
  ChevronRight,
  Github,
  Twitter,
  Cpu,
  Image as ImageIcon,
  Volume2,
  Download,
  Mic,
  ImagePlus,
  Languages,
  Zap,
  History,
  Lightbulb,
  FileText,
  Search as SearchIcon,
  Clock,
  BrainCircuit,
  Quote,
  Save,
  FileDown,
  Activity,
  Smile,
  Settings,
  FolderOpen,
  ShieldCheck,
  Wand2,
  X,
  Check,
  Palette,
  Copy,
  Square,
  Type
} from "lucide-react";
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Composant de rendu de graphes (style Claude) ─────────────────────────
const GraphRenderer = ({ graphJson }: { graphJson: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    let data: any;
    try { data = JSON.parse(graphJson); } catch { return; }
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (chartRef.current) { chartRef.current.destroy(); }

    const colors = data.datasets?.map((d: any, i: number) =>
      d.color || ['#6366f1','#22d3ee','#f59e0b','#10b981','#f43f5e'][i % 5]
    );

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js';
    script.onload = () => {
      const Chart = (window as any).Chart;
      if (!Chart || !canvasRef.current) return;
      chartRef.current = new Chart(canvasRef.current, {
        type: data.type || 'line',
        data: {
          labels: data.labels || [],
          datasets: (data.datasets || []).map((ds: any, i: number) => ({
            label: ds.label || '',
            data: ds.data || [],
            borderColor: colors[i],
            backgroundColor: data.type === 'pie' ? colors : colors[i] + '33',
            borderWidth: 2,
            tension: 0.4,
            fill: data.type === 'line',
            pointBackgroundColor: colors[i],
            pointRadius: 4,
          })),
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: '#ffffff99', font: { size: 11 } } },
            title: { display: !!data.title, text: data.title, color: '#ffffffcc', font: { size: 13, weight: 'bold' } },
          },
          scales: data.type === 'pie' ? {} : {
            x: { ticks: { color: '#ffffff66' }, grid: { color: '#ffffff11' } },
            y: { ticks: { color: '#ffffff66' }, grid: { color: '#ffffff11' } },
          },
        },
      });
    };
    if (!(window as any).Chart) {
      document.head.appendChild(script);
    } else {
      script.onload!(new Event('load'));
    }
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [graphJson]);

  return (
    <div className="my-4 p-4 rounded-2xl bg-white/5 border border-white/10">
      <canvas ref={canvasRef} height={220} />
    </div>
  );
};

// ─── Rendu du contenu avec graphes intégrés ──────────────────────────────
const MessageContent = ({ content }: { content: string }) => {
  const parts = content.split(/\[GRAPH:(.*?)\]/gs);
  return (
    <div className="markdown-body">
      {parts.map((part, i) => {
        if (i % 2 === 1) {
          return <GraphRenderer key={i} graphJson={part.trim()} />;
        }
        return (
          <Markdown key={i} components={{
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

// ─── VoiceOrb stylisé (style Perplexity / Gemini) ────────────────────────
const VoiceOrb = ({ isListening, isSpeaking, accentColor, voiceLevel = 0 }: {
  isListening: boolean;
  isSpeaking: boolean;
  accentColor: string;
  voiceLevel?: number;
}) => {
  const bars = 32;
  const baseColor = accentColor === 'emerald' ? '#10b981' : accentColor === 'rose' ? '#f43f5e' : '#6366f1';
  const secColor = accentColor === 'emerald' ? '#22d3ee' : accentColor === 'rose' ? '#f59e0b' : '#a855f7';

  return (
    <div className="relative flex flex-col items-center justify-center w-64 h-64">
      {/* Outer glow rings */}
      <motion.div
        animate={{ scale: isListening ? [1, 1.15, 1] : isSpeaking ? [1, 1.08, 1] : [1, 1.03, 1], opacity: isListening ? [0.3, 0.6, 0.3] : [0.1, 0.2, 0.1] }}
        transition={{ duration: isListening ? 0.8 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${baseColor}33 0%, transparent 70%)` }}
      />
      <motion.div
        animate={{ scale: isListening ? [1, 1.25, 1] : [1, 1.05, 1], opacity: isListening ? [0.15, 0.3, 0.15] : [0.05, 0.1, 0.05] }}
        transition={{ duration: isListening ? 0.8 : 3, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        className="absolute inset-[-20px] rounded-full"
        style={{ background: `radial-gradient(circle, ${secColor}22 0%, transparent 70%)` }}
      />

      {/* Audio bars ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[...Array(bars)].map((_, i) => {
          const angle = (i / bars) * 360;
          const isActive = isListening || isSpeaking;
          const barHeight = isActive ? 8 + Math.random() * (voiceLevel * 30 + 12) : 4;
          return (
            <motion.div
              key={i}
              animate={{ height: isActive ? [4, 4 + Math.sin(i * 0.8) * 20 + 8, 4] : 4, opacity: isActive ? [0.4, 1, 0.4] : 0.2 }}
              transition={{ duration: 0.4 + Math.random() * 0.6, repeat: Infinity, delay: (i / bars) * 0.5, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                width: '3px',
                borderRadius: '2px',
                background: `linear-gradient(to top, ${baseColor}, ${secColor})`,
                transformOrigin: 'center 110px',
                transform: `rotate(${angle}deg) translateY(-110px)`,
                height: `${barHeight}px`,
              }}
            />
          );
        })}
      </div>

      {/* Central orb */}
      <motion.div
        animate={{
          scale: isListening ? [1, 1.12, 0.95, 1] : isSpeaking ? [1, 1.06, 0.98, 1] : [1, 1.02, 1],
          borderRadius: isListening
            ? ['50%', '45% 55% 55% 45%', '55% 45% 45% 55%', '50%']
            : ['50%', '48% 52% 52% 48%', '50%'],
        }}
        transition={{ duration: isListening ? 0.6 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative w-28 h-28 flex items-center justify-center"
        style={{
          background: `radial-gradient(135deg, ${baseColor}cc 0%, ${secColor}88 50%, ${baseColor}44 100%)`,
          boxShadow: `0 0 40px ${baseColor}66, 0 0 80px ${baseColor}33, inset 0 0 30px ${secColor}22`,
        }}
      >
        {/* Inner shine */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute top-2 left-4 w-8 h-4 rounded-full bg-white/20 blur-sm" />
        </div>

        {/* Icon */}
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div key="mic" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}>
              <Mic className="w-10 h-10 text-white drop-shadow-lg" />
            </motion.div>
          ) : isSpeaking ? (
            <motion.div key="vol" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.2 }}>
              <Volume2 className="w-10 h-10 text-white drop-shadow-lg" />
            </motion.div>
          ) : (
            <motion.div key="logo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl font-black text-white italic tracking-tighter drop-shadow-lg">
              G
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

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

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices.filter(v => v.lang.startsWith('fr') || v.lang.startsWith('en')));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

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

    // ─── Génération d'images via Pollinations.ai (gratuit, sans clé API) ───────
    if (isImageGen) {
      if (!textToSend.trim()) {
        setNotification("✏️ Décris l'image que tu veux générer !");
        return;
      }

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `🎨 Génère une image : ${textToSend}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      try {
        const encodedPrompt = encodeURIComponent(textToSend);
        const seed = Math.floor(Math.random() * 999999);
        // URL directe sans crossOrigin — Pollinations bloque le preload CORS
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&enhance=true&seed=${seed}`;

        // On attend 3s que Pollinations commence à générer, puis on affiche directement
        await new Promise(resolve => setTimeout(resolve, 3000));

        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `✅ **Image générée !**\n\n**Prompt :** *${textToSend}*\n\n> 🎨 Propulsé par [Pollinations.ai](https://pollinations.ai) — Modèle FLUX`,
          timestamp: Date.now(),
          image: imageUrl,
          suggestions: [
            `Même image en style aquarelle`,
            `Même image en noir et blanc`,
            `Génère une variation de cette image`,
          ],
        }]);
      } catch (err) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "❌ **Erreur de génération.** Réessaie dans quelques secondes.",
          timestamp: Date.now(),
        }]);
      } finally {
        setIsLoading(false);
      }
      return;
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
    if (!SpeechRecognition) return alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      if (isAutoSpeak) handleSend(transcript);
    };
    recognition.start();
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

  return (
    <div className={cn(
      "flex h-screen overflow-hidden font-sans transition-all duration-700",
      theme === 'dark' ? "dark bg-[#050505] text-white" :
      theme === 'light' ? "bg-slate-50 text-slate-900" :
      theme === 'glass' ? "bg-[#0a0a0a] text-white backdrop-blur-md" :
      "bg-[#020205] text-cyan-50",
      fontSize === 'xs' ? "text-xs" : fontSize === 'sm' ? "text-sm" : fontSize === 'base' ? "text-base" : "text-lg"
    )}>
      <AnimatePresence>{showPricing && <PricingModal />}</AnimatePresence>

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
          <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="fixed md:relative z-50 h-full w-[280px] glass-sidebar flex flex-col overflow-hidden">
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
                  <div className="grid grid-cols-2 gap-1">
                    <button onClick={exportPDF} className="p-2 rounded-lg hover:bg-white/5 text-[10px] text-white/60 flex items-center gap-2 transition-colors">
                      <FileDown className="w-3 h-3" /> PDF Pro
                    </button>
                    <button onClick={exportWord} className="p-2 rounded-lg hover:bg-white/5 text-[10px] text-white/60 flex items-center gap-2 transition-colors">
                      <FileText className="w-3 h-3" /> Word
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
          <div className="flex items-center gap-4">
            {lastLatency && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/40">
                <Zap className="w-3 h-3 text-amber-400" />{lastLatency}ms
              </div>
            )}
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
              messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())).map((message) => (
                <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-4 group", message.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1", message.role === 'user' ? "bg-white/10" : "bg-gradient-to-br from-indigo-500 to-purple-600")}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn("max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed relative", message.role === 'user' ? "bg-white/5 border border-white/10 text-white/90" : "bg-white/5 border border-white/10 text-white/80 shadow-[0_0_20px_rgba(99,102,241,0.05)]")}>
                    {message.role === 'assistant' && (
                      <div className={cn("absolute -left-1 top-4 w-0.5 h-4 rounded-full", accentColor === 'indigo' ? "bg-indigo-500" : accentColor === 'emerald' ? "bg-emerald-500" : "bg-rose-500")} />
                    )}

                    {message.image && (
                      <img src={message.image} alt="Output" referrerPolicy="no-referrer" className="w-full max-h-80 object-cover rounded-xl mb-3 border border-white/10 cursor-zoom-in" onClick={() => setPreviewImage(message.image!)} />
                    )}

                    <MessageContent content={message.content} />

                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {message.suggestions.map((s, i) => (
                          <button key={i} onClick={() => handleSend(s)} className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-300 hover:bg-indigo-500/20 transition-all flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> {s}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
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
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex flex-col gap-3 w-full">
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <button onClick={() => speakMessage(message.content, message.id)} className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-white/40 hover:text-white" title="Lire à voix haute">
                                <Volume2 className={cn("w-3.5 h-3.5", isSpeaking === message.id && "text-indigo-400 animate-pulse")} />
                              </button>
                              <button onClick={() => navigator.clipboard.writeText(message.content)} className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-white/40 hover:text-white" title="Copier">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => exportSinglePDF(message)} className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-white/40 hover:text-white" title="Exporter en PDF">
                                <FileDown className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => exportSingleWord(message)} className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-white/40 hover:text-white" title="Exporter en Word">
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-[8px] text-white/20 font-bold uppercase tracking-widest">
                              <Clock className="w-2 h-2 inline mr-1" />
                              ~{Math.ceil(message.content.split(' ').length / 200)} min lecture
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
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
                  {/* Animated background gradient */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute inset-[-50%] opacity-20 pointer-events-none"
                    style={{ background: 'conic-gradient(from 0deg, #6366f100, #6366f133, #a855f733, #6366f100)' }}
                  />

                  {/* Transcript bubble */}
                  <AnimatePresence>
                    {isListening && (
                      <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-16 left-1/2 -translate-x-1/2 max-w-sm w-full mx-4 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Transcription en direct</span>
                        </div>
                        <p className="text-sm text-white/80 italic min-h-[20px]">
                          {(input || '').length > 0 ? input : <span className="text-white/20">En attente de votre voix...</span>}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Main orb */}
                  <div className="flex flex-col items-center gap-8 relative z-10">
                    <VoiceOrb isListening={isListening} isSpeaking={!!isSpeaking} accentColor={accentColor} />

                    {/* Status text */}
                    <div className="flex flex-col items-center gap-3 text-center">
                      <motion.div
                        key={isListening ? 'listening' : isSpeaking ? 'speaking' : 'idle'}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="flex flex-col items-center gap-1"
                      >
                        <span className={cn(
                          "text-2xl font-light tracking-tight",
                          isListening ? "text-red-300" : isSpeaking ? "text-indigo-300" : "text-white/60"
                        )}>
                          {isListening ? "Je vous écoute..." : isSpeaking ? "Djiogo.ai répond..." : "Dites quelque chose"}
                        </span>
                        <motion.span
                          animate={{ opacity: [0.3, 0.8, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/30"
                        >
                          {isListening ? "● Microphone actif" : isSpeaking ? "◉ Synthèse vocale" : "○ Mode mains libres"}
                        </motion.span>
                      </motion.div>

                      {/* Sound wave bars (decorative) */}
                      <div className="flex items-center gap-1 h-8 mt-2">
                        {[...Array(20)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              height: isListening || isSpeaking
                                ? [4, 4 + Math.sin(i * 0.9) * 20 + 10, 4]
                                : 4,
                              opacity: isListening || isSpeaking ? [0.4, 1, 0.4] : 0.15,
                            }}
                            transition={{ duration: 0.5 + (i % 5) * 0.1, repeat: Infinity, delay: i * 0.04, ease: 'easeInOut' }}
                            className="w-1 rounded-full"
                            style={{ background: `linear-gradient(to top, #6366f1, #a855f7)` }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4 mt-4">
                      <button
                        onClick={startVoiceInput}
                        className={cn(
                          "w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all",
                          isListening
                            ? "bg-red-500 border-red-400 shadow-lg shadow-red-500/40 scale-110"
                            : "bg-white/10 border-white/20 hover:bg-white/20"
                        )}
                      >
                        <Mic className="w-6 h-6 text-white" />
                      </button>

                      <button
                        onClick={() => setIsAutoSpeak(false)}
                        className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/15 transition-all"
                        title="Fermer"
                      >
                        <X className="w-5 h-5 text-white/60" />
                      </button>

                      <button
                        onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(null); }}
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center border transition-all",
                          isSpeaking ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" : "bg-white/5 border-white/10 text-white/30"
                        )}
                        title="Arrêter la lecture"
                      >
                        <Square className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">
                      Djiogo.ai Voice • Powered by Groq LPU™
                    </p>
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
              <div className="flex items-center gap-0.5">
                <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-colors" title="Analyser une image (Vision)">
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (!input.trim()) {
                      setNotification("✏️ Décris l'image à générer dans le champ texte !");
                      return;
                    }
                    handleSend(input, true);
                  }}
                  className="p-2 rounded-xl hover:bg-white/5 text-violet-400 hover:text-violet-300 transition-colors"
                  title="Générer une image avec Pollinations AI (gratuit)"
                >
                  <ImagePlus className="w-4 h-4" />
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

              <div className="flex items-center gap-0.5">
                <button onClick={() => setIsAutoSpeak(!isAutoSpeak)} className={cn("p-2 rounded-xl transition-colors", isAutoSpeak ? "text-indigo-400 bg-indigo-500/10" : "hover:bg-white/5 text-white/30 hover:text-white")} title="Mode mains libres">
                  <Zap className={cn("w-4 h-4", isAutoSpeak && "fill-current")} />
                </button>
                <button onClick={startVoiceInput} className={cn("p-2 rounded-xl transition-colors", isListening ? "bg-red-500/20 text-red-500 animate-pulse" : "hover:bg-white/5 text-white/30 hover:text-white")} title="Entrée vocale">
                  <Mic className="w-4 h-4" />
                </button>
                <button onClick={() => handleSend()} disabled={(!input.trim() && !selectedImage) || isLoading} className={cn("p-2 rounded-xl transition-all flex items-center justify-center", (input.trim() || selectedImage) && !isLoading ? `${accentColor === 'indigo' ? "bg-indigo-500" : accentColor === 'emerald' ? "bg-emerald-500" : "bg-rose-500"} text-white shadow-lg` : "bg-white/5 text-white/10 cursor-not-allowed")}>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
