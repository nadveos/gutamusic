import React from 'react';
import Link from 'next/link';
import { MusicDataService } from '../lib/api';

export const revalidate = 60;
import { HeroFeatured } from '../components/HeroFeatured';
import { WeeklyFeaturedSection } from '../components/WeeklyFeaturedSection';
import { VideoEmbedGrid } from '../components/VideoEmbedGrid';
import { FeaturedInterviewCard } from '../components/FeaturedInterviewCard';
import { SponsorBillboardHero } from '../components/SponsorBillboardHero';
import { HomeLiveSidebar } from '../components/HomeLiveSidebar';
import { getSpotifyPlaylist } from '../lib/services/spotifyService';
import { getProfessionalsFromDb } from '../lib/services/professionalsService';

export default async function HomePage() {
  // Asegurar en segundo plano que las efemérides del día de hoy estén sincronizadas en PocketBase
  MusicDataService.getTodayEphemerides().catch(() => {});

  const playlistId = process.env.NEXT_PUBLIC_SPOTIFY_PLAYLIST_ID || '5eprX7q6HoedI2nnnHEE2H';

  const [
    consagradosArtists,
    weeklyFeaturedArtists,
    latestArtists,
    videos,
    featuredInterview,
    spotifyPlaylist,
    homeSponsors,
    homeProfessionals,
  ] = await Promise.all([
    MusicDataService.getConsagradosArtists(),
    MusicDataService.getWeeklyFeaturedArtists(),
    MusicDataService.getArtists(),
    MusicDataService.getVideos(4),
    MusicDataService.getFeaturedInterview(),
    getSpotifyPlaylist(playlistId),
    MusicDataService.getAlliances('home_mid', true),
    getProfessionalsFromDb({ onlyActive: true }).catch(() => []),
  ]);

  const billboardSponsors = homeSponsors.filter((s) => s.sector === 'all_sections');

  return (
    <div className="space-y-10">
      {/* 1. Hero Principal - Artistas Consagrados Fijos */}
      {consagradosArtists.length > 0 && (
        <HeroFeatured artists={consagradosArtists} titleBadge="Artista Consagrado" />
      )}

      {/* 1.05 Franja de Convocatoria Alta Visibilidad para Artistas */}
      <section className="rounded-2xl bg-gradient-to-r from-[#241b1a] via-[#1c1d24] to-[#191d1b] border border-[#d97d64]/45 px-5 py-4 sm:px-7 sm:py-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-[#d97d64]/10">
        <div className="flex items-center gap-3.5 text-center md:text-left">
          <div className="hidden sm:flex w-11 h-11 rounded-xl bg-[#d97d64]/20 border border-[#d97d64]/40 items-center justify-center text-xl shrink-0">
            🎸
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#d97d64]/20 text-[#d97d64] text-[10px] font-black uppercase tracking-wider">
                100% Gratis • Autogestión en 2 min
              </span>
              <h2 className="text-sm sm:text-base font-black text-[#f3f1ec]">
                ¿Tenés una banda o proyecto solista?
              </h2>
            </div>
            <p className="text-xs text-[#aba79e]">
              Creá tu perfil oficial en GUTA MÚSICA, vinculá tu Spotify y publicá tus videos y fechas sin costo.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
          <Link
            href="/registro"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d97d64] to-[#e6cca0] hover:opacity-95 text-[#151618] font-extrabold text-xs shadow-lg shadow-[#d97d64]/25 transition-all active:scale-95 whitespace-nowrap"
          >
            + Registrar Mi Banda Gratis →
          </Link>
          <Link
            href="/login"
            className="px-3.5 py-2.5 rounded-xl bg-[#222329] hover:bg-[#2a2c35] text-[#f3f1ec] border border-[#353844] font-semibold text-xs transition-colors whitespace-nowrap"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* 1.1 Bloque Combinado en Home: Box Auspiciante Premium + Row de 4 Profesionales */}
      <SponsorBillboardHero
        initialSponsors={billboardSponsors}
        professionals={homeProfessionals}
      />

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
            href="/registro"
            className="px-6 py-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-[#d97d64] to-[#e6cca0] hover:opacity-95 text-[#151618] transition-all shadow-lg shadow-[#d97d64]/25"
          >
            + Registrar Mi Banda Gratis →
          </Link>
          <Link
            href="/entrevistas"
            className="px-5 py-3 rounded-xl font-medium text-xs bg-[#25272f] hover:bg-[#2e303b] text-[#f3f1ec] border border-[#393c49] transition-colors"
          >
            Ver Entrevistas & Sesiones
          </Link>
        </div>
      </section>
    </div>
  );
}

