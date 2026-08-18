'use client';

import React, { useState } from 'react';
import { EphemerisCategory, EphemerisItem } from '../../../lib/types';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { Plus, Sparkles, Check, ArrowRight, BookOpen, Trash2 } from 'lucide-react';

interface EfemeridesAdminClientProps {
  initialItems: EphemerisItem[];
}

export const EfemeridesAdminClient: React.FC<EfemeridesAdminClientProps> = ({
  initialItems,
}) => {
  const [itemsList, setItemsList] = useState<EphemerisItem[]>(initialItems);
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
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(`Aviso de IA: ${data.error || 'Error desconocido al consultar Gemini'}`);
        return;
      }

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setAiSuggestions(data.data);
        if (data.tokenUsage) {
          setAiDebugInfo(data.tokenUsage);
        }

        // Autofill with first suggestion
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
      }
    } catch (e: any) {
      console.error(e);
      alert(`Error de conexión: ${e?.message}`);
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

  const handleCategoryChange = (catId: EphemerisCategory) => {
    const found = categories.find((c) => c.id === catId);
    setFormData({
      ...formData,
      category: catId,
      categoryLabel: found?.label || 'Efeméride',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    setItemsList([newItem, ...itemsList]);
    setAiSuggestions([]);
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
    alert(`¡Efeméride "${newItem.title}" agregada al calendario histórico!`);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta efeméride?')) {
      setItemsList(itemsList.filter((i) => i.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Gestión de Efemérides Musicales"
        subtitle="Carga y consulta de hitos históricos: SADAIC, Billboard, Cosquín, lanzamientos y natalicios"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="lg:col-span-6 natural-card p-5 sm:p-6 rounded-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#2d2f38]">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#e6cca0]">
                Efeméride para el {formData.day} de {monthNames[formData.month - 1]}
              </h2>
              <p className="text-[11px] text-[#8c887f]">Consulta a lo largo de toda la historia musical</p>
            </div>

            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={loadingAI}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sand-soft text-xs font-semibold hover:bg-[#e6cca0]/20 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{loadingAI ? 'Investigando...' : 'Consultar a Gemini'}</span>
            </button>
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

          {/* AI Debug / Token Usage Info */}
          {aiDebugInfo && (
            <div className="flex items-center justify-between text-[10px] px-3 py-1.5 rounded-lg bg-[#18191e] border border-[#2d2f38] text-[#93a887]">
              <span>✅ Respuesta en vivo de Gemini 1.5 Flash</span>
              <span>Tokens: {aiDebugInfo.totalTokenCount || aiDebugInfo.promptTokenCount}</span>
            </div>
          )}

          {/* AI Suggestions Pill Options */}
          {aiSuggestions.length > 1 && (
            <div className="p-3 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-2">
              <span className="text-[11px] font-bold text-[#93a887] block">
                Otros hitos encontrados para el {formData.day} de {monthNames[formData.month - 1]}:
              </span>
              <div className="space-y-1.5">
                {aiSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAiOption(sug)}
                    className="w-full text-left text-xs p-2 rounded-lg bg-[#24252c] hover:bg-[#2c2e37] border border-[#31333d] flex items-center justify-between text-[#aba79e] hover:text-[#f3f1ec] transition-colors"
                  >
                    <span className="truncate">
                      <strong>({sug.year})</strong> {sug.title}
                    </span>
                    <ArrowRight className="w-3 h-3 flex-shrink-0 text-[#e6cca0]" />
                  </button>
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
                    onClick={() => handleDelete(item.id)}
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
    </div>
  );
};
