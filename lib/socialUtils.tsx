import React from 'react';
import { OfficialPlatformKey, OfficialSocialsSettings } from './types';

export interface PlatformMeta {
  key: OfficialPlatformKey;
  name: string;
  baseUrl: string;
  placeholder: string;
  prefixDisplay: string;
  brandColor: string;
  brandBg: string;
  hoverGlow: string;
  badgeLabel: string;
  description: string;
}

export const PLATFORMS_META: Record<OfficialPlatformKey, PlatformMeta> = {
  tiktok: {
    key: 'tiktok',
    name: 'TikTok',
    baseUrl: 'https://www.tiktok.com/@',
    placeholder: 'sesionesrg o @sesionesrg',
    prefixDisplay: 'tiktok.com/@',
    brandColor: '#25F4EE',
    brandBg: 'bg-[#000000]/60',
    hoverGlow: 'hover:border-[#25F4EE]/60 hover:shadow-[0_0_12px_rgba(37,244,238,0.25)] hover:text-[#25F4EE]',
    badgeLabel: 'Clips & Shorts',
    description: 'Videos cortos, backstages y momentos destacados de las sesiones en vivo.',
  },
  instagram: {
    key: 'instagram',
    name: 'Instagram',
    baseUrl: 'https://www.instagram.com/',
    placeholder: 'sesionesrg o @sesionesrg',
    prefixDisplay: 'instagram.com/',
    brandColor: '#E1306C',
    brandBg: 'bg-[#E1306C]/10',
    hoverGlow: 'hover:border-[#E1306C]/60 hover:shadow-[0_0_12px_rgba(225,48,108,0.25)] hover:text-[#E1306C]',
    badgeLabel: 'Comunidad & Fotos',
    description: 'Coberturas, historias, anuncios de convocatorias y fotos exclusivas.',
  },
  facebook: {
    key: 'facebook',
    name: 'Facebook',
    baseUrl: 'https://www.facebook.com/',
    placeholder: 'sesionesrg o URL de página',
    prefixDisplay: 'facebook.com/',
    brandColor: '#1877F2',
    brandBg: 'bg-[#1877F2]/10',
    hoverGlow: 'hover:border-[#1877F2]/60 hover:shadow-[0_0_12px_rgba(24,119,242,0.25)] hover:text-[#1877F2]',
    badgeLabel: 'Página Oficial',
    description: 'Transmisiones simultáneas, eventos y comunidad en Facebook.',
  },
  kick: {
    key: 'kick',
    name: 'Kick',
    baseUrl: 'https://kick.com/',
    placeholder: 'sesionesrg',
    prefixDisplay: 'kick.com/',
    brandColor: '#53FC18',
    brandBg: 'bg-[#53FC18]/10',
    hoverGlow: 'hover:border-[#53FC18]/60 hover:shadow-[0_0_12px_rgba(83,252,24,0.25)] hover:text-[#53FC18]',
    badgeLabel: 'Streaming En Vivo',
    description: 'Transmisión de alta definición sin restricciones para sesiones y lives.',
  },
  twitch: {
    key: 'twitch',
    name: 'Twitch',
    baseUrl: 'https://www.twitch.tv/',
    placeholder: 'sesionesrg',
    prefixDisplay: 'twitch.tv/',
    brandColor: '#9146FF',
    brandBg: 'bg-[#9146FF]/10',
    hoverGlow: 'hover:border-[#9146FF]/60 hover:shadow-[0_0_12px_rgba(145,70,255,0.25)] hover:text-[#9146FF]',
    badgeLabel: 'Lives & Sesiones',
    description: 'Canal de streaming interactivo con chat en directo y recitales acústicos.',
  },
};

export const PLATFORM_KEYS: OfficialPlatformKey[] = ['tiktok', 'instagram', 'facebook', 'kick', 'twitch'];

/**
 * Normaliza y devuelve la URL completa para una plataforma dada
 */
export function buildSocialUrl(platform: OfficialPlatformKey, handleOrUrl?: string): string {
  if (!handleOrUrl || !handleOrUrl.trim()) return '';

  const clean = handleOrUrl.trim();

  // Si ya es una URL completa (http/https), devolverla sanitizada
  if (/^https?:\/\//i.test(clean)) {
    return clean;
  }

  // Quitar arroba si fue ingresada (ej: @sesionesrg -> sesionesrg)
  const username = clean.replace(/^@+/, '');

  const meta = PLATFORMS_META[platform];
  if (!meta) return `https://${clean}`;

  return `${meta.baseUrl}${encodeURIComponent(username)}`;
}

/**
 * Configuración inicial por defecto con @sesionesrg
 */
export const DEFAULT_OFFICIAL_SOCIALS: OfficialSocialsSettings = {
  brandName: '@sesionesrg',
  badgeText: 'Sesiones RG Oficial',
  tiktok: {
    handle: 'sesionesrg',
    url: 'https://www.tiktok.com/@sesionesrg',
    active: true,
  },
  instagram: {
    handle: 'sesionesrg',
    url: 'https://www.instagram.com/sesionesrg',
    active: true,
  },
  facebook: {
    handle: 'sesionesrg',
    url: 'https://www.facebook.com/sesionesrg',
    active: true,
  },
  kick: {
    handle: 'sesionesrg',
    url: 'https://kick.com/sesionesrg',
    active: true,
  },
  twitch: {
    handle: 'sesionesrg',
    url: 'https://www.twitch.tv/sesionesrg',
    active: true,
  },
};

/**
 * Iconos SVG exactos y accesibles para las 5 redes sociales
 */
export function SocialIcon({
  platform,
  className = 'w-4 h-4',
}: {
  platform: OfficialPlatformKey;
  className?: string;
}) {
  switch (platform) {
    case 'tiktok':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.305-4.639c.319 0 .628.052.917.147V9.432a6.34 6.34 0 0 0-.917-.067c-3.528 0-6.388 2.86-6.388 6.388 0 3.528 2.86 6.388 6.388 6.388 3.528 0 6.388-2.86 6.388-6.388V8.718a8.218 8.218 0 0 0 4.723 1.488V6.761a4.845 4.845 0 0 1-1-.075z" />
        </svg>
      );

    case 'instagram':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );

    case 'facebook':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );

    case 'kick':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M3 2h5.5v7l4-7H18l-5 8.5 5.5 11.5h-5.5l-3.5-7.5V22H3V2z" />
        </svg>
      );

    case 'twitch':
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M2.149 0l-1.612 4.119v16.804h5.331V24h3.226l3.226-3.077h4.298l6.452-6.154V0H2.149zm19.355 13.846l-3.763 3.59h-4.839l-2.688 2.564V17.436H5.372V2.051h16.132v11.795zm-9.14-7.692h2.15v6.154h-2.15V6.154zm5.376 0h2.15v6.154h-2.15V6.154z" />
        </svg>
      );

    default:
      return null;
  }
}

export function InstagramIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function SpotifyIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

export function YouTubeIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}
