'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { EphemerisItem, EphemerisCategory } from '../../lib/types';
import { Calendar, BookOpen, Disc3, Award, Flame, Sparkles, Filter, Search, Clock } from 'lucide-react';

interface EfemeridesClientProps {
  initialItems: EphemerisItem[];
}

export const EfemeridesClient: React.FC<EfemeridesClientProps> = ({ initialItems }) => {
  const [selectedDay, setSelectedDay] = useState<number>(18);
  const [selectedMonth, setSelectedMonth] = useState<number>(8);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const months = [
    { num: 1, name: 'Enero' },
    { num: 2, name: 'Febrero' },
    { num: 3, name: 'Marzo' },
    { num: 4, name: 'Abril' },
    { num: 5, name: 'Mayo' },
    { num: 6, name: 'Junio' },
    { num: 7, name: 'Julio' },
    { num: 8, name: 'Agosto' },
    { num: 9, name: 'Septiembre' },
    { num: 10, name: 'Octubre' },
    { num: 11, name: 'Noviembre' },
    { num: 12, name: 'Diciembre' },
  ];

  const categories = [
    { id: 'todas', label: 'Todas las categorías' },
    { id: 'lanzamientos', label: 'Lanzamientos Históricos' },
    { id: 'billboard', label: 'Billboard & Récords' },
    { id: 'sadaic', label: 'Registros SADAIC' },
    { id: 'cosquin', label: 'Cosquín & Festivales' },
    { id: 'nacimientos', label: 'Nacimientos' },
    { id: 'fallecimientos', label: 'Fallecimientos' },
    { id: 'homenajes', label: 'Homenajes' },
  ];

  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      // Date filter (if searching by date when no text search)
      const matchesDate = !searchQuery ? (item.day === selectedDay && item.month === selectedMonth) : true;

      // Category filter
      const matchesCat = selectedCategory === 'todas' || item.category === selectedCategory;

      // Text query
      const q = searchQuery.toLowerCase().trim();
      const matchesText =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.artistRelated && item.artistRelated.toLowerCase().includes(q)) ||
        (item.source && item.source.toLowerCase().includes(q));

      return matchesDate && matchesCat && matchesText;
    });
  }, [initialItems, selectedDay, selectedMonth, selectedCategory, searchQuery]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
          <BookOpen className="w-4 h-4" />
          <span>Archivo Histórico del Patrimonio Musical</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          Efemérides Musicales
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-2xl">
          Lanzamientos fundacionales, registros en SADAIC, hitos en Billboard, festivales de Cosquín, Jesús María y tributos de la música argentina y latinoamericana.
        </p>
      </div>

      {/* Date & Filter Selector Bar */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          {/* Day & Month Selectors */}
          <div className="sm:col-span-3">
            <label className="text-xs text-gray-400 block mb-1.5 font-medium">Día</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-[#11141f] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400/60"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="text-xs text-gray-400 block mb-1.5 font-medium">Mes</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl bg-[#11141f] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-400/60"
            >
              {months.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div className="sm:col-span-5">
            <label className="text-xs text-gray-400 block mb-1.5 font-medium">Buscar en todo el archivo</label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ej: Charly García, SADAIC, 1985..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-amber-400/60"
              />
            </div>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-gray-400 font-semibold mr-1">Filtrar categoría:</span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Header Indicator */}
      <div className="flex items-center justify-between px-2 text-sm text-gray-400">
        <span className="font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          {searchQuery ? `Resultados de búsqueda: "${searchQuery}"` : `Efemérides del ${selectedDay} de ${months[selectedMonth - 1].name}`}
        </span>
        <span>{filteredItems.length} hitos históricos encontrados</span>
      </div>

      {/* Timeline Cards */}
      {filteredItems.length > 0 ? (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 hover:border-amber-400/30 transition-all flex flex-col sm:flex-row gap-6 items-start justify-between group"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-black px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Año {item.year}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/5 text-gray-300">
                    {item.categoryLabel}
                  </span>
                  {item.impactBadge && (
                    <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                      {item.impactBadge}
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-amber-300 transition-colors leading-tight">
                  {item.title}
                </h3>

                <p className="text-sm text-gray-300 leading-relaxed max-w-3xl font-light">
                  {item.description}
                </p>

                {item.source && (
                  <p className="text-xs text-gray-400 pt-1">
                    Fuente de verificación: <strong className="text-gray-300">{item.source}</strong>
                  </p>
                )}
              </div>

              {item.imageUrl && (
                <div className="relative w-full sm:w-44 aspect-video sm:aspect-square rounded-2xl overflow-hidden border border-white/10 flex-shrink-0">
                  <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform" />
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 glass-card rounded-3xl border border-white/10 space-y-3">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">No se registraron efemérides para esta fecha</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Probá seleccionando el 18 o 19 de Agosto, o buscando un artista como "Charly", "Soda" o "Mercedes Sosa".
          </p>
        </div>
      )}
    </div>
  );
};
