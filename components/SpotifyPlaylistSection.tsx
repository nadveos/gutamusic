import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, ArrowRight, Music, Radio, Sparkles } from 'lucide-react';
import { SpotifyPlaylistData } from '../lib/services/spotifyService';

export const SpotifyIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.497 17.307c-.217.354-.678.468-1.032.251-2.825-1.726-6.381-2.116-10.569-1.161-.403.093-.807-.156-.9-.559-.093-.404.156-.807.559-.9 4.582-1.048 8.528-.601 11.69 1.338.354.217.468.678.252 1.031zm1.468-3.262c-.273.443-.853.583-1.296.31-3.234-1.988-8.163-2.564-11.987-1.402-.497.151-1.026-.134-1.177-.631-.151-.497.134-1.026.631-1.177 4.372-1.328 9.805-.688 13.522 1.603.443.273.583.854.307 1.3zm.126-3.41c-3.878-2.302-10.279-2.513-13.987-1.387-.595.181-1.225-.157-1.406-.752-.181-.595.157-1.225.752-1.406 4.259-1.294 11.319-1.05 15.792 1.606.536.318.712 1.011.394 1.547-.318.536-1.011.712-1.545.392z" />
  </svg>
);

interface SpotifyPlaylistSectionProps {
  playlist: SpotifyPlaylistData | null;
  playlistId?: string;
}

export const SpotifyPlaylistSection: React.FC<SpotifyPlaylistSectionProps> = ({
  playlist,
  playlistId = '5eprX7q6HoedI2nnnHEE2H',
}) => {
  const currentId = playlist?.id || playlistId;
  const name = playlist?.name || 'Top Artistas Emergentes by Guta 1';
  const description = playlist?.description || 'Playlist oficial de GUTA MÚSICA';
  const spotifyUrl = playlist?.externalUrl || `https://open.spotify.com/playlist/${currentId}`;
  const ownerName = playlist?.ownerName || 'Guta Música';
  const imageUrl = playlist?.imageUrl;

  return (
    <section className="space-y-5 my-8">
      {/* 1. Header con estilo simétrico a las secciones de artistas */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#e6cca0]">
            <SpotifyIcon className="w-4 h-4 text-[#1DB954]" />
            <span>Playlist Oficial • GUTA MÚSICA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#f3f1ec]">
            {name}
          </h2>
          <p className="text-xs sm:text-sm text-[#aba79e]">
            Sonidos nuevos, canciones destacadas y el pulso de la escena emergente
          </p>
        </div>

        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1DB954] hover:bg-[#1aa34a] text-[#0d0e11] transition-all duration-200 shadow-md shadow-[#1DB954]/15 hover:shadow-[#1DB954]/30 hover:scale-[1.02] self-start sm:self-auto"
        >
          <SpotifyIcon className="w-4 h-4" />
          <span>Seguir en Spotify</span>
          <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
        </a>
      </div>

      {/* 2. Grid Principal: Tarjeta Editorial + Reproductor Embebido */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Columna Izquierda: Tarjeta Editorial Curada */}
        <div className="lg:col-span-5 natural-card rounded-2xl p-6 sm:p-7 flex flex-col justify-between border border-[#2d2f38] relative overflow-hidden group">
          {/* Resplandor ambiental de fondo */}
          <div className="absolute -top-16 -right-16 w-52 h-52 bg-[#1DB954]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#1DB954]/15 transition-colors" />

          <div className="space-y-5 relative z-10">
            {/* Cabecera interna: Portada oficial y datos */}
            <div className="flex items-start gap-4">
              {imageUrl ? (
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shadow-xl shrink-0 border border-[#3c3f4c]">
                  <Image
                    src={imageUrl}
                    alt={name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="96px"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-gradient-to-br from-[#1DB954]/25 to-[#1a1b1f] border border-[#3c3f4c] flex items-center justify-center shrink-0 shadow-lg">
                  <SpotifyIcon className="w-10 h-10 text-[#1DB954]" />
                </div>
              )}

              <div className="space-y-1.5 min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#1DB954] bg-[#1DB954]/10 px-2 py-0.5 rounded-full border border-[#1DB954]/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-ping" />
                  <span>Playlist Activa</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#f3f1ec] leading-snug line-clamp-2">
                  {name}
                </h3>
                <p className="text-xs text-[#aba79e]">
                  Por <span className="text-[#e6cca0] font-medium">{ownerName}</span>
                </p>
              </div>
            </div>

            {/* Descripción curatorial */}
            <p className="text-xs sm:text-sm text-[#aba79e] leading-relaxed">
              {description}
            </p>

            {/* Badges de estilo */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#25272f] text-[#f3f1ec] border border-[#393c49] flex items-center gap-1.5">
                <Music className="w-3 h-3 text-[#e6cca0]" />
                Talento Independiente
              </span>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#25272f] text-[#e6cca0] border border-[#393c49] flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-[#d97d64]" />
                Rotación Continua
              </span>
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-[#25272f] text-[#93a887] border border-[#393c49] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#1DB954]" />
                Actualizada 2026
              </span>
            </div>
          </div>

          {/* Bloque inferior: Convocatoria directa a artistas */}
          <div className="pt-5 mt-6 border-t border-[#2d2f38] relative z-10 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#aba79e] font-semibold">
                ¿Sos artista o banda?
              </p>
              <p className="text-xs text-[#f3f1ec] font-medium">
                Postulá tu canción para la lista
              </p>
            </div>
            <Link
              href="/artistas"
              className="text-xs font-bold text-[#e6cca0] hover:text-[#f3f1ec] transition-colors inline-flex items-center gap-1 shrink-0"
            >
              <span>Postularte</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Columna Derecha: Reproductor Oficial Spotify Embebido */}
        <div className="lg:col-span-7 natural-card rounded-2xl p-2.5 sm:p-3 border border-[#2d2f38] bg-[#121316] overflow-hidden flex flex-col justify-center shadow-xl">
          <iframe
            src={`https://open.spotify.com/embed/playlist/${currentId}?utm_source=generator&theme=0`}
            width="100%"
            height="380"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl w-full"
            style={{ borderRadius: '12px', minHeight: '380px' }}
            title={name}
          />
        </div>
      </div>
    </section>
  );
};
