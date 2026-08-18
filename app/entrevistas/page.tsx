import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MusicDataService } from '../../lib/api';
import { Radio, Play, Calendar, User, ArrowRight, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Entrevistas & Sesiones en Vivo | GUTA MÚSICA',
  description: 'Videoteca exclusiva de entrevistas a fondo y acústicos de artistas emergentes con Guta Flores.',
};

export default async function EntrevistasPage() {
  const interviews = await MusicDataService.getInterviews();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-400">
          <Radio className="w-4 h-4" />
          <span>Videoteca Editorial</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          Entrevistas & Acústicos GUTA
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-2xl">
          Charlas mano a mano, procesos de composición, grabaciones en vivo y la mirada de los artistas independientes conducido por Guta Flores.
        </p>
      </div>

      {/* Grid of Interviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {interviews.map((item) => (
          <article
            key={item.id}
            className="group rounded-3xl overflow-hidden glass-card border border-white/10 hover:border-rose-500/40 transition-all flex flex-col justify-between"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              <Image
                src={item.thumbnailUrl}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <div className="absolute top-3 left-3 z-10">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-rose-600 text-white shadow-md">
                  {item.category}
                </span>
              </div>

              <Link
                href={`/entrevistas/${item.slug}`}
                className="absolute inset-0 flex items-center justify-center z-10"
              >
                <div className="w-14 h-14 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 fill-white ml-0.5" />
                </div>
              </Link>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    {item.host}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    {item.date}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white group-hover:text-rose-300 transition-colors leading-tight">
                  {item.title}
                </h2>

                <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed font-light">
                  {item.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400">{item.artistName}</span>
                <Link
                  href={`/entrevistas/${item.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <span>Ver entrevista completa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
