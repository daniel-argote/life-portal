import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Accessibility Agent (Axe-Core)
// Runs only in development mode and when enabled in Settings.
if (import.meta.env.DEV) {
  const saved = localStorage.getItem('portalConfig');
  let showAgent = true;
  if (saved) {
    try {
      const config = JSON.parse(saved);
      showAgent = config.showA11yAgent !== false;
    } catch (e) {
      showAgent = true;
    }
  }

  if (showAgent) {
    import('@axe-core/react').then(axe => {
      axe.default(React, ReactDOM, 1000);
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)