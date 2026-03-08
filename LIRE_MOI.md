# 🚀 Djiogo.ai — Guide de déploiement (Groq Edition)

## Structure du projet
```
codeplus/
├── src/
│   ├── App.tsx          ✅ Migré vers Groq SDK
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts    ✅ Mis à jour (VITE_GROQ_API_KEY)
├── api/
│   ├── pay/
│   │   ├── initialize.ts
│   │   └── webhook.ts
│   └── user/
│       ├── status.ts
│       └── reset.ts
├── index.html
├── package.json         ✅ groq-sdk remplace @google/genai
├── vite.config.ts       ✅ Lit VITE_GROQ_API_KEY
├── vercel.json
├── tsconfig.json
└── .env.local           ✅ Contient VITE_GROQ_API_KEY
```

---

## ✅ ÉTAPES POUR LANCER L'APP

### Étape 1 — Installer les dépendances
```bash
cd codeplus
npm install
```

### Étape 2 — Vérifier le fichier .env.local
```env
VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxx
VITE_ADMIN_CODE=2027
```

### Étape 3 — Lancer en local
```bash
npm run dev
```
Ouvre http://localhost:5173 dans ton navigateur.

### Étape 4 — Déployer sur Vercel

Sur Vercel → Settings → Environment Variables, ajoute :

| Nom                  | Valeur                        |
|----------------------|-------------------------------|
| `VITE_GROQ_API_KEY`  | Ta clé Groq (gsk_...)         |
| `VITE_ADMIN_CODE`    | 2027 (ou un code personnalisé)|

```bash
# Déploiement via CLI
npx vercel --prod
```

---

## 🔧 Ce qui a changé (Gemini → Groq)

| Élément              | Avant (Gemini)                          | Après (Groq) ✅                          |
|----------------------|-----------------------------------------|------------------------------------------|
| SDK                  | `@google/genai`                         | `groq-sdk`                               |
| Variable d'env       | `VITE_GEMINI_API_KEY`                   | `VITE_GROQ_API_KEY`                      |
| Modèle texte         | `gemini-2.0-flash`                      | `llama-3.3-70b-versatile`                |
| Modèle vision        | `gemini-2.5-flash-preview-05-20`        | `meta-llama/llama-4-scout-17b-16e-instruct` |
| Génération d'images  | `gemini-2.0-flash-preview-image-gen`    | ⚠️ Non disponible (message informatif)  |
| TTS (voix mascotte)  | `gemini-2.5-flash-preview-tts`          | Web Speech API (natif navigateur)        |
| Vitesse              | ~50-100 tok/s                           | ~500+ tok/s (LPU Groq)                   |

---

## ⚠️ Limitation connue

**Génération d'images** : Groq est un moteur LLM/Vision uniquement.
Le bouton ImagePlus affiche un message informatif. Pour la génération d'images,
tu peux intégrer DALL-E 3 ou Stable Diffusion via leur API dans le futur.

---

## 🔑 Obtenir une clé Groq gratuite

1. Va sur https://console.groq.com
2. Crée un compte gratuit
3. Clique sur "API Keys" → "Create API Key"
4. Copie la clé (commence par `gsk_`)
5. Mets-la dans `.env.local` et sur Vercel

> Le plan gratuit Groq offre ~14,400 tokens/minute — très généreux !
