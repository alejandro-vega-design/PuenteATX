import React from 'react';
import { createRoot } from 'react-dom/client';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
inject();
injectSpeedInsights();
