import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Interview } from '../lib/types';
import { Radio, User, Calendar, Play, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface FeaturedInterviewCardProps {
  interview: Interview;
}

export const FeaturedInterviewCard: React.FC<FeaturedInterviewCardProps> = ({ interview }) => {
  return (
    <section className="rounded-3xl glass-card border border-white/10 p-6 sm:p-10 my-10 relative overflow-hidden shadow-2xl">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-rose-400 block">
              Entrevista Exclusiva GUTA
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {interview.artistName} en el Living
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            <User className="w-3.5 h-3.5 text-amber-400" />
            Conducción: <strong className="text-gray-200">{interview.host}</strong>
          </span>
          <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            {interview.date}
          </span>
        </div>
      </div>

      {/* Main Grid: Video Preview + Editorial */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 relative z-10 items-center">
        {/* Left: Video / Media block */}
        <div className="lg:col-span-5 relative">
          <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-lg group">
            <Image
              src={interview.thumbnailUrl}
              alt={interview.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            <Link
              href={`/entrevistas/${interview.slug}`}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7 fill-white ml-1" />
              </div>
            </Link>

            <span className="absolute bottom-3 left-3 text-xs font-bold px-2.5 py-1 rounded-md bg-black/80 text-rose-300 border border-rose-400/30">
              {interview.category}
            </span>
          </div>
        </div>

        {/* Right: Editorial & Highlights */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            {interview.title}
          </h3>

          <p className="text-sm text-gray-300 leading-relaxed font-light">
            {interview.summary}
          </p>

          {/* Highlights */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Puntos Destacados de la Charla
            </span>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-400">
              {interview.keyHighlights.map((hl, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-white/[0.02] p-2 rounded-lg border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{hl}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-4 pt-3">
            <Link
              href={`/entrevistas/${interview.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 transition-all"
            >
              <span>Leer Nota & Ver Entrevista Completa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href={`/artistas/${interview.artistSlug}`}
              className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-amber-400 transition-colors"
            >
              <span>Ver ficha y agenda de {interview.artistName} →</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
