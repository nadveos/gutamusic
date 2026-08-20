'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GenreType } from '../../lib/types';
import { pb } from '../../lib/pocketbase';
import { uploadImageToPocketBase } from '../../lib/uploadFile';
import {
  Mic2,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Music2,
  MapPin,
  Mail,
  Phone,
  Link as LinkIcon,
  Loader2,
  HeartHandshake,
  Radio,
  Calendar,
} from 'lucide-react';

const GENRES: GenreType[] = [
  'Folklore',
  'Rock',
  'Hip Hop',
  'Música Urbana',
  'Tango',
  'Música Popular',
  'Indie',
  'Fusión Latinoamericana',
  'Cumbia / Cuarteto',
  'Jazz / Instrumental',
];

export const ContactFormClient: React.FC = () => {
  const [formData, setFormData] = useState({
    stageName: '',
    contactName: '',
    email: '',
    phone: '',
    genres: [] as GenreType[],
    city: '',
    province: '',
    country: 'Argentina',
    bio: '',
    spotify: '',
    youtube: '',
    instagram: '',
    tiktok: '',
    photoUrl: '',
    message: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleGenreToggle = (genre: GenreType) => {
    setFormData((prev) => {
      const exists = prev.genres.includes(genre);
      return {
        ...prev,
        genres: exists ? prev.genres.filter((g) => g !== genre) : [...prev.genres, genre],
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setFilePreview(preview);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    if (formData.genres.length === 0) {
      setErrorMessage('Por favor seleccioná al menos un género musical.');
      setIsSubmitting(false);
      return;
    }

    try {
      let finalPhotoUrl = formData.photoUrl;

      // Upload image if a local file was chosen
      if (selectedFile) {
        const uploadRes = await uploadImageToPocketBase(selectedFile, 'applications');
        if (uploadRes.success && uploadRes.url) {
          finalPhotoUrl = uploadRes.url;
        }
      }

      const applicationPayload = {
        stageName: formData.stageName.trim(),
        contactName: formData.contactName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        genres: formData.genres,
        city: formData.city.trim(),
        province: formData.province.trim(),
        country: formData.country.trim(),
        bio: formData.bio.trim(),
        socials: {
          spotify: formData.spotify.trim(),
          youtube: formData.youtube.trim(),
          instagram: formData.instagram.trim(),
          tiktok: formData.tiktok.trim(),
        },
        photoUrl: finalPhotoUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
        message: formData.message.trim(),
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      // Try creating in PocketBase collection 'applications'
      try {
        await pb.collection('applications').create(applicationPayload);
      } catch (pbErr) {
        console.warn('PocketBase applications collection not available, saving to local application store:', pbErr);
      }

      // Also persist to localStorage for offline admin review demo
      const existing = JSON.parse(localStorage.getItem('guta_pending_applications') || '[]');
      existing.unshift({
        id: 'app-' + Date.now(),
        ...applicationPayload,
      });
      localStorage.setItem('guta_pending_applications', JSON.stringify(existing));

      setIsSuccess(true);
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setErrorMessage(err?.message || 'Ocurrió un error al enviar tu postulación. Por favor intentá nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#93a887]/20 border border-[#93a887]/30 text-[#93a887] flex items-center justify-center mx-auto animate-in zoom-in-75">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-[#e6cca0]">¡Postulación Recibida!</span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#f3f1ec]">
            Gracias por sumarte, {formData.stageName}
          </h1>
          <p className="text-sm text-[#aba79e] leading-relaxed max-w-lg mx-auto">
            Hemos recibido el material de tu proyecto musical. Nuestro equipo editorial y de curaduría artística revisará tu propuesta para incorporar tu perfil a la plataforma, coordinar notas exclusivas o sumar tus fechas a la cartelera federal.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#1e1f24] border border-[#2d2f38] text-xs text-[#aba79e] max-w-md mx-auto space-y-1">
          <p className="text-[#f3f1ec] font-semibold">¿Qué sigue ahora?</p>
          <p>Te responderemos al correo <strong className="text-[#e6cca0]">{formData.email}</strong> ante cualquier novedad o coordinación de acústicos en vivo.</p>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] text-xs font-bold transition-colors"
          >
            Volver al Inicio
          </Link>
          <Link
            href="/artistas"
            className="px-5 py-2.5 rounded-xl bg-[#222329] hover:bg-[#282a32] text-[#aba79e] text-xs font-semibold border border-[#31333d] transition-colors"
          >
            Explorar Otros Artistas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header Banner */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d97d64]/10 border border-[#d97d64]/20 text-[#d97d64] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Convocatoria Abierta & Permanente</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#f3f1ec] tracking-tight">
          Sumá tu Banda a <span className="text-[#e6cca0]">GUTA MÚSICA</span>
        </h1>
        <p className="text-sm text-[#aba79e] max-w-2xl mx-auto leading-relaxed">
          GUTA es una plataforma autogestiva y federal dedicada a visibilizar y conectar a solistas, ensambles y bandas emergentes de toda la Argentina. Si hacés música propia, postulate gratis para formar parte de nuestro catálogo, notas editoriales y cartelera cultural.
        </p>
      </div>

      {/* Feature Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="natural-card p-4 rounded-xl flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#d97d64]/15 text-[#d97d64]">
            <Mic2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#f3f1ec]">Perfil Artístico Propio</h2>
            <p className="text-[11px] text-[#8c887f]">Biografía, discografía, videoteca y enlaces directos a tus plataformas.</p>
          </div>
        </div>

        <div className="natural-card p-4 rounded-xl flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#93a887]/15 text-[#93a887]">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#f3f1ec]">Entrevistas & Lives</h2>
            <p className="text-[11px] text-[#8c887f]">Coberturas periodísticas, sesiones en vivo y crónicas de lanzamientos.</p>
          </div>
        </div>

        <div className="natural-card p-4 rounded-xl flex items-start gap-3">
          <div className="p-2 rounded-lg bg-[#e6cca0]/15 text-[#e6cca0]">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-[#f3f1ec]">Agenda de Shows</h2>
            <p className="text-[11px] text-[#8c887f]">Difusión de tus fechas, peñas, festivales y recitales en todo el país.</p>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-4 rounded-xl bg-[#c0909b]/15 border border-[#c0909b]/30 text-[#e6a8b4] text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Datos del Artista */}
        <div className="natural-card p-5 sm:p-7 rounded-2xl space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
            <Music2 className="w-3.5 h-3.5" /> 1. Identidad del Artista / Banda
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs text-[#aba79e] font-semibold block mb-1">
                Nombre Artístico / Proyecto *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Serenata Gaucha, Valeria Soler, Kallpa 380..."
                value={formData.stageName}
                onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div>
              <label className="text-xs text-[#aba79e] font-semibold block mb-1">
                Ciudad / Localidad *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Cosquín, Rosario, San Telmo, Salta..."
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div>
              <label className="text-xs text-[#aba79e] font-semibold block mb-1">
                Provincia *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Córdoba, Santa Fe, Jujuy, CABA..."
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            {/* Genre Selectors */}
            <div className="sm:col-span-2 space-y-2">
              <label className="text-xs text-[#aba79e] font-semibold block">
                Géneros & Estilos Musicales (seleccioná uno o varios) *
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((genre) => {
                  const isSelected = formData.genres.includes(genre);
                  return (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => handleGenreToggle(genre)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#d97d64] text-[#151618] border-[#d97d64] shadow-md shadow-[#d97d64]/20'
                          : 'bg-[#18191e] text-[#aba79e] border-[#2e3039] hover:border-[#424554] hover:text-[#f3f1ec]'
                      }`}
                    >
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-[#aba79e] font-semibold block mb-1">
                Reseña Biográfica / Propuesta Artística *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Contanos brevemente sobre tus canciones, integrantes, influencias, lanzamientos recientes y la historia de tu proyecto..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs leading-relaxed focus:outline-none focus:border-[#d97d64]"
              />
            </div>
          </div>
        </div>

        {/* 2. Fotos & Multimedia */}
        <div className="natural-card p-5 sm:p-7 rounded-2xl space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
            <UploadCloud className="w-3.5 h-3.5" /> 2. Foto del Artista o Banda
          </h2>

          <div className="space-y-3">
            <label className="text-xs text-[#aba79e] font-semibold block">
              Subir Foto Oficial / Flyer de Prensa (desde tu celular o PC)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <label className="flex-1 w-full flex items-center justify-center gap-2.5 p-4 rounded-xl border border-dashed border-[#3c3f4e] hover:border-[#e6cca0] bg-[#18191e] hover:bg-[#202228] cursor-pointer transition-colors text-xs font-semibold text-[#f3f1ec]">
                <UploadCloud className="w-5 h-5 text-[#e6cca0]" />
                <span>
                  {selectedFile ? selectedFile.name : 'Elegir archivo de imagen (JPG, PNG)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {filePreview && (
                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#2e3039] flex-shrink-0">
                  <Image src={filePreview} alt="Preview" fill className="object-cover" />
                </div>
              )}
            </div>

            <div className="pt-2">
              <label className="text-[11px] text-[#78746c] block mb-1">
                O ingresá una URL directa de imagen si ya la tenés online:
              </label>
              <input
                type="text"
                placeholder="https://..."
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs font-mono focus:outline-none focus:border-[#d97d64]"
              />
            </div>
          </div>
        </div>

        {/* 3. Enlaces & Redes */}
        <div className="natural-card p-5 sm:p-7 rounded-2xl space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
            <LinkIcon className="w-3.5 h-3.5" /> 3. Dónde Escucharte (Enlaces)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#aba79e] font-semibold block mb-1">Spotify URL</label>
              <input
                type="text"
                placeholder="https://open.spotify.com/artist/..."
                value={formData.spotify}
                onChange={(e) => setFormData({ ...formData, spotify: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div>
              <label className="text-xs text-[#aba79e] font-semibold block mb-1">YouTube URL (Canal o Videoclip)</label>
              <input
                type="text"
                placeholder="https://youtube.com/@..."
                value={formData.youtube}
                onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div>
              <label className="text-xs text-[#aba79e] font-semibold block mb-1">Instagram URL</label>
              <input
                type="text"
                placeholder="https://instagram.com/..."
                value={formData.instagram}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div>
              <label className="text-xs text-[#aba79e] font-semibold block mb-1">TikTok / Otras Redes</label>
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

        {/* 4. Datos de Contacto Directo */}
        <div className="natural-card p-5 sm:p-7 rounded-2xl space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
            <HeartHandshake className="w-3.5 h-3.5" /> 4. Contacto del Responsable
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-[#aba79e] font-semibold block mb-1">
                Nombre de Contacto / Manager *
              </label>
              <input
                type="text"
                required
                placeholder="Tu nombre o representante"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div>
              <label className="text-xs text-[#aba79e] font-semibold block mb-1">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                placeholder="banda@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div>
              <label className="text-xs text-[#aba79e] font-semibold block mb-1">
                WhatsApp / Teléfono
              </label>
              <input
                type="tel"
                placeholder="+54 9 11 ..."
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-xs text-[#aba79e] font-semibold block mb-1">
                Mensaje adicional para la redacción de GUTA (opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Contanos si tenés próximas fechas, lanzamiento de disco o si te gustaría participar de una sesión acústica..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="text-center pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-sm shadow-xl shadow-[#d97d64]/25 transition-all flex items-center justify-center gap-2.5 mx-auto cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando postulación...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Enviar Postulación a GUTA MÚSICA</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-[#78746c] mt-2.5">
            La postulación y difusión en GUTA es 100% gratuita y comunitaria.
          </p>
        </div>
      </form>
    </div>
  );
};
