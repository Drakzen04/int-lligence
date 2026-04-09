# INT-LLIGENCE 🤖

> An AI-powered web application built with the Anthropic Claude API.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-int--lligence.vercel.app-blue?style=for-the-badge)](https://int-lligence-iv9s.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-98%25-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Built with Claude](https://img.shields.io/badge/Powered%20by-Claude%20API-orange?style=for-the-badge)](https://anthropic.com)

---

## ✨ Overview

**INT-LLIGENCE** is a fully functional AI web application that leverages the Anthropic Claude API to deliver intelligent, real-time conversational experiences directly in the browser.

Built from scratch by **FOUEGAP DJIOGO GOMEZ** — a 16-year-old self-taught developer from Yaoundé, Cameroon.

---

## 🚀 Features

- 💬 Real-time AI conversation powered by Claude API
- ⚡ Fast and responsive UI built with React + TypeScript
- 🌐 Serverless API architecture via Vercel Functions
- 📱 Mobile-friendly responsive design
- 🔒 Secure API key handling via environment variables

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite |
| AI Backend | Anthropic Claude API |
| Styling | CSS |
| Deployment | Vercel |
| API Layer | Vercel Serverless Functions |

---

## 📁 Project Structure

```
int-lligence/
├── api/              # Vercel serverless functions (Claude API calls)
├── src/              # React TypeScript frontend
├── index.html        # Entry point
├── vite.config.ts    # Vite configuration
├── vercel.json       # Vercel deployment config
└── package.json      # Dependencies
```

---

## 🔧 Getting Started

### Prerequisites
- Node.js 18+
- An Anthropic API key ([get one here](https://console.anthropic.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/Drakzen04/int-lligence.git
cd int-lligence

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Environment Variables

Create a `.env` file at the root:

```env
ANTHROPIC_API_KEY=your_api_key_here
```

### Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌍 Deployment

This project is deployed on **Vercel**. The API key is stored securely as an environment variable in Vercel's dashboard — never exposed in the codebase.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Drakzen04/int-lligence)

---

## 👤 Author

**FOUEGAP DJIOGO GOMEZ** — Yaoundé, Cameroon

- 🎓 Terminale D — Collège Jésus-Marie de Simbock
- 🏅 Certified: [Claude Code in Action](https://verify.skilljar.com/c/azeoy3fd8xx4) — Anthropic (April 2026)
- 💼 Freelance web developer — international clients (Brazil, Qatar)
- 🤖 Builder of AI tools, trading bots & immersive web experiences

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">Built with 🧠 and ☕ from Cameroon</p>

