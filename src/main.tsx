import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  }
} catch (err: any) {
  console.error('Fatal mount error in main.tsx:', err);
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `<div style="padding: 24px; color: #ef4444; font-family: monospace;"><h2>Failed to mount application</h2><pre>${err?.stack || err?.message || err}</pre></div>`;
  }
}

// Dismiss initial loader once React render initiates
try {
  (window as any).__dismissInitialLoader?.();
} catch {}
