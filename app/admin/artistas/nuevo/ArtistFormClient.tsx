'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GenreType, AgendaEvent, DiscographyItem, DiscographyType } from '../../../../lib/types';
import { MusicDataService } from '../../../../lib/api';
import { pb } from '../../../../lib/pocketbase';
import { ImageUploadField } from '../../../../components/admin/ImageUploadField';
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  Link as LinkIcon,
  Music,
  Check,
  Sparkles,
  AlertCircle,
  Calendar,
  Plus,
  Trash2,
  MapPin,
  Ticket,
  Disc3,
} from 'lucide-react';
import { AITokenBadge } from '../../../../components/admin/AITokenBadge';

export const ArtistFormClient: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const genresList = MusicDataService.getGenresList();

  const [formData, setFormData] = useState({
    stageName: '',
    realName: '',
    genres: [] as GenreType[],
    city: '',
    province: '',
    country: 'Argentina',
    shortBio: '',
    bio: '',
    photoUrl: '',
    bannerUrl: '',
    quotes: '',
    featured: false,
    featuredOfWeek: false,
    spotify: '',
    youtube: '',
    instagram: '',
    tiktok: '',
    agenda: [] as AgendaEvent[],
    gallery: [] as string[],
    discography: [] as DiscographyItem[],
  });

  const [galleryUploadUrl, setGalleryUploadUrl] = useState('');
  const [manualGalleryUrl, setManualGalleryUrl] = useState('');

  // State for new discography release form
  const [newRelease, setNewRelease] = useState<{
    title: string;
    type: DiscographyType;
    year: number;
    coverUrl: string;
    spotifyUrl: string;
    tracksCount: string;
  }>({
    title: '',
    type: 'album',
    year: new Date().getFullYear(),
    coverUrl: '',
    spotifyUrl: '',
    tracksCount: '',
  });
  const [showReleaseForm, setShowReleaseForm] = useState(false);

  // State for new agenda event form
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    venue: '',
    city: '',
    province: '',
    type: 'recital' as 'recital' | 'festival' | 'pena' | 'acustico' | 'feria',
    isFree: false,
    ticketPrice: '',
    ticketUrl: '',
  });
  const [showEventForm, setShowEventForm] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [aiTokenUsage, setAiTokenUsage] = useState<any>(null);
  const [aiModelName, setAiModelName] = useState<string>('gemini-3.6-flash');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load existing artist if in edit mode or load AI draft if coming from AI Studio
  useEffect(() => {
    if (!editId) {
      if (typeof window !== 'undefined') {
        const aiDraft = sessionStorage.getItem('guta_ai_artist_draft');
        if (aiDraft) {
          try {
            const parsed = JSON.parse(aiDraft);
            setFormData((prev) => ({
              ...prev,
              ...parsed,
            }));
            sessionStorage.removeItem('guta_ai_artist_draft');
            setSuccessMessage('¡Datos generados por IA cargados en el formulario del artista!');
            setTimeout(() => setSuccessMessage(''), 4000);
          } catch (e) {}
        }
      }
      return;
    }

    const loadArtist = async () => {
      setIsLoading(true);
      try {
        let record: any = null;
        try {
          record = await pb.collection('artists').getOne(editId);
        } catch {
          record = await pb.collection('artists').getFirstListItem(`slug="${editId}"`);
        }

        if (record) {
          setFormData({
            stageName: record.stageName || '',
            realName: record.realName || '',
            genres: Array.isArray(record.genres) ? record.genres : (record.genres ? [record.genres] : []),
            city: record.city || '',
            province: record.province || '',
            country: record.country || 'Argentina',
            shortBio: record.shortBio || '',
            bio: record.bio || '',
            photoUrl: record.photoUrl || (record.photo ? pb.files.getUrl(record, record.photo) : ''),
            bannerUrl: record.bannerUrl || '',
            quotes: record.quotes || '',
            featured: Boolean(record.featured),
            featuredOfWeek: Boolean(record.featuredOfWeek),
            spotify: record.socials?.spotify || '',
            youtube: record.socials?.youtube || '',
            instagram: record.socials?.instagram || '',
            tiktok: record.socials?.tiktok || '',
            agenda: Array.isArray(record.agenda) ? record.agenda : [],
            gallery: Array.isArray(record.gallery) ? record.gallery : (typeof record.gallery === 'string' && record.gallery ? [record.gallery] : []),
            discography: Array.isArray(record.discography) ? record.discography : [],
          });
        }
      } catch (err: any) {
        console.warn('Error loading artist for edit:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadArtist();
  }, [editId]);

  const handleAddRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRelease.title.trim()) {
      setErrorMessage('Por favor completá el título del álbum o sencillo.');
      return;
    }

    const createdRelease: DiscographyItem = {
      id: `disc-${Date.now()}`,
      title: newRelease.title.trim(),
      type: newRelease.type,
      year: Number(newRelease.year) || new Date().getFullYear(),
      coverUrl: newRelease.coverUrl.trim() || formData.photoUrl || '',
      spotifyUrl: newRelease.spotifyUrl.trim() || undefined,
      tracksCount: newRelease.tracksCount ? parseInt(newRelease.tracksCount, 10) : undefined,
    };

    setFormData((prev) => ({
      ...prev,
      discography: [...prev.discography, createdRelease],
    }));

    setNewRelease({
      title: '',
      type: 'album',
      year: new Date().getFullYear(),
      coverUrl: '',
      spotifyUrl: '',
      tracksCount: '',
    });
    setShowReleaseForm(false);
  };

  const handleRemoveRelease = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      discography: prev.discography.filter((d) => d.id !== id),
    }));
  };

  const handleAddGalleryPhoto = (url: string) => {
    if (!url || !url.trim()) return;
    setFormData((prev) => ({
      ...prev,
      gallery: [...prev.gallery, url.trim()],
    }));
    setGalleryUploadUrl('');
    setManualGalleryUrl('');
  };

  const handleRemoveGalleryPhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gallery: prev.gallery.filter((_, idx) => idx !== index),
    }));
  };

  const toggleGenre = (genre: GenreType) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.date.trim() || !newEvent.venue.trim()) {
      setErrorMessage('Por favor completá el título, fecha y lugar del show.');
      return;
    }

    const createdEvent: AgendaEvent = {
      id: `ev-${Date.now()}`,
      title: newEvent.title.trim(),
      date: newEvent.date.trim(),
      venue: newEvent.venue.trim(),
      city: (newEvent.city || formData.city || 'Ciudad').trim(),
      province: (newEvent.province || formData.province || 'Provincia').trim(),
      country: 'Argentina',
      type: newEvent.type,
      isFree: newEvent.isFree,
      ticketPrice: newEvent.isFree ? 'Entrada Libre y Gratuita' : (newEvent.ticketPrice || 'Entradas en boletería'),
      ticketUrl: newEvent.ticketUrl.trim() || undefined,
    };

    setFormData((prev) => ({
      ...prev,
      agenda: [...prev.agenda, createdEvent],
    }));

    setNewEvent({
      title: '',
      date: '',
      venue: '',
      city: formData.city || '',
      province: formData.province || '',
      type: 'recital',
      isFree: false,
      ticketPrice: '',
      ticketUrl: '',
    });
    setShowEventForm(false);
  };

  const handleRemoveEvent = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      agenda: prev.agenda.filter((ev) => ev.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setErrorMessage('');
    setSuccessMessage('');

    const slug = formData.stageName
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Ensure URLs are valid http(s) URLs or empty string to satisfy PocketBase schema
    const cleanPhotoUrl = formData.photoUrl.trim();
    const cleanBannerUrl = formData.bannerUrl.trim();

    const isInvalidUrl = (url: string) => url !== '' && !url.startsWith('http://') && !url.startsWith('https://');
    if (isInvalidUrl(cleanPhotoUrl)) {
      setErrorMessage('La foto principal no tiene una URL válida (debe comenzar con http:// o https://). Subí el archivo nuevamente o ingresá un enlace válido.');
      setIsSaved(false);
      return;
    }
    if (isInvalidUrl(cleanBannerUrl)) {
      setErrorMessage('El banner de portada no tiene una URL válida (debe comenzar con http:// o https://). Subí el archivo nuevamente o ingresá un enlace válido.');
      setIsSaved(false);
      return;
    }

    const payload = {
      stageName: formData.stageName.trim(),
      slug,
      realName: formData.realName.trim(),
      genres: formData.genres,
      city: formData.city.trim(),
      province: formData.province.trim(),
      country: formData.country.trim(),
      shortBio: formData.shortBio.trim(),
      bio: formData.bio.trim(),
      photoUrl: cleanPhotoUrl,
      bannerUrl: cleanBannerUrl,
      quotes: formData.quotes.trim(),
      featured: formData.featured,
      featuredOfWeek: formData.featuredOfWeek,
      socials: {
        spotify: formData.spotify.trim(),
        youtube: formData.youtube.trim(),
        instagram: formData.instagram.trim(),
        tiktok: formData.tiktok.trim(),
      },
      agenda: formData.agenda,
      gallery: formData.gallery.filter((url) => Boolean(url && url.trim())),
      discography: formData.discography,
    };

    try {
      if (editId) {
        await pb.collection('artists').update(editId, payload);
        setSuccessMessage(`¡Artista "${formData.stageName}" actualizado en PocketBase!`);
      } else {
        await pb.collection('artists').create(payload);
        setSuccessMessage(`¡Artista "${formData.stageName}" creado en PocketBase!`);
      }

      setTimeout(() => {
        router.push('/admin/artistas');
      }, 1000);
    } catch (err: any) {
      console.error('Error saving artist:', err);
      let detail = err?.message || 'Verificá tus permisos de PocketBase';
      if (err?.data && typeof err.data === 'object') {
        const fieldErrors = Object.entries(err.data)
          .map(([k, v]: [string, any]) => `${k}: ${v?.message || JSON.stringify(v)}`)
          .join(' | ');
        if (fieldErrors) detail += ` [Campos: ${fieldErrors}]`;
      }
      setErrorMessage(`Error al guardar en PocketBase: ${detail}`);
      setIsSaved(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/admin/artistas"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c887f] hover:text-[#e6cca0] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Volver a la lista de artistas</span>
      </Link>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#f3f1ec]">
            {editId ? 'Editar Perfil de Artista' : 'Alta de Artista'}
          </h1>
          <p className="text-xs text-[#8c887f]">
            {editId ? 'Modificá los datos, fotos, redes y agenda del artista' : 'Completá la información del perfil del artista o banda'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!formData.stageName) {
                setErrorMessage('Por favor ingresá primero el nombre del artista para que la IA pueda redactar la biografía.');
                return;
              }
              setIsAiLoading(true);
              setAiTokenUsage(null);
              try {
                const res = await fetch('/api/ai/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'artist_review',
                    payload: {
                      stageName: formData.stageName,
                      genres: formData.genres,
                      city: formData.city,
                      province: formData.province,
                    },
                  }),
                });
                const rawText = await res.text();
                let data: any = null;
                try {
                  data = JSON.parse(rawText);
                } catch {
                  setErrorMessage('Aviso: El servidor no devolvió una respuesta JSON válida. Verificá que GEMINI_API_KEY esté configurada en CapRover.');
                  return;
                }

                if (data.success) {
                  setFormData((prev) => ({
                    ...prev,
                    shortBio: data.data.shortBio,
                    bio: data.data.fullBio,
                    quotes: data.data.quotes,
                  }));
                  if (data.model) setAiModelName(data.model);
                  if (data.tokenUsage) setAiTokenUsage(data.tokenUsage);
                } else {
                  setErrorMessage(`Aviso de IA: ${data.error || 'Error al generar biografía'}`);
                }
              } catch (e: any) {
                console.error(e);
                setErrorMessage(`Error de conexión: ${e?.message}`);
              } finally {
                setIsAiLoading(false);
              }
            }}
            disabled={isAiLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sand-soft text-xs font-semibold hover:bg-[#e6cca0]/20 transition-colors disabled:opacity-50"
          >
            {isAiLoading
              ? <span className="w-3.5 h-3.5 border border-[#e6cca0] border-t-transparent rounded-full animate-spin" />
              : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isAiLoading ? 'Generando...' : 'Autocompletar Bio con IA'}</span>
          </button>

          <button
            type="submit"
            disabled={isSaved || isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors disabled:opacity-50"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Guardando en DB...' : (editId ? 'Actualizar Artista' : 'Guardar Artista')}</span>
          </button>
        </div>
      </div>

      {/* AI Token Usage — shown after a bio is generated */}
      {aiTokenUsage && (
        <AITokenBadge
          usage={aiTokenUsage}
          model={aiModelName}
          action="Biograf\u00eda"
        />
      )}

      {/* 1. Datos Generales */}
      <div className="natural-card p-5 sm:p-6 rounded-2xl space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
          <Music className="w-3.5 h-3.5" /> 1. Datos de Identidad
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Nombre Artístico / Banda *</label>
            <input
              type="text"
              required
              placeholder="Ej: Serenata Gaucha"
              value={formData.stageName}
              onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Nombre Real / Integrantes</label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez, María Gómez..."
              value={formData.realName}
              onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>
        </div>

        {/* Géneros */}
        <div>
          <label className="text-[11px] text-[#aba79e] font-semibold block mb-1.5">Géneros Musicales *</label>
          <div className="flex flex-wrap gap-1.5">
            {genresList.map((genre) => {
              const selected = formData.genres.includes(genre);
              return (
                <button
                  type="button"
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-[#e6cca0] text-[#151618] font-bold'
                      : 'bg-[#18191e] text-[#aba79e] hover:bg-[#252730] border border-[#2e3039]'
                  }`}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </div>

        {/* Destacados */}
        <div className="flex flex-wrap gap-4 pt-1 border-t border-[#2a2c35] text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-[#aba79e] hover:text-[#f3f1ec]">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="rounded accent-[#d97d64]"
            />
            <span>Marcar como Artista Destacado</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-[#aba79e] hover:text-[#f3f1ec]">
            <input
              type="checkbox"
              checked={formData.featuredOfWeek}
              onChange={(e) => setFormData({ ...formData, featuredOfWeek: e.target.checked })}
              className="rounded accent-[#d97d64]"
            />
            <span>Artista de la Semana (Home Hero)</span>
          </label>
        </div>

        {/* Ubicación */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Ciudad *</label>
            <input
              type="text"
              required
              placeholder="Ej: Cosquín"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Provincia *</label>
            <input
              type="text"
              required
              placeholder="Ej: Córdoba"
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">País</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>
        </div>
      </div>

      {/* 2. Biografía y Reseña */}
      <div className="natural-card p-5 sm:p-6 rounded-2xl space-y-3.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] block">
          2. Reseña & Biografía
        </h2>

        <div>
          <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
            Resumen Corto (para portada y cards) *
          </label>
          <textarea
            rows={2}
            required
            placeholder="Breve descripción del estilo y propuesta..."
            value={formData.shortBio}
            onChange={(e) => setFormData({ ...formData, shortBio: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
          />
        </div>

        <div>
          <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
            Biografía Completa / Trayectoria *
          </label>
          <textarea
            rows={4}
            required
            placeholder="Historia de la banda, grabaciones, influencias y conceptos..."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
          />
        </div>

        <div>
          <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
            Frase / Cita Destacada
          </label>
          <input
            type="text"
            placeholder='"No venimos a romper la tradición, venimos a regarla con agua nueva."'
            value={formData.quotes}
            onChange={(e) => setFormData({ ...formData, quotes: e.target.value })}
            className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64] italic"
          />
        </div>
      </div>

      {/* 3. Fotos & Multimedia */}
      <div className="natural-card p-5 sm:p-6 rounded-2xl space-y-5">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
            <ImageIcon className="w-3.5 h-3.5" /> 3. Imágenes del Artista & Galería Fotográfica
          </h2>
          <p className="text-[11px] text-[#8c887f] mt-0.5">
            Podés subir fotos directamente desde tu computadora/celular a PocketBase o pegar un enlace externo.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUploadField
            label="Foto Principal / Retrato *"
            required
            value={formData.photoUrl}
            onChange={(url) => setFormData({ ...formData, photoUrl: url })}
            collectionName="media"
            aspectRatio="square"
            helperText="Formato cuadrado o vertical recomendado (JPG, PNG, WebP)"
          />

          <ImageUploadField
            label="Banner de Perfil / Portada"
            value={formData.bannerUrl}
            onChange={(url) => setFormData({ ...formData, bannerUrl: url })}
            collectionName="media"
            aspectRatio="banner"
            helperText="Formato horizontal panorámico para la cabecera"
          />
        </div>

        {/* Galería Fotográfica Múltiple */}
        <div className="pt-4 border-t border-[#2d2f38] space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-[#f3f1ec]">
                Galería de Fotos en Vivo & Backstage ({formData.gallery.length})
              </h3>
              <p className="text-[11px] text-[#8c887f]">
                Estas imágenes aparecerán en la pestaña "Biografía & Reseña" del perfil del artista.
              </p>
            </div>
          </div>

          {/* Grid de fotos cargadas en la galería */}
          {formData.gallery.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {formData.gallery.map((photo, idx) => (
                <div
                  key={idx}
                  className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#31333d] group"
                >
                  <img
                    src={photo}
                    alt={`Galería ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemoveGalleryPhoto(idx)}
                      className="p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                      title="Eliminar de la galería"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-[#e6cca0] font-mono">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Carga de nueva foto a la galería */}
          <div className="p-4 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-3">
            <span className="text-[11px] font-semibold text-[#e6cca0] block">
              + Agregar foto a la galería
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-8">
                <ImageUploadField
                  label="Subir Archivo o Tomar Foto"
                  value={galleryUploadUrl}
                  onChange={(url) => {
                    if (url) {
                      handleAddGalleryPhoto(url);
                    }
                  }}
                  collectionName="media"
                  aspectRatio="video"
                  helperText="Al seleccionar y subir el archivo se agregará automáticamente a la galería"
                />
              </div>

              <div className="sm:col-span-4 space-y-1">
                <label className="text-[11px] text-[#aba79e] font-semibold block">O pegar enlace web</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={manualGalleryUrl}
                    onChange={(e) => setManualGalleryUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGalleryPhoto(manualGalleryUrl);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#202228] border border-[#31333d] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddGalleryPhoto(manualGalleryUrl)}
                    disabled={!manualGalleryUrl.trim()}
                    className="px-3 py-1.5 rounded-lg bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Redes Sociales */}
      <div className="natural-card p-5 sm:p-6 rounded-2xl space-y-3.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
          <LinkIcon className="w-3.5 h-3.5" /> 4. Enlaces & Redes Sociales (solo se mostrarán las que tengan URL)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Spotify URL</label>
            <input
              type="text"
              placeholder="https://open.spotify.com/artist/..."
              value={formData.spotify}
              onChange={(e) => setFormData({ ...formData, spotify: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">YouTube URL</label>
            <input
              type="text"
              placeholder="https://youtube.com/@..."
              value={formData.youtube}
              onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Instagram URL</label>
            <input
              type="text"
              placeholder="https://instagram.com/..."
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>
          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">TikTok URL</label>
            <input
              type="text"
              placeholder="https://tiktok.com/@..."
              value={formData.tiktok}
              onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>
        </div>
      </div>

      {/* 5. Agenda & Próximos Shows */}
      <div className="natural-card p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#2d2f38]">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> 5. Agenda de Shows & Conciertos ({formData.agenda.length})
            </h2>
            <p className="text-[11px] text-[#8c887f]">Cargá las fechas en vivo del artista para que aparezcan en su perfil público</p>
          </div>

          {!showEventForm && (
            <button
              type="button"
              onClick={() => {
                setNewEvent((prev) => ({
                  ...prev,
                  city: formData.city || prev.city,
                  province: formData.province || prev.province,
                }));
                setShowEventForm(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-soft text-xs font-semibold hover:bg-[#e6cca0]/20 text-[#e6cca0] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Nueva Fecha</span>
            </button>
          )}
        </div>

        {/* Formulario desplegable para agregar fecha */}
        {showEventForm && (
          <div className="p-4 rounded-xl bg-[#1e2027] border border-[#353846] space-y-3.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-1 border-b border-[#2e303c]">
              <h4 className="text-xs font-bold text-[#f3f1ec]">Cargar Fecha de Concierto</h4>
              <button
                type="button"
                onClick={() => setShowEventForm(false)}
                className="text-[11px] text-[#8c887f] hover:text-[#f3f1ec]"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Título del Show / Festival *</label>
                <input
                  type="text"
                  placeholder="Ej: Presentación de Álbum / Noche de Peña"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Fecha & Hora *</label>
                <input
                  type="text"
                  placeholder="Ej: 15 de Septiembre - 21:30 hs"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Lugar / Sala / Venue *</label>
                <input
                  type="text"
                  placeholder="Ej: Teatro Plaza / Club Social"
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Ciudad</label>
                <input
                  type="text"
                  placeholder={formData.city || "Ciudad"}
                  value={newEvent.city}
                  onChange={(e) => setNewEvent({ ...newEvent, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Tipo de Evento</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                >
                  <option value="recital">Recital / Concierto</option>
                  <option value="festival">Festival</option>
                  <option value="pena">Peña Folklórica</option>
                  <option value="acustico">Acústico Íntimo</option>
                  <option value="feria">Feria / Espacio Abierto</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Entrada / Valor</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-[#aba79e] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newEvent.isFree}
                      onChange={(e) => setNewEvent({ ...newEvent, isFree: e.target.checked })}
                      className="rounded accent-[#d97d64]"
                    />
                    <span>Entrada Libre</span>
                  </label>
                  {!newEvent.isFree && (
                    <input
                      type="text"
                      placeholder="Ej: $8.000"
                      value={newEvent.ticketPrice}
                      onChange={(e) => setNewEvent({ ...newEvent, ticketPrice: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Link a Entradas / Boletería (Opcional)</label>
                <input
                  type="text"
                  placeholder="https://passline.com/..."
                  value={newEvent.ticketUrl}
                  onChange={(e) => setNewEvent({ ...newEvent, ticketUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddEvent}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#e6cca0] hover:bg-[#d4b785] text-[#151618] font-bold text-xs transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar a la Agenda del Artista</span>
              </button>
            </div>
          </div>
        )}

        {/* Lista de shows cargados */}
        {formData.agenda.length > 0 ? (
          <div className="space-y-2.5">
            {formData.agenda.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-xl bg-[#18191e] border border-[#2c2e38] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-[#24252c] text-[#e6cca0]">
                      {ev.type}
                    </span>
                    <span className="text-xs font-bold text-[#f3f1ec]">{ev.title}</span>
                  </div>
                  <p className="text-xs text-[#aba79e] flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[#d97d64]" />
                    <span>{ev.venue} — {ev.city}, {ev.province}</span>
                  </p>
                  <p className="text-[11px] text-[#e6cca0] flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{ev.date}</span>
                    <span className="text-[#8c887f]">({ev.isFree ? 'Entrada Libre' : ev.ticketPrice || 'En boletería'})</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {ev.ticketUrl && (
                    <a
                      href={ev.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#e6cca0] text-xs flex items-center gap-1"
                      title="Probar link a tickets"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveEvent(ev.id)}
                    className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#c0909b] hover:text-[#e07a8b] transition-colors"
                    title="Eliminar fecha de show"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !showEventForm && (
            <div className="p-4 rounded-xl bg-[#18191e]/50 border border-dashed border-[#2d303b] text-center">
              <p className="text-xs text-[#8c887f]">No hay fechas en vivo cargadas para este artista.</p>
              <button
                type="button"
                onClick={() => setShowEventForm(true)}
                className="mt-1.5 text-xs font-semibold text-[#d97d64] hover:underline"
              >
                + Cargar el primer show
              </button>
            </div>
          )
        )}
      </div>

      {/* 6. Discografía & Lanzamientos */}
      <div className="natural-card p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#2d2f38]">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
              <Disc3 className="w-3.5 h-3.5" /> 6. Discografía & Lanzamientos ({formData.discography.length})
            </h2>
            <p className="text-[11px] text-[#8c887f]">
              Álbumes, EPs, sencillos y producciones discográficas del artista
            </p>
          </div>

          {!showReleaseForm && (
            <button
              type="button"
              onClick={() => setShowReleaseForm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-soft text-xs font-semibold hover:bg-[#e6cca0]/20 text-[#e6cca0] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Lanzamiento</span>
            </button>
          )}
        </div>

        {/* Formulario para nuevo lanzamiento */}
        {showReleaseForm && (
          <div className="p-4 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-3.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-[#2d2f38] pb-2">
              <span className="text-xs font-bold text-[#f3f1ec]">+ Cargar Nuevo Lanzamiento</span>
              <button
                type="button"
                onClick={() => setShowReleaseForm(false)}
                className="text-xs text-[#8c887f] hover:text-[#f3f1ec]"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Título del Álbum / Single *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: El Viento de la Quebrada"
                  value={newRelease.title}
                  onChange={(e) => setNewRelease({ ...newRelease, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#202228] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Tipo de Formato</label>
                <select
                  value={newRelease.type}
                  onChange={(e) => setNewRelease({ ...newRelease, type: e.target.value as DiscographyType })}
                  className="w-full px-3 py-2 rounded-xl bg-[#202228] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                >
                  <option value="album">Álbum de Estudio</option>
                  <option value="single">Single / Sencillo</option>
                  <option value="ep">EP</option>
                  <option value="live_album">Álbum en Vivo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Año de Lanzamiento</label>
                <input
                  type="number"
                  placeholder="2026"
                  value={newRelease.year}
                  onChange={(e) => setNewRelease({ ...newRelease, year: parseInt(e.target.value, 10) || new Date().getFullYear() })}
                  className="w-full px-3 py-2 rounded-xl bg-[#202228] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Cantidad de Canciones</label>
                <input
                  type="number"
                  placeholder="Ej: 10"
                  value={newRelease.tracksCount}
                  onChange={(e) => setNewRelease({ ...newRelease, tracksCount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#202228] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Link de Spotify (Opcional)</label>
                <input
                  type="text"
                  placeholder="https://open.spotify.com/album/..."
                  value={newRelease.spotifyUrl}
                  onChange={(e) => setNewRelease({ ...newRelease, spotifyUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#202228] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>
            </div>

            <div>
              <ImageUploadField
                label="Portada del Disco / Arte de Tapa"
                value={newRelease.coverUrl}
                onChange={(url) => setNewRelease({ ...newRelease, coverUrl: url })}
                collectionName="media"
                aspectRatio="square"
                helperText="Formato cuadrado 1:1 recomendado (JPG, PNG, WebP)"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddRelease}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#e6cca0] hover:bg-[#d4b785] text-[#151618] font-bold text-xs transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar a la Discografía</span>
              </button>
            </div>
          </div>
        )}

        {/* Lista de lanzamientos cargados */}
        {formData.discography.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {formData.discography.map((disc) => {
              const typeLabels: Record<string, string> = {
                single: 'Single',
                ep: 'EP',
                album: 'Álbum',
                live_album: 'En Vivo',
              };
              return (
                <div
                  key={disc.id}
                  className="p-3 rounded-xl bg-[#18191e] border border-[#2c2e38] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-black border border-[#31333d] flex-shrink-0">
                      {disc.coverUrl ? (
                        <img src={disc.coverUrl} alt={disc.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#d97d64]">
                          <Disc3 className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[#24252c] text-[#e6cca0]">
                        {typeLabels[disc.type] || disc.type} • {disc.year}
                      </span>
                      <h4 className="text-xs font-bold text-[#f3f1ec] line-clamp-1 mt-0.5">{disc.title}</h4>
                      {disc.tracksCount && (
                        <span className="text-[10px] text-[#8c887f]">{disc.tracksCount} canciones</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveRelease(disc.id)}
                    className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#c0909b] hover:text-[#e07a8b] transition-colors cursor-pointer"
                    title="Eliminar lanzamiento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          !showReleaseForm && (
            <div className="p-4 rounded-xl bg-[#18191e]/50 border border-dashed border-[#2d303b] text-center">
              <p className="text-xs text-[#8c887f]">No hay lanzamientos discográficos cargados aún.</p>
              <button
                type="button"
                onClick={() => setShowReleaseForm(true)}
                className="mt-1.5 text-xs font-semibold text-[#d97d64] hover:underline cursor-pointer"
              >
                + Cargar el primer álbum o sencillo
              </button>
            </div>
          )
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isSaved || isLoading}
          className="px-6 py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSaved ? 'Guardando en DB...' : (editId ? 'Actualizar Artista' : 'Guardar y Publicar Artista')}
        </button>
      </div>
    </form>
  );
};
