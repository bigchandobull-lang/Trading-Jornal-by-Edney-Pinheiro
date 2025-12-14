import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './components/ThemeProvider';
import { TradesProvider } from './contexts/TradesContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ColorProvider } from './contexts/ColorContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import './i18n';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <React.Suspense fallback={<div className="w-full h-screen flex items-center justify-center">Loading...</div>}>
        <ThemeProvider>
          <ColorProvider>
            <CurrencyProvider>
                <NotificationProvider>
                <TradesProvider>
                    <App />
                </TradesProvider>
                </NotificationProvider>
            </CurrencyProvider>
          </ColorProvider>
        </ThemeProvider>
    </React.Suspense>
  </React.StrictMode>
);