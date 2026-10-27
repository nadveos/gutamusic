'use client';

import React, { useEffect } from 'react';

/**
 * Global Error Boundary para Next.js App Router.
 * Reemplaza la pantalla negra por defecto ("This page couldn't load")
 * y recupera automáticamente al usuario si ocurrió un fallo por nueva versión desplegada.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
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
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#151618] text-[#f3f1ec] flex items-center justify-center p-6 antialiased">
        <div className="max-w-md w-full text-center space-y-6 bg-[#1a1b22] border border-[#2d2f38] p-8 sm:p-10 rounded-3xl shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#d97d64]/15 border border-[#d97d64]/30 flex items-center justify-center text-[#d97d64] text-2xl font-bold shadow-lg shadow-[#d97d64]/10">
            !
          </div>

          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#f3f1ec] tracking-tight">
              Actualización en la plataforma
            </h1>
            <p className="text-xs sm:text-sm text-[#aba79e] leading-relaxed">
              Se ha publicado una nueva versión de GUTA MÚSICA. Recargá la página para continuar navegando con el contenido más reciente.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] transition-all shadow-md shadow-[#d97d64]/20 cursor-pointer active:scale-95"
            >
              Recargar página
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-xs bg-[#242630] hover:bg-[#2c2f3b] text-[#f3f1ec] border border-[#373a48] transition-colors cursor-pointer"
            >
              Ir al Inicio
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
