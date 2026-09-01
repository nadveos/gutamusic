'use client';

import React from 'react';
import { OfficialPlatformKey, OfficialSocialsSettings } from '../lib/types';
import { PLATFORMS_META, PLATFORM_KEYS, SocialIcon, buildSocialUrl } from '../lib/socialUtils';

interface OfficialSocialsBarProps {
  settings?: OfficialSocialsSettings;
  variant?: 'header' | 'drawer' | 'footer' | 'preview' | 'floating';
  showLabel?: boolean;
  className?: string;
}

export const OfficialSocialsBar: React.FC<OfficialSocialsBarProps> = ({
  settings,
  variant = 'header',
  showLabel = true,
  className = '',
}) => {
  // If settings not provided, use a default fallback
  const brandName = settings?.brandName || '@sesionesrg';

  // Get active platforms that have a non-empty handle
  const activePlatforms = PLATFORM_KEYS.filter((key) => {
    const channel = settings?.[key];
    if (!channel) return false;
    const isExplicitlyActive = channel.active !== false;
    const hasHandle = Boolean(channel.handle && channel.handle.trim().length > 0);
    return isExplicitlyActive && hasHandle;
  });

  if (activePlatforms.length === 0) {
    return null;
  }

  // Variant: Header Topbar (Sleek, compact & ultra-modern)
  if (variant === 'header') {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        {showLabel && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-[#e6cca0] tracking-tight mr-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d97d64] animate-pulse" aria-hidden="true" />
            <span>{brandName}:</span>
          </span>
        )}

        <div className="flex items-center gap-1">
          {activePlatforms.map((key) => {
            const channel = settings![key];
            const meta = PLATFORMS_META[key];
            const targetUrl = channel.url || buildSocialUrl(key, channel.handle);

            return (
              <a
                key={key}
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${meta.name} de ${brandName}`}
                title={`${meta.name} — ${brandName} (${channel.handle})`}
                className={`group relative p-1.5 rounded-lg border border-[#2e3039] bg-[#1a1b20] text-[#aba79e] transition-all duration-200 hover:scale-110 active:scale-95 ${meta.hoverGlow}`}
              >
                <SocialIcon platform={key} className="w-3.5 h-3.5 transition-transform group-hover:scale-105" />
                <span className="sr-only">{meta.name}</span>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // Variant: Mobile Drawer (Expanded with labels & handles)
  if (variant === 'drawer') {
    return (
      <div className={`space-y-2.5 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#e6cca0] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d97d64] animate-pulse" />
            <span>Redes Oficiales {brandName}</span>
          </span>
          <span className="text-[10px] text-[#78746c]">{activePlatforms.length} activas</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {activePlatforms.map((key) => {
            const channel = settings![key];
            const meta = PLATFORMS_META[key];
            const targetUrl = channel.url || buildSocialUrl(key, channel.handle);

            return (
              <a
                key={key}
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`p-2 rounded-xl border border-[#2d2f38] bg-[#1a1b20] flex items-center gap-2 text-xs font-semibold text-[#aba79e] hover:text-[#f3f1ec] transition-all active:scale-95 ${meta.hoverGlow}`}
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${meta.brandColor}18`, color: meta.brandColor }}
                >
                  <SocialIcon platform={key} className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden text-left">
                  <span className="block text-[11px] font-bold truncate text-[#f3f1ec]">{meta.name}</span>
                  <span className="block text-[9px] text-[#78746c] truncate">
                    {channel.handle.startsWith('@') ? channel.handle : `@${channel.handle}`}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // Variant: Footer (Sleek horizontal badges with subtle glow)
  if (variant === 'footer') {
    return (
      <div className={`space-y-2 ${className}`}>
        {showLabel && (
          <div className="flex items-center gap-1.5 text-xs text-[#aba79e]">
            <span className="font-semibold text-[#e6cca0]">Seguinos en {brandName}:</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          {activePlatforms.map((key) => {
            const channel = settings![key];
            const meta = PLATFORMS_META[key];
            const targetUrl = channel.url || buildSocialUrl(key, channel.handle);

            return (
              <a
                key={key}
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${meta.name} ${brandName}`}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#2a2c35] bg-[#18191e] text-[#aba79e] hover:text-[#f3f1ec] transition-all duration-200 text-xs font-medium ${meta.hoverGlow}`}
              >
                <div style={{ color: meta.brandColor }}>
                  <SocialIcon platform={key} className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px]">{meta.name}</span>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // Default / Preview Variant
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {activePlatforms.map((key) => {
        const channel = settings![key];
        const meta = PLATFORMS_META[key];
        const targetUrl = channel.url || buildSocialUrl(key, channel.handle);

        return (
          <a
            key={key}
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-xl border border-[#2e3039] bg-[#16171c] flex items-center gap-2 text-xs font-medium text-[#aba79e] hover:text-[#f3f1ec] transition-all ${meta.hoverGlow}`}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${meta.brandColor}20`, color: meta.brandColor }}
            >
              <SocialIcon platform={key} className="w-4 h-4" />
            </div>
            <div>
              <strong className="block text-xs text-[#f3f1ec]">{meta.name}</strong>
              <span className="text-[10px] text-[#78746c]">
                {channel.handle.startsWith('@') ? channel.handle : `@${channel.handle}`}
              </span>
            </div>
          </a>
        );
      })}
    </div>
  );
};
