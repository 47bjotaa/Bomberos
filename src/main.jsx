import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext';
import { redirectToCanonicalHost } from './utils/constants';

if (!redirectToCanonicalHost()) {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StrictMode>,
  )
}
