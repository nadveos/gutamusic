'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink, Sparkles, MessageCircle, Phone, Globe, ShieldCheck, ArrowRight } from 'lucide-react';
import { SpotifyPlaylistData } from '../lib/services/spotifyService';
import { AlliancePartner } from '../lib/types';

export const SpotifyIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.497 17.307c-.217.354-.678.468-1.032.251-2.825-1.726-6.381-2.116-10.569-1.161-.403.093-.807-.156-.9-.559-.093-.404.156-.807.559-.9 4.582-1.048 8.528-.601 11.69 1.338.354.217.468.678.252 1.031zm1.468-3.262c-.273.443-.853.583-1.296.31-3.234-1.988-8.163-2.564-11.987-1.402-.497.151-1.026-.134-1.177-.631-.151-.497.134-1.026.631-1.177 4.372-1.328 9.805-.688 13.522 1.603.443.273.583.854.307 1.3zm.126-3.41c-3.878-2.302-10.279-2.513-13.987-1.387-.595.181-1.225-.157-1.406-.752-.181-.595.157-1.225.752-1.406 4.259-1.294 11.319-1.05 15.792 1.606.536.318.712 1.011.394 1.547-.318.536-1.011.712-1.545.392z" />
  </svg>
);

interface HomeLiveSidebarProps {
  playlist: SpotifyPlaylistData | null;
  playlistId: string;
  sponsors: AlliancePartner[];
}

export const HomeLiveSidebar: React.FC<HomeLiveSidebarProps> = ({
  playlist,
  playlistId,
  sponsors = [],
}) => {
  const currentId = playlist?.id || playlistId;
  const playlistName = playlist?.name || 'Top Artistas Emergentes by Guta';
  const spotifyUrl = playlist?.externalUrl || `https://open.spotify.com/playlist/${currentId}`;

  const getCleanWhatsappUrl = (rawWa?: string, rawPhone?: string, name?: string) => {
    const targetNumber = (rawWa || rawPhone || '').replace(/\D/g, '');
    if (!targetNumber) return null;
    const msg = encodeURIComponent(`Hola ${name || ''}, me contacto desde la plataforma GUTA MÚSICA.`);
    return `https://wa.me/${targetNumber}?text=${msg}`;
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
          WIDGET 1: REPRODUCTOR SPOTIFY OFICIAL GUTA
      ======================================================== */}
      <div className="rounded-2xl natural-card border border-[#2d2f38] p-4 sm:p-5 relative overflow-hidden group shadow-xl bg-gradient-to-b from-[#181a20] to-[#121316]">
        {/* Glow ambiental */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#1DB954]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#1DB954]/15 transition-colors" />

        <div className="space-y-3.5 relative z-10">
          {/* Header del Reproductor */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1DB954]">
                Playlist Oficial
              </span>
            </div>
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-[#1DB954]/15 hover:bg-[#1DB954] text-[#1DB954] hover:text-[#0d0e11] border border-[#1DB954]/30 hover:border-[#1DB954] transition-all"
              title="Escuchar en Spotify"
            >
              <SpotifyIcon className="w-3.5 h-3.5" />
              <span>Seguir</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div>
            <h3 className="text-base font-extrabold text-[#f3f1ec] leading-snug line-clamp-1">
              {playlistName}
            </h3>
            <p className="text-[11px] text-[#aba79e]">
              Curaduría federal activa • Canciones en rotación
            </p>
          </div>

          {/* Iframe Embebido Oficial de Spotify (altura compacta optimizada para columna) */}
          <div className="rounded-xl overflow-hidden bg-[#0d0e10] border border-[#262832] shadow-inner">
            <iframe
              src={`https://open.spotify.com/embed/playlist/${currentId}?utm_source=generator&theme=0`}
              width="100%"
              height="352"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="w-full"
              style={{ borderRadius: '10px' }}
              title={playlistName}
            />
          </div>

          {/* Call to action para músicos */}
          <div className="pt-2 flex items-center justify-between text-[11px] border-t border-[#252731]">
            <span className="text-[#aba79e]">¿Hacés música?</span>
            <Link
              href="/artistas"
              className="font-semibold text-[#e6cca0] hover:text-[#f3f1ec] transition-colors inline-flex items-center gap-1"
            >
              Postulá tu canción
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================
          WIDGET 2: AUSPICIANTE DESTACADO / ALIANZA OFICIAL
      ======================================================== */}
      {sponsors.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#e6cca0]">
              <Sparkles className="w-3 h-3 text-[#e6cca0]" />
              <span>Auspiciante Destacado</span>
            </div>
            <Link
              href="/sumar-auspicio"
              className="text-[10px] text-[#aba79e] hover:text-[#e6cca0] transition-colors font-medium"
            >
              + Anunciar aquí
            </Link>
          </div>

          {sponsors.map((item) => {
            const waUrl = getCleanWhatsappUrl(item.whatsapp, item.phone, item.name);
            const rawPhone = item.phone ? `tel:${item.phone.replace(/[^\d+]/g, '')}` : null;
            const isPremium = item.sector === 'all_sections';

            return (
              <div
                key={item.id || item.name}
                className={`group rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 relative ${
                  isPremium
                    ? 'bg-gradient-to-b from-[#222530] via-[#1a1b22] to-[#121316] border-2 border-[#e6cca0] shadow-xl shadow-[#e6cca0]/10 ring-1 ring-[#e6cca0]/30 hover:border-[#d97d64]'
                    : 'bg-[#1a1b22] border border-[#d97d64]/60 shadow-lg shadow-[#121316]/60 hover:border-[#d97d64]'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Imagen / Logotipo adaptativo */}
                  <div className="relative w-full h-28 rounded-xl bg-[#0f1013] border border-[#2a2d38] p-3 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <Image
                          src={item.imageUrl}
                          alt={item.name || 'Auspiciante'}
                          fill
                          sizes="(max-width: 1024px) 100vw, 350px"
                          className="object-contain object-center transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#78746c] text-center p-2">
                        <ShieldCheck className="w-6 h-6 mb-1 text-[#e6cca0]" />
                        <span className="text-xs font-semibold text-[#aba79e]">{item.name}</span>
                      </div>
                    )}

                    {/* Rubro / Categoría */}
                    {item.category && (
                      <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[#121316]/95 text-[#e6cca0] border border-[#e6cca0]/40 max-w-[75%] truncate">
                        {item.category}
                      </span>
                    )}
                  </div>

                  {/* Datos del Anunciante */}
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-[#f3f1ec] group-hover:text-[#e6cca0] transition-colors leading-snug">
                      {item.name}
                    </h4>
                    {item.description && (
                      <p className="text-xs text-[#aba79e] leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones de Contacto */}
                <div className="pt-3.5 mt-3.5 border-t border-[#262832] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366] text-[#4ade80] hover:text-[#0b2812] border border-[#25D366]/40 text-xs font-bold transition-all shadow-sm"
                        title="Contactar por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {rawPhone && !waUrl && (
                      <a
                        href={rawPhone}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#242730] hover:bg-[#2d313d] text-[#e6cca0] border border-[#343846] text-xs font-medium transition-colors"
                        title="Llamar"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{item.phone}</span>
                      </a>
                    )}
                  </div>

                  {item.websiteUrl && (
                    <a
                      href={item.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-[#202228] hover:bg-[#282b35] text-[#aba79e] hover:text-[#f3f1ec] border border-[#2d2f38] transition-colors"
                      title="Visitar sitio web / red social"
                      aria-label={`Sitio web de ${item.name}`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Aviso discreto en margen inferior derecho */}
                <span className="text-[9px] text-[#78746c] italic block text-right pt-2 select-none">
                  * Este es un auspiciante PREMIUM
                </span>
              </div>
            );
          })}

          <div className="text-center pt-1">
            <Link
              href="/sumar-auspicio"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#e6cca0] hover:text-[#f3f1ec] transition-colors"
            >
              <Sparkles className="w-3 h-3 text-[#d97d64]" />
              <span>¿Querés sumar tu marca a este espacio? Conocé los planes</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Tarjeta de invitación si aún no hay sponsor en este sector */
        <div className="rounded-2xl natural-card border border-dashed border-[#383b48] p-5 text-center space-y-3 bg-[#16171d]/60">
          <div className="w-10 h-10 rounded-full bg-[#e6cca0]/10 border border-[#e6cca0]/25 flex items-center justify-center mx-auto text-[#e6cca0]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#f3f1ec]">
              Espacio de Auspicio Disponible
            </h4>
            <p className="text-xs text-[#aba79e] leading-relaxed">
              Posicioná tu empresa junto al reproductor oficial de GUTA MÚSICA con alcance federal garantizado.
            </p>
          </div>
          <Link
            href="/sumar-auspicio"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#d97d64] hover:bg-[#cb7159] text-[#121316] transition-colors shadow-sm"
          >
            Sumar Mi Marca
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
