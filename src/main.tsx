import React from 'react';import{createRoot}from'react-dom/client';import{registerSW}from'virtual:pwa-register';import'./style.css';import App from'./App';
registerSW({immediate:true});createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
