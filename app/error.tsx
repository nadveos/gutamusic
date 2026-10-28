'use client';

import React, { useEffect, useState } from 'react';

/**
 * Error boundary para las páginas de la aplicación.
 * Si detecta fallo de navegación/chunk tras un despliegue, recarga automáticamente
 * sin mostrar el cartel de bloqueo, salvo que el error persista tras recargar.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    console.error('[ErrorBoundary]', error);

    try {
      const now = Date.now();
      const lastReload = Number(sessionStorage.getItem('guta_chunk_auto_reload') || 0);
      if (now - lastReload > 10000) {
        sessionStorage.setItem('guta_chunk_auto_reload', String(now));
        window.location.reload();
        return;
      }
    } catch {
      // sessionStorage bloqueado o no disponible
    }

    setShowFallback(true);
  }, [error]);

  if (!showFallback) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-xs text-[#aba79e]">
          <div className="w-6 h-6 rounded-full border-2 border-[#d97d64] border-t-transparent animate-spin" />
          <span>Cargando sección...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-5 bg-[#1a1b22] border border-[#2d2f38] p-8 rounded-2xl shadow-xl">
        <div className="w-12 h-12 mx-auto rounded-xl bg-[#d97d64]/15 border border-[#d97d64]/30 flex items-center justify-center text-[#d97d64] text-xl font-bold">
          !
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-[#f3f1ec]">No se pudo cargar esta sección</h2>
          <p className="text-xs text-[#aba79e] leading-relaxed">
            Ocurrió un inconveniente temporal al abrir esta página. Podés reintentar o volver al inicio.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] transition-colors cursor-pointer"
          >
            Reintentar
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl font-medium text-xs bg-[#242630] hover:bg-[#2c2f3b] text-[#f3f1ec] border border-[#373a48] transition-colors cursor-pointer"
          >
            Recargar
          </button>
          <a
            href="/"
            className="px-5 py-2.5 rounded-xl font-medium text-xs bg-[#242630] hover:bg-[#2c2f3b] text-[#e6cca0] border border-[#373a48] transition-colors"
          >
            Ir al Inicio
          </a>
        </div>
      </div>
    </div>
  );
}
