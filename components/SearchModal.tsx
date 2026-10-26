'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Mic2, Radio, MapPin, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface SearchResultArtist {
  id: string;
  slug: string;
  stageName: string;
  genres: string[];
  city?: string;
  province?: string;
  photoUrl?: string;
}

interface SearchResultInterview {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  thumbnailUrl?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_SUGGESTIONS = [
  'Folklore',
  'Rock',
  'Tango',
  'Salta',
  'Córdoba',
  'Buenos Aires',
  'Zamba',
];

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [artists, setArtists] = useState<SearchResultArtist[]>([]);
  const [interviews, setInterviews] = useState<SearchResultInterview[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
      // Cargar destacados iniciales
      fetchResults('');
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Listener para cerrar con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Búsqueda con debounce
  const fetchResults = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setArtists(data.artists || []);
      setInterviews(data.interviews || []);
    } catch {
      setArtists([]);
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchResults(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleSelectArtist = (slug: string) => {
    onClose();
    router.push(`/artistas/${slug}`);
  };

  const handleSelectInterview = (slug: string) => {
    onClose();
    router.push(`/entrevistas/${slug}`);
  };

  const handleViewAll = () => {
    onClose();
    if (query) {
      router.push(`/artistas?query=${encodeURIComponent(query)}`);
    } else {
      router.push('/artistas');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 sm:pt-20 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#18191e] border border-[#2d2f38] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con Input de búsqueda */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-[#2d2f38] bg-[#1d1f25]">
          <Search className="w-5 h-5 text-[#d97d64] flex-shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por artista, banda, provincia o género..."
            className="w-full bg-transparent text-sm sm:text-base text-[#f3f1ec] placeholder-[#7d7970] focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-[#aba79e] animate-spin mr-2" />}
          {query && !loading && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-[#aba79e] hover:text-[#f3f1ec] hover:bg-[#282a32] transition-colors mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono text-[#8c887f] bg-[#141518] border border-[#2d2f38] px-2 py-0.5 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Sugerencias rápidas cuando el input está vacío */}
        {!query && (
          <div className="px-4 py-2.5 bg-[#15161a] border-b border-[#252730] flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[#8c887f] flex items-center gap-1 mr-1 flex-shrink-0">
              <Sparkles className="w-3 h-3 text-[#e6cca0]" />
              Sugerencias:
            </span>
            {POPULAR_SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setQuery(tag)}
                className="px-2.5 py-1 rounded-full bg-[#20222a] hover:bg-[#2c2e39] text-[#aba79e] hover:text-[#f3f1ec] transition-colors flex-shrink-0 text-[11px] font-medium"
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Contenido / Resultados */}
        <div className="overflow-y-auto p-3 sm:p-4 space-y-4">
          {/* Si no hay resultados */}
          {!loading && query && artists.length === 0 && interviews.length === 0 && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#22232a] text-[#8c887f] flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm text-[#aba79e]">
                No encontramos coincidencias para &ldquo;<span className="text-[#f3f1ec] font-semibold">{query}</span>&rdquo;
              </p>
              <button
                type="button"
                onClick={handleViewAll}
                className="text-xs font-semibold text-[#d97d64] hover:text-[#e6cca0] transition-colors"
              >
                Explorar el catálogo completo en /artistas →
              </button>
            </div>
          )}

          {/* Sección de Artistas */}
          {artists.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-[#8c887f]">
                <span className="flex items-center gap-1.5">
                  <Mic2 className="w-3.5 h-3.5 text-[#d97d64]" />
                  Artistas & Bandas
                </span>
                <span>{artists.length} resultado{artists.length > 1 ? 's' : ''}</span>
              </div>

              <div className="grid gap-1">
                {artists.map((artist) => {
                  const location = [artist.city, artist.province].filter(Boolean).join(', ');
                  return (
                    <button
                      key={artist.id}
                      type="button"
                      onClick={() => handleSelectArtist(artist.slug)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#22242c] transition-colors group text-left border border-transparent hover:border-[#2d2f38]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {artist.photoUrl ? (
                          <img
                            src={artist.photoUrl}
                            alt={artist.stageName}
                            className="w-10 h-10 rounded-full object-cover border border-[#2d2f38] flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#252730] border border-[#2d2f38] flex items-center justify-center flex-shrink-0 text-[#aba79e]">
                            <Mic2 className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#f3f1ec] group-hover:text-[#d97d64] transition-colors truncate">
                            {artist.stageName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#aba79e] truncate">
                            {location && (
                              <span className="flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 text-[#e6cca0]" />
                                {location}
                              </span>
                            )}
                            {artist.genres && artist.genres.length > 0 && (
                              <span className="text-[11px] text-[#e6cca0] font-medium">
                                • {artist.genres.slice(0, 2).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#8c887f] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sección de Entrevistas */}
          {interviews.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[#252730]">
              <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider text-[#8c887f]">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#93a887]" />
                  Entrevistas & Sesiones
                </span>
                <span>{interviews.length}</span>
              </div>

              <div className="grid gap-1">
                {interviews.map((interview) => (
                  <button
                    key={interview.id}
                    type="button"
                    onClick={() => handleSelectInterview(interview.slug)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#22242c] transition-colors group text-left border border-transparent hover:border-[#2d2f38]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {interview.thumbnailUrl ? (
                        <img
                          src={interview.thumbnailUrl}
                          alt={interview.title}
                          className="w-12 h-9 rounded-lg object-cover border border-[#2d2f38] flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-9 rounded-lg bg-[#252730] border border-[#2d2f38] flex items-center justify-center flex-shrink-0 text-[#aba79e]">
                          <Radio className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#f3f1ec] group-hover:text-[#93a887] transition-colors truncate">
                          {interview.title}
                        </p>
                        <p className="text-xs text-[#aba79e] truncate">
                          Artista: {interview.artistName}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#8c887f] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="px-4 py-3 bg-[#141518] border-t border-[#252730] flex items-center justify-between text-xs text-[#8c887f]">
          <span className="hidden sm:inline">
            Usá <kbd className="font-mono bg-[#1d1f25] px-1.5 py-0.5 rounded text-[10px] text-[#aba79e]">ESC</kbd> para cerrar
          </span>
          <button
            type="button"
            onClick={handleViewAll}
            className="flex items-center gap-1 text-[#d97d64] hover:text-[#e6cca0] font-semibold transition-colors ml-auto"
          >
            Ver catálogo completo en /artistas
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
