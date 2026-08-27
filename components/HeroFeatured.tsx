'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Artist } from '../lib/types';
import { MapPin, ArrowRight, Radio, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface HeroFeaturedProps {
  artist?: Artist;
  artists?: Artist[];
}

export const HeroFeatured: React.FC<HeroFeaturedProps> = ({ artist, artists: rawArtists }) => {
  const artists: Artist[] = rawArtists && rawArtists.length > 0 
    ? rawArtists 
    : artist 
      ? [artist] 
      : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = artists.length;
  const currentArtist = artists[currentIndex] || artists[0];

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay con pausa en hover
  useEffect(() => {
    if (total <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      handleNext();
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused, handleNext]);

  if (!currentArtist) return null;

  const isMultiple = total > 1;

  return (
    <section
      className="relative w-full rounded-2xl overflow-hidden natural-card my-6 group h-[420px] sm:h-[460px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Artistas Destacados"
    >
      {/* Background Media with smooth transition */}
      <div className="absolute inset-0 z-0">
        <div key={currentArtist.id} className="relative w-full h-full animate-fadeIn transition-opacity duration-700">
          <Image
            src={currentArtist.bannerUrl || currentArtist.photoUrl}
            alt={currentArtist.stageName}
            fill
            sizes="100vw"
            priority
            className="object-cover object-center opacity-30 scale-100 group-hover:scale-102 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#151618] via-[#151618]/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#151618] via-[#151618]/70 to-transparent" />
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 p-6 sm:p-10 lg:p-12 max-w-4xl h-full flex flex-col justify-between">
        <div className="space-y-4">
          {/* Badge & Navigation info */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold bg-sand-soft uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#d97d64]" />
              {currentArtist.featuredOfWeek ? 'Artista Destacado de la Semana' : 'Artista Destacado'}
              {isMultiple && (
                <span className="ml-1 opacity-75 font-normal">
                  ({currentIndex + 1} de {total})
                </span>
              )}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-[#aba79e]">
              <MapPin className="w-3.5 h-3.5 text-[#d97d64]" />
              {currentArtist.city && currentArtist.province && currentArtist.city.toLowerCase() !== currentArtist.province.toLowerCase()
                ? `${currentArtist.city}, ${currentArtist.province}`
                : (currentArtist.province ? `${currentArtist.province}, ${currentArtist.country || 'Argentina'}` : (currentArtist.country || 'Argentina'))}
            </span>
          </div>

          {/* Title & Bio with smooth fade */}
          <div key={`info-${currentArtist.id}`} className="space-y-3 animate-fadeIn">
            <h1 className="text-3xl sm:text-5xl font-black text-[#f3f1ec] tracking-tight leading-none">
              {currentArtist.stageName}
            </h1>
            <p className="text-base sm:text-lg text-[#c5c0b6] font-normal leading-relaxed max-w-2xl line-clamp-3">
              {currentArtist.shortBio}
            </p>
            {currentArtist.quotes && (
              <p className="italic text-xs sm:text-sm text-[#e6cca0] font-serif border-l-2 border-[#d97d64] pl-3 py-0.5 line-clamp-2">
                &ldquo;{currentArtist.quotes}&rdquo;
              </p>
            )}
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2 pt-1">
            {currentArtist.genres.map((g) => (
              <span
                key={g}
                className="text-xs px-2.5 py-1 rounded-md bg-[#272931]/80 backdrop-blur-xs text-[#c5c0b6] border border-[#353844] font-medium"
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <Link
            href={`/artistas/${currentArtist.slug}`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] transition-colors active:scale-95 shadow-md"
          >
            <span>Ver Perfil & Discografía</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {currentArtist.videos && currentArtist.videos.length > 0 && (
            <Link
              href={`/artistas/${currentArtist.slug}`}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-xs bg-[#25272f]/90 hover:bg-[#2e303b] text-[#f3f1ec] border border-[#393c49] transition-colors"
            >
              <Radio className="w-4 h-4 text-[#d97d64]" />
              <span>Ver Videos & Lives ({currentArtist.videos.length})</span>
            </Link>
          )}
        </div>
      </div>

      {/* Slider Controls (if multiple featured artists) */}
      {isMultiple && (
        <>
          {/* Arrow Left */}
          <button
            onClick={handlePrev}
            aria-label="Artista anterior"
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#18191d]/80 hover:bg-[#d97d64] hover:text-[#151618] text-[#f3f1ec] border border-[#393c49] flex items-center justify-center backdrop-blur-md transition-all opacity-80 group-hover:opacity-100 active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Arrow Right */}
          <button
            onClick={handleNext}
            aria-label="Siguiente artista"
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#18191d]/80 hover:bg-[#d97d64] hover:text-[#151618] text-[#f3f1ec] border border-[#393c49] flex items-center justify-center backdrop-blur-md transition-all opacity-80 group-hover:opacity-100 active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicator at the bottom */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#151618]/70 backdrop-blur-md border border-[#31333d]">
            {artists.map((item, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Ir al artista ${idx + 1}: ${item.stageName}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-6 bg-[#d97d64]'
                      : 'w-2 bg-[#4b4e5c] hover:bg-[#aba79e]'
                  }`}
                />
              );
            })}
          </div>
        </>
      )}
    </section>
  );
};
