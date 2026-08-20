import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Interview } from '../lib/types';
import { Radio, User, Calendar, Play, ArrowRight, CheckCircle2 } from 'lucide-react';

interface FeaturedInterviewCardProps {
  interview: Interview;
}

export const FeaturedInterviewCard: React.FC<FeaturedInterviewCardProps> = ({ interview }) => {
  return (
    <section className="rounded-2xl natural-card p-6 sm:p-8 my-8 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#2d2f38] relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-lg bg-[#272932] text-[#d97d64] border border-[#393c4a]">
            <Radio className="w-4 h-4" />
          </span>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d97d64] block">
              Entrevista Exclusiva GUTA
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#f3f1ec]">
              {interview.artistName} en el Living
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#aba79e]">
          <span className="flex items-center gap-1.5 bg-[#24252c] px-3 py-1.5 rounded-lg border border-[#31333d]">
            <User className="w-3.5 h-3.5 text-[#e6cca0]" />
            Conducción: <strong className="text-[#f3f1ec]">{interview.host}</strong>
          </span>
          <span className="flex items-center gap-1.5 bg-[#24252c] px-3 py-1.5 rounded-lg border border-[#31333d]">
            <Calendar className="w-3.5 h-3.5 text-[#93a887]" />
            {interview.date}
          </span>
        </div>
      </div>

      {/* Main Grid: Video Preview + Editorial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 relative z-10 items-center">
        {/* Left: Video / Media block */}
        <div className="lg:col-span-5 relative">
          <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden natural-panel border border-[#31333d] group">
            <Image
              src={interview.thumbnailUrl}
              alt={interview.title}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#151618]/90 via-transparent to-transparent" />

            <Link
              href={`/entrevistas/${interview.slug}`}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-14 h-14 rounded-full bg-[#d97d64] text-[#151618] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Play className="w-6 h-6 fill-[#151618] ml-0.5" />
              </div>
            </Link>

            <span className="absolute bottom-3 left-3 text-[11px] font-semibold px-2.5 py-1 rounded bg-[#1e1f24]/90 text-[#f3f1ec] border border-[#3c3f4c]">
              {interview.category}
            </span>
          </div>
        </div>

        {/* Right: Editorial & Highlights */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-[#f3f1ec] leading-snug">
            {interview.title}
          </h3>

          <p className="text-xs sm:text-sm text-[#aba79e] leading-relaxed font-normal">
            {interview.summary}
          </p>

          {/* Highlights */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] block">
              Puntos Destacados de la Charla
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#aba79e]">
              {interview.keyHighlights.map((hl, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-[#24252c] p-2 rounded-lg border border-[#31333d]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#93a887] flex-shrink-0 mt-0.5" />
                  <span>{hl}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/entrevistas/${interview.slug}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] transition-colors"
            >
              <span>Leer Nota & Ver Entrevista</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href={`/artistas/${interview.artistSlug}`}
              className="inline-flex items-center gap-1 text-xs text-[#aba79e] hover:text-[#f3f1ec] transition-colors"
            >
              <span>Ver ficha y agenda de {interview.artistName} →</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
