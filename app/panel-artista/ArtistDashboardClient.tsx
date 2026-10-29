'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Music2,
  Disc3,
  Calendar,
  Video,
  Share2,
  Upload,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  LogOut,
  Save,
  Plus,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Info,
} from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { GenreType, DiscographyType, VideoPlatform } from '@/lib/types';

const GENRE_OPTIONS: GenreType[] = [
  'Folklore',
  'Pop',
  'Rock',
  'EDM',
  'Dance',
  'Electrónica',
  'Música Urbana',
  'Trap',
  'Hip Hop',
  'Cumbia',
  'Cuarteto',
  'Cumbia / Cuarteto',
  'Indie',
  'Tango',
  'Música Popular',
  'Fusión Latinoamericana',
  'House / Techno',
  'Synthpop',
  'Reggaeton',
  'R&B / Soul',
  'Jazz / Instrumental',
  'Blues / Funk',
  'Reggae / Ska',
  'Chamamé',
  'Acústico / Cantautor',
  'Metal / Punk',
  'Salsa / Bachata',
  'Música Clásica',
];

export function ArtistDashboardClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingSpotify, setSyncingSpotify] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [artist, setArtist] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'bio' | 'spotify' | 'discografia' | 'agenda' | 'videos'>('bio');

  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [customGenreInput, setCustomGenreInput] = useState('');

  const handleAddCustomGenre = () => {
    const trimmed = customGenreInput.trim();
    if (!trimmed) return;
    if (!formData.genres.some((g) => g.toLowerCase() === trimmed.toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        genres: [...prev.genres, trimmed as GenreType],
      }));
    }
    setCustomGenreInput('');
  };

  // Form State
  const [formData, setFormData] = useState({
    stageName: '',
    realName: '',
    genres: ['Folklore'] as GenreType[],
    city: '',
    province: '',
    country: 'Argentina',
    bio: '',
    shortBio: '',
    quotes: '',
    photoUrl: '',
    bannerUrl: '',
    socials: {
      spotify: '',
      youtube: '',
      instagram: '',
      tiktok: '',
      website: '',
    },
    discography: [] as any[],
    agenda: [] as any[],
    videos: [] as any[],
    hasDiscrepancies: false,
    discrepanciesNotes: '',
  });

  // Modal para agregar show manual
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    venue: '',
    city: '',
    province: '',
    country: 'Argentina',
    date: '',
    ticketUrl: '',
    ticketPrice: '',
    isFree: false,
    type: 'recital',
  });

  // Modal para agregar lanzamiento manual
  const [showDiscModal, setShowDiscModal] = useState(false);
  const [newDisc, setNewDisc] = useState({
    title: '',
    type: 'single' as DiscographyType,
    year: new Date().getFullYear(),
    coverUrl: '',
    spotifyUrl: '',
    tracksCount: 1,
  });

  // Modal para agregar video
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: '',
    platform: 'youtube' as VideoPlatform,
    url: '',
  });

  // Feature Flag: habilitar compra de destaque semanal (oculto hasta lanzamiento comercial)
  const ENABLE_WEEKLY_FEATURED_PURCHASE = false;
  const [featuredLoading, setFeaturedLoading] = useState(false);

  const handleUpgradeToFeatured = async () => {
    if (!artist?.id) return;
    setFeaturedLoading(true);
    try {
      const res = await fetch('/api/mercadopago/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'weekly_featured',
          artistId: artist.id,
          artistName: artist.stageName,
          userEmail: user?.email,
        }),
      });
      const data = await res.json();
      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        alert(data.error || 'Error al conectar con Mercado Pago');
      }
    } catch {
      alert('Error de conexión al procesar el pago.');
    } finally {
      setFeaturedLoading(false);
    }
  };

  // Cargar sesión y perfil
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/artist-portal/profile');
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
      }

      setUser(data.user);
      if (data.artist) {
        setArtist(data.artist);
        setFormData({
          stageName: data.artist.stageName || '',
          realName: data.artist.realName || '',
          genres: data.artist.genres || ['Folklore'],
          city: data.artist.city || '',
          province: data.artist.province || '',
          country: data.artist.country || 'Argentina',
          bio: data.artist.bio || '',
          shortBio: data.artist.shortBio || '',
          quotes: data.artist.quotes || '',
          photoUrl: data.artist.photoUrl || '',
          bannerUrl: data.artist.bannerUrl || '',
          socials: data.artist.socials || {},
          discography: data.artist.discography || [],
          agenda: data.artist.agenda || [],
          videos: data.artist.videos || [],
          hasDiscrepancies: Boolean(data.artist.hasDiscrepancies),
          discrepanciesNotes: data.artist.adminNotes || '',
        });
      } else {
        // Inicializar nombre y origen de contacto del registro si están disponibles
        const savedRef =
          typeof window !== 'undefined' ? localStorage.getItem('guta_referral_source') || '' : '';
        setFormData((prev) => ({
          ...prev,
          stageName: data.user?.stageName || '',
          socials: {
            ...prev.socials,
            ...(savedRef ? { referralSource: savedRef } : {}),
          },
        }));
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al cargar los datos del perfil.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    pb.authStore.clear();
    if (typeof document !== 'undefined') {
      document.cookie = pb.authStore.exportToCookie({
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      });
    }
    router.push('/login');
  };

  // Subir imagen (Avatar o Banner)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'photoUrl' | 'bannerUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMessage({ type: 'info', text: 'Subiendo imagen a los servidores...' });
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('collection', 'media');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setFormData((prev) => ({ ...prev, [field]: data.url }));
        setMessage({ type: 'success', text: '¡Imagen cargada exitosamente!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al subir la imagen.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error en la subida del archivo.' });
    }
  };

  // Sincronizar y Corroborar Spotify
  const handleSyncSpotify = async () => {
    if (!formData.socials.spotify && !formData.stageName) {
      setMessage({
        type: 'error',
        text: 'Ingresá tu enlace de Spotify o el nombre de tu banda para sincronizar.',
      });
      return;
    }

    setSyncingSpotify(true);
    setMessage(null);

    try {
      const res = await fetch('/api/artist-portal/sync-spotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotifyUrl: formData.socials.spotify,
          stageName: formData.stageName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage({
          type: 'error',
          text: data.error || 'No se pudo sincronizar el perfil con Spotify.',
        });
        setSyncingSpotify(false);
        return;
      }

      // Integrar discografía evitando duplicados
      const existingTitles = new Set(formData.discography.map((d: any) => d.title.toLowerCase().trim()));
      const newItems = (data.discography || []).filter(
        (d: any) => !existingTitles.has(d.title.toLowerCase().trim())
      );

      const mergedDiscography = [...formData.discography, ...newItems];

      setFormData((prev) => ({
        ...prev,
        socials: {
          ...prev.socials,
          spotify: data.officialSpotifyUrl || prev.socials.spotify,
        },
        discography: mergedDiscography,
        hasDiscrepancies: data.hasDiscrepancies,
        discrepanciesNotes: data.discrepancies?.join(' | ') || '',
        photoUrl: prev.photoUrl || data.officialPhotoUrl || '',
      }));

      if (data.hasDiscrepancies) {
        setMessage({
          type: 'info',
          text: `Se asociaron ${newItems.length} lanzamientos de Spotify. Nota: Se detectaron discrepancias que serán revisadas por el moderador.`,
        });
      } else {
        setMessage({
          type: 'success',
          text: `¡Perfil de Spotify verificado! Se incorporaron ${newItems.length} lanzamientos automáticamente.`,
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión con Spotify.' });
    } finally {
      setSyncingSpotify(false);
    }
  };

  // Guardar Cambios (Crear o Actualizar)
  const handleSave = async () => {
    if (!formData.stageName.trim()) {
      setMessage({ type: 'error', text: 'El nombre del proyecto es obligatorio.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const isNew = !artist?.id;
      const url = '/api/artist-portal/profile';
      const method = isNew ? 'POST' : 'PUT';
      const savedReferral =
        typeof window !== 'undefined' ? localStorage.getItem('guta_referral_source') || '' : '';
      const mergedSocials = {
        ...formData.socials,
        ...(savedReferral && !(formData.socials as any)?.referralSource
          ? { referralSource: savedReferral }
          : {}),
      };
      const payload = isNew
        ? { ...formData, socials: mergedSocials, referralSource: (mergedSocials as any).referralSource || '' }
        : { id: artist.id, ...formData, socials: mergedSocials };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage({ type: 'error', text: data.error || 'Error al guardar los cambios.' });
        setSaving(false);
        return;
      }

      setArtist(data.artist);
      setMessage({
        type: 'success',
        text: isNew
          ? '¡Tu ficha fue creada y enviada a revisión con éxito!'
          : '¡Cambios guardados correctamente!',
      });
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión al guardar.' });
    } finally {
      setSaving(false);
    }
  };

  // Agregar show a la agenda
  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.venue) {
      alert('Completá al menos el nombre del show, la sala/venue y la fecha.');
      return;
    }
    const eventItem = {
      id: `ev-${Date.now()}`,
      ...newEvent,
    };
    setFormData((prev) => ({
      ...prev,
      agenda: [...prev.agenda, eventItem],
    }));
    setShowEventModal(false);
    setNewEvent({
      title: '',
      venue: '',
      city: '',
      province: '',
      country: 'Argentina',
      date: '',
      ticketUrl: '',
      ticketPrice: '',
      isFree: false,
      type: 'recital',
    });
  };

  // Agregar lanzamiento a la discografía
  const handleAddDisc = () => {
    if (!newDisc.title) {
      alert('Completá el título del lanzamiento.');
      return;
    }
    const discItem = {
      id: `disc-man-${Date.now()}`,
      ...newDisc,
    };
    setFormData((prev) => ({
      ...prev,
      discography: [discItem, ...prev.discography],
    }));
    setShowDiscModal(false);
    setNewDisc({
      title: '',
      type: 'single',
      year: new Date().getFullYear(),
      coverUrl: '',
      spotifyUrl: '',
      tracksCount: 1,
    });
  };

  // Agregar video
  const handleAddVideo = () => {
    if (!newVideo.title || !newVideo.url) {
      alert('Completá el título y enlace del video.');
      return;
    }
    const videoItem = {
      id: `vid-man-${Date.now()}`,
      title: newVideo.title,
      platform: newVideo.platform,
      url: newVideo.url,
      embedUrl: newVideo.url,
      thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800',
      channelOrAuthor: formData.stageName,
      type: 'live',
      duration: '',
      publishedAt: new Date().toISOString().split('T')[0],
    };
    setFormData((prev) => ({
      ...prev,
      videos: [videoItem, ...prev.videos],
    }));
    setShowVideoModal(false);
    setNewVideo({ title: '', platform: 'youtube', url: '' });
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-[#d97d64] animate-spin" />
        <span className="text-xs text-[#aba79e] font-medium">Cargando tu panel de artista...</span>
      </div>
    );
  }

  const isApproved = artist?.status === 'approved';
  const isPending = !artist || artist.status === 'pending';
  const needsRevision = artist?.status === 'needs_revision';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* 1. Header del Portal con Identidad y Logout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2d2f38]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#d97d64] flex items-center justify-center text-[#151618] font-bold">
              <Music2 className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#f3f1ec]">
              {artist ? formData.stageName || 'Mi Proyecto Musical' : 'Sumar Mi Proyecto Musical'}
            </h1>
          </div>
          <p className="text-xs text-[#aba79e]">
            Conectado como <strong className="text-[#f3f1ec]">{user?.email}</strong> ({user?.name || 'Artista'})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {artist?.slug && isApproved && (
            <Link
              href={`/artistas/${artist.slug}`}
              target="_blank"
              className="px-3 py-1.5 rounded-xl bg-[#24252c] hover:bg-[#2e303b] text-[#93a887] border border-[#31333d] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Perfil Público</span>
            </Link>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-[#d97d64] hover:bg-[#c86d55] text-[#151618] text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#d97d64]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl bg-[#24252c] hover:bg-[#2e303b] text-[#aba79e] hover:text-[#f3f1ec] border border-[#31333d] transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Banner de Estado de Aprobación */}
      {isPending && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#e6cca0]/10 border border-[#e6cca0]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e6cca0]/20 text-[#e6cca0] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#f3f1ec] text-sm">En Espera de Aprobación</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#e6cca0]/20 text-[#e6cca0]">
                  MODERACIÓN PENDIENTE
                </span>
              </div>
              <p className="text-[#aba79e]">
                {artist
                  ? 'Tu ficha fue enviada al equipo editorial de Guta Música. Podés seguir completando tu información mientras la revisamos.'
                  : 'Completá los datos de tu banda/solista y guardá para enviar tu postulación a moderación.'}
              </p>
            </div>
          </div>
          <span className="text-[11px] text-[#e6cca0] font-semibold">Respuesta estimada: 24 - 48 hs</span>
        </div>
      )}

      {isApproved && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#93a887]/15 border border-[#93a887]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#93a887]/20 text-[#93a887] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-[#f3f1ec] text-sm">Perfil Aprobado & Público</span>
              <p className="text-[#aba79e]">
                Tu música y fechas en vivo están activas en el directorio federal de Guta Música.
              </p>
            </div>
          </div>
          <Link
            href={`/artistas/${artist.slug}`}
            target="_blank"
            className="px-3.5 py-1.5 rounded-xl bg-[#93a887] text-[#151618] font-bold text-xs flex items-center gap-1.5 hover:bg-[#859c79] transition-colors"
          >
            <span>Ver Ficha Pública</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 2.1 Oferta de Destaque Semanal con Mercado Pago (Oculto hasta que actives el flag) */}
      {ENABLE_WEEKLY_FEATURED_PURCHASE && isApproved && artist && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#d97d64]/15 via-[#e6cca0]/10 to-[#1e1f25] border border-[#d97d64]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d97d64]" />
              <span className="font-bold text-[#f3f1ec] text-sm">Destacar en Portada Principal (7 días)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d97d64]/20 text-[#d97d64]">HERO PRO</span>
            </div>
            <p className="text-xs text-[#aba79e]">
              Posicioná a tu banda en el slider principal de la Home de GUTA con alcance nacional garantizado.
            </p>
          </div>
          <button
            type="button"
            onClick={handleUpgradeToFeatured}
            disabled={featuredLoading}
            className="px-4 py-2.5 rounded-xl bg-[#009EE3] hover:bg-[#008ac7] text-[#121316] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-md shadow-[#009EE3]/20"
          >
            {featuredLoading ? (
              <span>Conectando...</span>
            ) : (
              <span>Destacar con Mercado Pago</span>
            )}
          </button>
        </div>
      )}

      {needsRevision && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Observaciones del Moderador</span>
          </div>
          <p className="text-[#f3f1ec] bg-black/30 p-3 rounded-xl border border-amber-500/20">
            {artist.adminNotes || 'Por favor revisá los datos cargados y actualizá la información solicitada.'}
          </p>
          <p className="text-[11px] text-[#aba79e]">
            Realizá los ajustes necesarios y presioná <strong>«Guardar Cambios»</strong> para reenviar a revisión.
          </p>
        </div>
      )}

      {/* Alerta de Discrepancias de Spotify */}
      {formData.hasDiscrepancies && (
        <div className="p-4 rounded-xl bg-[#24252c] border border-amber-500/40 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-300">Aviso sobre tu vinculación con Spotify:</span>
            <p className="text-[#aba79e]">
              {formData.discrepanciesNotes ||
                'Se detectaron variaciones entre los datos ingresados y el perfil oficial de Spotify. Las canciones fueron asociadas pero tu ficha fue marcada para cotejo editorial antes de su publicación.'}
            </p>
          </div>
        </div>
      )}

      {/* Alertas de Notificación del Sistema */}
      {message && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-[#93a887]/15 border border-[#93a887]/30 text-[#93a887]'
              : message.type === 'error'
              ? 'bg-red-950/40 border border-red-500/30 text-red-200'
              : 'bg-blue-950/40 border border-blue-500/30 text-blue-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 3. Navegación por Pestañas */}
      <div className="flex border-b border-[#2d2f38] gap-1 sm:gap-2 overflow-x-auto pb-2 text-xs font-semibold">
        {[
          { key: 'bio', label: 'Identidad & Biografía', icon: Music2 },
          { key: 'spotify', label: 'Spotify & Redes', icon: Share2 },
          { key: 'discografia', label: `Discografía (${formData.discography.length})`, icon: Disc3 },
          { key: 'agenda', label: `Agenda & Shows (${formData.agenda.length})`, icon: Calendar },
          { key: 'videos', label: `Videos (${formData.videos.length})`, icon: Video },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
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

      {/* 4. Contenido de las Pestañas */}

      {/* TAB 1: IDENTIDAD & BIOGRAFÍA */}
      {activeTab === 'bio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 natural-card p-5 sm:p-6 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#e6cca0]">
              Datos Generales del Proyecto Musical
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#aba79e] block">
                  Nombre Artístico / Banda / Solista *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Tupay"
                  value={formData.stageName}
                  onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#aba79e] block">
                  Nombre Real / Integrantes principales
                </label>
                <input
                  type="text"
                  placeholder="Ej. Edwin Hermosa, Fernando Torrico"
                  value={formData.realName}
                  onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#aba79e] block">Ciudad</label>
                <input
                  type="text"
                  placeholder="Ej. Tilcara"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#aba79e] block">Provincia</label>
                <input
                  type="text"
                  placeholder="Ej. Jujuy"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#aba79e] block">País</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>
            </div>

            {/* Géneros */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#aba79e] block">
                  Géneros Musicales (seleccioná los que apliquen)
                </label>
                <span className="text-[10px] text-[#e6cca0]">
                  {formData.genres.length} seleccionado{formData.genres.length === 1 ? '' : 's'}
                </span>
              </div>

              {/* Botones de Géneros Principales */}
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 rounded-xl bg-[#141518] border border-[#262830]">
                {GENRE_OPTIONS.map((genre) => {
                  const selected = formData.genres.some((g) => g.toLowerCase() === genre.toLowerCase());
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => {
                        const newGenres = selected
                          ? formData.genres.filter((g) => g.toLowerCase() !== genre.toLowerCase())
                          : [...formData.genres, genre];
                        setFormData({ ...formData, genres: newGenres });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                        selected
                          ? 'bg-[#d97d64] text-[#151618] border-[#d97d64] font-bold'
                          : 'bg-[#18191e] text-[#aba79e] border-[#2e3039] hover:border-[#464957] hover:text-[#f3f1ec]'
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}

                {/* Mostrar géneros personalizados que el usuario haya agregado */}
                {formData.genres
                  .filter((g) => !GENRE_OPTIONS.some((opt) => opt.toLowerCase() === g.toLowerCase()))
                  .map((customGenre) => (
                    <button
                      key={customGenre}
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          genres: formData.genres.filter((g) => g !== customGenre),
                        });
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border bg-[#e6cca0] text-[#151618] border-[#e6cca0] flex items-center gap-1"
                    >
                      <span>{customGenre}</span>
                      <span className="text-[10px] opacity-70">✕</span>
                    </button>
                  ))}
              </div>

              {/* Input para agregar otro género no listado */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  placeholder="+ ¿Otro género o estilo específico? Escribilo acá..."
                  value={customGenreInput}
                  onChange={(e) => setCustomGenreInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomGenre();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs placeholder:text-[#5a5751] focus:outline-none focus:border-[#d97d64]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomGenre}
                  className="px-3 py-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#e6cca0] border border-[#31333d] text-xs font-semibold shrink-0 cursor-pointer transition-colors"
                >
                  + Agregar
                </button>
              </div>
            </div>

            {/* Biografía */}
            <div className="space-y-1 pt-2">
              <label className="text-[11px] font-semibold text-[#aba79e] block">
                Biografía Completa / Historia y Propuesta Musical *
              </label>
              <textarea
                rows={5}
                required
                placeholder="Contanos sobre los orígenes, influencias, recorrido y propuesta artística..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64] leading-relaxed"
              />
            </div>

            {/* Frase / Cita */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#aba79e] block">
                Frase / Cita Destacada (opcional)
              </label>
              <input
                type="text"
                placeholder='"El folklore no es nostalgia, es futuro."'
                value={formData.quotes}
                onChange={(e) => setFormData({ ...formData, quotes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64] italic"
              />
            </div>

            {/* ¿Por dónde nos conociste? */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-semibold text-[#aba79e] block">
                ¿Por dónde nos conociste?
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Instagram',
                  'TikTok',
                  'Facebook',
                  'YouTube',
                  'Kick / Twitch',
                  'Recomendación de un colega',
                  'Buscador (Google / Web)',
                  'Prensa / Evento en vivo',
                  'Otro',
                ].map((opt) => {
                  const currentRef = (formData.socials as any)?.referralSource || '';
                  const selected = currentRef === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const nextVal = selected ? '' : opt;
                        if (typeof window !== 'undefined' && nextVal) {
                          localStorage.setItem('guta_referral_source', nextVal);
                        }
                        setFormData({
                          ...formData,
                          socials: {
                            ...formData.socials,
                            referralSource: nextVal,
                          } as any,
                        });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                        selected
                          ? 'bg-[#d97d64] text-[#151618] border-[#d97d64] font-bold'
                          : 'bg-[#18191e] text-[#aba79e] border-[#2e3039] hover:border-[#464957] hover:text-[#f3f1ec]'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Fotos (Avatar & Banner) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="natural-card p-5 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e6cca0]">
                Fotografía Principal (Avatar)
              </h3>
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#18191e] border border-[#2e3039] flex items-center justify-center">
                {formData.photoUrl ? (
                  <Image src={formData.photoUrl} alt="Foto de Perfil" fill sizes="300px" className="object-cover" />
                ) : (
                  <div className="text-center p-4 text-[#8c887f]">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span className="text-xs">Sin foto de perfil cargada</span>
                  </div>
                )}
              </div>
              <label className="w-full py-2 px-3 rounded-xl bg-[#24252c] hover:bg-[#2e303b] text-[#f3f1ec] text-xs font-semibold border border-[#31333d] flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#d97d64]" />
                <span>Subir Foto de Perfil</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'photoUrl')}
                  className="hidden"
                />
              </label>
            </div>

            <div className="natural-card p-5 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#e6cca0]">
                Foto Panorámica (Banner Hero)
              </h3>
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#18191e] border border-[#2e3039] flex items-center justify-center">
                {formData.bannerUrl ? (
                  <Image src={formData.bannerUrl} alt="Banner" fill sizes="300px" className="object-cover" />
                ) : (
                  <div className="text-center p-4 text-[#8c887f]">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span className="text-xs">Sin banner panorámico</span>
                  </div>
                )}
              </div>
              <label className="w-full py-2 px-3 rounded-xl bg-[#24252c] hover:bg-[#2e303b] text-[#f3f1ec] text-xs font-semibold border border-[#31333d] flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#d97d64]" />
                <span>Subir Banner Horizontal</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'bannerUrl')}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPOTIFY & REDES SOCIALES */}
      {activeTab === 'spotify' && (
        <div className="space-y-6">
          {/* Tarjeta Destacada de Spotify con Sincronización Automática */}
          <div className="natural-card p-6 rounded-2xl border-2 border-[#1db954]/40 bg-gradient-to-br from-[#1a1c22] to-[#121915] space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1db954]/20 border border-[#1db954]/40 text-[#1db954] flex items-center justify-center">
                  <Disc3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#f3f1ec]">Integración Oficial de Spotify</h3>
                  <p className="text-xs text-[#aba79e]">
                    Ingresá tu perfil para corroborar tu música y traer lanzamientos automáticamente.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSyncSpotify}
                disabled={syncingSpotify}
                className="px-4 py-2 rounded-xl bg-[#1db954] hover:bg-[#1aa34a] text-[#121316] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#1db954]/20 disabled:opacity-50"
              >
                {syncingSpotify ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Conectando con Spotify...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Corroborar y Sincronizar Música</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#aba79e] block">
                Enlace a tu Perfil de Artista en Spotify
              </label>
              <input
                type="url"
                placeholder="https://open.spotify.com/artist/0AMd5Lv1a9CTAdLfbIkf8F"
                value={formData.socials.spotify || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    socials: { ...formData.socials, spotify: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs font-mono placeholder:text-[#5a5751] focus:outline-none focus:border-[#1db954]"
              />
              <p className="text-[10px] text-[#8c887f]">
                El recuadro del reproductor oficial solo se mostrará en tu página pública si este enlace es válido.
              </p>
            </div>
          </div>

          {/* Redes Sociales Generales */}
          <div className="natural-card p-6 rounded-2xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#e6cca0]">
              Otras Redes Sociales & Plataformas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#aba79e] block">YouTube</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/@tubanda"
                  value={formData.socials.youtube || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socials: { ...formData.socials, youtube: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#aba79e] block">Instagram</label>
                <input
                  type="url"
                  placeholder="https://instagram.com/tubanda"
                  value={formData.socials.instagram || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socials: { ...formData.socials, instagram: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#aba79e] block">TikTok</label>
                <input
                  type="url"
                  placeholder="https://tiktok.com/@tubanda"
                  value={formData.socials.tiktok || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socials: { ...formData.socials, tiktok: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#aba79e] block">Sitio Web Oficial</label>
                <input
                  type="url"
                  placeholder="https://tubanda.com"
                  value={formData.socials.website || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      socials: { ...formData.socials, website: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DISCOGRAFÍA */}
      {activeTab === 'discografia' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#f3f1ec]">Lanzamientos & Álbumes</h3>
              <p className="text-xs text-[#aba79e]">
                Música oficial vinculada de Spotify o cargada manualmente.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDiscModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#24252c] hover:bg-[#2e303b] text-[#e6cca0] border border-[#31333d] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Lanzamiento Manual</span>
            </button>
          </div>

          {formData.discography.length === 0 ? (
            <div className="natural-card p-8 rounded-2xl text-center space-y-3">
              <Disc3 className="w-10 h-10 text-[#8c887f] mx-auto opacity-50" />
              <p className="text-xs text-[#aba79e]">Aún no tenés lanzamientos asociados a tu ficha.</p>
              <button
                type="button"
                onClick={() => setActiveTab('spotify')}
                className="px-3 py-1.5 rounded-xl bg-[#1db954] text-[#151618] text-xs font-bold inline-flex items-center gap-1.5"
              >
                <span>Sincronizar con Spotify</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {formData.discography.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="natural-card p-3.5 rounded-xl border border-[#2e3039] flex items-center gap-3 relative group"
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#151618] shrink-0 border border-[#31333d]">
                    {item.coverUrl ? (
                      <Image src={item.coverUrl} alt={item.title} fill sizes="56px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8c887f]">
                        <Disc3 className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-[#8c887f] uppercase font-mono block">
                      {item.type || 'Álbum'} • {item.year}
                    </span>
                    <h4 className="text-xs font-bold text-[#f3f1ec] truncate">{item.title}</h4>
                    {item.spotifyUrl && (
                      <a
                        href={item.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#93a887] hover:underline flex items-center gap-1 pt-0.5"
                      >
                        <span>Escuchar</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        discography: formData.discography.filter((_, i) => i !== idx),
                      });
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 transition-all cursor-pointer"
                    title="Eliminar disco"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AGENDA DE SHOWS */}
      {activeTab === 'agenda' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#f3f1ec]">Próximos Conciertos & Giras</h3>
              <p className="text-xs text-[#aba79e]">Fechas en vivo que se mostrarán en tu perfil y agenda federal.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowEventModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#d97d64] hover:bg-[#c86d55] text-[#151618] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Nuevo Show</span>
            </button>
          </div>

          {formData.agenda.length === 0 ? (
            <div className="natural-card p-8 rounded-2xl text-center space-y-2">
              <Calendar className="w-10 h-10 text-[#8c887f] mx-auto opacity-50" />
              <p className="text-xs text-[#aba79e]">No tenés fechas cargadas en tu agenda.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {formData.agenda.map((ev, idx) => (
                <div
                  key={ev.id || idx}
                  className="natural-card p-4 rounded-xl border border-[#2e3039] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#24252c] text-[#e6cca0] font-bold">
                        {ev.date}
                      </span>
                      <h4 className="text-xs font-bold text-[#f3f1ec]">{ev.title}</h4>
                    </div>
                    <p className="text-[11px] text-[#aba79e]">
                      {ev.venue} • {ev.city}, {ev.province}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {ev.ticketUrl && (
                      <a
                        href={ev.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-[#24252c] text-[#93a887] text-[11px] font-semibold flex items-center gap-1"
                      >
                        <span>Entradas</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          agenda: formData.agenda.filter((_, i) => i !== idx),
                        });
                      }}
                      className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: VIDEOS */}
      {activeTab === 'videos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#f3f1ec]">Videos & Sesiones en Vivo</h3>
              <p className="text-xs text-[#aba79e]">Enlaces de YouTube o TikTok para tu reproductor.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowVideoModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#d97d64] hover:bg-[#c86d55] text-[#151618] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Video</span>
            </button>
          </div>

          {formData.videos.length === 0 ? (
            <div className="natural-card p-8 rounded-2xl text-center space-y-2">
              <Video className="w-10 h-10 text-[#8c887f] mx-auto opacity-50" />
              <p className="text-xs text-[#aba79e]">No tenés videos cargados todavía.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {formData.videos.map((vid, idx) => (
                <div
                  key={vid.id || idx}
                  className="natural-card p-3.5 rounded-xl border border-[#2e3039] flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[10px] uppercase font-mono text-[#d97d64] block">
                      {vid.platform}
                    </span>
                    <h4 className="text-xs font-bold text-[#f3f1ec] truncate">{vid.title}</h4>
                    <p className="text-[10px] text-[#8c887f] truncate">{vid.url}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        videos: formData.videos.filter((_, i) => i !== idx),
                      });
                    }}
                    className="p-1.5 rounded-lg bg-red-950/40 text-red-400 hover:bg-red-900/60 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: AGREGAR SHOW */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="natural-card p-6 rounded-2xl border border-[#2e3039] max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-[#f3f1ec]">Agregar Concierto a la Agenda</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-[#aba79e] block mb-1">Nombre del Show *</label>
                <input
                  type="text"
                  placeholder="Ej. Presentación Oficial del Nuevo Disco"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#aba79e] block mb-1">Sala / Teatro / Venue *</label>
                <input
                  type="text"
                  placeholder="Ej. Teatro San Martín"
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-[#aba79e] block mb-1">Ciudad</label>
                  <input
                    type="text"
                    placeholder="Ej. Córdoba"
                    value={newEvent.city}
                    onChange={(e) => setNewEvent({ ...newEvent, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#aba79e] block mb-1">Fecha y Hora *</label>
                  <input
                    type="text"
                    placeholder="Ej. 2026-10-15 21:00"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#aba79e] block mb-1">Link a Entradas (Passline, Ticketek, etc.)</label>
                <input
                  type="url"
                  placeholder="https://passline.com/eventos/..."
                  value={newEvent.ticketUrl}
                  onChange={(e) => setNewEvent({ ...newEvent, ticketUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                className="px-3 py-1.5 rounded-xl bg-[#24252c] text-[#aba79e] text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddEvent}
                className="px-4 py-1.5 rounded-xl bg-[#d97d64] text-[#151618] text-xs font-bold"
              >
                Agregar a Agenda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR LANZAMIENTO */}
      {showDiscModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="natural-card p-6 rounded-2xl border border-[#2e3039] max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-[#f3f1ec]">Agregar Lanzamiento Manual</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-[#aba79e] block mb-1">Título del Disco o Single *</label>
                <input
                  type="text"
                  placeholder="Ej. Coplas del Valle"
                  value={newDisc.title}
                  onChange={(e) => setNewDisc({ ...newDisc, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-[#aba79e] block mb-1">Tipo</label>
                  <select
                    value={newDisc.type}
                    onChange={(e) => setNewDisc({ ...newDisc, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec]"
                  >
                    <option value="album">Álbum</option>
                    <option value="single">Single</option>
                    <option value="ep">EP</option>
                    <option value="live_album">En Vivo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-[#aba79e] block mb-1">Año</label>
                  <input
                    type="number"
                    value={newDisc.year}
                    onChange={(e) => setNewDisc({ ...newDisc, year: parseInt(e.target.value, 10) || 2026 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-[#aba79e] block mb-1">URL de Portada</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newDisc.coverUrl}
                  onChange={(e) => setNewDisc({ ...newDisc, coverUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscModal(false)}
                className="px-3 py-1.5 rounded-xl bg-[#24252c] text-[#aba79e] text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddDisc}
                className="px-4 py-1.5 rounded-xl bg-[#d97d64] text-[#151618] text-xs font-bold"
              >
                Guardar Lanzamiento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR VIDEO */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="natural-card p-6 rounded-2xl border border-[#2e3039] max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-[#f3f1ec]">Agregar Video / Sesión</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] text-[#aba79e] block mb-1">Título del Video *</label>
                <input
                  type="text"
                  placeholder="Ej. Zamba del Laurel (Sesión Acústica)"
                  value={newVideo.title}
                  onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#aba79e] block mb-1">Plataforma</label>
                <select
                  value={newVideo.platform}
                  onChange={(e) => setNewVideo({ ...newVideo, platform: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec]"
                >
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-[#aba79e] block mb-1">Enlace del Video *</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={newVideo.url}
                  onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="px-3 py-1.5 rounded-xl bg-[#24252c] text-[#aba79e] text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddVideo}
                className="px-4 py-1.5 rounded-xl bg-[#d97d64] text-[#151618] text-xs font-bold"
              >
                Agregar Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
