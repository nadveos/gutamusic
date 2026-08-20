import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MusicDataService } from '../../lib/api';
import { Radio, Play, Calendar, User, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Entrevistas & Sesiones en Vivo | GUTA MÚSICA',
  description: 'Videoteca exclusiva de entrevistas a fondo y acústicos de artistas emergentes con Guta Flores.',
};

export default async function EntrevistasPage() {
  const interviews = await MusicDataService.getInterviews();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#d97d64]">
          <Radio className="w-3.5 h-3.5" />
          <span>Videoteca Editorial</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#f3f1ec]">
          Entrevistas & Acústicos GUTA
        </h1>
        <p className="text-[#aba79e] text-xs sm:text-sm max-w-2xl">
          Charlas mano a mano, procesos de composición, grabaciones en vivo y la mirada de los artistas independientes conducido por Guta Flores.
        </p>
      </div>

      {/* Grid of Interviews */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {interviews.map((item) => (
          <article
            key={item.id}
            className="group rounded-2xl overflow-hidden natural-card transition-colors flex flex-col justify-between"
          >
            {/* Thumbnail */}
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              <Image
                src={item.thumbnailUrl}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-102 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1e1f24] via-transparent to-transparent" />

              <div className="absolute top-2.5 left-2.5 z-10">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1e1f24]/90 text-[#f3f1ec] border border-[#3c3f4c]">
                  {item.category}
                </span>
              </div>

              <Link
                href={`/entrevistas/${item.slug}`}
                className="absolute inset-0 flex items-center justify-center z-10"
              >
                <div className="w-12 h-12 rounded-full bg-[#d97d64] text-[#151618] flex items-center justify-center transition-transform group-hover:scale-105">
                  <Play className="w-5 h-5 fill-[#151618] ml-0.5" />
                </div>
              </Link>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 text-xs text-[#8c887f]">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#e6cca0]" />
                    {item.host}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#93a887]" />
                    {item.date}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-[#f3f1ec] group-hover:text-[#e6cca0] transition-colors leading-snug">
                  {item.title}
                </h2>

                <p className="text-xs text-[#aba79e] line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-[#2a2c35] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#e6cca0]">{item.artistName}</span>
                <Link
                  href={`/entrevistas/${item.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#d97d64] hover:underline transition-colors"
                >
                  <span>Ver entrevista</span>
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
