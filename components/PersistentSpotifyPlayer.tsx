'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronUp, ChevronDown, Minimize2, Music2 } from 'lucide-react';

interface PersistentSpotifyPlayerProps {
  playlistId?: string;
  playlistName?: string;
}

interface SlotRect {
  top: number;
  left: number;
  width: number;
  height: number;
  inView: boolean;
}

export const PersistentSpotifyPlayer: React.FC<PersistentSpotifyPlayerProps> = ({
  playlistId = process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID || '5eprX7q6HoedI2nnnHEE2H',
  playlistName = 'Top Artistas Emergentes by Guta',
}) => {
  const pathname = usePathname();
  const [slotRect, setSlotRect] = useState<SlotRect | null>(null);
  const [isExpandedInMini, setIsExpandedInMini] = useState(false);
  const [isMinimizedToPill, setIsMinimizedToPill] = useState(false);

  // Ocultar visualmente en rutas administrativas o paneles privados (sin desmontar el iframe)
  const isHiddenRoute =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/panel-');

  const isHome = pathname === '/';

  const updateSlotPosition = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== '/') {
      setSlotRect(null);
      return;
    }

    const slotEl = document.getElementById('guta-spotify-home-slot');
    if (!slotEl) {
      setSlotRect(null);
      return;
    }

    const rect = slotEl.getBoundingClientRect();
    const inView = rect.bottom > 90 && rect.top < window.innerHeight - 40 && rect.width > 50;

    setSlotRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height || 352,
      inView,
    });
  }, []);

  useEffect(() => {
    updateSlotPosition();

    // Actualizar en scroll y resize de forma ligera con rAF
    let rafId: number | null = null;
    const onScrollOrResize = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        updateSlotPosition();
        rafId = null;
      });
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });

    const interval = setInterval(updateSlotPosition, 400);

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      clearInterval(interval);
    };
  }, [pathname, updateSlotPosition]);

  // Determinar si se acopla al slot de la Home o si flota como Mini Reproductor al pie de página
  const isDockedInHome = isHome && slotRect && slotRect.inView;

  if (isHiddenRoute) {
    return (
      <div
        aria-hidden="true"
        className="fixed -bottom-[9999px] -left-[9999px] w-1 h-1 opacity-0 pointer-events-none overflow-hidden"
      >
        <iframe
          src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
          width="100%"
          height="80"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          title={playlistName}
        />
      </div>
    );
  }

  const miniHeight = isExpandedInMini ? 352 : 80;

  return (
    <>
      {/* Botón píldora flotante si el usuario minimizó el mini-reproductor mientras navega */}
      {!isDockedInHome && isMinimizedToPill && (
        <button
          type="button"
          onClick={() => setIsMinimizedToPill(false)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#16181f]/95 hover:bg-[#1e212b] border border-[#1DB954]/50 shadow-2xl text-xs font-bold text-[#f3f1ec] backdrop-blur-md transition-all cursor-pointer group"
          title="Mostrar mini reproductor de GUTA"
        >
          <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
          <Music2 className="w-3.5 h-3.5 text-[#1DB954]" />
          <span>Reproductor GUTA</span>
          <ChevronUp className="w-3.5 h-3.5 text-[#aba79e] group-hover:text-[#f3f1ec]" />
        </button>
      )}

      {/* Contenedor único del iframe de Spotify (NUNCA se desmonta para mantener la reproducción activa) */}
      <div
        style={
          isDockedInHome && slotRect
            ? {
                position: 'fixed',
                top: `${slotRect.top}px`,
                left: `${slotRect.left}px`,
                width: `${slotRect.width}px`,
                height: `${slotRect.height}px`,
                zIndex: 30,
              }
            : isMinimizedToPill
              ? {
                  position: 'fixed',
                  bottom: '-9999px',
                  right: '-9999px',
                  width: '320px',
                  height: '80px',
                  opacity: 0,
                  pointerEvents: 'none',
                  zIndex: -1,
                }
              : undefined
        }
        className={
          isDockedInHome
            ? 'rounded-xl overflow-hidden bg-[#0d0e10]'
            : isMinimizedToPill
              ? ''
              : 'fixed bottom-3 right-3 left-3 sm:left-auto sm:w-[360px] z-40 rounded-2xl bg-[#14151b]/95 backdrop-blur-md border border-[#2e313d] shadow-2xl p-2 transition-all duration-200'
        }
      >
        {/* Barra superior de control solo visible en modo Mini Reproductor flotante */}
        {!isDockedInHome && !isMinimizedToPill && (
          <div className="flex items-center justify-between px-2 pb-1.5 mb-1 border-b border-[#252834] text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse shrink-0" />
              <span className="font-bold text-[#f3f1ec] truncate">
                Playlist GUTA en reproducción
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsExpandedInMini((prev) => !prev)}
                className="px-2 py-0.5 rounded bg-[#20222b] hover:bg-[#2a2d3a] text-[#e6cca0] text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title={isExpandedInMini ? 'Modo barra compacta' : 'Ver lista de canciones'}
              >
                {isExpandedInMini ? (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>Compactar</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Lista</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsMinimizedToPill(true)}
                className="p-1 rounded bg-[#20222b] hover:bg-[#2a2d3a] text-[#aba79e] hover:text-[#f3f1ec] transition-colors cursor-pointer"
                title="Minimizar a botón discreto (la música sigue sonando)"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <iframe
          src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
          width="100%"
          height={isDockedInHome ? '352' : String(miniHeight)}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="w-full rounded-xl transition-all duration-200"
          style={{
            borderRadius: '10px',
            height: isDockedInHome ? '352px' : `${miniHeight}px`,
          }}
          title={playlistName}
        />
      </div>
    </>
  );
};
