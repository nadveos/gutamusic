import React from 'react';
import Link from 'next/link';
import { MusicDataService } from '../lib/api';

export const dynamic = 'force-dynamic';
import { HeroFeatured } from '../components/HeroFeatured';
import { WeeklyFeaturedSection } from '../components/WeeklyFeaturedSection';
import { VideoEmbedGrid } from '../components/VideoEmbedGrid';
import { FeaturedInterviewCard } from '../components/FeaturedInterviewCard';
import { SponsorBillboardHero } from '../components/SponsorBillboardHero';
import { HomeLiveSidebar } from '../components/HomeLiveSidebar';
import { getSpotifyPlaylist } from '../lib/services/spotifyService';

export default async function HomePage() {
  // Asegurar en segundo plano que las efemérides del día de hoy estén sincronizadas en PocketBase
  MusicDataService.getTodayEphemerides().catch(() => {});

  const consagradosArtists = await MusicDataService.getConsagradosArtists();
  const weeklyFeaturedArtists = await MusicDataService.getWeeklyFeaturedArtists();
  const latestArtists = await MusicDataService.getArtists();
  const videos = await MusicDataService.getVideos(4);
  const featuredInterview = await MusicDataService.getFeaturedInterview();

  // Playlist oficial de Spotify
  const playlistId = process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID || '5eprX7q6HoedI2nnnHEE2H';
  const spotifyPlaylist = await getSpotifyPlaylist(playlistId);

  // Auspiciantes para la columna lateral (home_mid & all_sections)
  const homeSponsors = await MusicDataService.getAlliances('home_mid', true);

  return (
    <div className="space-y-10">
      {/* 1. Hero Principal - Artistas Consagrados Fijos */}
      {consagradosArtists.length > 0 && (
        <HeroFeatured artists={consagradosArtists} titleBadge="Artista Consagrado" />
      )}

      {/* 1.1 Billboard de Alto Impacto (Scroll-Reveal): Patrocinador Oficial Exclusivo */}
      <SponsorBillboardHero />

      {/* 2. Grid Editorial en 2 Columnas: Contenido Principal + Sidebar Sticky */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-6">
        {/* Columna Principal Izquierda (66% - 70%) */}
        <div className="lg:col-span-8 space-y-12">
          {/* Destacados de la Semana */}
          {weeklyFeaturedArtists.length > 0 && (
            <WeeklyFeaturedSection
              artists={weeklyFeaturedArtists}
              totalArtistsCount={latestArtists.length}
            />
          )}

          {/* Entrevista Destacada & Sesión Exclusiva */}
          {featuredInterview && <FeaturedInterviewCard interview={featuredInterview} />}

          {/* Últimos Videos de YouTube, TikTok y Facebook */}
          <VideoEmbedGrid videos={videos} />
        </div>

        {/* Columna Lateral Sticky Derecha (30% - 34%) */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          <HomeLiveSidebar
            playlist={spotifyPlaylist}
            playlistId={playlistId}
            sponsors={homeSponsors}
          />
        </aside>
      </div>

      {/* 3. Banner de Convocatoria Federal para Artistas */}
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
            href="/entrevistas"
            className="px-5 py-2.5 rounded-xl font-medium text-xs bg-[#25272f] hover:bg-[#2e303b] text-[#f3f1ec] border border-[#393c49] transition-colors"
          >
            Ver Entrevistas & Sesiones
          </Link>
        </div>
      </section>
    </div>
  );
}

