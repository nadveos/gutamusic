import React from 'react';
import Link from 'next/link';
import { EphemerisItem } from '../lib/types';
import { Calendar, BookOpen, ArrowRight, Award, Disc3, Flame } from 'lucide-react';

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

  const getCategoryBadge = (category: string, label: string) => {
    switch (category) {
      case 'lanzamientos':
        return <span className="bg-sage-soft px-2 py-0.5 rounded text-[11px] font-semibold">{label}</span>;
      case 'billboard':
        return <span className="bg-sand-soft px-2 py-0.5 rounded text-[11px] font-semibold">{label}</span>;
      case 'sadaic':
        return <span className="bg-slate-soft px-2 py-0.5 rounded text-[11px] font-semibold">{label}</span>;
      case 'cosquin':
      case 'jesus_maria':
        return <span className="bg-terracotta-soft px-2 py-0.5 rounded text-[11px] font-semibold">{label}</span>;
      default:
        return <span className="bg-[#272932] text-[#c5c0b6] px-2 py-0.5 rounded text-[11px] font-semibold">{label}</span>;
    }
  };

  return (
    <section className="rounded-2xl natural-card p-6 sm:p-8 space-y-5 my-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2d2f38]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#e6cca0]">
            <Calendar className="w-3.5 h-3.5" />
            <span>Efemérides Musicales del Día</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#f3f1ec]">
            Un día como hoy: <span className="text-[#e6cca0]">{day} de {monthNames[month - 1]}</span>
          </h2>
        </div>

        <Link
          href="/efemerides"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#aba79e] hover:text-[#f3f1ec] transition-colors self-start sm:self-auto"
        >
          <span>Ver calendario histórico</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Timeline items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl bg-[#24252c] border border-[#31333d] hover:border-[#464956] transition-colors flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                {getCategoryBadge(item.category, item.categoryLabel)}
                <span className="text-xs font-bold text-[#e6cca0] bg-[#1e1f24] px-2 py-0.5 rounded border border-[#383a46]">
                  Año {item.year}
                </span>
              </div>

              <h3 className="text-base font-bold text-[#f3f1ec] leading-snug">
                {item.title}
              </h3>

              <p className="text-xs text-[#aba79e] leading-relaxed">
                {item.description}
              </p>
            </div>

            {item.source && (
              <div className="pt-2 border-t border-[#2e3039] flex items-center justify-between text-[11px] text-[#8c887f]">
                <span className="truncate">Fuente: {item.source}</span>
                {item.impactBadge && (
                  <span className="text-[#e6cca0] font-medium">{item.impactBadge}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Categories Bar */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-[#8c887f] bg-[#18191d] p-3 rounded-xl border border-[#2a2c35]">
        <span className="text-[#aba79e] font-medium">Registros históricos incluidos:</span>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-[#24252c] text-[#93a887]">Lanzamientos</span>
          <span className="px-2 py-0.5 rounded bg-[#24252c] text-[#e6cca0]">Billboard Latino</span>
          <span className="px-2 py-0.5 rounded bg-[#24252c] text-[#a7b8c8]">SADAIC</span>
          <span className="px-2 py-0.5 rounded bg-[#24252c] text-[#d97d64]">Cosquín & Festivales</span>
        </div>
      </div>
    </section>
  );
};
