'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Artist } from '../../../lib/types';
import { getVideoEmbedUrl } from '../../../lib/videoUtils';
import {
  MapPin,
  Calendar,
  Disc3,
  Video,
  Newspaper,
  ExternalLink,
  Play,
  Ticket,
  Music,
} from 'lucide-react';
import { LikeButton } from '../../../components/LikeButton';
import { ShareButton } from '../../../components/ShareButton';

interface ArtistProfileClientProps {
  artist: Artist;
}

export const ArtistProfileClient: React.FC<ArtistProfileClientProps> = ({ artist }) => {
  const [activeTab, setActiveTab] = useState<'bio' | 'videos' | 'discografia' | 'prensa'>('bio');
  const [activeVideoEmbed, setActiveVideoEmbed] = useState<string | null>(
    artist.videos.length > 0
      ? getVideoEmbedUrl(artist.videos[0].embedUrl || artist.videos[0].url, artist.videos[0].platform)
      : null
  );

  const spotifyArtistId = React.useMemo(() => {
    if (artist.socials?.spotify) {
      const match = artist.socials.spotify.match(/artist\/([a-zA-Z0-9]{22})/);
      if (match) return match[1];
      const uriMatch = artist.socials.spotify.match(/spotify:artist:([a-zA-Z0-9]{22})/);
      if (uriMatch) return uriMatch[1];
    }
    for (const d of artist.discography) {
      if (d.spotifyUrl) {
        const match = d.spotifyUrl.match(/artist\/([a-zA-Z0-9]{22})/);
        if (match) return match[1];
      }
    }
    return null;
  }, [artist.socials?.spotify, artist.discography]);

  return (
    <div className="space-y-8">
      {/* 1. Artist Header Hero */}
      <section className="relative rounded-2xl overflow-hidden natural-card p-6 sm:p-8">
        {/* Background Banner */}
        <div className="absolute inset-0 z-0">
          <Image
            src={artist.bannerUrl || artist.photoUrl}
            alt={artist.stageName}
            fill
            sizes="100vw"
            priority
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1f24] via-[#1e1f24]/85 to-transparent" />
        </div>

        {/* Profile Card Header */}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-end gap-6">
          {/* Avatar / Main Photo */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden border border-[#3c3f4c] flex-shrink-0 bg-[#151618]">
            <Image
              src={artist.photoUrl}
              alt={artist.stageName}
              fill
              sizes="(max-width: 640px) 128px, 160px"
              className="object-cover"
            />
          </div>

          {/* Identity & Badges */}
          <div className="space-y-2 text-center md:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              {artist.genres.map((g) => (
                <span key={g} className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-sand-soft">
                  {g}
                </span>
              ))}
              <div className="flex items-center gap-1 text-xs text-[#aba79e] bg-[#24252c] px-2.5 py-0.5 rounded border border-[#31333d]">
                <MapPin className="w-3 h-3 text-[#d97d64]" />
                <span>{artist.province ? `${artist.province}, ${artist.country || 'Argentina'}` : (artist.country || 'Argentina')}</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-[#f3f1ec] leading-tight">
              {artist.stageName}
            </h1>

            {artist.quotes && (
              <p className="text-xs sm:text-sm text-[#e6cca0] italic font-serif">
                {artist.quotes}
              </p>
            )}

            {/* Actions & Social Links */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
              <LikeButton
                artistId={artist.id}
                artistSlug={artist.slug}
                initialLikesCount={artist.likesCount || 0}
              />

              <ShareButton
                title={`${artist.stageName} | GUTA MÚSICA`}
                text={`Descubrí la música, videos y discografía de ${artist.stageName} en GUTA MÚSICA.`}
              />

              {artist.discography.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('discografia')}
                  className="px-2.5 py-1.5 rounded-xl bg-[#e6cca0]/10 hover:bg-[#e6cca0]/20 text-[#e6cca0] border border-[#e6cca0]/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Disc3 className="w-3.5 h-3.5 text-[#d97d64]" />
                  <span>Discografía ({artist.discography.length})</span>
                </button>
              )}

              {artist.socials?.spotify && artist.socials.spotify.trim() && !['https://spotify.com', 'https://spotify.com/'].includes(artist.socials.spotify.trim()) && (
                <a
                  href={artist.socials.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-[#24252c] hover:bg-[#2e303b] text-[#93a887] border border-[#31333d] text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <span>Spotify</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {artist.socials?.youtube && artist.socials.youtube.trim() && !['https://youtube.com', 'https://youtube.com/'].includes(artist.socials.youtube.trim()) && (
                <a
                  href={artist.socials.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-[#24252c] hover:bg-[#2e303b] text-[#d97d64] border border-[#31333d] text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <span>YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {artist.socials?.instagram && artist.socials.instagram.trim() && !['https://instagram.com', 'https://instagram.com/'].includes(artist.socials.instagram.trim()) && (
                <a
                  href={artist.socials.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-[#24252c] hover:bg-[#2e303b] text-[#e6cca0] border border-[#31333d] text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <span>Instagram</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {artist.socials?.tiktok && artist.socials.tiktok.trim() && !['https://tiktok.com', 'https://tiktok.com/'].includes(artist.socials.tiktok.trim()) && (
                <a
                  href={artist.socials.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-xl bg-[#24252c] hover:bg-[#2e303b] text-[#8fa1b3] border border-[#31333d] text-xs font-medium flex items-center gap-1 transition-colors"
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
      <div className="flex border-b border-[#2d2f38] gap-1 sm:gap-2 overflow-x-auto pb-2 text-xs font-semibold">
        {[
          { key: 'bio', label: 'Biografía & Reseña', icon: Music },
          { key: 'videos', label: `Videos & Lives (${artist.videos.length})`, icon: Video },
          { key: 'discografia', label: `Discografía (${artist.discography.length})`, icon: Disc3 },
          { key: 'prensa', label: `Notas & Prensa (${artist.press.length})`, icon: Newspaper },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-[#d97d64] text-[#151618] font-bold'
                  : 'text-[#aba79e] hover:text-[#f3f1ec] hover:bg-[#24252c]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Tab Contents */}

      {/* Tab: BIO */}
      {activeTab === 'bio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 natural-card p-6 rounded-2xl space-y-4">
            <h2 className="text-xl font-bold text-[#f3f1ec]">Trayectoria & Propuesta Musical</h2>
            <p className="text-[#aba79e] leading-relaxed whitespace-pre-line text-xs sm:text-sm">
              {artist.bio}
            </p>

            {artist.gallery.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-[#2a2c35]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0]">
                  Galería Fotográfica
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {artist.gallery.map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-[#31333d]">
                      <Image src={img} alt={`${artist.stageName} ${idx}`} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-4">
            {/* Quick Details */}
            <div className="natural-card p-5 rounded-2xl space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0]">
                Ficha Técnica
              </h3>
              <div className="space-y-2 text-xs text-[#aba79e]">
                <div className="flex justify-between border-b border-[#2a2c35] pb-1.5">
                  <span className="text-[#8c887f]">Origen</span>
                  <span className="font-medium text-[#f3f1ec]">
                    {artist.province ? `${artist.province}, ${artist.country || 'Argentina'}` : (artist.country || 'Argentina')}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#2a2c35] pb-1.5">
                  <span className="text-[#8c887f]">Géneros</span>
                  <span className="font-medium text-[#f3f1ec]">{artist.genres.join(', ')}</span>
                </div>
                <div className="flex justify-between border-b border-[#2a2c35] pb-1.5">
                  <span className="text-[#8c887f]">Incorporación</span>
                  <span className="font-medium text-[#f3f1ec]">{artist.createdDate || 'Agosto 2026'}</span>
                </div>
              </div>
            </div>

            {/* Latest Release / Último Lanzamiento */}
            {artist.discography.length > 0 && (
              <div className="natural-card p-5 rounded-2xl border border-[#3d3835] space-y-3 bg-[#1e1f25]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sand-soft uppercase tracking-wide flex items-center gap-1.5 text-[#e6cca0]">
                    <Disc3 className="w-3 h-3 text-[#d97d64]" />
                    Último Lanzamiento
                  </span>
                  <button
                    onClick={() => setActiveTab('discografia')}
                    className="text-[11px] font-semibold text-[#d97d64] hover:underline cursor-pointer"
                  >
                    Ver todos ({artist.discography.length})
                  </button>
                </div>

                <div className="flex items-center gap-3.5 pt-1">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#151618] border border-[#31333d] flex-shrink-0">
                    {artist.discography[0].coverUrl ? (
                      <Image
                        src={artist.discography[0].coverUrl}
                        alt={artist.discography[0].title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#d97d64] bg-[#22242c]">
                        <Disc3 className="w-7 h-7 opacity-70" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="text-[10px] text-[#aba79e] font-mono block uppercase">
                      {artist.discography[0].type} • {artist.discography[0].year}
                    </span>
                    <h4 className="text-sm font-bold text-[#f3f1ec] truncate">
                      {artist.discography[0].title}
                    </h4>
                    {artist.discography[0].tracksCount && (
                      <p className="text-[11px] text-[#8c887f]">
                        {artist.discography[0].tracksCount} temas
                      </p>
                    )}
                  </div>
                </div>

                {artist.discography[0].spotifyUrl && (
                  <a
                    href={artist.discography[0].spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#93a887] text-xs font-semibold border border-[#31333d] transition-colors"
                  >
                    <span>Escuchar en Spotify</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {/* Recuadro Oficial de Spotify: Top Canciones & Oyentes Mensuales */}
            {spotifyArtistId ? (
              <div className="natural-card p-4 sm:p-5 rounded-2xl border border-[#2e3039] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#1db954]/15 border border-[#1db954]/30 flex items-center justify-center text-[#1db954] shadow-xs">
                      <Disc3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#f3f1ec]">Top Canciones en Spotify</h4>
                      <p className="text-[10px] text-[#8c887f]">Las más escuchadas de {artist.stageName}</p>
                    </div>
                  </div>

                  <a
                    href={`https://open.spotify.com/artist/${spotifyArtistId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded-lg bg-[#1db954]/10 hover:bg-[#1db954]/20 border border-[#1db954]/30 text-[#1db954] text-[10px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>Perfil</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {artist.monthlyListeners && (
                  <div className="p-2.5 rounded-xl bg-[#1db954]/10 border border-[#1db954]/25 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-[#aba79e] font-medium flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1db954] animate-pulse" />
                      <span>Oyentes Mensuales:</span>
                    </span>
                    <span className="text-xs font-bold text-[#1db954]">
                      {artist.monthlyListeners}
                    </span>
                  </div>
                )}

                <div className="rounded-xl overflow-hidden bg-black/60 border border-[#2b2d38] shadow-inner">
                  <iframe
                    src={`https://open.spotify.com/embed/artist/${spotifyArtistId}?utm_source=generator&theme=0`}
                    width="100%"
                    height="352"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title={`Spotify Player - ${artist.stageName}`}
                    className="w-full border-0"
                  />
                </div>
              </div>
            ) : artist.monthlyListeners ? (
              <div className="natural-card p-4 rounded-2xl border border-[#2e3039] space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1db954] block">
                  Audiencia en Spotify
                </span>
                <p className="text-sm font-bold text-[#f3f1ec]">{artist.monthlyListeners}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Tab: VIDEOS */}
      {activeTab === 'videos' && (
        <div className="space-y-5">
          {activeVideoEmbed && (
            <div className="natural-card p-4 sm:p-5 rounded-2xl space-y-2.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#93a887]">
                Reproductor Principal
              </span>
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-[#2d2f38]">
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

          {artist.videos.length === 0 ? (
            <p className="text-[#8c887f] text-xs italic py-4">No hay videos ni sesiones cargadas aún para este artista.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {artist.videos.map((vid) => (
                <div
                  key={vid.id}
                  className="natural-card rounded-xl overflow-hidden p-3.5 space-y-2.5 cursor-pointer hover:border-[#464956] transition-colors"
                  onClick={() => {
                    const embed = getVideoEmbedUrl(vid.embedUrl || vid.url, vid.platform);
                    if (embed) setActiveVideoEmbed(embed);
                  }}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    <Image src={vid.thumbnailUrl} alt={vid.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-[#d97d64] text-[#151618] flex items-center justify-center">
                        <Play className="w-4 h-4 fill-[#151618] ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-[#e6cca0]">{vid.type}</span>
                    <h4 className="text-xs sm:text-sm font-bold text-[#f3f1ec] line-clamp-2">
                      {vid.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: DISCOGRAFÍA */}
      {activeTab === 'discografia' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {artist.discography.length > 0 ? (
            artist.discography.map((disc) => {
              const typeLabels: Record<string, string> = {
                single: 'Single',
                ep: 'EP',
                album: 'Álbum',
                live_album: 'Álbum en Vivo',
              };
              return (
                <div key={disc.id} className="natural-card rounded-xl p-4 space-y-3 flex flex-col justify-between">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-[#18191d] border border-[#2d2f38]">
                    {disc.coverUrl ? (
                      <Image
                        src={disc.coverUrl}
                        alt={disc.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#d97d64] bg-[#202228]">
                        <Disc3 className="w-12 h-12 opacity-60" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#24252c] text-[#e6cca0]">
                      {typeLabels[disc.type] || disc.type} • {disc.year}
                    </span>
                    <h4 className="text-base font-bold text-[#f3f1ec]">{disc.title}</h4>
                    {disc.tracksCount && (
                      <p className="text-xs text-[#8c887f]">{disc.tracksCount} canciones</p>
                    )}
                  </div>
                  {disc.spotifyUrl && (
                    <a
                      href={disc.spotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#93a887] font-semibold text-xs border border-[#31333d] transition-colors"
                    >
                      <span>Escuchar en Spotify</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-[#8c887f] text-xs italic py-4">No hay lanzamientos cargados aún para este artista.</p>
          )}
        </div>
      )}


      {/* Tab: PRENSA */}
      {activeTab === 'prensa' && (
        <div className="space-y-4 max-w-3xl">
          {artist.press.length > 0 ? (
            artist.press.map((item) => (
              <div
                key={item.id}
                className="natural-card p-5 sm:p-6 rounded-2xl space-y-3 border border-[#2d2f38] hover:border-[#464956] transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8c887f]">
                  <span className="font-semibold text-[#e6cca0] px-2.5 py-1 rounded bg-[#24252c] border border-[#31333d]">
                    {item.medium}
                  </span>
                  <span className="flex items-center gap-1 text-[#93a887]">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-bold text-[#f3f1ec] leading-snug">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm text-[#aba79e] leading-relaxed">
                  {item.excerpt}
                </p>
                {item.url && (
                  <div className="pt-1">
                    {item.url.startsWith('/') ? (
                      <Link
                        href={item.url}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors"
                      >
                        <Newspaper className="w-3.5 h-3.5" />
                        <span>Leer nota editorial / entrevista</span>
                      </Link>
                    ) : (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#e6cca0] font-semibold text-xs border border-[#31333d] transition-colors"
                      >
                        <span>Ver nota externa</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-[#8c887f] text-xs">No hay notas de prensa registradas para este artista aún.</p>
          )}
        </div>
      )}
    </div>
  );
};
