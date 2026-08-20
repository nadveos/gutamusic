'use client';

import React, { useState } from 'react';
import { EphemerisCategory, EphemerisItem } from '../../../lib/types';
import { pb } from '../../../lib/pocketbase';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { ConfirmModal } from '../../../components/admin/ConfirmModal';
import { AITokenBadge } from '../../../components/admin/AITokenBadge';
import { Plus, Sparkles, Check, ArrowRight, Save, Trash2, Layers, Loader2 } from 'lucide-react';

interface EfemeridesAdminClientProps {
  initialItems: EphemerisItem[];
}

export const EfemeridesAdminClient: React.FC<EfemeridesAdminClientProps> = ({
  initialItems,
}) => {
  const [itemsList, setItemsList] = useState<EphemerisItem[]>(initialItems);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    day: 18,
    month: 8,
    year: 1985,
    category: 'lanzamientos' as EphemerisCategory,
    categoryLabel: 'Lanzamientos Históricos',
    description: '',
    source: '',
    impactBadge: '',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
  });

  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiDebugInfo, setAiDebugInfo] = useState<any>(null);
  const [aiRegionName, setAiRegionName] = useState<string>('Argentina');
  const [aiGroundedSources, setAiGroundedSources] = useState<number>(0);
  const [aiModelName, setAiModelName] = useState<string>('gemini-3.6-flash');
  const [savingBulk, setSavingBulk] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('argentina');

  const confirmDelete = async () => {
    if (deleteTarget) {
      const id = deleteTarget.id;
      setItemsList(itemsList.filter((i) => i.id !== id));
      try {
        await pb.collection('ephemerides').delete(id);
      } catch (e) {}
      setDeleteTarget(null);
    }
  };

  const categories = [
    { id: 'lanzamientos', label: 'Lanzamientos Históricos' },
    { id: 'billboard', label: 'Billboard & Récords' },
    { id: 'sadaic', label: 'Registros SADAIC' },
    { id: 'cosquin', label: 'Cosquín & Festivales' },
    { id: 'jesus_maria', label: 'Festival de Jesús María' },
    { id: 'gardel', label: 'Premios Gardel' },
    { id: 'nacimientos', label: 'Nacimientos' },
    { id: 'fallecimientos', label: 'Fallecimientos' },
    { id: 'homenajes', label: 'Homenajes' },
    { id: 'curiosidades', label: 'Curiosidades & Archivo' },
    { id: 'latam_festivales', label: 'Festivales LATAM' },
    { id: 'latam_premios', label: 'Premios LATAM' },
    { id: 'internacional', label: 'Internacional' },
  ];

  const latamRegions = [
    { id: 'argentina', label: '🇦🇷 Argentina', emoji: '🇦🇷' },
    { id: 'mexico', label: '🇲🇽 México', emoji: '🇲🇽' },
    { id: 'colombia', label: '🇨🇴 Colombia', emoji: '🇨🇴' },
    { id: 'chile', label: '🇨🇱 Chile', emoji: '🇨🇱' },
    { id: 'brasil', label: '🇧🇷 Brasil', emoji: '🇧🇷' },
    { id: 'peru', label: '🇵🇪 Perú', emoji: '🇵🇪' },
    { id: 'venezuela', label: '🇻🇪 Venezuela', emoji: '🇻🇪' },
    { id: 'uruguay', label: '🇺🇾 Uruguay', emoji: '🇺🇾' },
    { id: 'bolivia', label: '🇧🇴 Bolivia', emoji: '🇧🇴' },
    { id: 'ecuador', label: '🇪🇨 Ecuador', emoji: '🇪🇨' },
    { id: 'paraguay', label: '🇵🇾 Paraguay', emoji: '🇵🇾' },
    { id: 'cuba', label: '🇨🇺 Cuba', emoji: '🇨🇺' },
    { id: 'puerto_rico', label: '🇵🇷 Puerto Rico', emoji: '🇵🇷' },
    { id: 'republica_dominicana', label: '🇩🇴 R. Dominicana', emoji: '🇩🇴' },
    { id: 'centroamerica', label: '🌎 Centroamérica', emoji: '🌎' },
    { id: 'latam_general', label: '🌎 LATAM General', emoji: '🌎' },
  ];

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handleGenerateAI = async () => {
    setLoadingAI(true);
    setAiSuggestions([]);
    setAiDebugInfo(null);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_daily_ephemerides',
          payload: {
            day: formData.day,
            month: formData.month,
            category: formData.category,
            region: selectedRegion,
          },
        }),
      });

      const rawText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        if (rawText.includes('<html') || res.status === 504 || res.status === 502) {
          setNotification({
            type: 'error',
            text: `Aviso del Servidor (${res.status}): La consulta a Gemini tardó más de lo esperado o la clave GEMINI_API_KEY no está configurada en las Variables de Entorno de CapRover.`,
          });
          return;
        }
        setNotification({
          type: 'error',
          text: `Error de respuesta inesperada (${res.status}): ${rawText.substring(0, 120)}`,
        });
        return;
      }

      if (!res.ok || !data.success) {
        setNotification({ type: 'error', text: `Aviso de IA: ${data.error || 'Error desconocido al consultar Gemini'}` });
        return;
      }

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setAiSuggestions(data.data);
        if (data.model) {
          setAiModelName(data.model);
        }
        if (data.tokenUsage) {
          setAiDebugInfo(data.tokenUsage);
        }
        if (data.region) {
          setAiRegionName(data.region);
        }
        setAiGroundedSources(data.groundedSources ?? 0);

        // Autofill form with first suggestion
        const first = data.data[0];
        setFormData((prev) => ({
          ...prev,
          title: first.title,
          year: first.year,
          category: first.category || prev.category,
          categoryLabel: first.categoryLabel || prev.categoryLabel,
          description: first.description,
          source: first.source,
          impactBadge: first.impactBadge,
        }));
        const regionLabel = latamRegions.find(r => r.id === selectedRegion)?.label || selectedRegion;
        const droppedMsg = data.dropped > 0 ? ` (${data.dropped} resultado/s con fecha incorrecta descartados)` : '';
        setNotification({ type: 'success', text: `¡${data.data.length} efeméride/s verificadas de ${regionLabel} para el ${formData.day}/${formData.month}!${droppedMsg}` });
      } else if (data.success && Array.isArray(data.data) && data.data.length === 0) {
        // Gemini returned empty — no verified events for that exact date
        const regionLabel = latamRegions.find(r => r.id === selectedRegion)?.label || selectedRegion;
        const droppedMsg = data.dropped > 0 ? ` Gemini propuso ${data.dropped} resultado/s pero con fechas incorrectas y fueron descartados.` : '';
        setNotification({
          type: 'error',
          text: `Gemini no encontró efemérides verificadas de ${regionLabel} para el ${formData.day}/${formData.month}.${droppedMsg} Probá con otra fecha u otro país.`
        });
      }
    } catch (e: any) {
      console.error(e);
      setNotification({ type: 'error', text: `Error de conexión: ${e?.message}` });
    } finally {
      setLoadingAI(false);
    }
  };


  const handleSelectAiOption = (item: any) => {
    setFormData((prev) => ({
      ...prev,
      title: item.title,
      year: item.year,
      category: item.category || prev.category,
      categoryLabel: item.categoryLabel || prev.categoryLabel,
      description: item.description,
      source: item.source,
      impactBadge: item.impactBadge,
    }));
  };

  // Save a single suggestion from the card directly
  const handleSaveSingleSuggestion = async (item: any) => {
    const newItem: EphemerisItem = {
      id: `eph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      day: item.day || formData.day,
      month: item.month || formData.month,
      year: item.year,
      title: item.title,
      description: item.description,
      category: item.category || 'lanzamientos',
      categoryLabel: item.categoryLabel || 'Lanzamientos Históricos',
      source: item.source || 'Archivo Histórico',
      impactBadge: item.impactBadge || 'Hito Histórico',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    };

    try {
      await pb.collection('ephemerides').create(newItem);
      setNotification({ type: 'success', text: `¡Efeméride "${newItem.title}" guardada en PocketBase!` });
    } catch (e) {}

    setItemsList((prev) => [newItem, ...prev]);
    // Remove from suggestions
    setAiSuggestions((prev) => prev.filter((s) => s.title !== item.title));
  };

  // Save all suggestions in 1-click bulk
  const handleSaveAllSuggestions = async () => {
    if (aiSuggestions.length === 0) return;
    setSavingBulk(true);

    const newItemsToAdd: EphemerisItem[] = [];

    for (const sug of aiSuggestions) {
      const newItem: EphemerisItem = {
        id: `eph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        day: sug.day || formData.day,
        month: sug.month || formData.month,
        year: sug.year,
        title: sug.title,
        description: sug.description,
        category: sug.category || 'lanzamientos',
        categoryLabel: sug.categoryLabel || 'Lanzamientos Históricos',
        source: sug.source || 'Archivo Histórico',
        impactBadge: sug.impactBadge || 'Hito Histórico',
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
      };

      try {
        await pb.collection('ephemerides').create(newItem);
      } catch (e) {}

      newItemsToAdd.push(newItem);
    }

    setItemsList((prev) => [...newItemsToAdd, ...prev]);
    setAiSuggestions([]);
    setSavingBulk(false);
    setNotification({ type: 'success', text: `¡Se guardaron los ${newItemsToAdd.length} hitos en PocketBase exitosamente!` });
  };

  const handleCategoryChange = (catId: EphemerisCategory) => {
    const found = categories.find((c) => c.id === catId);
    setFormData({
      ...formData,
      category: catId,
      categoryLabel: found?.label || 'Efeméride',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newItem: EphemerisItem = {
      id: `eph-${Date.now()}`,
      day: formData.day,
      month: formData.month,
      year: formData.year,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      categoryLabel: formData.categoryLabel,
      source: formData.source,
      impactBadge: formData.impactBadge,
      imageUrl: formData.imageUrl,
    };

    try {
      await pb.collection('ephemerides').create(newItem);
      setNotification({ type: 'success', text: `¡Efeméride "${newItem.title}" agregada al calendario histórico!` });
    } catch (e) {}

    setItemsList([newItem, ...itemsList]);
    setFormData({
      title: '',
      day: formData.day,
      month: formData.month,
      year: 1985,
      category: 'lanzamientos',
      categoryLabel: 'Lanzamientos Históricos',
      description: '',
      source: '',
      impactBadge: '',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    });
  };

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Gestión de Efemérides Musicales"
        subtitle="Carga y consulta de hitos históricos: SADAIC, Billboard, Cosquín, lanzamientos y natalicios"
      />

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 border animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-[11px] opacity-70 hover:opacity-100 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="lg:col-span-6 natural-card p-5 sm:p-6 rounded-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#2d2f38]">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#e6cca0]">
                Efemérides del {formData.day} de {monthNames[formData.month - 1]}
              </h2>
              <p className="text-[11px] text-[#8c887f]">Consulta histórica musical en toda América Latina</p>
            </div>

            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={loadingAI}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-soft text-xs font-semibold hover:bg-[#e6cca0]/20 transition-colors disabled:opacity-50"
            >
              {loadingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{loadingAI ? `Investigando en ${latamRegions.find(r => r.id === selectedRegion)?.emoji || '🌎'}...` : 'Consultar a Gemini'}</span>
            </button>
          </div>

          {/* LATAM Region Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#aba79e] font-semibold block">
              País / Región a consultar en Gemini
            </label>
            <div className="flex flex-wrap gap-1.5">
              {latamRegions.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => setSelectedRegion(region.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    selectedRegion === region.id
                      ? 'bg-[#d97d64] text-[#151618] border-[#d97d64] shadow-sm shadow-[#d97d64]/20'
                      : 'bg-[#18191e] text-[#aba79e] border-[#2e3039] hover:border-[#424554] hover:text-[#f3f1ec]'
                  }`}
                >
                  {region.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#78746c]">
              Gemini buscará efemérides musicales históricas del país seleccionado con fuentes y artistas específicos de cada región.
            </p>
          </div>

          {/* Selector de Fecha */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Día *</label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Mes *</label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              >
                {monthNames.map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Año del Hito *</label>
              <input
                type="number"
                required
                placeholder="Ej: 1982"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>
          </div>

          {/* AI Token Usage Badge */}
          {aiDebugInfo && (
            <AITokenBadge
              usage={aiDebugInfo}
              model={aiModelName}
              grounded={true}
              groundedSources={aiGroundedSources}
              action="Efemérides"
            />
          )}

          {/* AI Suggestions Box with Bulk Save & Quick Add */}
          {aiSuggestions.length > 0 && (
            <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#e6cca0] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gemini encontró {aiSuggestions.length} hitos de {aiRegionName} para el {formData.day} de {monthNames[formData.month - 1]}:
                </span>

                {aiSuggestions.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSaveAllSuggestions}
                    disabled={savingBulk}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] transition-colors"
                  >
                    <Layers className="w-3 h-3" />
                    <span>{savingBulk ? 'Guardando...' : `Guardar los ${aiSuggestions.length} juntos`}</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {aiSuggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#24252c] border border-[#31333d] space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sand-soft mr-1.5">
                          Año {sug.year}
                        </span>
                        <strong className="text-[#f3f1ec] block mt-1">{sug.title}</strong>
                        <p className="text-[11px] text-[#aba79e] leading-relaxed line-clamp-2">
                          {sug.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-[#2d2f38] flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleSelectAiOption(sug)}
                        className="text-[#e6cca0] hover:underline flex items-center gap-1 font-medium"
                      >
                        <span>Cargar al formulario para editar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveSingleSuggestion(sug)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e2420] text-[#93a887] border border-[#2f3f33] hover:bg-[#28332b] font-bold transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        <span>Guardar este</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Categoría / Tipo de Registro *</label>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value as EphemerisCategory)}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Título del Hito Histórico *</label>
            <input
              type="text"
              required
              placeholder="Ej: Soda Stereo debuta en las listas de Billboard Latino"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Descripción Completa del Hecho *</label>
            <textarea
              rows={3}
              required
              placeholder="Detalle histórico de lo ocurrido en esta fecha..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Fuente de Verificación</label>
              <input
                type="text"
                placeholder="Ej: Archivo SADAIC / Cosquín"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Badge de Impacto</label>
              <input
                type="text"
                placeholder="Ej: Hito Histórico"
                value={formData.impactBadge}
                onChange={(e) => setFormData({ ...formData, impactBadge: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors"
          >
            Guardar Efeméride en PocketBase
          </button>
        </form>

        {/* Existing List */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8c887f]">
              Archivo Histórico Cargado ({itemsList.length})
            </h2>
            <span className="text-[11px] text-[#aba79e]">Sincronizado con PocketBase</span>
          </div>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {itemsList.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl natural-card space-y-1.5 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-sand-soft text-xs font-bold">
                      {item.day} de {monthNames[item.month - 1]} ({item.year})
                    </span>
                    <span className="text-[10px] text-[#8c887f] uppercase font-semibold">
                      {item.categoryLabel}
                    </span>
                  </div>
                  <button
                    onClick={() => setDeleteTarget({ id: item.id, title: item.title })}
                    className="text-[#78746c] hover:text-[#c0909b] p-1 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-[#f3f1ec]">{item.title}</h4>
                <p className="text-xs text-[#aba79e] line-clamp-2 leading-relaxed">{item.description}</p>
                {item.source && (
                  <p className="text-[10px] text-[#78746c]">Fuente: {item.source}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Eliminar Efeméride"
        message={`¿Deseás eliminar la efeméride "${deleteTarget?.title}" del calendario histórico?`}
        confirmText="Eliminar Efeméride"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
