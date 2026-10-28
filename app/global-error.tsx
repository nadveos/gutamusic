'use client';

import React, { useEffect, useState } from 'react';

/**
 * Global Error Boundary para Next.js App Router.
 * Reemplaza la pantalla negra por defecto ("This page couldn't load")
 * y recupera automáticamente al usuario de forma transparente.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    console.error('[GlobalError]', error);

    try {
      const now = Date.now();
      const lastReload = Number(sessionStorage.getItem('guta_chunk_auto_reload') || 0);
      if (now - lastReload > 10000) {
        sessionStorage.setItem('guta_chunk_auto_reload', String(now));
        window.location.reload();
        return;
      }
    } catch {
      // sessionStorage no disponible
    }

    setShowFallback(true);
  }, [error]);

  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#151618] text-[#f3f1ec] flex items-center justify-center p-6 antialiased">
        {!showFallback ? (
          <div className="flex flex-col items-center gap-3 text-xs text-[#aba79e]">
            <div className="w-7 h-7 rounded-full border-2 border-[#d97d64] border-t-transparent animate-spin" />
            <span>Cargando plataforma...</span>
          </div>
        ) : (
          <div className="max-w-md w-full text-center space-y-6 bg-[#1a1b22] border border-[#2d2f38] p-8 sm:p-10 rounded-3xl shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#d97d64]/15 border border-[#d97d64]/30 flex items-center justify-center text-[#d97d64] text-2xl font-bold shadow-lg shadow-[#d97d64]/10">
              !
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#f3f1ec] tracking-tight">
                No se pudo cargar la página
              </h1>
              <p className="text-xs sm:text-sm text-[#aba79e] leading-relaxed">
                Ocurrió un inconveniente temporal de conexión. Recargá la página o volvé al inicio para continuar.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] transition-all shadow-md shadow-[#d97d64]/20 cursor-pointer active:scale-95"
              >
                Reintentar
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-xs bg-[#242630] hover:bg-[#2c2f3b] text-[#f3f1ec] border border-[#373a48] transition-colors cursor-pointer"
              >
                Recargar página
              </button>
              <a
                href="/"
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-medium text-xs bg-[#242630] hover:bg-[#2c2f3b] text-[#e6cca0] border border-[#373a48] transition-colors"
              >
                Ir al Inicio
              </a>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
