import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {loadRuntimeConfig} from './api/runtimeConfig';

// Start config resolution immediately, but do not block first paint on it.
// Requests still await the same promise inside apiClient before hitting the
// backend, so the UI appears sooner without risking wrong-target calls.
void loadRuntimeConfig();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
