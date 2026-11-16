import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { applyStoredPreferences } from './features/accessibility/preferences';
import './index.css';
import './all-css.css'; // global theme (fonts, colours); loaded last so it wins over index.css

applyStoredPreferences();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.error('Service worker registration failed:', error);
    });
  });
}
