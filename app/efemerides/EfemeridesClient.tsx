'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { EphemerisItem } from '../../lib/types';
import { Calendar, BookOpen, Search, Loader2 } from 'lucide-react';
import { ShareButton } from '../../components/ShareButton';

interface EfemeridesClientProps {
  initialItems: EphemerisItem[];
  initialDay?: number;
  initialMonth?: number;
}

export const EfemeridesClient: React.FC<EfemeridesClientProps> = ({
  initialItems,
  initialDay,
  initialMonth,
}) => {
  const now = new Date();
  const defaultDay = initialDay ?? now.getDate();
  const defaultMonth = initialMonth ?? (now.getMonth() + 1);

  const [items, setItems] = useState<EphemerisItem[]>(initialItems);
  const [searchResults, setSearchResults] = useState<EphemerisItem[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(defaultDay);
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultMonth);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [syncingDate, setSyncingDate] = useState<boolean>(false);
  const syncedKeysRef = useRef<Set<string>>(
    new Set(initialItems.length > 0 ? [`${defaultDay}-${defaultMonth}`] : [])
  );

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

  // Sincronización bajo demanda si una fecha seleccionada aún no tiene registros en PocketBase
  useEffect(() => {
    const hasForDate = items.some((i) => i.day === selectedDay && i.month === selectedMonth);
    const key = `${selectedDay}-${selectedMonth}`;
    if (hasForDate || syncedKeysRef.current.has(key)) return;

    syncedKeysRef.current.add(key);
    let isMounted = true;
    setSyncingDate(true);

    fetch(`/api/efemerides/sync?day=${selectedDay}&month=${selectedMonth}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && Array.isArray(data?.items) && data.items.length > 0) {
          setItems((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newOnes = data.items.filter((it: EphemerisItem) => !existingIds.has(it.id));
            return [...prev, ...newOnes];
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setSyncingDate(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDay, selectedMonth, items]);

  // Búsqueda global en el archivo de PocketBase cuando el usuario escribe en el buscador
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(() => {
      setSyncingDate(true);
      fetch(`/api/efemerides/sync?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && Array.isArray(data?.items)) {
            setSearchResults(data.items);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setSyncingDate(false);
        });
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const filteredItems = useMemo(() => {
    const sourceList = searchQuery.trim().length >= 2 && searchResults !== null ? searchResults : items;
    return sourceList.filter((item) => {
      const matchesDate = !searchQuery.trim() ? (item.day === selectedDay && item.month === selectedMonth) : true;
      const matchesCat = selectedCategory === 'todas' || item.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesText =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.artistRelated && item.artistRelated.toLowerCase().includes(q)) ||
        (item.source && item.source.toLowerCase().includes(q));

      return matchesDate && matchesCat && matchesText;
    });
  }, [items, searchResults, selectedDay, selectedMonth, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#e6cca0]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Archivo Histórico del Patrimonio Musical</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#f3f1ec]">
            Efemérides Musicales
          </h1>
          <p className="text-[#aba79e] text-xs sm:text-sm max-w-2xl">
            Lanzamientos fundacionales, registros en SADAIC, hitos en Billboard, festivales de Cosquín, Jesús María y tributos de la música argentina y latinoamericana.
          </p>
        </div>

        <ShareButton
          title="Efemérides Musicales | GUTA MÚSICA"
          text="Descubrí los lanzamientos, hitos y fechas históricas de la música argentina y latinoamericana en GUTA MÚSICA."
        />
      </div>

      {/* Date & Filter Selector Bar */}
      <div className="natural-card p-5 rounded-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Day & Month Selectors */}
          <div className="sm:col-span-3">
            <label className="text-[11px] text-[#8c887f] block mb-1 font-medium">Día</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="text-[11px] text-[#8c887f] block mb-1 font-medium">Mes</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
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
            <label className="text-[11px] text-[#8c887f] block mb-1 font-medium">Buscar en todo el archivo</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8c887f] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ej: Charly García, SADAIC, 1985..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] placeholder-[#78746c] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>
          </div>
        </div>

        {/* Categories Pills */}
        <div className="pt-2 border-t border-[#2a2c35] flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-[#8c887f] font-semibold mr-1">Filtrar categoría:</span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  isSelected
                    ? 'bg-[#d97d64] text-[#151618] font-bold'
                    : 'bg-[#24252c] text-[#aba79e] hover:bg-[#2c2e37] hover:text-[#f3f1ec] border border-[#31333d]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Header Indicator */}
      <div className="flex items-center justify-between px-1 text-xs text-[#8c887f]">
        <span className="font-semibold text-[#f3f1ec] flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-[#e6cca0]" />
          {searchQuery ? `Resultados de búsqueda: "${searchQuery}"` : `Efemérides del ${selectedDay} de ${months[selectedMonth - 1].name}`}
        </span>
        <span>{filteredItems.length} registros</span>
      </div>

      {/* Timeline Cards */}
      {filteredItems.length > 0 ? (
        <div className="space-y-3.5">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="natural-card p-5 rounded-2xl flex flex-col sm:flex-row gap-5 items-start justify-between"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-sand-soft">
                      Año {item.year}
                    </span>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-[#24252c] text-[#aba79e]">
                      {item.categoryLabel}
                    </span>
                    {item.impactBadge && (
                      <span className="text-[11px] font-medium text-[#d97d64] bg-terracotta-soft px-2 py-0.5 rounded">
                        {item.impactBadge}
                      </span>
                    )}
                  </div>

                  <ShareButton
                    title={`${item.title} (${item.year}) | Efemérides GUTA MÚSICA`}
                    text={`${item.title} — ${item.description}`}
                    variant="compact"
                  />
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-[#f3f1ec] leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#aba79e] leading-relaxed max-w-3xl">
                  {item.description}
                </p>

                {item.source && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <p className="text-[11px] text-[#78746c]">
                      Fuente de verificación: <strong className="text-[#aba79e]">{item.source}</strong>
                    </p>
                    {item.mbid && (
                      <a
                        href={`https://musicbrainz.org/artist/${item.mbid}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#93a887]/15 text-[#93a887] border border-[#93a887]/30 hover:bg-[#93a887]/25 transition-colors"
                      >
                        ✓ Verificado en MusicBrainz
                      </a>
                    )}
                    {item.originCity && item.country && (
                      <span className="text-[10px] text-[#8c887f] bg-[#1a1b1f] px-2 py-0.5 rounded border border-[#2d2f38]">
                        📍 {item.originCity}, {item.country}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {item.imageUrl && (
                <div className="relative w-full sm:w-36 aspect-video sm:aspect-square rounded-xl overflow-hidden border border-[#2d2f38] flex-shrink-0">
                  <Image src={item.imageUrl} alt={item.title} fill sizes="(max-width: 640px) 100vw, 144px" className="object-cover" />
                </div>
              )}
            </article>
          ))}
        </div>
      ) : syncingDate ? (
        <div className="text-center py-12 natural-card rounded-2xl space-y-3">
          <Loader2 className="w-8 h-8 text-[#d97d64] mx-auto animate-spin" />
          <h3 className="text-base font-bold text-[#f3f1ec]">
            Sincronizando efemérides del {selectedDay} de {months[selectedMonth - 1].name}...
          </h3>
          <p className="text-xs text-[#8c887f] max-w-xs mx-auto">
            Consultando fuentes históricas verificadas y guardando en el archivo.
          </p>
        </div>
      ) : (
        <div className="text-center py-12 natural-card rounded-2xl space-y-2">
          <BookOpen className="w-8 h-8 text-[#78746c] mx-auto" />
          <h3 className="text-base font-bold text-[#f3f1ec]">No se registraron efemérides para esta fecha</h3>
          <p className="text-xs text-[#8c887f] max-w-xs mx-auto">
            Probá seleccionando otra fecha en el calendario o buscando por nombre de artista.
          </p>
        </div>
      )}
    </div>
  );
};
