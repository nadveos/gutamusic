import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Artist } from '../lib/types';
import { MapPin, ArrowRight, Radio } from 'lucide-react';

interface HeroFeaturedProps {
  artist: Artist;
}

export const HeroFeatured: React.FC<HeroFeaturedProps> = ({ artist }) => {
  return (
    <section className="relative w-full rounded-2xl overflow-hidden natural-card my-6">
      {/* Background Media with overlay gradient */}
      <div className="absolute inset-0 z-0">
        <Image
          src={artist.bannerUrl || artist.photoUrl}
          alt={artist.stageName}
          fill
          sizes="100vw"
          priority
          className="object-cover object-center opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#151618] via-[#151618]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#151618] via-[#151618]/70 to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-4xl space-y-5">
        {/* Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold bg-sand-soft uppercase tracking-wider">
            Artista Destacado de la Semana
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-[#aba79e]">
            <MapPin className="w-3.5 h-3.5 text-[#d97d64]" />
            {artist.city}, {artist.province}
          </span>
        </div>

        {/* Title & Bio */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-[#f3f1ec] tracking-tight leading-none">
            {artist.stageName}
          </h1>
          <p className="text-base sm:text-lg text-[#c5c0b6] font-normal leading-relaxed max-w-2xl">
            {artist.shortBio}
          </p>
          {artist.quotes && (
            <p className="italic text-xs sm:text-sm text-[#e6cca0] font-serif border-l-2 border-[#d97d64] pl-3 py-0.5">
              {artist.quotes}
            </p>
          )}
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-2 pt-1">
          {artist.genres.map((g) => (
            <span
              key={g}
              className="text-xs px-2.5 py-1 rounded-md bg-[#272931] text-[#c5c0b6] border border-[#353844] font-medium"
            >
              {g}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <Link
            href={`/artistas/${artist.slug}`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] transition-colors active:scale-95"
          >
            <span>Ver Perfil & Discografía</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {artist.videos.length > 0 && (
            <Link
              href={`/entrevistas/serenata-gaucha-en-vivo-guta-estudio`}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-xs bg-[#25272f] hover:bg-[#2e303b] text-[#f3f1ec] border border-[#393c49] transition-colors"
            >
              <Radio className="w-4 h-4 text-[#d97d64]" />
              <span>Ver Sesión en Vivo GUTA</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};
