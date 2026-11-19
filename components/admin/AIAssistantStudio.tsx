'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '../../lib/pocketbase';
import { Artist } from '../../lib/types';
import {
  Sparkles,
  Copy,
  Check,
  Wand2,
  FileText,
  Globe,
  RefreshCw,
  Radio,
  Newspaper,
  UserCheck,
  Quote,
  ListCheck,
  BookOpen,
  ClipboardPaste,
  Link2,
  AlertCircle,
  Trash2,
} from 'lucide-react';

export const AIAssistantStudio: React.FC = () => {
  const router = useRouter();
  const [activeTool, setActiveTool] = useState<'article' | 'artist' | 'interview' | 'seo'>(
    'article'
  );
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Existing PocketBase artists
  const [pbArtists, setPbArtists] = useState<Artist[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string>('custom');

  // Input fields (Left column)
  const [stageName, setStageName] = useState('Sylvia Pop');
  const [genres, setGenres] = useState('Under');
  const [city, setCity] = useState('Quilmes');
  const [province, setProvince] = useState('Buenos Aires');
  const [topic, setTopic] = useState('Lanzamiento de nuevo EP');
  const [category, setCategory] = useState<
    'Acústico GUTA' | 'Estudio' | 'En Vivo' | 'Especial'
  >('Estudio');
  const [host, setHost] = useState('Guta Flores');
  const [artistPhoto, setArtistPhoto] = useState('');

  // NotebookLM / External Source Connection
  const [sourceUrl, setSourceUrl] = useState('');
  const [notebookSourceText, setNotebookSourceText] = useState('');
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Editable Editorial Fields (Right column — always visible & editable)
  const [editorialTitle, setEditorialTitle] = useState('');
  const [editorialSubtitle, setEditorialSubtitle] = useState('');
  const [editorialSummary, setEditorialSummary] = useState('');
  const [editorialQuotes, setEditorialQuotes] = useState('');
  const [editorialBody, setEditorialBody] = useState('');
  const [keyHighlights, setKeyHighlights] = useState<string[]>([]);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [usedModel, setUsedModel] = useState<string | null>(null);

  const [redirectToast, setRedirectToast] = useState('');

  // Load artists from PocketBase on mount
  useEffect(() => {
    const loadArtists = async () => {
      try {
        const records = await pb.collection('artists').getFullList<any>({
          sort: 'stageName',
          requestKey: null,
        });
        if (records && records.length > 0) {
          const list: Artist[] = records.map((r) => ({
            id: r.id,
            slug: r.slug,
            stageName: r.stageName,
            realName: r.realName || '',
            genres: Array.isArray(r.genres) ? r.genres : [r.genres || 'Folklore'],
            city: r.city || '',
            province: r.province || '',
            country: r.country || 'Argentina',
            bio: r.bio || '',
            shortBio: r.shortBio || '',
            photoUrl: r.photoUrl || (r.photo ? pb.files.getUrl(r, r.photo) : ''),
            bannerUrl: r.bannerUrl || '',
            featured: Boolean(r.featured),
            featuredOfWeek: Boolean(r.featuredOfWeek),
            socials: r.socials || {},
            videos: [],
            discography: [],
            agenda: [],
            press: [],
            gallery: [],
            createdDate: r.createdDate || r.created?.split(' ')[0] || '',
          }));
          setPbArtists(list);
        }
      } catch (e) {
        console.warn('Error loading artists in AI Studio:', e);
      }
    };

    loadArtists();
  }, []);

  // When an existing artist is picked from the dropdown
  const handleSelectArtist = (artistId: string) => {
    setSelectedArtistId(artistId);
    if (artistId === 'custom') {
      setArtistPhoto('');
      return;
    }

    const artist = pbArtists.find((a) => a.id === artistId);
    if (artist) {
      setStageName(artist.stageName);
      setGenres(artist.genres.join(', '));
      setCity(artist.city || '');
      setProvince(artist.province || '');
      setArtistPhoto(artist.photoUrl || '');
    }
  };

  // Importar desde URL pública o Google Doc compartido
  const handleFetchSourceUrl = async () => {
    if (!sourceUrl.trim()) return;
    setFetchingUrl(true);
    setSourceNotice(null);
    setErrorBanner(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fetch_source_url',
          payload: { sourceUrl: sourceUrl.trim() },
        }),
      });
      const data = await res.json();
      if (data.text) {
        setNotebookSourceText(data.text);
        if (!editorialBody.trim()) {
          setEditorialBody(data.text);
        }
        setSourceNotice('¡Contenido extraído del enlace y cargado como fuente base!');
      } else if (data.notice) {
        setSourceNotice(data.notice);
      }
    } catch {
      setSourceNotice(
        'No se pudo leer el enlace directamente. Copiá el texto de NotebookLM y usá el botón "Pegar de NotebookLM".'
      );
    } finally {
      setFetchingUrl(false);
    }
  };

  // Pegar desde el portapapeles (NotebookLM)
  const handlePasteFromClipboard = async (target: 'source' | 'body') => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText || !clipText.trim()) {
        setSourceNotice('El portapapeles está vacío. Copiá primero la nota en NotebookLM.');
        return;
      }
      if (target === 'source') {
        setNotebookSourceText(clipText.trim());
        if (!editorialBody.trim()) {
          setEditorialBody(clipText.trim());
        }
      } else {
        setEditorialBody(clipText.trim());
      }
      setSourceNotice('¡Editorial de NotebookLM pegada! Ya podés pulsar "Refinar Editorial con IA" o editarla.');
    } catch {
      setSourceNotice('Hacé clic dentro del recuadro y presioná Ctrl+V para pegar tu texto de NotebookLM.');
    }
  };

  const applyAiResultToFields = (d: any, modelName?: string) => {
    if (!d) return;
    if (d.title) setEditorialTitle(d.title);
    if (d.subtitle) setEditorialSubtitle(d.subtitle);
    if (d.summary || d.shortBio) setEditorialSummary(d.summary || d.shortBio);
    if (d.editorialText || d.fullBio) setEditorialBody(d.editorialText || d.fullBio);
    if (d.quotes) setEditorialQuotes(d.quotes);
    if (Array.isArray(d.keyHighlights)) setKeyHighlights(d.keyHighlights);
    if (d.seoTitle) setSeoTitle(d.seoTitle);
    if (d.seoDesc) setSeoDesc(d.seoDesc);
    if (modelName) setUsedModel(modelName);
  };

  // Generar Nota desde Parámetros + Fuente NotebookLM
  const handleGenerate = async () => {
    setLoading(true);
    setErrorBanner(null);

    let action = 'article_generation';
    if (activeTool === 'artist' || activeTool === 'seo') action = 'artist_review';
    else if (activeTool === 'interview') action = 'interview_chronicle';

    const payload = {
      stageName,
      artistName: stageName,
      genres: genres.split(',').map((g) => g.trim()),
      city,
      province,
      topic,
      host,
      category,
      sourceUrl: sourceUrl.trim(),
      notebookSourceText: notebookSourceText.trim(),
      draftTitle: editorialTitle.trim(),
      draftSubtitle: editorialSubtitle.trim(),
      draftSummary: editorialSummary.trim(),
      draftEditorialText: editorialBody.trim(),
      draftQuotes: editorialQuotes.trim(),
    };

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        applyAiResultToFields(data.data, data.model);
      } else {
        setErrorBanner(data.error || 'Error al generar con Gemini AI.');
      }
    } catch (e: any) {
      setErrorBanner(e?.message || 'Error de conexión con el motor de IA.');
    } finally {
      setLoading(false);
    }
  };

  // Refinar lo que el usuario pegó o escribió en los campos editoriales de la derecha
  const handleRefineEditorial = async () => {
    if (!editorialBody.trim() && !notebookSourceText.trim()) {
      setErrorBanner(
        'Pegá primero la editorial de NotebookLM o un borrador en el Cuerpo de la Nota para que la IA lo refine y complete los titulares.'
      );
      return;
    }

    setRefining(true);
    setErrorBanner(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refine_editorial',
          payload: {
            stageName,
            genres: genres.split(',').map((g) => g.trim()),
            city,
            province,
            topic,
            host,
            category,
            sourceUrl: sourceUrl.trim(),
            notebookSourceText: notebookSourceText.trim(),
            draftTitle: editorialTitle.trim(),
            draftSubtitle: editorialSubtitle.trim(),
            draftSummary: editorialSummary.trim(),
            draftEditorialText: editorialBody.trim(),
            draftQuotes: editorialQuotes.trim(),
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        applyAiResultToFields(data.data, data.model);
      } else {
        setErrorBanner(data.error || 'No se pudo refinar la editorial.');
      }
    } catch (e: any) {
      setErrorBanner(e?.message || 'Error de conexión al refinar.');
    } finally {
      setRefining(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const hasEditorialContent = Boolean(
    editorialTitle.trim() || editorialBody.trim() || editorialSummary.trim()
  );

  // Redirigir a la creación de Nota / Entrevista en el sitio
  const handleTransferToInterview = () => {
    if (!hasEditorialContent) return;

    const currentArtist = pbArtists.find((a) => a.id === selectedArtistId);

    const draft = {
      title: editorialTitle.trim() || `${stageName}: ${topic || 'Especial Editorial en GUTA'}`,
      subtitle: editorialSubtitle.trim() || editorialSummary.trim() || '',
      summary: editorialSummary.trim() || editorialSubtitle.trim() || '',
      editorialText: editorialBody.trim(),
      keyHighlights: Array.isArray(keyHighlights) ? keyHighlights : [],
      artistId: currentArtist ? currentArtist.id : 'custom',
      artistName: stageName,
      artistSlug: currentArtist
        ? currentArtist.slug
        : stageName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      artistPhoto: currentArtist?.photoUrl || artistPhoto || '',
      host: host || 'Guta Flores',
      category: category || 'Acústico GUTA',
      date: new Date().toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };

    sessionStorage.setItem('guta_ai_interview_draft', JSON.stringify(draft));
    setRedirectToast('Abriendo editor de notas con tu editorial...');
    setTimeout(() => {
      router.push('/admin/entrevistas/nuevo');
    }, 500);
  };

  // Redirigir a la creación o actualización del artista
  const handleTransferToArtist = () => {
    if (!hasEditorialContent) return;

    const currentArtist = pbArtists.find((a) => a.id === selectedArtistId);

    const draft = {
      stageName,
      genres: genres.split(',').map((g) => g.trim()),
      city,
      province,
      shortBio: editorialSummary.trim() || editorialSubtitle.trim() || '',
      bio: editorialBody.trim(),
      quotes: editorialQuotes.trim(),
      photoUrl: currentArtist?.photoUrl || artistPhoto || '',
    };

    sessionStorage.setItem('guta_ai_artist_draft', JSON.stringify(draft));
    setRedirectToast('Abriendo formulario de artista con la bio y datos...');
    setTimeout(() => {
      if (currentArtist) {
        router.push(`/admin/artistas/nuevo?edit=${currentArtist.id}`);
      } else {
        router.push('/admin/artistas/nuevo');
      }
    }, 500);
  };

  const handleClearFields = () => {
    setEditorialTitle('');
    setEditorialSubtitle('');
    setEditorialSummary('');
    setEditorialQuotes('');
    setEditorialBody('');
    setKeyHighlights([]);
    setSeoTitle('');
    setSeoDesc('');
  };

  return (
    <div className="space-y-6">
      {redirectToast && (
        <div className="p-3.5 rounded-xl bg-[#93a887] text-[#151618] text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span>{redirectToast}</span>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        </div>
      )}

      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Tool Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#2a2c35] pb-3">
        {[
          {
            id: 'article',
            label: 'Nota Periodística / Artículo para el Sitio',
            icon: Newspaper,
            badge: 'Recomendado',
          },
          { id: 'artist', label: 'Biografía & Perfil de Artista', icon: FileText },
          { id: 'interview', label: 'Crónica de Entrevista & Acústico', icon: Radio },
          { id: 'seo', label: 'Estrategia SEO & Meta Tags', icon: Globe },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#d97d64] text-[#151618] font-bold'
                  : 'bg-[#202228] text-[#aba79e] hover:text-[#f3f1ec] border border-[#2d2f38]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              {t.badge && !isActive && (
                <span className="px-1.5 py-0.5 rounded bg-[#e6cca0]/20 text-[#e6cca0] text-[10px]">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: Parámetros + Conexión NotebookLM */}
        <div className="lg:col-span-5 natural-card p-5 rounded-2xl space-y-4 h-fit">
          <div className="flex items-center justify-between pb-2 border-b border-[#2d2f38]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5" /> Parámetros de Redacción
            </h3>
            <span className="text-[10px] text-[#8c887f]">
              {usedModel ? `Gemini (${usedModel})` : 'Gemini AI + NotebookLM'}
            </span>
          </div>

          {/* Selector de artista de la base de datos */}
          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
              Seleccionar Artista de la Base de Datos (Opcional)
            </label>
            <select
              value={selectedArtistId}
              onChange={(e) => handleSelectArtist(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            >
              <option value="custom">+ Escribir datos de artista manualmente...</option>
              {pbArtists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.stageName} ({a.genres.join(', ') || a.province || 'Artista'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
                Nombre del Artista / Banda *
              </label>
              <input
                type="text"
                required
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
                Géneros Musicales
              </label>
              <input
                type="text"
                placeholder="Ej: Folklore, Tango, Rock, Fusión, Under"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  placeholder="Ej: Quilmes"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
                  Provincia
                </label>
                <input
                  type="text"
                  placeholder="Ej: Buenos Aires"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>
            </div>

            {(activeTool === 'article' || activeTool === 'interview') && (
              <>
                <div>
                  <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
                    Enfoque / Eje de la Nota
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Lanzamiento de nuevo EP, gira nacional, raíces e identidad sonora"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
                      Sección / Categoría
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                    >
                      <option value="Acústico GUTA">Acústico GUTA</option>
                      <option value="Estudio">Estudio / Lanzamiento</option>
                      <option value="En Vivo">En Vivo / Crónica</option>
                      <option value="Especial">Especial Editorial</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
                      Firma / Conducción
                    </label>
                    <input
                      type="text"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* CONECTOR NOTEBOOKLM / FUENTE EXTERNA */}
            <div className="p-3.5 rounded-xl bg-[#16181f] border border-[#2d3140] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#e6cca0] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#d97d64]" />
                  <span>Fuente NotebookLM / Link de Referencia</span>
                </span>
                <button
                  type="button"
                  onClick={() => handlePasteFromClipboard('source')}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#232632] hover:bg-[#2d3140] text-[10px] font-bold text-[#93a887] border border-[#353a4c] transition-colors cursor-pointer"
                  title="Pegar texto copiado desde NotebookLM"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  <span>Pegar de NotebookLM</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Link2 className="w-3.5 h-3.5 text-[#78746c] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Link de Google Doc público, web o referencia de cuaderno..."
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-[#111216] border border-[#292b36] text-[#f3f1ec] text-[11px] focus:outline-none focus:border-[#d97d64]"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFetchSourceUrl}
                  disabled={fetchingUrl || !sourceUrl.trim()}
                  className="px-2.5 py-1.5 rounded-lg bg-[#232632] hover:bg-[#2e3242] text-[#e6cca0] border border-[#353a4c] text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap"
                >
                  {fetchingUrl ? 'Leyendo...' : 'Leer Link'}
                </button>
              </div>

              <textarea
                rows={4}
                placeholder="O pegá acá los apuntes, resumen o la editorial generada en tu cuaderno de NotebookLM para que nuestra IA redacte basándose 100% en esos datos reales..."
                value={notebookSourceText}
                onChange={(e) => setNotebookSourceText(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#111216] border border-[#292b36] text-[#f3f1ec] text-[11px] leading-relaxed focus:outline-none focus:border-[#d97d64]"
              />

              {sourceNotice && (
                <p className="text-[10px] text-[#e6cca0] bg-[#e6cca0]/10 border border-[#e6cca0]/25 px-2.5 py-1.5 rounded-lg leading-snug">
                  💡 {sourceNotice}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !stageName.trim()}
            className="w-full py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>
              {loading
                ? 'Redactando con Inteligencia Editorial...'
                : notebookSourceText.trim()
                ? 'Redactar Nota Basada en NotebookLM'
                : activeTool === 'article'
                ? 'Redactar Nota Periodística Completa'
                : 'Generar Redacción Editorial'}
            </span>
          </button>
        </div>

        {/* COLUMNA DERECHA: Campos Editoriales Siempre Visibles + Botón Refinar con IA */}
        <div className="lg:col-span-7 natural-card p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Cabecera de la mesa de edición */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#2d2f38]">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#93a887] flex items-center gap-1.5">
                  <Newspaper className="w-3.5 h-3.5" /> Resultado de la Redacción & Editor Editorial
                </h3>
                <p className="text-[11px] text-[#8c887f] mt-0.5">
                  Podés pegar tu editorial de NotebookLM directo en los campos y tocar{' '}
                  <strong className="text-[#e6cca0]">Refinar Editorial con IA</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {hasEditorialContent && (
                  <button
                    type="button"
                    onClick={handleClearFields}
                    className="p-1.5 rounded-lg bg-[#202228] hover:bg-[#2c2023] text-[#8c887f] hover:text-rose-300 border border-[#2d2f38] transition-colors cursor-pointer"
                    title="Limpiar campos editoriales"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRefineEditorial}
                  disabled={refining || (!editorialBody.trim() && !notebookSourceText.trim())}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#e6cca0] to-[#d97d64] hover:opacity-95 text-[#151618] font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-40"
                  title="Toma el texto editorial que pegaste y la IA lo pule, estructura subtítulos y genera Titular, Bajada y Resumen"
                >
                  {refining ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  <span>{refining ? 'Refinando Editorial...' : 'Refinar Editorial con IA'}</span>
                </button>
              </div>
            </div>

            {/* CAMPO 1: Titular Periodístico */}
            <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-[#e6cca0] tracking-wide">
                  1. Titular Principal de la Nota
                </label>
                {editorialTitle && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(editorialTitle, 'title')}
                    className="text-[11px] text-[#aba79e] hover:text-[#f3f1ec] flex items-center gap-1"
                  >
                    {copiedKey === 'title' ? (
                      <Check className="w-3 h-3 text-[#93a887]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedKey === 'title' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Escribí o pegá el titular (o dejalo vacío y tocá 'Refinar Editorial con IA' para que lo arme solo)..."
                value={editorialTitle}
                onChange={(e) => setEditorialTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#121317] border border-[#292b34] text-sm font-black text-[#f3f1ec] focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            {/* CAMPO 2: Subtítulo / Bajada Periodística */}
            <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-[#e6cca0] tracking-wide">
                  2. Subtítulo / Bajada Periodística
                </label>
                {editorialSubtitle && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(editorialSubtitle, 'subtitle')}
                    className="text-[11px] text-[#aba79e] hover:text-[#f3f1ec] flex items-center gap-1"
                  >
                    {copiedKey === 'subtitle' ? (
                      <Check className="w-3 h-3 text-[#93a887]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedKey === 'subtitle' ? 'Copiado' : 'Copiar'}</span>
                  </button>
                )}
              </div>
              <textarea
                rows={2}
                placeholder="Bajada o copete de 2 oraciones que sintetiza el enfoque de la nota..."
                value={editorialSubtitle}
                onChange={(e) => setEditorialSubtitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#121317] border border-[#292b34] text-xs text-[#f3f1ec] leading-relaxed focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            {/* CAMPO 3: Resumen de Portada & Frase Destacada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[#93a887] tracking-wide block">
                  3A. Resumen Corto (Cards de Portada)
                </label>
                <textarea
                  rows={2}
                  placeholder="Resumen breve para la tarjeta en la sección Entrevistas..."
                  value={editorialSummary}
                  onChange={(e) => setEditorialSummary(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#121317] border border-[#292b34] text-xs text-[#f3f1ec] leading-relaxed focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-[#e6cca0] tracking-wide flex items-center gap-1">
                  <Quote className="w-3 h-3" /> 3B. Cita / Frase Destacada
                </label>
                <textarea
                  rows={2}
                  placeholder='"Frase o declaración destacada del artista..."'
                  value={editorialQuotes}
                  onChange={(e) => setEditorialQuotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-[#121317] border border-[#292b34] text-xs text-[#e6cca0] italic leading-relaxed focus:outline-none focus:border-[#d97d64]"
                />
              </div>
            </div>

            {/* CAMPO 4: Cuerpo Completo de la Editorial / Nota */}
            <div className="p-4 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[10px] uppercase font-bold text-[#e6cca0] tracking-wide">
                  4. Cuerpo Completo de la Editorial / Nota (Markdown)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePasteFromClipboard('body')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#232632] hover:bg-[#2d3140] text-[11px] font-bold text-[#93a887] border border-[#353a4c] transition-colors cursor-pointer"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Pegar Editorial de NotebookLM</span>
                  </button>
                  {editorialBody && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(editorialBody, 'body')}
                      className="text-[11px] text-[#aba79e] hover:text-[#f3f1ec] flex items-center gap-1"
                    >
                      {copiedKey === 'body' ? (
                        <Check className="w-3 h-3 text-[#93a887]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedKey === 'body' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={11}
                placeholder="Pegá aquí la editorial completa de NotebookLM o redactá el cuerpo de la nota. Podés usar subtítulos con ##. Luego podés tocar 'Refinar Editorial con IA' arriba para que Gemini pula la redacción y te arme el titular y la bajada automáticamente, o enviarla directo a publicar..."
                value={editorialBody}
                onChange={(e) => setEditorialBody(e.target.value)}
                className="w-full p-3 rounded-lg bg-[#121317] border border-[#292b34] text-xs text-[#f3f1ec] leading-relaxed focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            {/* Puntos clave & SEO (si se generaron) */}
            {keyHighlights.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#93a887] flex items-center gap-1">
                  <ListCheck className="w-3 h-3" /> Puntos Clave Extraídos
                </span>
                <ul className="space-y-1 text-xs text-[#aba79e]">
                  {keyHighlights.map((hl, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#d97d64] font-bold">•</span>
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(seoTitle || seoDesc) && (
              <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#93a887]">
                  SEO & Meta Tags Sugeridos
                </span>
                {seoTitle && <p className="text-[#f3f1ec] font-semibold text-xs">{seoTitle}</p>}
                {seoDesc && <p className="text-[#8c887f] text-[11px]">{seoDesc}</p>}
              </div>
            )}
          </div>

          {/* Botones de Acción Final hacia el sitio */}
          <div className="pt-4 border-t border-[#2d2f38] flex flex-wrap gap-2.5 justify-between items-center">
            <button
              type="button"
              onClick={handleRefineEditorial}
              disabled={refining || (!editorialBody.trim() && !notebookSourceText.trim())}
              className="px-3.5 py-2.5 rounded-xl bg-[#24252c] hover:bg-[#2e303b] text-[#e6cca0] font-bold text-xs border border-[#353846] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {refining ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5 text-[#d97d64]" />
              )}
              <span>🪄 Refinar y Completar Campos con IA</span>
            </button>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleTransferToInterview}
                disabled={!hasEditorialContent}
                className="px-4 py-2.5 rounded-xl bg-[#93a887] hover:bg-[#829676] text-[#151618] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-40"
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>📰 Crear Nota / Entrevista con este Borrador</span>
              </button>

              <button
                type="button"
                onClick={handleTransferToArtist}
                disabled={!hasEditorialContent}
                className="px-4 py-2.5 rounded-xl bg-[#24252c] hover:bg-[#2e303b] text-[#e6cca0] font-semibold text-xs border border-[#31333d] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>👤 Cargar en Perfil de Artista</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
