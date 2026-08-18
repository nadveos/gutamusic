'use client';

import React, { useState, useMemo } from 'react';
import { Artist, GenreType } from '../../lib/types';
import { ArtistCard } from '../../components/ArtistCard';
import { Search, Mic2, MapPin } from 'lucide-react';

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
      const matchesGenre =
        selectedGenre === 'Todos' ||
        artist.genres.some((g) => g.toLowerCase() === selectedGenre.toLowerCase());

      const matchesProvince =
        selectedProvince === 'Todas' || artist.province === selectedProvince;

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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#e6cca0]">
          <Mic2 className="w-3.5 h-3.5" />
          <span>Directorio Federal de Música</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#f3f1ec]">
          Artistas & Bandas Emergentes
        </h1>
        <p className="text-[#aba79e] text-xs sm:text-sm max-w-2xl">
          Explorá solistas, agrupaciones y proyectos independientes de todos los géneros y rincones de Argentina y Latinoamérica.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="natural-card p-4 sm:p-5 rounded-2xl space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-[#8c887f] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, ciudad o palabra clave..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] placeholder-[#78746c] text-xs focus:outline-none focus:border-[#d97d64] transition-colors"
            />
          </div>

          {/* Province Filter */}
          <div className="sm:col-span-6 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#d97d64] flex-shrink-0" />
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
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
        <div className="pt-2 border-t border-[#2a2c35] flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#8c887f] mr-1">Géneros:</span>
          {['Todos', ...genres].map((genre) => {
            const isSelected = selectedGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  isSelected
                    ? 'bg-[#d97d64] text-[#151618] font-bold'
                    : 'bg-[#24252c] text-[#aba79e] hover:bg-[#2c2e37] hover:text-[#f3f1ec] border border-[#31333d]'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-[#8c887f] px-1">
        <span>
          Mostrando <strong className="text-[#f3f1ec]">{filteredArtists.length}</strong> de {initialArtists.length} artistas
        </span>
        {(searchQuery || selectedGenre !== 'Todos' || selectedProvince !== 'Todas') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedGenre('Todos');
              setSelectedProvince('Todas');
            }}
            className="text-[#e6cca0] hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Artists Grid */}
      {filteredArtists.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredArtists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 natural-card rounded-2xl space-y-2">
          <Mic2 className="w-8 h-8 text-[#78746c] mx-auto" />
          <h3 className="text-base font-bold text-[#f3f1ec]">No se encontraron artistas</h3>
          <p className="text-xs text-[#8c887f] max-w-xs mx-auto">
            Probá ajustando los términos de búsqueda o seleccionando otro género.
          </p>
        </div>
      )}
    </div>
  );
};
