'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Artist } from '../lib/types';
import { MapPin, ArrowRight, Sparkles, Play, Music, Flame } from 'lucide-react';

interface WeeklyFeaturedSectionProps {
  artists: Artist[];
  totalArtistsCount?: number;
}

export const WeeklyFeaturedSection: React.FC<WeeklyFeaturedSectionProps> = ({ artists, totalArtistsCount }) => {
  if (!artists || artists.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 sm:space-y-5" aria-label="Destacados de la Semana">
      {/* Encabezado de la sección */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-[#242630]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#d97d64]">
            <span className="p-1 rounded-md bg-[#d97d64]/10 text-[#d97d64]">
              <Flame className="w-3.5 h-3.5" />
            </span>
            <span>Rotación Semanal</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#f3f1ec] tracking-tight mt-1">
            Destacados de la Semana
          </h2>
          <p className="text-xs sm:text-sm text-[#aba79e]">
            Proyectos independientes recomendados en difusión especial durante 7 días
          </p>
        </div>

        {/* Botón directo para ver catálogo completo */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            href="/artistas"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#20222a] hover:bg-[#292c36] text-[#e6cca0] hover:text-[#f3f1ec] border border-[#2e313d] text-xs font-bold transition-all shadow-xs active:scale-95"
          >
            <span>Ver todos los artistas</span>
            {typeof totalArtistsCount === 'number' && totalArtistsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-[#d97d64]/15 text-[#d97d64] text-[11px] font-extrabold">
                {totalArtistsCount}
              </span>
            )}
            <ArrowRight className="w-3.5 h-3.5 text-[#d97d64]" />
          </Link>
        </div>
      </div>

      {/* Grid de Cards con microanimaciones hover y alta fidelidad en móvil */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {artists.map((artist) => {
          const location = artist.city && artist.province && artist.city.toLowerCase() !== artist.province.toLowerCase()
            ? `${artist.city}, ${artist.province}`
            : (artist.province || artist.city || artist.country || 'Argentina');

          const imageSrc = artist.photoUrl || artist.bannerUrl || '/brand/guta-musica-logo.svg';

          return (
            <article
              key={artist.id}
              className="group relative rounded-2xl overflow-hidden bg-[#16171c] border border-[#272933] hover:border-[#d97d64]/60 transition-all duration-300 hover:shadow-[0_12px_28px_rgba(217,125,100,0.16)] hover:-translate-y-1 flex flex-col justify-between"
            >
              {/* Media Thumbnail con zoom y badge animado */}
              <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-[#101114]">
                <Image
                  src={imageSrc}
                  alt={artist.stageName}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover object-center group-hover:scale-106 transition-transform duration-500 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#16171c] via-[#16171c]/30 to-transparent" />

                {/* Badge flotante "Destacado de la Semana" */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#141518]/90 text-[#e6cca0] border border-[#d97d64]/40 backdrop-blur-md shadow-lg">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d97d64] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#d97d64]" />
                    </span>
                    <span>De la Semana</span>
                  </span>
                </div>

                {/* Floating Play Icon Overlay al hacer hover */}
                <div className="absolute bottom-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-[#d97d64] text-[#121316] flex items-center justify-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 shadow-lg shadow-[#d97d64]/30">
                  <Play className="w-3.5 h-3.5 fill-[#121316] ml-0.5" />
                </div>
              </div>

              {/* Contenido de la Card */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  {/* Ubicación */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[#8c887f]">
                    <MapPin className="w-3 h-3 text-[#d97d64] shrink-0" />
                    <span className="truncate">{location}</span>
                  </div>

                  {/* Nombre del Artista */}
                  <h3 className="text-base sm:text-lg font-black text-[#f3f1ec] group-hover:text-[#e6cca0] transition-colors leading-tight line-clamp-1">
                    {artist.stageName}
                  </h3>

                  {/* Biografía corta / Quote */}
                  <p className="text-xs text-[#aba79e] line-clamp-2 leading-relaxed">
                    {artist.shortBio || artist.bio || 'Proyecto musical independiente en difusión federal.'}
                  </p>

                  {/* Géneros */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {artist.genres.slice(0, 2).map((genre) => (
                      <span
                        key={genre}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#20222a] text-[#c5c0b6] border border-[#2e313d]"
                      >
                        {genre}
                      </span>
                    ))}
                    {artist.genres.length > 2 && (
                      <span className="text-[10px] text-[#78746c] self-center">
                        +{artist.genres.length - 2}
                      </span>
                    )}
                  </div>
                </div>

                {/* Enlace y CTA táctil */}
                <div className="pt-2.5 border-t border-[#23252e] flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#78746c] flex items-center gap-1">
                    <Music className="w-3 h-3 text-[#93a887]" />
                    <span>Perfil Oficial</span>
                  </span>

                  <Link
                    href={`/artistas/${artist.slug}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#e6cca0] group-hover:text-[#f3f1ec] group-hover:bg-[#d97d64] group-hover:text-[#121316] transition-all cursor-pointer"
                  >
                    <span>Escuchar</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Botón inferior responsive para explorar todo el catálogo */}
      <div className="pt-2 flex justify-center">
        <Link
          href="/artistas"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1b1c23] hover:bg-[#23252f] text-[#e6cca0] hover:text-[#f3f1ec] border border-[#2b2d39] text-xs font-bold transition-all shadow-sm active:scale-98"
        >
          <span>Explorar el catálogo completo de artistas</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#d97d64]" />
        </Link>
      </div>
    </section>
  );
};
