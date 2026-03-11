import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ─── Charger Puter.js pour la génération d'images ultra-rapide ───────────
// (Sans modifier index.html ni index.css)
const puterScript = document.createElement('script');
puterScript.src = 'https://js.puter.com/v2/';
puterScript.async = true;
document.head.appendChild(puterScript);
// ─────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
