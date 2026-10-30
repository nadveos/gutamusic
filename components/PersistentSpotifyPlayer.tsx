'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronUp, ChevronDown, Minimize2, Music2, RotateCcw } from 'lucide-react';

interface PersistentSpotifyPlayerProps {
  playlistId?: string;
  playlistName?: string;
}

interface PageSlotState {
  url: string;
  title: string;
  top: number;
  left: number;
  width: number;
  height: number;
  inView: boolean;
}

interface PlayerInstance {
  url: string;
  title: string;
  createdAt: number;
}

export const PersistentSpotifyPlayer: React.FC<PersistentSpotifyPlayerProps> = ({
  playlistId = process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID || '5eprX7q6HoedI2nnnHEE2H',
}) => {
  const pathname = usePathname();
  const defaultUrl = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`;
  const defaultTitle = 'Playlist GUTA en reproducción';

  // Fuente activa que persiste en el mini-reproductor flotante al navegar por toda la web
  const [activeSource, setActiveSource] = useState<{ url: string; title: string }>(() => ({
    url: defaultUrl,
    title: defaultTitle,
  }));

  // Slot detectado en la página actual (Home playlist o Top Tracks de un artista en /artistas/[slug])
  const [pageSlot, setPageSlot] = useState<PageSlotState | null>(null);

  // Lista estable de instancias montadas (ordenada por createdAt para que React NUNCA desmonte ni recargue el iframe en reproducción)
  const [instances, setInstances] = useState<PlayerInstance[]>(() => [
    { url: defaultUrl, title: defaultTitle, createdAt: 1 },
  ]);

  const [isExpandedInMini, setIsExpandedInMini] = useState(false);
  const [isMinimizedToPill, setIsMinimizedToPill] = useState(false);

  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});
  const nextCreatedAtRef = useRef(2);

  // Ocultar visualmente en rutas administrativas o paneles privados (sin desmontar el iframe activo)
  const isHiddenRoute =
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/panel-');

  const updateSlotPosition = useCallback(() => {
    if (typeof window === 'undefined') return;

    const slotEl = document.querySelector('[data-guta-spotify-slot="true"]') as HTMLElement | null;
    if (!slotEl) {
      setPageSlot(null);
      return;
    }

    const slotUrl = slotEl.getAttribute('data-spotify-url');
    const slotTitle = slotEl.getAttribute('data-spotify-title') || defaultTitle;
    if (!slotUrl) {
      setPageSlot(null);
      return;
    }

    const rect = slotEl.getBoundingClientRect();
    const inView = rect.bottom > 85 && rect.top < window.innerHeight - 30 && rect.width > 50;

    setPageSlot({
      url: slotUrl,
      title: slotTitle,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height || 352,
      inView,
    });
  }, [defaultTitle]);

  // Sincronizar las instancias montadas (máximo 2: la activa flotante + el slot de la página actual si es de otro artista)
  useEffect(() => {
    setInstances((prev) => {
      const needed = new Map<string, string>();
      needed.set(activeSource.url, activeSource.title);
      if (pageSlot?.url) {
        needed.set(pageSlot.url, pageSlot.title);
      }

      // Mantener las instancias existentes que siguen siendo necesarias con su mismo createdAt
      const kept = prev
        .filter((item) => needed.has(item.url))
        .map((item) => ({
          ...item,
          title: needed.get(item.url) || item.title,
        }));

      // Agregar cualquier instancia nueva al final sin alterar el orden de las existentes
      for (const [url, title] of needed.entries()) {
        if (!kept.some((k) => k.url === url)) {
          kept.push({
            url,
            title,
            createdAt: nextCreatedAtRef.current++,
          });
        }
      }

      kept.sort((a, b) => a.createdAt - b.createdAt);
      return kept;
    });
  }, [activeSource.url, activeSource.title, pageSlot?.url, pageSlot?.title]);

  // Actualizar coordenadas del slot al hacer scroll, resize o cambiar de ruta
  useEffect(() => {
    updateSlotPosition();

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

    const interval = setInterval(updateSlotPosition, 350);

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      clearInterval(interval);
    };
  }, [pathname, updateSlotPosition]);

  // Detectar cuando el usuario da Play o interactúa con el reproductor de un artista (o de la Home)
  // para que el reproductor flotante adopte inmediatamente esa escucha
  useEffect(() => {
    const promoteInstance = (url: string, title: string) => {
      setActiveSource((prev) => {
        if (prev.url === url) return prev;
        return { url, title };
      });
      setIsMinimizedToPill(false);
    };

    // 1. Escuchar eventos postMessage oficiales del iframe de Spotify (playback_update)
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('spotify.com')) return;

      let data = event.data;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      const isPlayingEvent =
        data?.type === 'playback_update' && data?.payload && data.payload.isPaused === false;

      if (isPlayingEvent) {
        for (const inst of instances) {
          const iframeEl = iframeRefs.current[inst.url];
          if (iframeEl && iframeEl.contentWindow === event.source) {
            promoteInstance(inst.url, inst.title);
            break;
          }
        }
      }
    };

    // 2. Detectar clic / foco sobre el iframe del slot en página (cuando el usuario hace clic en Play del artista)
    const checkActiveIframeFocus = () => {
      const activeEl = document.activeElement;
      if (!activeEl || activeEl.tagName !== 'IFRAME') return;

      for (const inst of instances) {
        const iframeEl = iframeRefs.current[inst.url];
        if (iframeEl && iframeEl === activeEl && inst.url !== activeSource.url) {
          promoteInstance(inst.url, inst.title);
          break;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('blur', checkActiveIframeFocus);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('blur', checkActiveIframeFocus);
    };
  }, [instances, activeSource.url]);

  const miniHeight = isExpandedInMini ? 352 : 80;
  const isActiveDockedInPage = Boolean(
    !isHiddenRoute && pageSlot && pageSlot.inView && pageSlot.url === activeSource.url
  );
  const isPlayingCustomArtist = activeSource.url !== defaultUrl;

  return (
    <>
      {/* Botón píldora flotante si el usuario minimizó el mini-reproductor mientras navega */}
      {!isHiddenRoute && !isActiveDockedInPage && isMinimizedToPill && (
        <button
          type="button"
          onClick={() => setIsMinimizedToPill(false)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#16181f]/95 hover:bg-[#1e212b] border border-[#1DB954]/50 shadow-2xl text-xs font-bold text-[#f3f1ec] backdrop-blur-md transition-all cursor-pointer group"
          title="Mostrar mini reproductor en reproducción"
        >
          <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
          <Music2 className="w-3.5 h-3.5 text-[#1DB954]" />
          <span className="max-w-[180px] truncate">{activeSource.title}</span>
          <ChevronUp className="w-3.5 h-3.5 text-[#aba79e] group-hover:text-[#f3f1ec]" />
        </button>
      )}

      {/* Renderizar instancias activas (ordenadas por createdAt para preservar siempre el nodo DOM del iframe que suena) */}
      {instances.map((inst) => {
        const isActive = inst.url === activeSource.url;
        const isCurrentPageSlot = Boolean(pageSlot && inst.url === pageSlot.url);
        const isDockedInSlot = Boolean(!isHiddenRoute && isCurrentPageSlot && pageSlot?.inView);
        const isFloatingMini = Boolean(!isHiddenRoute && isActive && !isDockedInSlot && !isMinimizedToPill);

        let containerStyle: React.CSSProperties;
        let containerClass = '';

        if (isDockedInSlot && pageSlot) {
          containerStyle = {
            position: 'fixed',
            top: `${pageSlot.top}px`,
            left: `${pageSlot.left}px`,
            width: `${pageSlot.width}px`,
            height: `${pageSlot.height}px`,
            zIndex: 30,
          };
          containerClass = 'rounded-xl overflow-hidden bg-[#0d0e10]';
        } else if (isFloatingMini) {
          containerStyle = {};
          containerClass =
            'fixed bottom-3 right-3 left-3 sm:left-auto sm:w-[370px] z-40 rounded-2xl bg-[#14151b]/95 backdrop-blur-md border border-[#2e313d] shadow-2xl p-2 transition-all duration-200';
        } else {
          // Oculto fuera de pantalla (ej. ruta /admin, píldora minimizada, o slot fuera de vista sin ser la fuente activa)
          containerStyle = {
            position: 'fixed',
            bottom: '-9999px',
            right: '-9999px',
            width: '320px',
            height: '80px',
            opacity: 0,
            pointerEvents: 'none',
            zIndex: -1,
          };
          containerClass = '';
        }

        const iframeHeight = isDockedInSlot ? 352 : miniHeight;

        return (
          <div key={inst.createdAt} style={containerStyle} className={containerClass}>
            {/* Barra superior de control solo visible en modo Mini Reproductor flotante */}
            {isFloatingMini && (
              <div className="flex items-center justify-between gap-2 px-2 pb-1.5 mb-1 border-b border-[#252834] text-[11px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse shrink-0" />
                  <span className="font-bold text-[#f3f1ec] truncate" title={inst.title}>
                    {inst.title}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isPlayingCustomArtist && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSource({
                          url: defaultUrl,
                          title: defaultTitle,
                        })
                      }
                      className="px-1.5 py-0.5 rounded bg-[#20222b] hover:bg-[#2a2d3a] text-[#1DB954] text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Volver a la Playlist Oficial GUTA"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Playlist GUTA</span>
                    </button>
                  )}

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
              ref={(el) => {
                iframeRefs.current[inst.url] = el;
              }}
              src={inst.url}
              width="100%"
              height={String(iframeHeight)}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="w-full rounded-xl transition-all duration-200"
              style={{
                borderRadius: '10px',
                height: `${iframeHeight}px`,
              }}
              title={inst.title}
            />
          </div>
        );
      })}
    </>
  );
};
