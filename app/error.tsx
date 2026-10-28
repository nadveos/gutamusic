'use client';

import React, { useEffect } from 'react';

/**
 * Error boundary para las páginas de la aplicación.
 * Si detecta fallo de chunk por despliegue reciente, recarga de forma transparente.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[ErrorBoundary]', error);
    const msg = error?.message || '';
    const isChunkError =
      msg.includes('ChunkLoadError') ||
      msg.includes('Loading chunk') ||
      msg.includes('Failed to fetch') ||
      msg.includes('dynamically imported module') ||
      msg.includes('Importing a module script failed');

    if (isChunkError) {
      const now = Date.now();
      const lastReload = Number(sessionStorage.getItem('guta_chunk_auto_reload') || 0);
      if (now - lastReload > 8000) {
        sessionStorage.setItem('guta_chunk_auto_reload', String(now));
        window.location.reload();
      }
    }
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-5 bg-[#1a1b22] border border-[#2d2f38] p-8 rounded-2xl shadow-xl">
        <div className="w-12 h-12 mx-auto rounded-xl bg-[#d97d64]/15 border border-[#d97d64]/30 flex items-center justify-center text-[#d97d64] text-xl font-bold">
          !
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-[#f3f1ec]">Contenido actualizado</h2>
          <p className="text-xs text-[#aba79e] leading-relaxed">
            Hemos detectado una actualización en la plataforma. Recargá la página para ver los últimos cambios.
          </p>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] transition-colors cursor-pointer"
          >
            Recargar
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl font-medium text-xs bg-[#242630] hover:bg-[#2c2f3b] text-[#f3f1ec] border border-[#373a48] transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}
