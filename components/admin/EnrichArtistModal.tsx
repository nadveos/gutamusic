'use client';

import React, { useState, useEffect } from 'react';
import { DiscographyItem, AgendaEvent } from '../../lib/types';
import { Sparkles, Disc3, CheckSquare, Square, X, ExternalLink, Loader2 } from 'lucide-react';

export type EnrichMode = 'all' | 'discography' | 'shows';

interface EnrichArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageName: string;
  genres?: string[];
  city?: string;
  province?: string;
  country?: string;
  spotifyUrl?: string;
  initialMode?: EnrichMode;
  onApply: (selectedDiscography: DiscographyItem[], selectedAgenda: AgendaEvent[]) => void;
}

export const EnrichArtistModal: React.FC<EnrichArtistModalProps> = ({
  isOpen,
  onClose,
  stageName,
  genres = [],
  city = '',
  province = '',
  country = 'Argentina',
  spotifyUrl = '',
  onApply,
}) => {
  const [currentSpotifyUrl, setCurrentSpotifyUrl] = useState(spotifyUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [discographyResults, setDiscographyResults] = useState<DiscographyItem[]>([]);
  const [selectedDiscIds, setSelectedDiscIds] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [sourcesInfo, setSourcesInfo] = useState<{ spotifyAlbumsFound?: number; musicBrainzFound?: number }>({});

  useEffect(() => {
    if (spotifyUrl) setCurrentSpotifyUrl(spotifyUrl);
  }, [spotifyUrl]);

  useEffect(() => {
    if (isOpen) {
      setHasSearched(false);
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartSearch = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setHasSearched(false);

    try {
      const res = await fetch('/api/ai/enrich-artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stageName,
          genres,
          city,
          province,
          country,
          spotifyUrl: currentSpotifyUrl,
          mode: 'discography',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo obtener información de Spotify.');
      }

      setDiscographyResults(data.discography || []);
      setSelectedDiscIds((data.discography || []).map((d: any) => d.id));
      setSummary(data.summary || '');
      setSourcesInfo(data.sources || {});
      setHasSearched(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al conectar con la API de Spotify.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDiscSelection = (id: string) => {
    setSelectedDiscIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAllDiscography = () => {
    if (selectedDiscIds.length === discographyResults.length) {
      setSelectedDiscIds([]);
    } else {
      setSelectedDiscIds(discographyResults.map((d) => d.id));
    }
  };

  const handleConfirm = () => {
    const finalDiscography = discographyResults.filter((d) => selectedDiscIds.includes(d.id));
    onApply(finalDiscography, []);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl natural-card rounded-2xl border border-[#3e4252] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2d2f38] flex items-center justify-between bg-gradient-to-r from-[#20222a] to-[#1c1d23]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1db954] to-[#e6cca0] flex items-center justify-center text-[#151618] shadow-md">
              <Disc3 className="w-5 h-5 text-[#151618]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#f3f1ec] flex items-center gap-2">
                <span>Rastrear Discografía Oficial (Spotify)</span>
              </h2>
              <p className="text-[11px] text-[#8c887f]">
                Sincronizá álbumes, EPs y sencillos oficiales con carátulas en alta resolución para <strong className="text-[#f3f1ec]">{stageName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8c887f] hover:text-[#f3f1ec] hover:bg-[#252731] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Form / Prompt */}
          {!isLoading && (
            <div className="p-4 rounded-xl bg-[#191a21] border border-[#2b2d39] space-y-3">
              <label className="text-[11px] font-semibold text-[#e6cca0] block">
                Enlace o ID de Spotify del artista:
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Ej: https://open.spotify.com/artist/0AMd5Lv1a9CTAdLfbIkf8F o dejalo vacío para buscar por nombre"
                  value={currentSpotifyUrl}
                  onChange={(e) => setCurrentSpotifyUrl(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#20222a] border border-[#373a48] text-xs text-[#f3f1ec] focus:outline-none focus:border-[#1db954]"
                />
                <button
                  type="button"
                  onClick={handleStartSearch}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#1db954] to-[#e6cca0] hover:opacity-95 text-[#151618] font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4 text-[#151618]" />
                  <span>{hasSearched ? 'Volver a Rastrear' : 'Rastrear en Spotify'}</span>
                </button>
              </div>
              <p className="text-[10px] text-[#78746c]">
                Tip: Podés pegar el enlace directo del perfil o de la discografía del artista en Spotify para una precisión del 100%.
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="py-12 text-center space-y-3.5">
              <Loader2 className="w-8 h-8 text-[#1db954] animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#f3f1ec]">
                  Conectando con Spotify Web API para {stageName}...
                </h4>
                <p className="text-[11px] text-[#8c887f]">
                  Recuperando todos los álbumes, EPs y sencillos oficiales con carátulas en 640x640...
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-[#c0909b]/15 border border-[#c0909b]/30 text-[#e6a8b4] text-xs">
              {errorMessage}
            </div>
          )}

          {/* Results State */}
          {hasSearched && !isLoading && (
            <div className="space-y-4">
              {summary && (
                <div className="p-3 rounded-xl bg-[#20222a] border border-[#2d2f38] text-xs text-[#aba79e] flex items-center gap-2">
                  <span className="text-base">💡</span>
                  <span>{summary}</span>
                </div>
              )}

              {sourcesInfo.spotifyAlbumsFound !== undefined && sourcesInfo.spotifyAlbumsFound > 0 && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    Conexión exitosa con <strong>Spotify Web API</strong>: {sourcesInfo.spotifyAlbumsFound} producciones oficiales obtenidas.
                  </span>
                </div>
              )}

              {/* Section: Discografía */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#2a2c35]">
                  <div className="flex items-center gap-2">
                    <Disc3 className="w-4 h-4 text-[#1db954]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#e6cca0]">
                      Lanzamientos Detectados ({discographyResults.length})
                    </h3>
                  </div>
                  {discographyResults.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllDiscography}
                      className="text-[11px] text-[#aba79e] hover:text-[#f3f1ec] underline cursor-pointer"
                    >
                      {selectedDiscIds.length === discographyResults.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                  )}
                </div>

                {discographyResults.length === 0 ? (
                  <p className="text-xs text-[#78746c] italic">No se hallaron lanzamientos indexados para este artista en Spotify.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {discographyResults.map((disc) => {
                      const isSelected = selectedDiscIds.includes(disc.id);
                      return (
                        <div
                          key={disc.id}
                          onClick={() => toggleDiscSelection(disc.id)}
                          className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#1db954]/10 border-[#1db954]/50'
                              : 'bg-[#18191e] border-[#292b34] opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="text-[#1db954]">
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-[#606371]" />}
                          </div>

                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black border border-[#31333d] flex-shrink-0">
                            {disc.coverUrl ? (
                              <img src={disc.coverUrl} alt={disc.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#1db954] bg-[#22232a]">
                                <Disc3 className="w-5 h-5 opacity-70" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#24252c] text-[#e6cca0]">
                              {disc.type} • {disc.year}
                            </span>
                            <h4 className="text-xs font-bold text-[#f3f1ec] truncate mt-0.5">{disc.title}</h4>
                            {disc.spotifyUrl && (
                              <a
                                href={disc.spotifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] text-[#1db954] hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <span>Abrir en Spotify</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#2d2f38] bg-[#1a1b22] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#aba79e] hover:text-[#f3f1ec] hover:bg-[#252731] transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          {hasSearched && selectedDiscIds.length > 0 && (
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#1db954] to-[#e6cca0] hover:opacity-95 text-[#151618] font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Incorporar al Perfil ({selectedDiscIds.length} lanzamientos)
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
