'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Artist } from '../../../lib/types';
import {
  MapPin,
  Calendar,
  Disc3,
  Video,
  Newspaper,
  Image as ImageIcon,
  Share2,
  ExternalLink,
  Play,
  Ticket,
  Music,
  Radio,
  CheckCircle,
} from 'lucide-react';

interface ArtistProfileClientProps {
  artist: Artist;
}

export const ArtistProfileClient: React.FC<ArtistProfileClientProps> = ({ artist }) => {
  const [activeTab, setActiveTab] = useState<'bio' | 'videos' | 'discografia' | 'agenda' | 'prensa' | 'galeria'>('bio');
  const [activeVideoEmbed, setActiveVideoEmbed] = useState<string | null>(
    artist.videos.length > 0 ? artist.videos[0].embedUrl || null : null
  );

  return (
    <div className="space-y-10">
      {/* 1. Artist Header Hero */}
      <section className="relative rounded-3xl overflow-hidden glass-card border border-white/10 p-6 sm:p-10 shadow-2xl">
        {/* Background Banner */}
        <div className="absolute inset-0 z-0">
          <Image
            src={artist.bannerUrl || artist.photoUrl}
            alt={artist.stageName}
            fill
            priority
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-[#090a0f]/80 to-transparent" />
        </div>

        {/* Profile Card Header */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6 sm:gap-8">
          {/* Avatar / Main Photo */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden glass-panel border-2 border-amber-400/40 shadow-xl flex-shrink-0">
            <Image
              src={artist.photoUrl}
              alt={artist.stageName}
              fill
              className="object-cover"
            />
          </div>

          {/* Identity & Badges */}
          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {artist.genres[0]}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-300 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>{artist.city}, {artist.province}, {artist.country}</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              {artist.stageName}
            </h1>

            {artist.quotes && (
              <p className="text-xs sm:text-sm text-amber-200/80 italic font-serif">
                {artist.quotes}
              </p>
            )}

            {/* Social Links */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
              {artist.socials.spotify && (
                <a
                  href={artist.socials.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Spotify</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {artist.socials.youtube && (
                <a
                  href={artist.socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {artist.socials.instagram && (
                <a
                  href={artist.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Instagram</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {artist.socials.tiktok && (
                <a
                  href={artist.socials.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>TikTok</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-2 sm:gap-4 overflow-x-auto pb-2 text-sm font-semibold">
        {[
          { key: 'bio', label: 'Biografía & Reseña', icon: Music },
          { key: 'videos', label: `Videos & Lives (${artist.videos.length})`, icon: Video },
          { key: 'discografia', label: `Discografía (${artist.discography.length})`, icon: Disc3 },
          { key: 'agenda', label: `Agenda & Fechas (${artist.agenda.length})`, icon: Calendar },
          { key: 'prensa', label: `Notas & Prensa (${artist.press.length})`, icon: Newspaper },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}

      {/* Tab: BIO */}
      {activeTab === 'bio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6">
            <h2 className="text-2xl font-bold text-white">Trayectoria & Propuesta Musical</h2>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm sm:text-base">
              {artist.bio}
            </p>

            {artist.gallery.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-white/10">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                  Galería Fotográfica
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {artist.gallery.map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-white/10">
                      <Image src={img} alt={`${artist.stageName} ${idx}`} fill className="object-cover hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Details */}
            <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Ficha Técnica
              </h3>
              <div className="space-y-3 text-xs text-gray-300">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400">Origen</span>
                  <span className="font-semibold text-white">{artist.city}, {artist.province}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400">Géneros</span>
                  <span className="font-semibold text-white">{artist.genres.join(', ')}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-400">Incorporación</span>
                  <span className="font-semibold text-white">{artist.createdDate}</span>
                </div>
              </div>
            </div>

            {/* Next Date Preview */}
            {artist.agenda.length > 0 && (
              <div className="glass-card p-6 rounded-2xl border border-rose-500/30 bg-rose-500/[0.03] space-y-3">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 uppercase tracking-wide">
                  Próxima Fecha en Vivo
                </span>
                <h4 className="text-sm font-bold text-white leading-tight">
                  {artist.agenda[0].title}
                </h4>
                <p className="text-xs text-gray-400">
                  {artist.agenda[0].venue} • {artist.agenda[0].city}
                </p>
                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-amber-400 font-bold">{artist.agenda[0].date}</span>
                  <button
                    onClick={() => setActiveTab('agenda')}
                    className="text-xs font-bold text-white hover:text-rose-400 underline"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: VIDEOS */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          {activeVideoEmbed && (
            <div className="glass-card p-4 sm:p-6 rounded-3xl border border-white/10 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Reproductor Principal
              </span>
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10">
                <iframe
                  src={activeVideoEmbed}
                  title="Video Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {artist.videos.map((vid) => (
              <div
                key={vid.id}
                className="glass-card rounded-2xl overflow-hidden border border-white/10 p-4 space-y-3 group cursor-pointer hover:border-cyan-400/40 transition-all"
                onClick={() => vid.embedUrl && setActiveVideoEmbed(vid.embedUrl)}
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                  <Image src={vid.thumbnailUrl} alt={vid.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-500 text-black flex items-center justify-center">
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-amber-400">{vid.type}</span>
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                    {vid.title}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: DISCOGRAFÍA */}
      {activeTab === 'discografia' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {artist.discography.length > 0 ? (
            artist.discography.map((disc) => (
              <div key={disc.id} className="glass-card rounded-2xl border border-white/10 p-5 space-y-4 flex flex-col justify-between">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-900 border border-white/10">
                  <Image src={disc.coverUrl} alt={disc.title} fill className="object-cover" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/5 text-amber-400">
                    {disc.type} • {disc.year}
                  </span>
                  <h4 className="text-lg font-bold text-white">{disc.title}</h4>
                  {disc.tracksCount && (
                    <p className="text-xs text-gray-400">{disc.tracksCount} canciones</p>
                  )}
                </div>
                {disc.spotifyUrl && (
                  <a
                    href={disc.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/40 transition-colors"
                  >
                    <span>Escuchar en Spotify</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No hay lanzamientos cargados aún.</p>
          )}
        </div>
      )}

      {/* Tab: AGENDA */}
      {activeTab === 'agenda' && (
        <div className="space-y-4 max-w-3xl">
          {artist.agenda.length > 0 ? (
            artist.agenda.map((event) => (
              <div
                key={event.id}
                className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-400/20 text-amber-300">
                    {event.type}
                  </span>
                  <h4 className="text-lg font-bold text-white">{event.title}</h4>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {event.venue} — {event.city}, {event.province}
                  </p>
                  <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {event.date}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
                  <span className="text-xs font-extrabold text-gray-200">
                    {event.isFree ? 'Entrada Libre y Gratuita' : event.ticketPrice || 'Entradas en boletería'}
                  </span>
                  {event.ticketUrl && (
                    <a
                      href={event.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Comprar Entrada</span>
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No hay fechas programadas próximamente.</p>
          )}
        </div>
      )}

      {/* Tab: PRENSA */}
      {activeTab === 'prensa' && (
        <div className="space-y-4 max-w-3xl">
          {artist.press.length > 0 ? (
            artist.press.map((item) => (
              <div key={item.id} className="glass-card p-6 rounded-2xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="font-bold text-amber-400">{item.medium}</span>
                  <span>{item.date}</span>
                </div>
                <h4 className="text-base font-bold text-white">{item.title}</h4>
                <p className="text-xs text-gray-300 leading-relaxed font-light">{item.excerpt}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No hay notas de prensa registradas para este artista aún.</p>
          )}
        </div>
      )}
    </div>
  );
};
