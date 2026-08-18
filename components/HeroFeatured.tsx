import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Artist } from '../lib/types';
import { Play, Sparkles, MapPin, ArrowRight, Music, Radio } from 'lucide-react';

interface HeroFeaturedProps {
  artist: Artist;
}

export const HeroFeatured: React.FC<HeroFeaturedProps> = ({ artist }) => {
  return (
    <section className="relative w-full rounded-3xl overflow-hidden glass-card border border-white/10 my-6 shadow-2xl">
      {/* Background Media with overlay gradient */}
      <div className="absolute inset-0 z-0">
        <Image
          src={artist.bannerUrl || artist.photoUrl}
          alt={artist.stageName}
          fill
          priority
          className="object-cover object-center opacity-40 scale-105 transition-transform duration-1000 hover:scale-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/60 to-transparent" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 p-6 sm:p-10 lg:p-14 max-w-4xl space-y-6">
        {/* Badge */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
            Artista Destacado de la Semana
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            {artist.city}, {artist.province}
          </span>
        </div>

        {/* Title & Bio */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
            {artist.stageName}
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 font-light leading-relaxed max-w-2xl">
            {artist.shortBio}
          </p>
          {artist.quotes && (
            <p className="italic text-sm text-amber-200/90 font-serif border-l-2 border-amber-500/60 pl-3 py-0.5">
              {artist.quotes}
            </p>
          )}
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-2 pt-1">
          {artist.genres.map((g) => (
            <span
              key={g}
              className="text-xs px-3 py-1 rounded-lg bg-white/10 text-gray-200 border border-white/10 font-medium"
            >
              {g}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-4 pt-4">
          <Link
            href={`/artistas/${artist.slug}`}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/25 transition-all active:scale-95"
          >
            <span>Ver Perfil & Discografía</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {artist.videos.length > 0 && (
            <Link
              href={`/entrevistas/serenata-gaucha-en-vivo-guta-estudio`}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all backdrop-blur-md"
            >
              <Radio className="w-4 h-4 text-rose-400" />
              <span>Ver Sesión en Vivo GUTA</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};
