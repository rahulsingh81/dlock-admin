import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// apply saved theme before render (avoids flash)
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register the PWA service worker — scoped to /admin/ so it ONLY controls the
// admin panel and never the public website. Enables "Add to Home Screen".
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/admin/sw.js', { scope: '/admin/' }).catch(() => {});
  });
}
