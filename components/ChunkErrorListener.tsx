'use client';

import { useEffect } from 'react';

/**
 * Escucha errores globales de carga de chunks (Deployment Skew / ChunkLoadError)
 * que ocurren cuando se despliega una nueva versión en CapRover y el usuario
 * tiene abierta una pestaña con los hashes de JavaScript del build anterior.
 * Si detecta un chunk 404 o fallo de importación dinámica, recarga automáticamente
 * la página para obtener los assets actualizados sin mostrar la pantalla negra de error.
 */
export function ChunkErrorListener() {
  useEffect(() => {
    const handleChunkError = (message: string) => {
      const isChunkError =
        message.includes('ChunkLoadError') ||
        message.includes('Loading chunk') ||
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Importing a module script failed') ||
        message.includes('error loading dynamically imported module');

      if (isChunkError) {
        const now = Date.now();
        const lastReload = Number(sessionStorage.getItem('guta_chunk_auto_reload') || 0);
        // Evitar loops infinitos: sólo recargar si pasaron más de 8 segundos del último intento
        if (now - lastReload > 8000) {
          sessionStorage.setItem('guta_chunk_auto_reload', String(now));
          window.location.reload();
        }
      }
    };

    const onError = (event: ErrorEvent) => {
      handleChunkError(event?.message || '');
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const msg = typeof reason === 'string' ? reason : reason?.message || '';
      handleChunkError(msg);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
