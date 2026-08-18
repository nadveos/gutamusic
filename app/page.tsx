import React from 'react';
import Link from 'next/link';
import { MusicDataService } from '../lib/api';
import { HeroFeatured } from '../components/HeroFeatured';
import { ArtistCard } from '../components/ArtistCard';
import { EphemeridesWidget } from '../components/EphemeridesWidget';
import { VideoEmbedGrid } from '../components/VideoEmbedGrid';
import { FeaturedInterviewCard } from '../components/FeaturedInterviewCard';
import { Mic2, ArrowRight, Sparkles, Radio, Calendar } from 'lucide-react';

export default async function HomePage() {
  const featuredArtist = await MusicDataService.getFeaturedArtistOfWeek();
  const latestArtists = await MusicDataService.getArtists();
  const videos = await MusicDataService.getVideos(4);
  const featuredInterview = await MusicDataService.getFeaturedInterview();
  const ephemerides = await MusicDataService.getTodayEphemerides();

  return (
    <div className="space-y-12">
      {/* 1. Hero Principal - Artista de la Semana */}
      {featuredArtist && <HeroFeatured artist={featuredArtist} />}

      {/* 2. Efemérides Musicales del Día */}
      <EphemeridesWidget items={ephemerides} day={18} month={8} />

      {/* 3. Últimos Artistas Incorporados */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
              <Mic2 className="w-4 h-4" />
              <span>Nuevos Descubrimientos</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Últimos Artistas Incorporados
            </h2>
            <p className="text-sm text-gray-400">
              Talentos independientes de toda la Argentina y Latinoamérica
            </p>
          </div>

          <Link
            href="/artistas"
            className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span>Ver catálogo completo ({latestArtists.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Artists Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-cyan-500/20 p-8 sm:p-12 border border-white/10 text-center space-y-4 shadow-xl">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
          <Sparkles className="w-3.5 h-3.5" /> Convocatoria Abierta Permanente
        </span>
        <h3 className="text-2xl sm:text-4xl font-black text-white max-w-2xl mx-auto leading-tight">
          ¿Hacés música independiente y querés difusión federal?
        </h3>
        <p className="text-sm text-gray-300 max-w-xl mx-auto">
          Sumá tu material discográfico, videos, peñas y recitales a la plataforma GUTA MÚSICA sin intermediarios.
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-4">
          <Link
            href="/artistas"
            className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-500/20 transition-all"
          >
            Sumar Mi Proyecto Musical
          </Link>
          <Link
            href="/agenda"
            className="px-6 py-3 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all"
          >
            Consultar Cartelera de Fechas
          </Link>
        </div>
      </section>
    </div>
  );
}
