'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Artist, VideoItem, VideoPlatform, VideoType } from '../../../lib/types';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { Video, Sparkles, Check, Play, ExternalLink, Trash2, ArrowRight } from 'lucide-react';

interface VideoUploadClientProps {
  initialVideos: VideoItem[];
  artists: Artist[];
}

export const VideoUploadClient: React.FC<VideoUploadClientProps> = ({
  initialVideos,
  artists,
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<VideoPlatform>('youtube');
  const [videoTitle, setVideoTitle] = useState('');
  const [channelOrAuthor, setChannelOrAuthor] = useState('');
  const [videoType, setVideoType] = useState<VideoType>('session');
  const [selectedArtistId, setSelectedArtistId] = useState(artists[0]?.id || '');
  const [thumbnailPreview, setThumbnailPreview] = useState('https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop');
  const [embedUrl, setEmbedUrl] = useState('');
  const [videosList, setVideosList] = useState<VideoItem[]>(initialVideos);
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-detect metadata on URL change
  const handleUrlChange = (url: string) => {
    setVideoUrl(url);

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setDetectedPlatform('youtube');
      let videoId = '';
      if (url.includes('v=')) {
        videoId = url.split('v=')[1]?.split('&')[0];
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1]?.split('?')[0];
      }
      if (videoId) {
        setThumbnailPreview(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
        setEmbedUrl(`https://www.youtube-nocookie.com/embed/${videoId}`);
        if (!videoTitle) setVideoTitle(`Sesión Oficial en Vivo (${videoId})`);
        if (!channelOrAuthor) setChannelOrAuthor('Canal Oficial de YouTube');
      }
    } else if (url.includes('tiktok.com')) {
      setDetectedPlatform('tiktok');
      setThumbnailPreview('https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800&auto=format&fit=crop');
      if (!channelOrAuthor) setChannelOrAuthor('@artista_tiktok');
    } else if (url.includes('facebook.com')) {
      setDetectedPlatform('facebook');
      setThumbnailPreview('https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop');
      if (!channelOrAuthor) setChannelOrAuthor('Página de Facebook Live');
    }
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const targetArtist = artists.find((a) => a.id === selectedArtistId);

    const newVideo: VideoItem = {
      id: `vid-${Date.now()}`,
      title: videoTitle || 'Video Sin Título',
      platform: detectedPlatform,
      url: videoUrl,
      embedUrl: embedUrl || videoUrl,
      thumbnailUrl: thumbnailPreview,
      channelOrAuthor: channelOrAuthor || 'Autor',
      type: videoType,
      publishedAt: '2026-08-18',
      views: '1.2K',
      artistId: selectedArtistId,
      artistName: targetArtist?.stageName || 'Artista',
    };

    setTimeout(() => {
      setVideosList([newVideo, ...videosList]);
      setIsProcessing(false);
      setVideoUrl('');
      setVideoTitle('');
      alert(`¡Video "${newVideo.title}" agregado exitosamente a la videoteca!`);
    }, 600);
  };

  return (
    <div className="space-y-10">
      <AdminHeader
        title="Gestión & Carga de Videos"
        subtitle="Ingresá videos de YouTube, TikTok y Facebook con autodetección de metadatos"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* URL Parser Form */}
        <form onSubmit={handleSaveVideo} className="lg:col-span-7 glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Asistente de Carga por URL
          </h2>

          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">
              URL del Video (YouTube, TikTok, Facebook) *
            </label>
            <input
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=... o TikTok / Facebook"
              value={videoUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 font-semibold block mb-1.5">Plataforma Detectada</label>
              <select
                value={detectedPlatform}
                onChange={(e) => setDetectedPlatform(e.target.value as VideoPlatform)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#11141f] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
              >
                <option value="youtube">YouTube (Embed Oficial)</option>
                <option value="tiktok">TikTok Video</option>
                <option value="facebook">Facebook Live / Video</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-300 font-semibold block mb-1.5">Tipo de Contenido</label>
              <select
                value={videoType}
                onChange={(e) => setVideoType(e.target.value as VideoType)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#11141f] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
              >
                <option value="session">Sesión en Vivo GUTA</option>
                <option value="interview">Entrevista</option>
                <option value="live">Presentación en Recital</option>
                <option value="acoustic">Acústico / Ensayo</option>
                <option value="clip">Videoclip Oficial</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">Vincular a Artista *</label>
            <select
              value={selectedArtistId}
              onChange={(e) => setSelectedArtistId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#11141f] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
            >
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.stageName} ({a.city}, {a.province})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">Título del Video</label>
            <input
              type="text"
              required
              placeholder="Ej: Serenata Gaucha - Zamba del Laurel (Sesión en Vivo)"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">Canal / Autor</label>
            <input
              type="text"
              placeholder="Ej: GUTA Sesiones o @canal_oficial"
              value={channelOrAuthor}
              onChange={(e) => setChannelOrAuthor(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all"
          >
            {isProcessing ? 'Procesando...' : 'Guardar Video en la Videoteca'}
          </button>
        </form>

        {/* Live Preview Card */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Vista Previa en Tiempo Real
          </h3>

          <div className="glass-card rounded-2xl overflow-hidden border border-white/10 p-4 space-y-3">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-white/10">
              <Image src={thumbnailPreview} alt="Preview" fill className="object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 fill-black ml-0.5" />
                </div>
              </div>
              <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded bg-black/80 text-cyan-300 uppercase">
                {detectedPlatform}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-amber-400 block">{channelOrAuthor || 'Autor / Canal'}</span>
              <h4 className="text-sm font-bold text-white leading-snug">
                {videoTitle || 'Título del video aparecerá aquí'}
              </h4>
              <span className="text-[10px] text-gray-400 block pt-1 uppercase font-bold">
                Categoría: {videoType}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Videos List */}
      <section className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-lg font-bold text-white">Videos Cargados en la Plataforma</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {videosList.map((vid) => (
            <div key={vid.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-2 flex flex-col justify-between">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                <Image src={vid.thumbnailUrl} alt={vid.title} fill className="object-cover" />
                <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-cyan-300 uppercase">
                  {vid.platform}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-amber-400 font-semibold block">{vid.artistName}</span>
                <h4 className="text-xs font-bold text-white line-clamp-2">{vid.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
