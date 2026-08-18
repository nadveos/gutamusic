'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GenreType } from '../../../../lib/types';
import { MusicDataService } from '../../../../lib/api';
import { ArrowLeft, Save, Image as ImageIcon, Link as LinkIcon, Music, Check, Sparkles } from 'lucide-react';

export const ArtistFormClient: React.FC = () => {
  const router = useRouter();
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
  });

  const [isSaved, setIsSaved] = useState(false);

  const toggleGenre = (genre: GenreType) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      alert(`¡Artista "${formData.stageName}" registrado exitosamente en el sistema!`);
      router.push('/admin/artistas');
    }, 800);
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#f3f1ec]">
            Alta / Edición de Artista
          </h1>
          <p className="text-xs text-[#8c887f]">Completá la información del perfil del artista o banda</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              if (!formData.stageName) {
                alert('Por favor ingresá primero el nombre del artista para que la IA pueda redactar la biografía.');
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaved ? 'Guardando...' : 'Guardar Artista'}</span>
          </button>
        </div>
      </div>

      {/* 1. Datos Generales */}
      <div className="natural-card p-5 sm:p-6 rounded-2xl space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
          <Music className="w-3.5 h-3.5" /> Datos de Identidad
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
              Nombre Artístico / Banda *
            </label>
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
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
              Nombre Real / Subtítulo
            </label>
            <input
              type="text"
              placeholder="Ej: Ensamble Criollo Contemporáneo"
              value={formData.realName}
              onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>
        </div>

        {/* Géneros Multi-select */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-[#aba79e] font-semibold block">
            Géneros Musicales *
          </label>
          <div className="flex flex-wrap gap-1.5">
            {genresList.map((genre) => {
              const isSelected = formData.genres.includes(genre);
              return (
                <button
                  type="button"
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#d97d64] text-[#151618] font-bold'
                      : 'bg-[#24252c] text-[#aba79e] hover:bg-[#2e303b] border border-[#31333d]'
                  }`}
                >
                  {genre} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
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
          Reseña & Biografía
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
          <ImageIcon className="w-3.5 h-3.5" /> Imágenes del Artista
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Foto Principal (URL / Cloudinary) *</label>
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
          <LinkIcon className="w-3.5 h-3.5" /> Enlaces & Redes Sociales
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

      {/* Submit Button */}
      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors"
        >
          Guardar y Publicar Artista
        </button>
      </div>
    </form>
  );
};
