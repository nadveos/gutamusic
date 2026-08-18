import React from 'react';
import Link from 'next/link';
import { EphemerisItem } from '../lib/types';
import { Calendar, BookOpen, Sparkles, ArrowRight, Award, Disc3, Flame, Clock } from 'lucide-react';

interface EphemeridesWidgetProps {
  items: EphemerisItem[];
  day?: number;
  month?: number;
}

export const EphemeridesWidget: React.FC<EphemeridesWidgetProps> = ({ items, day = 18, month = 8 }) => {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lanzamientos':
        return <Disc3 className="w-4 h-4 text-emerald-400" />;
      case 'billboard':
        return <Award className="w-4 h-4 text-amber-400" />;
      case 'sadaic':
        return <BookOpen className="w-4 h-4 text-cyan-400" />;
      case 'cosquin':
      case 'jesus_maria':
        return <Flame className="w-4 h-4 text-rose-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <section className="rounded-3xl glass-card border border-white/10 p-6 sm:p-8 space-y-6 my-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
            <Calendar className="w-4 h-4" />
            <span>Efemérides Musicales del Día</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Un día como hoy: <span className="text-gradient-gold">{day} de {monthNames[month - 1]}</span>
          </h2>
        </div>

        <Link
          href="/efemerides"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-amber-400 transition-colors self-start sm:self-auto"
        >
          <span>Ver calendario histórico</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Timeline items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-amber-400/30 transition-all flex flex-col justify-between space-y-3 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-md bg-white/5 text-gray-300">
                  {getCategoryIcon(item.category)}
                  {item.categoryLabel}
                </span>
                <span className="text-xs font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                  Año {item.year}
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                {item.title}
              </h3>

              <p className="text-xs text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </div>

            {item.source && (
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                <span className="truncate">Fuente: {item.source}</span>
                {item.impactBadge && (
                  <span className="text-amber-400 font-semibold">{item.impactBadge}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Category Explanatory Bar */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400 bg-black/30 p-3 rounded-xl border border-white/5">
        <span className="text-gray-300 font-medium">Registros históricos incluidos:</span>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-white/5 text-emerald-300">Lanzamientos</span>
          <span className="px-2 py-0.5 rounded bg-white/5 text-amber-300">Billboard Latino</span>
          <span className="px-2 py-0.5 rounded bg-white/5 text-cyan-300">SADAIC</span>
          <span className="px-2 py-0.5 rounded bg-white/5 text-rose-300">Cosquín & Festivales</span>
        </div>
      </div>
    </section>
  );
};
