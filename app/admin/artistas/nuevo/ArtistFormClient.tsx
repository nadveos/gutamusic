'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GenreType, AgendaEvent } from '../../../../lib/types';
import { MusicDataService } from '../../../../lib/api';
import { pb } from '../../../../lib/pocketbase';
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
} from 'lucide-react';

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
    photoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=1600&auto=format&fit=crop',
    quotes: '',
    featured: false,
    featuredOfWeek: false,
    spotify: '',
    youtube: '',
    instagram: '',
    tiktok: '',
    agenda: [] as AgendaEvent[],
  });

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

  // Load existing artist if in edit mode
  useEffect(() => {
    if (!editId) return;

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
            photoUrl: record.photoUrl || (record.photo ? pb.files.getUrl(record, record.photo) : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop'),
            bannerUrl: record.bannerUrl || '',
            quotes: record.quotes || '',
            featured: Boolean(record.featured),
            featuredOfWeek: Boolean(record.featuredOfWeek),
            spotify: record.socials?.spotify || '',
            youtube: record.socials?.youtube || '',
            instagram: record.socials?.instagram || '',
            tiktok: record.socials?.tiktok || '',
            agenda: Array.isArray(record.agenda) ? record.agenda : [],
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
      photoUrl: formData.photoUrl.trim(),
      bannerUrl: formData.bannerUrl.trim(),
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
      setErrorMessage(`Error al guardar en PocketBase: ${err?.message || 'Verificá tus permisos'}`);
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
                const data = await res.json();
                if (data.success) {
                  setFormData((prev) => ({
                    ...prev,
                    shortBio: data.data.shortBio,
                    bio: data.data.fullBio,
                    quotes: data.data.quotes,
                  }));
                }
              } catch (e) {
                console.error(e);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sand-soft text-xs font-semibold hover:bg-[#e6cca0]/20 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autocompletar Bio con IA</span>
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

      {/* 3. Fotos & Multimedia URLs */}
      <div className="natural-card p-5 sm:p-6 rounded-2xl space-y-3.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5" /> 3. Imágenes del Artista
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Foto Principal (URL / Cloudinary / Facebook) *</label>
            <input
              type="text"
              required
              value={formData.photoUrl}
              onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs font-mono focus:outline-none focus:border-[#d97d64]"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Banner de Perfil (URL)</label>
            <input
              type="text"
              value={formData.bannerUrl}
              onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs font-mono focus:outline-none focus:border-[#d97d64]"
            />
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

      {/* Submit Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isSaved || isLoading}
          className="px-6 py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors disabled:opacity-50"
        >
          {isSaved ? 'Guardando en DB...' : (editId ? 'Actualizar Artista' : 'Guardar y Publicar Artista')}
        </button>
      </div>
    </form>
  );
};
