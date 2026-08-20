'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { VideoItem } from '../lib/types';
import { Play, Eye, ExternalLink, X, Radio } from 'lucide-react';

interface VideoEmbedGridProps {
  videos: VideoItem[];
  title?: string;
  subtitle?: string;
}

export const VideoEmbedGrid: React.FC<VideoEmbedGridProps> = ({
  videos,
  title = 'Videoteca Musical & Presentaciones',
  subtitle = 'Videos de YouTube, TikTok y Facebook reproducibles en directo',
}) => {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1e1f24]/90 text-[#f3f1ec] border border-[#3c3f4c]">
            YouTube
          </span>
        );
      case 'tiktok':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1e1f24]/90 text-[#e6cca0] border border-[#3c3f4c]">
            TikTok
          </span>
        );
      case 'facebook':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1e1f24]/90 text-[#a7b8c8] border border-[#3c3f4c]">
            Facebook
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section className="space-y-5 my-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#93a887]">
            <Radio className="w-3.5 h-3.5" />
            <span>Videoteca & Multimedia</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#f3f1ec]">{title}</h2>
          <p className="text-xs sm:text-sm text-[#aba79e]">{subtitle}</p>
        </div>
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            className="group relative rounded-xl overflow-hidden natural-card transition-colors flex flex-col justify-between cursor-pointer"
            onClick={() => setActiveVideo(video)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-[#18191d]">
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover group-hover:scale-102 transition-transform duration-300 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1e1f24] via-transparent to-black/20" />

              {/* Badges */}
              <div className="absolute top-2 left-2 z-10">
                {getPlatformBadge(video.platform)}
              </div>

              {video.duration && (
                <span className="absolute bottom-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#151618]/90 text-[#aba79e]">
                  {video.duration}
                </span>
              )}

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-10 h-10 rounded-full bg-[#d97d64] text-[#151618] flex items-center justify-center transition-transform group-hover:scale-105">
                  <Play className="w-4 h-4 fill-[#151618] ml-0.5" />
                </div>
              </div>
            </div>

            {/* Video Meta */}
            <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[#e6cca0] block">
                  {video.channelOrAuthor}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-[#f3f1ec] group-hover:text-[#e6cca0] transition-colors line-clamp-2 leading-snug">
                  {video.title}
                </h3>
              </div>

              <div className="pt-2 border-t border-[#2a2c35] flex items-center justify-between text-[10px] text-[#8c887f]">
                <span className="capitalize">{video.type}</span>
                {video.views && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-[#8c887f]" />
                    {video.views}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden bg-[#1e1f24] border border-[#383a46] p-4 sm:p-6 space-y-3">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#2d2f38]">
              <div className="flex items-center gap-2">
                {getPlatformBadge(activeVideo.platform)}
                <h3 className="text-sm sm:text-base font-bold text-[#f3f1ec] truncate max-w-lg">
                  {activeVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1 rounded-lg bg-[#272932] text-[#aba79e] hover:text-[#f3f1ec]"
                aria-label="Cerrar video"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embed Container */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-[#2d2f38]">
              {activeVideo.embedUrl ? (
                <iframe
                  src={`${activeVideo.embedUrl}?autoplay=1`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <Play className="w-10 h-10 text-[#d97d64]" />
                  <p className="text-xs text-[#aba79e]">
                    Reproducción de contenido desde {activeVideo.platform.toUpperCase()}
                  </p>
                  <a
                    href={activeVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d97d64] text-[#151618] font-bold text-xs"
                  >
                    <span>Abrir en {activeVideo.platform}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer Info */}
            <div className="flex items-center justify-between text-xs text-[#8c887f] pt-1">
              <span>Canal/Autor: <strong className="text-[#f3f1ec]">{activeVideo.channelOrAuthor}</strong></span>
              <a
                href={activeVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#e6cca0] flex items-center gap-1 transition-colors"
              >
                <span>Ver fuente original</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
