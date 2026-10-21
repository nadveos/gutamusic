'use client';

import React, { useState } from 'react';
import { DiscographyItem, AgendaEvent } from '../../lib/types';
import { Sparkles, Disc3, Calendar, CheckSquare, Square, X, ExternalLink, Loader2 } from 'lucide-react';

interface EnrichArtistModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageName: string;
  genres?: string[];
  city?: string;
  province?: string;
  country?: string;
  spotifyUrl?: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [discographyResults, setDiscographyResults] = useState<DiscographyItem[]>([]);
  const [agendaResults, setAgendaResults] = useState<AgendaEvent[]>([]);
  const [selectedDiscIds, setSelectedDiscIds] = useState<string[]>([]);
  const [selectedAgendaIds, setSelectedAgendaIds] = useState<string[]>([]);
  const [summary, setSummary] = useState('');

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
          spotifyUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo obtener información en la web.');
      }

      setDiscographyResults(data.discography || []);
      setAgendaResults(data.agenda || []);
      setSelectedDiscIds((data.discography || []).map((d: any) => d.id));
      setSelectedAgendaIds((data.agenda || []).map((a: any) => a.id));
      setSummary(data.summary || '');
      setHasSearched(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al conectar con el servicio de IA y búsqueda.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDiscSelection = (id: string) => {
    setSelectedDiscIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAgendaSelection = (id: string) => {
    setSelectedAgendaIds((prev) =>
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

  const toggleAllAgenda = () => {
    if (selectedAgendaIds.length === agendaResults.length) {
      setSelectedAgendaIds([]);
    } else {
      setSelectedAgendaIds(agendaResults.map((a) => a.id));
    }
  };

  const handleConfirm = () => {
    const finalDiscography = discographyResults.filter((d) => selectedDiscIds.includes(d.id));
    const finalAgenda = agendaResults.filter((a) => selectedAgendaIds.includes(a.id));
    onApply(finalDiscography, finalAgenda);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl natural-card rounded-2xl border border-[#3e4252] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2d2f38] flex items-center justify-between bg-gradient-to-r from-[#20222a] to-[#1c1d23]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#d97d64] to-[#e6cca0] flex items-center justify-center text-[#151618] shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#f3f1ec] flex items-center gap-2">
                <span>Rastreo Mágico de Discografía & Shows</span>
              </h2>
              <p className="text-[11px] text-[#8c887f]">
                Escanea automáticamente la web, MusicBrainz, Spotify y carteleras para <strong>{stageName}</strong>
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
          {/* Initial State / Prompt to start */}
          {!hasSearched && !isLoading && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#24252f] border border-[#373a48] flex items-center justify-center text-[#e6cca0] mx-auto shadow-inner">
                <Sparkles className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-sm font-bold text-[#f3f1ec]">¿Querés autocompletar la información del artista?</h3>
                <p className="text-xs text-[#aba79e]">
                  Nuestro asistente consultará en tiempo real bases discográficas mundiales y eventos en vivo confirmados para <strong>{stageName}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartSearch}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d97d64] to-[#e6cca0] hover:opacity-95 text-[#151618] font-bold text-xs shadow-lg transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Iniciar Rastreo Web Inteligente</span>
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="py-12 text-center space-y-3.5">
              <Loader2 className="w-8 h-8 text-[#d97d64] animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#f3f1ec]">Buscando en la web y bases de datos oficiales...</h4>
                <p className="text-[11px] text-[#8c887f]">
                  Consultando MusicBrainz, Spotify, Passline y carteleras de festivales para {stageName}.
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
            <div className="space-y-6">
              {summary && (
                <div className="p-3 rounded-xl bg-[#20222a] border border-[#2d2f38] text-xs text-[#aba79e] flex items-center gap-2">
                  <span className="text-base">💡</span>
                  <span>{summary}</span>
                </div>
              )}

              {/* Section: Discografía */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#2a2c35]">
                  <div className="flex items-center gap-2">
                    <Disc3 className="w-4 h-4 text-[#d97d64]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#e6cca0]">
                      Discografía Detectada ({discographyResults.length})
                    </h3>
                  </div>
                  {discographyResults.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllDiscography}
                      className="text-[11px] text-[#aba79e] hover:text-[#f3f1ec] underline"
                    >
                      {selectedDiscIds.length === discographyResults.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                  )}
                </div>

                {discographyResults.length === 0 ? (
                  <p className="text-xs text-[#78746c] italic">No se hallaron lanzamientos indexados para este artista.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {discographyResults.map((disc) => {
                      const isSelected = selectedDiscIds.includes(disc.id);
                      return (
                        <div
                          key={disc.id}
                          onClick={() => toggleDiscSelection(disc.id)}
                          className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#d97d64]/10 border-[#d97d64]/50'
                              : 'bg-[#18191e] border-[#292b34] opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="text-[#d97d64]">
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-[#606371]" />}
                          </div>

                          <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-black border border-[#31333d] flex-shrink-0">
                            {disc.coverUrl ? (
                              <img src={disc.coverUrl} alt={disc.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#d97d64] bg-[#22232a]">
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
                              <span className="text-[10px] text-[#93a887] flex items-center gap-1 mt-0.5">
                                <span>Spotify listo</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section: Agenda & Shows */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#2a2c35]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#d97d64]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#e6cca0]">
                      Próximos Shows & Fechas Detectadas ({agendaResults.length})
                    </h3>
                  </div>
                  {agendaResults.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllAgenda}
                      className="text-[11px] text-[#aba79e] hover:text-[#f3f1ec] underline"
                    >
                      {selectedAgendaIds.length === agendaResults.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </button>
                  )}
                </div>

                {agendaResults.length === 0 ? (
                  <p className="text-xs text-[#78746c] italic">No se hallaron presentaciones en vivo programadas en la web.</p>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {agendaResults.map((ev) => {
                      const isSelected = selectedAgendaIds.includes(ev.id);
                      return (
                        <div
                          key={ev.id}
                          onClick={() => toggleAgendaSelection(ev.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#d97d64]/10 border-[#d97d64]/50'
                              : 'bg-[#18191e] border-[#292b34] opacity-70 hover:opacity-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-[#d97d64]">
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-[#606371]" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold text-[#e6cca0]">{ev.date}</span>
                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#24252c] text-[#8c887f]">
                                  {ev.city}, {ev.province}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-[#f3f1ec] mt-0.5">{ev.title}</h4>
                              <p className="text-[11px] text-[#aba79e]">{ev.venue}</p>
                            </div>
                          </div>

                          {ev.ticketUrl && (
                            <span className="text-[10px] font-medium text-[#93a887] border border-[#3c4e36] bg-[#1d271c] px-2 py-0.5 rounded hidden sm:inline-flex items-center gap-1">
                              <span>Tickets</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
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
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#aba79e] hover:text-[#f3f1ec] hover:bg-[#252731] transition-colors"
          >
            Cerrar
          </button>

          {hasSearched && (selectedDiscIds.length > 0 || selectedAgendaIds.length > 0) && (
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#d97d64] to-[#e6cca0] hover:opacity-95 text-[#151618] font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                Incorporar al Perfil ({selectedDiscIds.length} discos, {selectedAgendaIds.length} shows)
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
