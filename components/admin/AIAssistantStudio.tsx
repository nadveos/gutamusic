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
  ArrowRight,
  UserCheck,
  ExternalLink,
  Tag,
  Quote,
  ListCheck,
  Flame,
} from 'lucide-react';

export const AIAssistantStudio: React.FC = () => {
  const router = useRouter();
  const [activeTool, setActiveTool] = useState<'article' | 'artist' | 'interview' | 'seo'>('article');
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Existing PocketBase artists
  const [pbArtists, setPbArtists] = useState<Artist[]>([]);
  const [selectedArtistId, setSelectedArtistId] = useState<string>('custom');

  // Input fields
  const [stageName, setStageName] = useState('Los Caminantes del Monte');
  const [genres, setGenres] = useState('Folklore, Fusión');
  const [city, setCity] = useState('Tilcara');
  const [province, setProvince] = useState('Jujuy');
  const [topic, setTopic] = useState('Lanzamiento de nuevo disco y raíces culturales');
  const [category, setCategory] = useState<'Acústico GUTA' | 'Estudio' | 'En Vivo' | 'Especial'>('Acústico GUTA');
  const [host, setHost] = useState('Guta Flores');
  const [artistPhoto, setArtistPhoto] = useState('');

  // Results
  const [generatedData, setGeneratedData] = useState<any>(null);
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

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedData(null);

    let action = 'article_generation';
    let payload: any = {};

    if (activeTool === 'article') {
      action = 'article_generation';
      payload = {
        stageName,
        genres: genres.split(',').map((g) => g.trim()),
        city,
        province,
        topic,
        host,
        category,
      };
    } else if (activeTool === 'artist' || activeTool === 'seo') {
      action = 'artist_review';
      payload = {
        stageName,
        genres: genres.split(',').map((g) => g.trim()),
        city,
        province,
      };
    } else if (activeTool === 'interview') {
      action = 'interview_chronicle';
      payload = {
        artistName: stageName,
        host,
        topic,
      };
    }

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedData(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Redirigir a la creación de Nota / Entrevista en el sitio
  const handleTransferToInterview = () => {
    if (!generatedData) return;

    const currentArtist = pbArtists.find((a) => a.id === selectedArtistId);

    const draft = {
      title: generatedData.title || `Crónica: ${stageName} en GUTA`,
      subtitle: generatedData.subtitle || generatedData.shortBio || '',
      summary: generatedData.summary || generatedData.shortBio || '',
      editorialText: generatedData.editorialText || generatedData.fullBio || '',
      keyHighlights: Array.isArray(generatedData.keyHighlights) ? generatedData.keyHighlights : [],
      artistId: currentArtist ? currentArtist.id : 'custom',
      artistName: stageName,
      artistSlug: currentArtist ? currentArtist.slug : stageName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      artistPhoto: currentArtist?.photoUrl || artistPhoto || '',
      host: host || 'Guta Flores',
      category: category || 'Acústico GUTA',
      date: new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }),
    };

    sessionStorage.setItem('guta_ai_interview_draft', JSON.stringify(draft));
    setRedirectToast('Abriendo editor de notas con el borrador generado...');
    setTimeout(() => {
      router.push('/admin/entrevistas/nuevo');
    }, 600);
  };

  // Redirigir a la creación o actualización del artista
  const handleTransferToArtist = () => {
    if (!generatedData) return;

    const currentArtist = pbArtists.find((a) => a.id === selectedArtistId);

    const draft = {
      stageName,
      genres: genres.split(',').map((g) => g.trim()),
      city,
      province,
      shortBio: generatedData.shortBio || generatedData.summary || '',
      bio: generatedData.fullBio || generatedData.editorialText || '',
      quotes: generatedData.quotes || '',
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
    }, 600);
  };

  return (
    <div className="space-y-6">
      {redirectToast && (
        <div className="p-3.5 rounded-xl bg-[#93a887] text-[#151618] text-xs font-bold flex items-center justify-between animate-in fade-in">
          <span>{redirectToast}</span>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        </div>
      )}

      {/* Tool Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#2a2c35] pb-3">
        {[
          { id: 'article', label: 'Nota Periodística / Artículo para el Sitio', icon: Newspaper, badge: 'Recomendado' },
          { id: 'artist', label: 'Biografía & Perfil de Artista', icon: FileText },
          { id: 'interview', label: 'Crónica de Entrevista & Acústico', icon: Radio },
          { id: 'seo', label: 'Estrategia SEO & Meta Tags', icon: Globe },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTool(t.id as any);
                setGeneratedData(null);
              }}
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
        {/* Input Parameters Form */}
        <div className="lg:col-span-5 natural-card p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#2d2f38]">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5" /> Parámetros de Redacción
            </h3>
            <span className="text-[10px] text-[#8c887f]">Gemini AI</span>
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
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Nombre del Artista / Banda *</label>
              <input
                type="text"
                required
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Géneros Musicales</label>
              <input
                type="text"
                placeholder="Ej: Folklore, Tango, Rock, Fusión"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Ciudad</label>
                <input
                  type="text"
                  placeholder="Ej: Tilcara"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Provincia</label>
                <input
                  type="text"
                  placeholder="Ej: Jujuy"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>
            </div>

            {(activeTool === 'article' || activeTool === 'interview') && (
              <>
                <div>
                  <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Enfoque / Eje de la Nota</label>
                  <input
                    type="text"
                    placeholder="Ej: Lanzamiento de disco, gira nacional, raíces e identidad sonora"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Sección / Categoría</label>
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
                    <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Firma / Conducción</label>
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
                : activeTool === 'article'
                ? 'Redactar Nota Periodística Completa'
                : 'Generar Redacción Editorial'}
            </span>
          </button>
        </div>

        {/* Results Output Box */}
        <div className="lg:col-span-7 natural-card p-5 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#2d2f38]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#93a887] flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5" /> Resultado de la Redacción
              </h3>
              {generatedData && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#93a887]/20 text-[#93a887] font-semibold">
                  Listo para publicar
                </span>
              )}
            </div>

            {generatedData ? (
              <div className="space-y-4 text-xs">
                {/* Header Titular & Copete */}
                {generatedData.title && (
                  <div className="p-4 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[#e6cca0] tracking-wide">
                        Titular & Bajada Periodística
                      </span>
                      <button
                        onClick={() => copyToClipboard(`${generatedData.title}\n\n${generatedData.subtitle || ''}`, 'title')}
                        className="text-[#aba79e] hover:text-[#f3f1ec] flex items-center gap-1"
                      >
                        {copiedKey === 'title' ? <Check className="w-3 h-3 text-[#93a887]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'title' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                    <h2 className="text-base font-black text-[#f3f1ec] leading-snug">{generatedData.title}</h2>
                    {generatedData.subtitle && (
                      <p className="text-xs text-[#aba79e] leading-relaxed border-l-2 border-[#d97d64] pl-2.5 italic">
                        {generatedData.subtitle}
                      </p>
                    )}
                  </div>
                )}

                {/* Highlights */}
                {Array.isArray(generatedData.keyHighlights) && generatedData.keyHighlights.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-2">
                    <span className="text-[10px] uppercase font-bold text-[#93a887] flex items-center gap-1">
                      <ListCheck className="w-3 h-3" /> Puntos Clave de la Nota
                    </span>
                    <ul className="space-y-1 text-[#aba79e]">
                      {generatedData.keyHighlights.map((hl: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-[#d97d64] font-bold">•</span>
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cuerpo del Artículo Editorial */}
                {(generatedData.editorialText || generatedData.fullBio) && (
                  <div className="p-4 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[#e6cca0]">
                        Cuerpo de la Nota / Biografía
                      </span>
                      <button
                        onClick={() => copyToClipboard(generatedData.editorialText || generatedData.fullBio, 'body')}
                        className="text-[#aba79e] hover:text-[#f3f1ec] flex items-center gap-1"
                      >
                        {copiedKey === 'body' ? <Check className="w-3 h-3 text-[#93a887]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'body' ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                    <div className="text-[#aba79e] leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto pr-1 text-xs">
                      {generatedData.editorialText || generatedData.fullBio}
                    </div>
                  </div>
                )}

                {/* Quotes */}
                {generatedData.quotes && (
                  <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#e6cca0] flex items-center gap-1">
                      <Quote className="w-3 h-3" /> Declaración Destacada
                    </span>
                    <p className="text-[#e6cca0] italic font-serif text-xs">{generatedData.quotes}</p>
                  </div>
                )}

                {/* SEO */}
                {generatedData.seoTitle && (
                  <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#93a887]">SEO & Meta Tags</span>
                    <p className="text-[#f3f1ec] font-semibold text-xs">{generatedData.seoTitle}</p>
                    <p className="text-[#8c887f] text-[11px]">{generatedData.seoDesc}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-[#78746c] space-y-2">
                <Sparkles className="w-8 h-8 mx-auto opacity-40 text-[#e6cca0]" />
                <p className="text-xs">
                  Elegí un artista o completá los datos y hacé clic en "Redactar Nota Periodística Completa".
                </p>
                <p className="text-[11px] text-[#555]">
                  Podrás enviar el resultado directamente a la sección de Entrevistas y Notas con 1 clic.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons to connect with site directly */}
          {generatedData && (
            <div className="pt-4 border-t border-[#2d2f38] flex flex-wrap gap-2.5 justify-end">
              <button
                type="button"
                onClick={handleTransferToInterview}
                className="px-4 py-2.5 rounded-xl bg-[#93a887] hover:bg-[#829676] text-[#151618] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Newspaper className="w-3.5 h-3.5" />
                <span>📰 Crear Nota / Entrevista con este Borrador</span>
              </button>

              <button
                type="button"
                onClick={handleTransferToArtist}
                className="px-4 py-2.5 rounded-xl bg-[#24252c] hover:bg-[#2e303b] text-[#e6cca0] font-semibold text-xs border border-[#31333d] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>👤 Cargar en Perfil de Artista</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

