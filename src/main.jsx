import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from "@vercel/speed-insights/react"
import './index.css'
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <ErrorBoundary>
        <AuthProvider>
            <App />
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
    </ErrorBoundary>
)