'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Artist, VideoItem, VideoPlatform, VideoType } from '../../../lib/types';
import { pb } from '../../../lib/pocketbase';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { ConfirmModal } from '../../../components/admin/ConfirmModal';
import {
  parseYouTubeVideoId,
  detectVideoPlatform,
  getVideoEmbedUrl,
  getVideoThumbnailUrl,
} from '../../../lib/videoUtils';
import {
  Play,
  Trash2,
  ExternalLink,
  Video,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
} from 'lucide-react';

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
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [duration, setDuration] = useState('');

  const [videosList, setVideosList] = useState<VideoItem[]>(initialVideos);
  const [isProcessing, setIsProcessing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [activePreviewVideo, setActivePreviewVideo] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-detect and parse URL instantly
  const handleUrlChange = (url: string) => {
    setVideoUrl(url);

    const platform = detectVideoPlatform(url);
    setDetectedPlatform(platform);

    if (platform === 'youtube') {
      const videoId = parseYouTubeVideoId(url);
      if (videoId) {
        const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        const embed = `https://www.youtube-nocookie.com/embed/${videoId}`;
        setThumbnailPreview(thumb);
        setEmbedUrl(embed);

        if (!videoTitle) {
          const isShort = url.includes('/shorts/');
          const isMusic = url.includes('music.youtube.com');
          if (isShort) {
            setVideoTitle(`Short en Vivo (${videoId})`);
          } else if (isMusic) {
            setVideoTitle(`Lanzamiento en YouTube Music (${videoId})`);
          } else {
            setVideoTitle(`Sesión Oficial en Vivo (${videoId})`);
          }
        }
        if (!channelOrAuthor) {
          const currentArtist = artists.find((a) => a.id === selectedArtistId);
          setChannelOrAuthor(currentArtist ? `${currentArtist.stageName} Oficial` : 'Canal Oficial');
        }
      }
    } else if (platform === 'tiktok') {
      setThumbnailPreview('https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800&auto=format&fit=crop');
      setEmbedUrl(url);
      if (!channelOrAuthor) setChannelOrAuthor('@artista_tiktok');
    } else if (platform === 'facebook') {
      setThumbnailPreview('https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop');
      setEmbedUrl(url);
      if (!channelOrAuthor) setChannelOrAuthor('Página Oficial');
    }
  };

  const handleArtistSelect = (artistId: string) => {
    setSelectedArtistId(artistId);
    if (artistId !== 'general') {
      const art = artists.find((a) => a.id === artistId);
      if (art && !channelOrAuthor) {
        setChannelOrAuthor(`${art.stageName} Oficial`);
      }
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setNotification(null);

    const targetArtist = artists.find((a) => a.id === selectedArtistId);
    const resolvedEmbed = embedUrl || getVideoEmbedUrl(videoUrl, detectedPlatform);
    const resolvedThumbnail =
      thumbnailPreview ||
      getVideoThumbnailUrl(videoUrl, detectedPlatform) ||
      targetArtist?.photoUrl ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop';

    const payload = {
      title: videoTitle.trim() || 'Video Sin Título',
      platform: detectedPlatform,
      url: videoUrl.trim(),
      embedUrl: resolvedEmbed,
      thumbnailUrl: resolvedThumbnail,
      channelOrAuthor: channelOrAuthor.trim() || targetArtist?.stageName || 'Autor',
      type: videoType,
      duration: duration.trim() || '03:30',
      publishedAt: new Date().toISOString().split('T')[0],
      views: '1.2K',
      featured: isFeatured,
      artistId: selectedArtistId === 'general' ? '' : selectedArtistId,
      artistName: selectedArtistId === 'general' ? 'GUTA Contenidos' : targetArtist?.stageName || 'Artista',
    };

    try {
      // Guardado directo en la colección 'videos' de PocketBase
      const record = await pb.collection('videos').create(payload);

      const createdItem: VideoItem = {
        id: record.id,
        title: record.title,
        platform: record.platform,
        url: record.url,
        embedUrl: record.embedUrl,
        thumbnailUrl: record.thumbnailUrl,
        channelOrAuthor: record.channelOrAuthor,
        type: record.type,
        duration: record.duration,
        publishedAt: record.publishedAt,
        views: record.views,
        featured: Boolean(record.featured),
        artistId: record.artistId,
        artistName: record.artistName,
      };

      setVideosList([createdItem, ...videosList]);
      setVideoUrl('');
      setVideoTitle('');
      setChannelOrAuthor('');
      setDuration('');
      setThumbnailPreview('');
      setEmbedUrl('');
      setNotification({
        type: 'success',
        text: `¡Video "${createdItem.title}" guardado exitosamente en PocketBase!`,
      });
    } catch (err: any) {
      console.error('Error al guardar video en PocketBase:', err);
      if (err?.status === 403 || err?.message?.includes('superusers')) {
        setNotification({
          type: 'error',
          text: `Error de permisos (403): Verificá las API Rules de la colección 'videos' en PocketBase.`,
        });
      } else {
        setNotification({
          type: 'error',
          text: `Error al guardar en PocketBase: ${err?.message || 'Error desconocido'}`,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      const id = deleteTarget.id;
      const title = deleteTarget.title;
      try {
        await pb.collection('videos').delete(id);
        setVideosList((prev) => prev.filter((v) => v.id !== id));
        setNotification({
          type: 'success',
          text: `Video "${title}" eliminado de PocketBase.`,
        });
      } catch (err: any) {
        console.error('Error al eliminar video de PocketBase:', err);
        setNotification({
          type: 'error',
          text: `No se pudo eliminar el video de PocketBase: ${err?.message || 'Error desconocido'}`,
        });
      }
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Gestión & Carga de Videos"
        subtitle="Ingreso de videos de YouTube, Shorts, YouTube Music, TikTok y Facebook con autodetección de metadatos y guardado en PocketBase"
      />

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 border animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-[11px] opacity-80 hover:opacity-100 underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* URL Parser Form */}
        <form onSubmit={handleSaveVideo} className="lg:col-span-7 natural-card p-5 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#93a887]">
            <Video className="w-3.5 h-3.5" />
            <span>Asistente de Carga Directa</span>
          </div>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
              URL del Video (YouTube estándar, Shorts, YouTube Music, TikTok) *
            </label>
            <input
              type="text"
              required
              placeholder="https://www.youtube.com/watch?v=... o https://youtube.com/shorts/... o https://music.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64] font-mono"
            />
            <span className="text-[10px] text-[#78746c] block pt-1">
              Podés pegar URLs de YouTube tradicionales, YouTube Shorts, YouTube Music o enlaces cortos youtu.be
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Plataforma Detectada</label>
              <select
                value={detectedPlatform}
                onChange={(e) => setDetectedPlatform(e.target.value as VideoPlatform)}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              >
                <option value="youtube">YouTube (Estándar / Shorts / Music)</option>
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
                <option value="interview">Entrevista / Nota</option>
                <option value="live">Presentación en Recital</option>
                <option value="acoustic">Acústico / Ensayo</option>
                <option value="clip">Videoclip Oficial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Vincular a Artista *</label>
              <select
                value={selectedArtistId}
                onChange={(e) => handleArtistSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              >
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.stageName} ({a.city || 'Argentina'})
                  </option>
                ))}
                <option value="general">GUTA Contenido General (Sin artista específico)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Duración (ej: 03:45)</label>
              <input
                type="text"
                placeholder="03:45"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Título del Video *</label>
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

          {/* Featured Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-[#383b47] bg-[#18191e] text-[#d97d64] focus:ring-0 cursor-pointer"
              />
              <span className="text-xs text-[#f3f1ec]">
                Destacar este video en la portada y galerías principales
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando en PocketBase...</span>
              </>
            ) : (
              <span>Guardar Video en PocketBase</span>
            )}
          </button>
        </form>

        {/* Live Preview Card & Player */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8c887f]">
            Vista Previa del Reproductor
          </h3>

          <div className="natural-card rounded-2xl p-4 space-y-3">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#2d2f38]">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title="Preview"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : thumbnailPreview ? (
                <div className="relative w-full h-full">
                  <Image src={thumbnailPreview} alt="Preview" fill sizes="400px" className="object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="w-11 h-11 rounded-full bg-[#d97d64] text-[#151618] flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-[#151618] ml-0.5" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#78746c] space-y-2 p-4 text-center">
                  <Video className="w-8 h-8 opacity-40" />
                  <span className="text-xs">Pegá un link de YouTube arriba para previsualizar aquí el reproductor</span>
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-semibold text-[#e6cca0] block">
                {channelOrAuthor || 'Autor / Canal'}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-[#f3f1ec] leading-snug">
                {videoTitle || 'Título del video aparecerá aquí'}
              </h4>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-[#aba79e] bg-[#24252c] px-2 py-0.5 rounded uppercase font-medium">
                  {videoType}
                </span>
                <span className="text-[10px] text-[#8c887f] uppercase">
                  {detectedPlatform}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Videos List */}
      <section className="natural-card p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#f3f1ec]">
            Videos en la Plataforma ({videosList.length})
          </h2>
          <span className="text-xs text-[#8c887f]">Persistidos en PocketBase</span>
        </div>

        {videosList.length === 0 ? (
          <p className="text-xs text-[#8c887f] italic py-4">No hay videos guardados aún.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {videosList.map((vid) => (
              <div
                key={vid.id}
                className="p-3 rounded-xl bg-[#24252c] border border-[#31333d] space-y-2.5 flex flex-col justify-between hover:border-[#464956] transition-colors"
              >
                <div className="space-y-2">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-[#2a2c35]">
                    {vid.thumbnailUrl ? (
                      <Image
                        src={vid.thumbnailUrl}
                        alt={vid.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#555]">
                        <Video className="w-5 h-5" />
                      </div>
                    )}
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#1e1f24]/90 text-[#e6cca0] uppercase">
                      {vid.platform}
                    </span>
                    {vid.duration && (
                      <span className="absolute bottom-1.5 right-1.5 text-[9px] font-mono px-1 py-0.5 rounded bg-black/80 text-[#f3f1ec]">
                        {vid.duration}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] text-[#e6cca0] font-semibold block truncate">
                      {vid.artistName || 'GUTA Contenidos'}
                    </span>
                    <h4 className="text-xs font-bold text-[#f3f1ec] line-clamp-2 leading-tight">
                      {vid.title}
                    </h4>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#2d2f38] flex items-center justify-between">
                  <a
                    href={vid.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#aba79e] hover:text-[#f3f1ec] flex items-center gap-1 transition-colors"
                  >
                    <span>Ver enlace</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ id: vid.id, title: vid.title })}
                    className="p-1.5 rounded-lg text-[#c0909b] hover:text-[#e07a8b] hover:bg-[#2e303b] transition-colors cursor-pointer"
                    title="Eliminar video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Eliminar Video"
        message={`¿Estás seguro de que deseás eliminar el video "${deleteTarget?.title}"? Esta acción removerá el video de PocketBase y del perfil del artista.`}
        confirmText="Eliminar Video"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
