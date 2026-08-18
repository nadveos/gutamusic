'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GenreType } from '../../../../lib/types';
import { MusicDataService } from '../../../../lib/api';
import { ArrowLeft, Save, Sparkles, Image as ImageIcon, Link as LinkIcon, Music, MapPin, Check } from 'lucide-react';

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
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <Link
        href="/admin/artistas"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-amber-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la lista de artistas</span>
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Alta / Edición de Artista
          </h1>
          <p className="text-xs text-gray-400">Completá la información del perfil del artista o banda</p>
        </div>

        <button
          type="submit"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
        >
          {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Guardando...' : 'Guardar Artista'}</span>
        </button>
      </div>

      {/* 1. Datos Generales */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Music className="w-4 h-4" /> Datos de Identidad
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">
              Nombre Artístico / Banda *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Serenata Gaucha"
              value={formData.stageName}
              onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">
              Nombre Real / Subtítulo
            </label>
            <input
              type="text"
              placeholder="Ej: Ensamble Criollo Contemporáneo"
              value={formData.realName}
              onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Géneros Multi-select */}
        <div className="space-y-2">
          <label className="text-xs text-gray-300 font-semibold block">
            Géneros Musicales *
          </label>
          <div className="flex flex-wrap gap-2">
            {genresList.map((genre) => {
              const isSelected = formData.genres.includes(genre);
              return (
                <button
                  type="button"
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {genre} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ubicación */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">Ciudad *</label>
            <input
              type="text"
              required
              placeholder="Ej: Cosquín"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">Provincia *</label>
            <input
              type="text"
              required
              placeholder="Ej: Córdoba"
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">País</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* 2. Biografía y Reseña */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Reseña & Biografía
        </h2>

        <div>
          <label className="text-xs text-gray-300 font-semibold block mb-1.5">
            Resumen Corto (aparece en portada y cards) *
          </label>
          <textarea
            rows={2}
            required
            placeholder="Breve descripción del estilo y propuesta..."
            value={formData.shortBio}
            onChange={(e) => setFormData({ ...formData, shortBio: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="text-xs text-gray-300 font-semibold block mb-1.5">
            Biografía Completa / Trayectoria *
          </label>
          <textarea
            rows={5}
            required
            placeholder="Historia de la banda, grabaciones, influencias y conceptos..."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="text-xs text-gray-300 font-semibold block mb-1.5">
            Frase / Cita Destacada
          </label>
          <input
            type="text"
            placeholder='"No venimos a romper la tradición, venimos a regarla con agua nueva."'
            value={formData.quotes}
            onChange={(e) => setFormData({ ...formData, quotes: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400 italic"
          />
        </div>
      </div>

      {/* 3. Fotos & Multimedia URLs */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" /> Imágenes del Artista
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">Foto Principal (URL / Cloudinary) *</label>
            <input
              type="text"
              required
              value={formData.photoUrl}
              onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">Banner de Perfil (URL)</label>
            <input
              type="text"
              value={formData.bannerUrl}
              onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* 4. Redes Sociales */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <LinkIcon className="w-4 h-4" /> Enlaces & Redes Sociales
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">Spotify URL</label>
            <input
              type="text"
              placeholder="https://open.spotify.com/artist/..."
              value={formData.spotify}
              onChange={(e) => setFormData({ ...formData, spotify: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">YouTube URL</label>
            <input
              type="text"
              placeholder="https://youtube.com/@..."
              value={formData.youtube}
              onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">Instagram URL</label>
            <input
              type="text"
              placeholder="https://instagram.com/..."
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">TikTok URL</label>
            <input
              type="text"
              placeholder="https://tiktok.com/@..."
              value={formData.tiktok}
              onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm shadow-xl shadow-amber-500/20 transition-all"
        >
          Guardar y Publicar Artista
        </button>
      </div>
    </form>
  );
};
