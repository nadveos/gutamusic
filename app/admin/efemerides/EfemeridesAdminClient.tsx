'use client';

import React, { useState } from 'react';
import { EphemerisCategory, EphemerisItem } from '../../../lib/types';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { BookOpen, Plus, Save, Sparkles, Check, Trash2, Calendar } from 'lucide-react';

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
    categoryLabel: 'Lanzamiento Histórico',
    description: '',
    source: '',
    impactBadge: '',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
  });

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
    setFormData({
      title: '',
      day: 18,
      month: 8,
      year: 1985,
      category: 'lanzamientos',
      categoryLabel: 'Lanzamiento Histórico',
      description: '',
      source: '',
      impactBadge: '',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    });
    alert(`¡Efeméride "${newItem.title}" agregada al calendario histórico!`);
  };

  return (
    <div className="space-y-10">
      <AdminHeader
        title="Gestión de Efemérides Musicales"
        subtitle="Carga y edición de hitos históricos: SADAIC, Billboard, Cosquín, nacimientos y homenajes"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-6 glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nueva Efeméride Histórica
          </h2>

          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">Título del Hito Histórico *</label>
            <input
              type="text"
              required
              placeholder="Ej: Ingreso al ranking Billboard Latino..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-300 font-semibold block mb-1.5">Día *</label>
              <input
                type="number"
                min={1}
                max={31}
                required
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 font-semibold block mb-1.5">Mes *</label>
              <input
                type="number"
                min={1}
                max={12}
                required
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 font-semibold block mb-1.5">Año Histórico *</label>
              <input
                type="number"
                required
                placeholder="1985"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">Categoría / Tipo de Registro *</label>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value as EphemerisCategory)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#11141f] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">Descripción Completa del Hecho *</label>
            <textarea
              rows={3}
              required
              placeholder="Detalle histórico de lo ocurrido en esta fecha..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-300 font-semibold block mb-1.5">Fuente de Verificación</label>
              <input
                type="text"
                placeholder="Ej: Archivo SADAIC"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-300 font-semibold block mb-1.5">Badge de Impacto</label>
              <input
                type="text"
                placeholder="Ej: Top 10 Continental"
                value={formData.impactBadge}
                onChange={(e) => setFormData({ ...formData, impactBadge: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            Guardar Efeméride
          </button>
        </form>

        {/* Existing List */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Efemérides Registradas ({itemsList.length})
          </h2>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {itemsList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl glass-card border border-white/5 hover:border-emerald-400/30 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                      {item.day}/{item.month} ({item.year})
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">
                      {item.categoryLabel}
                    </span>
                  </div>
                  {item.impactBadge && (
                    <span className="text-[10px] text-amber-400 font-bold">
                      {item.impactBadge}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
