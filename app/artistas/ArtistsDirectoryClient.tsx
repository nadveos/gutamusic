'use client';

import React, { useState, useMemo } from 'react';
import { Artist, GenreType } from '../../lib/types';
import { ArtistCard } from '../../components/ArtistCard';
import { Search, Filter, Mic2, MapPin, Sparkles } from 'lucide-react';

interface ArtistsDirectoryClientProps {
  initialArtists: Artist[];
  genres: GenreType[];
  initialGenre?: string;
}

export const ArtistsDirectoryClient: React.FC<ArtistsDirectoryClientProps> = ({
  initialArtists,
  genres,
  initialGenre,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre || 'Todos');
  const [selectedProvince, setSelectedProvince] = useState<string>('Todas');

  const provinces = useMemo(() => {
    const list = Array.from(new Set(initialArtists.map((a) => a.province))).filter(Boolean);
    return ['Todas', ...list];
  }, [initialArtists]);

  const filteredArtists = useMemo(() => {
    return initialArtists.filter((artist) => {
      // Filter by genre
      const matchesGenre =
        selectedGenre === 'Todos' ||
        artist.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase());

      // Filter by province
      const matchesProvince =
        selectedProvince === 'Todas' || artist.province === selectedProvince;

      // Filter by text query
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        artist.stageName.toLowerCase().includes(q) ||
        artist.city.toLowerCase().includes(q) ||
        artist.province.toLowerCase().includes(q) ||
        artist.shortBio.toLowerCase().includes(q) ||
        artist.genres.some((g) => g.toLowerCase().includes(q));

      return matchesGenre && matchesProvince && matchesQuery;
    });
  }, [initialArtists, selectedGenre, selectedProvince, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
          <Mic2 className="w-4 h-4" />
          <span>Directorio Federal de Música</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          Artistas & Bandas Emergentes
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-2xl">
          Explorá solistas, agrupaciones y proyectos independientes de todos los géneros y rincones de Argentina y Latinoamérica.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="glass-card p-4 sm:p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, ciudad o palabra clave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-amber-400/60 transition-colors"
            />
          </div>

          {/* Province Filter */}
          <div className="sm:col-span-6 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#11141f] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400/60"
            >
              <option value="Todas">Todas las Provincias / Regiones</option>
              {provinces.filter((p) => p !== 'Todas').map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Genre Badges Pills */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-400 mr-1">Géneros:</span>
          {['Todos', ...genres].map((genre) => {
            const isSelected = selectedGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span>
          Mostrando <strong className="text-white">{filteredArtists.length}</strong> de {initialArtists.length} artistas
        </span>
        {(searchQuery || selectedGenre !== 'Todos' || selectedProvince !== 'Todas') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGenre('Todos');
              setSelectedProvince('Todas');
            }}
            className="text-amber-400 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Artists Grid */}
      {filteredArtists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredArtists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 glass-card rounded-3xl border border-white/10 space-y-3">
          <Mic2 className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No se encontraron artistas</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Probá ajustando los términos de búsqueda o seleccionando otro género.
          </p>
        </div>
      )}
    </div>
  );
};
