import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';
import App from './App';

// Inject Font Awesome 6 Free (no npm package needed)
(function injectFA() {
  if (document.querySelector('#fa6-free')) return;
  const link = document.createElement('link');
  link.id  = 'fa6-free';
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
})();

// Inject Google Fonts: Playfair Display + Nunito
(function injectFonts() {
  if (document.querySelector('#afrolink-gfonts')) return;
  const link = document.createElement('link');
  link.id  = 'afrolink-gfonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,500&family=Nunito:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(link);
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
