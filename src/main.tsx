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
