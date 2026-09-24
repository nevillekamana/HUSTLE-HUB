//-----------------------------------------------------\\
//                        IMPORTS
//-----------------------------------------------------\\

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

//-----------------------------------------------------\\
//                     MOUNT THE APP
//-----------------------------------------------------\\

//strict mode runs effects twice in development, which surfaces a missing
//cleanup long before it becomes a production bug
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
