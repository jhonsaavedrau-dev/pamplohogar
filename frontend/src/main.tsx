import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProveedorSesion } from './lib/sesion';
import { ProveedorComparador } from './lib/comparador';
import { LimiteDeError } from './components/LimiteDeError';
import { App } from './App';
import './index.css';

const cliente = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

const raiz = document.getElementById('root');
if (!raiz) throw new Error('No se encontro el elemento raiz de la aplicacion.');

/*
  Se registra solo en la version publicada. En el computador estorba: dejaria
  guardadas versiones viejas y uno se volveria loco viendo cambios que ya hizo
  pero no aparecen.
*/
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Que falle esto no puede tumbar la pagina: sin el, todo sigue
      // funcionando, solo que sin guardar nada para cuando no haya senal.
    });
  });
}

createRoot(raiz).render(
  <StrictMode>
    <LimiteDeError>
      <QueryClientProvider client={cliente}>
        <BrowserRouter>
          <ProveedorSesion>
            <ProveedorComparador>
              <App />
            </ProveedorComparador>
          </ProveedorSesion>
        </BrowserRouter>
      </QueryClientProvider>
    </LimiteDeError>
  </StrictMode>,
);
