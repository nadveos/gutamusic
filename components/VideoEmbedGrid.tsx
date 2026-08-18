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
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded bg-red-600/90 text-white shadow-sm">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            YouTube
          </span>
        );
      case 'tiktok':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-black/90 text-cyan-300 border border-cyan-400/40 shadow-sm">
            TikTok
          </span>
        );
      case 'facebook':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-600/90 text-white shadow-sm">
            Facebook Live
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section className="space-y-6 my-10">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400">
            <Radio className="w-4 h-4" />
            <span>Streaming & Multimedia</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">{title}</h2>
          <p className="text-sm text-gray-400">{subtitle}</p>
        </div>
      </div>

      {/* Video Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {videos.map((video) => (
          <div
            key={video.id}
            className="group relative rounded-2xl overflow-hidden glass-card border border-white/10 hover:border-cyan-400/40 transition-all flex flex-col justify-between hover:shadow-xl hover:shadow-cyan-500/10 cursor-pointer"
            onClick={() => setActiveVideo(video)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-85 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

              {/* Badges */}
              <div className="absolute top-2.5 left-2.5 z-10">
                {getPlatformBadge(video.platform)}
              </div>

              {video.duration && (
                <span className="absolute bottom-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/80 text-gray-200">
                  {video.duration}
                </span>
              )}

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-12 h-12 rounded-full bg-cyan-500/90 text-black flex items-center justify-center shadow-lg shadow-cyan-500/50 group-hover:scale-110 group-hover:bg-cyan-400 transition-all">
                  <Play className="w-5 h-5 fill-black ml-0.5" />
                </div>
              </div>
            </div>

            {/* Video Meta */}
            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-amber-400 block mb-1">
                  {video.channelOrAuthor}
                </span>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                  {video.title}
                </h3>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                <span className="capitalize">{video.type}</span>
                {video.views && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-gray-400" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl rounded-3xl overflow-hidden glass-card border border-white/20 shadow-2xl p-4 sm:p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                {getPlatformBadge(activeVideo.platform)}
                <h3 className="text-base font-bold text-white truncate max-w-lg">
                  {activeVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition-colors"
                aria-label="Cerrar video"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embed Container */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner">
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
                  <Play className="w-12 h-12 text-cyan-400 animate-pulse" />
                  <p className="text-sm text-gray-300">
                    Reproducción de contenido desde {activeVideo.platform.toUpperCase()}
                  </p>
                  <a
                    href={activeVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs"
                  >
                    <span>Abrir en {activeVideo.platform}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer Info */}
            <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
              <span>Canal/Autor: <strong className="text-white">{activeVideo.channelOrAuthor}</strong></span>
              <a
                href={activeVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-400 flex items-center gap-1 transition-colors"
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
