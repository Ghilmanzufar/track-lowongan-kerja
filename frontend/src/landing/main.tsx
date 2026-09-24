import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './landing.css';

const root = document.getElementById('landing-root')!;
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
