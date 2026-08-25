import React from 'react';
import Link from 'next/link';
import { MusicDataService } from '../lib/api';
import { HeroFeatured } from '../components/HeroFeatured';
import { ArtistCard } from '../components/ArtistCard';
import { EphemeridesWidget } from '../components/EphemeridesWidget';
import { VideoEmbedGrid } from '../components/VideoEmbedGrid';
import { FeaturedInterviewCard } from '../components/FeaturedInterviewCard';
import { Mic2, ArrowRight } from 'lucide-react';

export default async function HomePage() {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1;

  const featuredArtists = await MusicDataService.getFeaturedArtists();
  const latestArtists = await MusicDataService.getArtists();
  const videos = await MusicDataService.getVideos(4);
  const featuredInterview = await MusicDataService.getFeaturedInterview();
  const ephemerides = await MusicDataService.getTodayEphemerides(currentDay, currentMonth);

  return (
    <div className="space-y-10">
      {/* 1. Hero Principal - Artistas Destacados (Slider) */}
      {featuredArtists.length > 0 && <HeroFeatured artists={featuredArtists} />}

      {/* 2. Efemérides Musicales del Día */}
      <EphemeridesWidget items={ephemerides} day={currentDay} month={currentMonth} />

      {/* 3. Últimos Artistas Incorporados */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#e6cca0]">
              <Mic2 className="w-3.5 h-3.5" />
              <span>Nuevos Descubrimientos</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#f3f1ec]">
              Últimos Artistas Incorporados
            </h2>
            <p className="text-xs sm:text-sm text-[#aba79e]">
              Talentos independientes de toda la Argentina y Latinoamérica
            </p>
          </div>

          <Link
            href="/artistas"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e6cca0] hover:text-[#f3f1ec] transition-colors"
          >
            <span>Ver catálogo completo ({latestArtists.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Artists Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {latestArtists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      </section>

      {/* 4. Entrevista Destacada & Sesión Exclusiva */}
      {featuredInterview && <FeaturedInterviewCard interview={featuredInterview} />}

      {/* 5. Últimos Videos de YouTube, TikTok y Facebook */}
      <VideoEmbedGrid videos={videos} />

      {/* 6. Banner de Convocatoria Federal para Artistas */}
      <section className="rounded-2xl natural-card p-8 sm:p-10 text-center space-y-3.5">
        <span className="inline-block px-3 py-1 rounded-md text-[11px] font-semibold bg-sand-soft uppercase tracking-wider">
          Convocatoria Abierta Permanente
        </span>
        <h3 className="text-2xl sm:text-3xl font-bold text-[#f3f1ec] max-w-xl mx-auto leading-snug">
          ¿Hacés música independiente y buscás difusión federal?
        </h3>
        <p className="text-xs sm:text-sm text-[#aba79e] max-w-lg mx-auto">
          Sumá tu material discográfico, videos, peñas y recitales a la plataforma GUTA MÚSICA.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/artistas"
            className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] transition-colors"
          >
            Sumar Mi Proyecto Musical
          </Link>
          <Link
            href="/agenda"
            className="px-5 py-2.5 rounded-xl font-medium text-xs bg-[#25272f] hover:bg-[#2e303b] text-[#f3f1ec] border border-[#393c49] transition-colors"
          >
            Consultar Cartelera de Fechas
          </Link>
        </div>
      </section>
    </div>
  );
}
