'use client';

import React, { useState } from 'react';
import { Sparkles, Copy, Check, Wand2, FileText, Globe, RefreshCw, Radio } from 'lucide-react';

export const AIAssistantStudio: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'artist' | 'interview' | 'seo'>('artist');
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Artist inputs
  const [stageName, setStageName] = useState('Los Caminantes del Monte');
  const [genres, setGenres] = useState('Folklore, Fusión');
  const [city, setCity] = useState('Tilcara');
  const [province, setProvince] = useState('Jujuy');

  // Interview inputs
  const [interviewArtist, setInterviewArtist] = useState('Serenata Gaucha');
  const [host, setHost] = useState('Guta Flores');

  // Results
  const [generatedData, setGeneratedData] = useState<any>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setGeneratedData(null);

    let action = 'artist_review';
    let payload: any = {};

    if (activeTool === 'artist' || activeTool === 'seo') {
      action = 'artist_review';
      payload = { stageName, genres: genres.split(','), city, province };
    } else if (activeTool === 'interview') {
      action = 'interview_chronicle';
      payload = { artistName: interviewArtist, host };
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

  return (
    <div className="space-y-6">
      {/* Tool Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#2a2c35] pb-3">
        {[
          { id: 'artist', label: 'Reseña & Biografía de Artista', icon: FileText },
          { id: 'interview', label: 'Crónica de Entrevista & Acústico', icon: Radio },
          { id: 'seo', label: 'Generador de SEO & Meta Tags', icon: Globe },
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-[#d97d64] text-[#151618]'
                  : 'bg-[#202228] text-[#aba79e] hover:text-[#f3f1ec] border border-[#2d2f38]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Form */}
        <div className="lg:col-span-5 natural-card p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5" /> Parámetros para la IA
          </h3>

          {activeTool === 'artist' || activeTool === 'seo' ? (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Nombre del Artista / Banda</label>
                <input
                  type="text"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Géneros Musicales</label>
                <input
                  type="text"
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
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Provincia</label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Artista Invitado</label>
                <input
                  type="text"
                  value={interviewArtist}
                  onChange={(e) => setInterviewArtist(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Conductor</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{loading ? 'Redactando con IA...' : 'Generar Redacción Editorial'}</span>
          </button>
        </div>

        {/* Results Output Box */}
        <div className="lg:col-span-7 natural-card p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#93a887]">
            Resultado Generado
          </h3>

          {generatedData ? (
            <div className="space-y-4 text-xs">
              {generatedData.shortBio && (
                <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#e6cca0]">Resumen Corto</span>
                    <button
                      onClick={() => copyToClipboard(generatedData.shortBio, 'shortBio')}
                      className="text-[#aba79e] hover:text-[#f3f1ec] flex items-center gap-1"
                    >
                      {copiedKey === 'shortBio' ? <Check className="w-3.5 h-3.5 text-[#93a887]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'shortBio' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  <p className="text-[#aba79e] leading-relaxed">{generatedData.shortBio}</p>
                </div>
              )}

              {generatedData.fullBio && (
                <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#e6cca0]">Biografía Completa</span>
                    <button
                      onClick={() => copyToClipboard(generatedData.fullBio, 'fullBio')}
                      className="text-[#aba79e] hover:text-[#f3f1ec] flex items-center gap-1"
                    >
                      {copiedKey === 'fullBio' ? <Check className="w-3.5 h-3.5 text-[#93a887]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'fullBio' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  <p className="text-[#aba79e] leading-relaxed whitespace-pre-line">{generatedData.fullBio}</p>
                </div>
              )}

              {generatedData.quotes && (
                <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#e6cca0]">Cita Destacada</span>
                    <button
                      onClick={() => copyToClipboard(generatedData.quotes, 'quotes')}
                      className="text-[#aba79e] hover:text-[#f3f1ec] flex items-center gap-1"
                    >
                      {copiedKey === 'quotes' ? <Check className="w-3.5 h-3.5 text-[#93a887]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'quotes' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  <p className="text-[#e6cca0] italic font-serif">{generatedData.quotes}</p>
                </div>
              )}

              {generatedData.seoTitle && (
                <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#93a887]">Meta Tags SEO</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8c887f] block">Title:</span>
                    <p className="text-[#f3f1ec] font-semibold">{generatedData.seoTitle}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#8c887f] block">Description:</span>
                    <p className="text-[#aba79e]">{generatedData.seoDesc}</p>
                  </div>
                </div>
              )}

              {generatedData.editorialText && (
                <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#e6cca0]">Crónica Periodística</span>
                    <button
                      onClick={() => copyToClipboard(generatedData.editorialText, 'editorial')}
                      className="text-[#aba79e] hover:text-[#f3f1ec] flex items-center gap-1"
                    >
                      {copiedKey === 'editorial' ? <Check className="w-3.5 h-3.5 text-[#93a887]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'editorial' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                  <p className="text-[#aba79e] leading-relaxed whitespace-pre-line">{generatedData.editorialText}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-[#78746c] space-y-2">
              <Sparkles className="w-7 h-7 mx-auto opacity-40 text-[#e6cca0]" />
              <p className="text-xs">Configurá los parámetros a la izquierda y hacé clic en "Generar Redacción Editorial".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
