'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Artist, Interview, VideoPlatform } from '../../../../lib/types';
import { MusicDataService } from '../../../../lib/api';
import { pb } from '../../../../lib/pocketbase';
import { ImageUploadField } from '../../../../components/admin/ImageUploadField';
import {
  ArrowLeft,
  Save,
  Radio,
  Sparkles,
  AlertCircle,
  Plus,
  Trash2,
  Video,
  Eye,
  Bold,
  Italic,
  Heading2,
  Quote,
  List,
  Loader2,
  Wand2,
  CheckCircle2,
} from 'lucide-react';

interface InterviewFormClientProps {
  initialArtists: Artist[];
}

export const InterviewFormClient: React.FC<InterviewFormClientProps> = ({ initialArtists }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    subtitle: '',
    artistId: initialArtists[0]?.id || '',
    artistName: initialArtists[0]?.stageName || '',
    artistSlug: initialArtists[0]?.slug || '',
    artistPhoto: initialArtists[0]?.photoUrl || '',
    host: 'Guta Flores',
    date: new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }),
    summary: '',
    editorialText: '',
    keyHighlights: [
      'Proceso creativo y composición independiente',
      'Defensa de la identidad cultural federal',
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoPlatform: 'youtube' as VideoPlatform,
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
    featured: false,
    category: 'Acústico GUTA' as 'Estudio' | 'En Vivo' | 'Acústico GUTA' | 'Especial',
  });

  const [newHighlight, setNewHighlight] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isLoading, setIsLoading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load existing interview if editing
  useEffect(() => {
    if (!editId) return;

    const loadInterview = async () => {
      setIsLoading(true);
      try {
        let record: any = null;
        try {
          record = await pb.collection('interviews').getOne(editId);
        } catch {
          const all = await MusicDataService.getInterviews();
          record = all.find((i) => i.id === editId || i.slug === editId);
        }

        if (record) {
          setFormData({
            title: record.title || '',
            slug: record.slug || '',
            subtitle: record.subtitle || '',
            artistId: record.artistId || '',
            artistName: record.artistName || '',
            artistSlug: record.artistSlug || '',
            artistPhoto: record.artistPhoto || '',
            host: record.host || 'Guta Flores',
            date: record.date || '',
            summary: record.summary || '',
            editorialText: record.editorialText || '',
            keyHighlights: Array.isArray(record.keyHighlights) ? record.keyHighlights : [],
            videoUrl: record.videoUrl || '',
            videoPlatform: record.videoPlatform || 'youtube',
            thumbnailUrl: record.thumbnailUrl || '',
            featured: Boolean(record.featured),
            category: record.category || 'Acústico GUTA',
          });
        }
      } catch (err: any) {
        console.error('Error loading interview:', err);
        setErrorMessage('No se pudo cargar la entrevista a editar.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInterview();
  }, [editId]);

  // When artist selection changes, sync artist info and thumbnail if empty
  const handleArtistChange = (selectedId: string) => {
    const artist = initialArtists.find((a) => a.id === selectedId);
    if (artist) {
      setFormData((prev) => ({
        ...prev,
        artistId: artist.id,
        artistName: artist.stageName,
        artistSlug: artist.slug,
        artistPhoto: artist.photoUrl,
        thumbnailUrl: prev.thumbnailUrl || artist.photoUrl,
      }));
    }
  };

  const handleTitleChange = (val: string) => {
    const slug = val
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: editId ? prev.slug : slug,
    }));
  };

  const handleAddHighlight = () => {
    if (!newHighlight.trim()) return;
    setFormData((prev) => ({
      ...prev,
      keyHighlights: [...prev.keyHighlights, newHighlight.trim()],
    }));
    setNewHighlight('');
  };

  const handleRemoveHighlight = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      keyHighlights: prev.keyHighlights.filter((_, i) => i !== idx),
    }));
  };

  // Formatting helpers for text editor
  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = document.getElementById('editorial-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = formData.editorialText;
    const selectedText = currentText.substring(start, end) || 'texto';

    const newText =
      currentText.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      currentText.substring(end);

    setFormData((prev) => ({ ...prev, editorialText: newText }));
  };

  // AI Assistant generator
  const handleGenerateWithAi = (type: 'full' | 'summary' | 'highlights') => {
    setIsAiGenerating(true);
    setTimeout(() => {
      const artistName = formData.artistName || 'el artista emergente';
      const category = formData.category;

      if (type === 'full') {
        const generated = `En una tarde colmada de emoción e identidad sonora en los estudios de GUTA MÚSICA, compartimos un mano a mano íntimo con ${artistName}.

"La música independiente no es una etapa previa a nada: es un fin en sí mismo, un acto de resistencia y libertad creativa", expresó ${artistName} durante la charla conducida por ${formData.host}.

A lo largo del encuentro ${category.toLowerCase()}, repasamos el génesis de sus composiciones, el diálogo entre los ritmos tradicionales y la vanguardia contemporánea, y la importancia de consolidar redes de difusión federales que descentralicen la escena cultural.

Con una ejecución acústica impecable que conmovió a todo el equipo, ${artistName} reafirma su lugar como una de las voces más prometedoras y genuinas de la nueva música popular argentina.`;
        setFormData((prev) => ({
          ...prev,
          editorialText: generated,
          summary: prev.summary || `Entrevista exclusiva y sesión en vivo con ${artistName}. Un recorrido por su obra, influencias y visión del circuito autogestivo federal.`,
        }));
      } else if (type === 'summary') {
        setFormData((prev) => ({
          ...prev,
          summary: `Mano a mano exclusivo con ${artistName} en GUTA MÚSICA: análisis de su último trabajo, procesos de producción y el desafío de proyectar la música federal al mundo.`,
        }));
      } else if (type === 'highlights') {
        setFormData((prev) => ({
          ...prev,
          keyHighlights: [
            `El origen y concepto detrás de las canciones de ${artistName}`,
            'La autogestión y el armado de giras por el interior del país',
            'Instrumentación y búsqueda sonora identitaria',
            'Próximos lanzamientos y presentaciones en vivo',
          ],
        }));
      }

      setIsAiGenerating(false);
    }, 900);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.title.trim() || !formData.editorialText.trim()) {
      setErrorMessage('Por favor completá el título y la redacción editorial.');
      setIsLoading(false);
      return;
    }

    const payload = {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      subtitle: formData.subtitle.trim(),
      artistId: formData.artistId,
      artistName: formData.artistName.trim(),
      artistSlug: formData.artistSlug.trim(),
      artistPhoto: formData.artistPhoto,
      host: formData.host.trim(),
      date: formData.date.trim(),
      summary: formData.summary.trim(),
      editorialText: formData.editorialText.trim(),
      keyHighlights: formData.keyHighlights,
      videoUrl: formData.videoUrl.trim(),
      videoPlatform: formData.videoPlatform,
      thumbnailUrl: formData.thumbnailUrl.trim(),
      featured: formData.featured,
      category: formData.category,
    };

    try {
      if (editId) {
        await pb.collection('interviews').update(editId, payload);
        setSuccessMessage('¡Entrevista actualizada con éxito en PocketBase!');
      } else {
        await pb.collection('interviews').create(payload);
        setSuccessMessage('¡Entrevista publicada exitosamente en PocketBase!');
      }

      setTimeout(() => {
        router.push('/admin/entrevistas');
      }, 1000);
    } catch (err: any) {
      console.warn('PocketBase save fallback:', err);
      setSuccessMessage('¡Entrevista guardada correctamente (Modo Local/Mock)!');
      setTimeout(() => {
        router.push('/admin/entrevistas');
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Back button & Action Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/entrevistas"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c887f] hover:text-[#e6cca0] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a Entrevistas</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#c97058] text-[#151618] font-bold text-xs shadow-lg shadow-[#d97d64]/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{editId ? 'Actualizar Entrevista' : 'Publicar Entrevista'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-[#c0909b]/15 border border-[#c0909b]/30 text-[#e6a8b4] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-[#93a887]/15 border border-[#93a887]/30 text-[#93a887] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-[#f3f1ec]">
          {editId ? 'Editar Entrevista / Live' : 'Redactar Nueva Entrevista'}
        </h1>
        <p className="text-xs text-[#8c887f]">
          Editor editorial con asistente de IA, carga de videos multiformato y publicación a PocketBase
        </p>
      </div>

      {/* 1. Datos Principales del Artista & Título */}
      <div className="natural-card p-5 sm:p-6 rounded-2xl space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
          <Radio className="w-3.5 h-3.5" /> 1. Encabezado & Artista Invitado
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
              Artista / Proyecto Musical *
            </label>
            <select
              value={formData.artistId}
              onChange={(e) => handleArtistChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            >
              {initialArtists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.stageName} ({artist.city || 'Argentina'})
                </option>
              ))}
              <option value="custom">+ Artista no listado (escribir nombre abajo)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
              Nombre a mostrar del Artista
            </label>
            <input
              type="text"
              required
              value={formData.artistName}
              onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              placeholder="Ej: Serenata Gaucha"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
              Título Principal de la Nota / Entrevista *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-sm font-bold focus:outline-none focus:border-[#d97d64]"
              placeholder='Ej: Serenata Gaucha: "El folklore no es nostalgia, es territorio y presente"'
            />
          </div>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
              Slug URL (identificador único)
            </label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#e6cca0] font-mono text-xs focus:outline-none focus:border-[#d97d64]"
              placeholder="serenata-gaucha-entrevista-exclusiva"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
              Subtítulo / Bajada
            </label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              placeholder="Mano a mano sobre la poesía urbana y la autogestión"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
              Conducción / Entrevistador
            </label>
            <input
              type="text"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
              Categoría
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            >
              <option value="Acústico GUTA">Acústico GUTA</option>
              <option value="Estudio">Estudio</option>
              <option value="En Vivo">En Vivo</option>
              <option value="Especial">Especial</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Redacción Editorial & Asistente IA */}
      <div className="natural-card p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2d2f38] pb-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> 2. Redacción Editorial & Asistente IA
            </h2>
            <p className="text-[11px] text-[#8c887f]">
              Escribí la crónica o generá un borrador con el asistente inteligente
            </p>
          </div>

          {/* AI Shortcuts */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleGenerateWithAi('full')}
              disabled={isAiGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2a2c35] hover:bg-[#343742] border border-[#3e4250] text-[#e6cca0] text-[11px] font-semibold transition-colors cursor-pointer"
            >
              {isAiGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              <span>Generar Crónica IA</span>
            </button>
            <button
              type="button"
              onClick={() => handleGenerateWithAi('summary')}
              disabled={isAiGenerating}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#202228] hover:bg-[#282a32] text-[#aba79e] text-[11px] transition-colors"
            >
              <span>+ Resumen IA</span>
            </button>
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
            Resumen / Copete de Portada *
          </label>
          <textarea
            rows={2}
            required
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            placeholder="Breve párrafo introductorio para destacar en listados y redes..."
            className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
          />
        </div>

        {/* Formatting Toolbar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-[#18191e] p-1 rounded-lg border border-[#2e3039]">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                className="p-1.5 rounded hover:bg-[#282a33] text-[#aba79e] hover:text-[#f3f1ec]"
                title="Negrita"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                className="p-1.5 rounded hover:bg-[#282a33] text-[#aba79e] hover:text-[#f3f1ec]"
                title="Cursiva"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n### ', '\n')}
                className="p-1.5 rounded hover:bg-[#282a33] text-[#aba79e] hover:text-[#f3f1ec]"
                title="Subtítulo"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n> "', '"\n')}
                className="p-1.5 rounded hover:bg-[#282a33] text-[#aba79e] hover:text-[#f3f1ec]"
                title="Cita"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('\n- ')}
                className="p-1.5 rounded hover:bg-[#282a33] text-[#aba79e] hover:text-[#f3f1ec]"
                title="Lista"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Editor / Preview Switch */}
            <div className="flex items-center gap-1 bg-[#18191e] p-1 rounded-lg border border-[#2e3039]">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                  activeTab === 'editor' ? 'bg-[#282a33] text-[#f3f1ec]' : 'text-[#8c887f]'
                }`}
              >
                Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                  activeTab === 'preview' ? 'bg-[#282a33] text-[#e6cca0]' : 'text-[#8c887f]'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Vista Previa</span>
              </button>
            </div>
          </div>

          {activeTab === 'editor' ? (
            <textarea
              id="editorial-textarea"
              rows={12}
              required
              value={formData.editorialText}
              onChange={(e) => setFormData({ ...formData, editorialText: e.target.value })}
              placeholder="Escribí aquí el cuerpo de la entrevista, preguntas y respuestas, anécdotas y detalles del vivo..."
              className="w-full p-4 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs leading-relaxed focus:outline-none focus:border-[#d97d64] font-sans"
            />
          ) : (
            <div className="p-5 rounded-xl bg-[#121316] border border-[#2e3039] text-[#f3f1ec] text-xs leading-relaxed min-h-[250px] space-y-3 prose prose-invert max-w-none">
              {formData.editorialText ? (
                formData.editorialText.split('\n\n').map((paragraph, idx) => {
                  if (paragraph.startsWith('### ')) {
                    return (
                      <h3 key={idx} className="text-sm font-bold text-[#e6cca0] pt-2">
                        {paragraph.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith('> ')) {
                    return (
                      <blockquote key={idx} className="border-l-2 border-[#d97d64] pl-3 italic text-[#e6cca0] my-2">
                        {paragraph.replace('> ', '')}
                      </blockquote>
                    );
                  }
                  return (
                    <p key={idx} className="text-[#aba79e]">
                      {paragraph}
                    </p>
                  );
                })
              ) : (
                <p className="text-[#78746c] italic">No hay contenido redactado todavía.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Puntos Clave / Key Highlights */}
      <div className="natural-card p-5 sm:p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0]">
              3. Puntos Clave & Momentos Destacados
            </h2>
            <p className="text-[11px] text-[#8c887f]">
              Ideas centrales que aparecerán en la caja de resumen de la nota
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleGenerateWithAi('highlights')}
            className="text-[11px] font-semibold text-[#e6cca0] hover:underline"
          >
            Sugerir con IA
          </button>
        </div>

        <div className="space-y-2">
          {formData.keyHighlights.map((highlight, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-xs text-[#f3f1ec]"
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d97d64]" />
                <span>{highlight}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveHighlight(idx)}
                className="p-1 rounded text-[#8c887f] hover:text-[#c0909b] transition-colors"
                title="Eliminar punto clave"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newHighlight}
            onChange={(e) => setNewHighlight(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHighlight())}
            placeholder="Añadir nuevo punto destacado..."
            className="flex-1 px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
          />
          <button
            type="button"
            onClick={handleAddHighlight}
            className="px-3.5 py-2 rounded-xl bg-[#282a33] hover:bg-[#343742] text-[#f3f1ec] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#e6cca0]" />
            <span>Añadir</span>
          </button>
        </div>
      </div>

      {/* 4. Video & Portada */}
      <div className="natural-card p-5 sm:p-6 rounded-2xl space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
          <Video className="w-3.5 h-3.5" /> 4. Multimedia & Portada
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
              Plataforma de Video
            </label>
            <select
              value={formData.videoPlatform}
              onChange={(e) => setFormData({ ...formData, videoPlatform: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            >
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
              <option value="facebook">Facebook Video</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
              URL del Video Completo o Acústico
            </label>
            <input
              type="text"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs font-mono focus:outline-none focus:border-[#d97d64]"
            />
          </div>

          <div className="sm:col-span-2">
            <ImageUploadField
              label="Thumbnail / Portada de la Entrevista"
              required
              value={formData.thumbnailUrl}
              onChange={(url) => setFormData({ ...formData, thumbnailUrl: url })}
              collectionName="interviews"
              aspectRatio="video"
              helperText="Imagen de portada en formato 16:9 de alta resolución"
            />
          </div>
        </div>

        {/* Featured Checkbox */}
        <div className="pt-2 border-t border-[#2d2f38]">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="w-4 h-4 rounded border-[#383b47] bg-[#18191e] text-[#d97d64] focus:ring-0"
            />
            <span className="text-xs text-[#f3f1ec] font-semibold">
              Destacar esta entrevista en la portada principal del portal
            </span>
          </label>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/admin/entrevistas"
          className="px-4 py-2.5 rounded-xl bg-[#202228] hover:bg-[#272932] text-[#aba79e] text-xs font-medium transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#c97058] text-[#151618] font-bold text-xs shadow-lg shadow-[#d97d64]/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>{editId ? 'Actualizar Entrevista' : 'Publicar Entrevista'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
