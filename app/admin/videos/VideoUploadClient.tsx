'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Artist, VideoItem, VideoPlatform, VideoType } from '../../../lib/types';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { Play, ExternalLink } from 'lucide-react';

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
    <div className="space-y-8">
      <AdminHeader
        title="Gestión & Carga de Videos"
        subtitle="Ingresá videos de YouTube, TikTok y Facebook con autodetección de metadatos"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* URL Parser Form */}
        <form onSubmit={handleSaveVideo} className="lg:col-span-7 natural-card p-5 sm:p-6 rounded-2xl space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#93a887]">
            Asistente de Carga por URL
          </h2>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
              URL del Video (YouTube, TikTok, Facebook) *
            </label>
            <input
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64] font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Plataforma Detectada</label>
              <select
                value={detectedPlatform}
                onChange={(e) => setDetectedPlatform(e.target.value as VideoPlatform)}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              >
                <option value="youtube">YouTube (Embed Oficial)</option>
                <option value="tiktok">TikTok Video</option>
                <option value="facebook">Facebook Live / Video</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Tipo de Contenido</label>
              <select
                value={videoType}
                onChange={(e) => setVideoType(e.target.value as VideoType)}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
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
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Vincular a Artista *</label>
            <select
              value={selectedArtistId}
              onChange={(e) => setSelectedArtistId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            >
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.stageName} ({a.city}, {a.province})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Título del Video</label>
            <input
              type="text"
              required
              placeholder="Ej: Serenata Gaucha - Zamba del Laurel (Sesión en Vivo)"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Canal / Autor</label>
            <input
              type="text"
              placeholder="Ej: GUTA Sesiones o @canal_oficial"
              value={channelOrAuthor}
              onChange={(e) => setChannelOrAuthor(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors"
          >
            {isProcessing ? 'Procesando...' : 'Guardar Video en la Videoteca'}
          </button>
        </form>

        {/* Live Preview Card */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8c887f]">
            Vista Previa
          </h3>

          <div className="natural-card rounded-2xl p-4 space-y-2.5">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-[#2d2f38]">
              <Image src={thumbnailPreview} alt="Preview" fill className="object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#d97d64] text-[#151618] flex items-center justify-center">
                  <Play className="w-4 h-4 fill-[#151618] ml-0.5" />
                </div>
              </div>
              <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1e1f24]/90 text-[#f3f1ec] uppercase">
                {detectedPlatform}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-[#e6cca0] block">{channelOrAuthor || 'Autor / Canal'}</span>
              <h4 className="text-xs sm:text-sm font-bold text-[#f3f1ec] leading-snug">
                {videoTitle || 'Título del video aparecerá aquí'}
              </h4>
              <span className="text-[10px] text-[#8c887f] block pt-0.5 uppercase font-medium">
                Categoría: {videoType}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Videos List */}
      <section className="natural-card p-5 rounded-2xl space-y-3">
        <h2 className="text-base font-bold text-[#f3f1ec]">Videos Cargados en la Plataforma</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {videosList.map((vid) => (
            <div key={vid.id} className="p-3 rounded-xl bg-[#24252c] border border-[#31333d] space-y-2 flex flex-col justify-between">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <Image src={vid.thumbnailUrl} alt={vid.title} fill className="object-cover" />
                <span className="absolute top-1.5 left-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#1e1f24]/90 text-[#e6cca0] uppercase">
                  {vid.platform}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#e6cca0] font-medium block">{vid.artistName}</span>
                <h4 className="text-xs font-bold text-[#f3f1ec] line-clamp-2">{vid.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
