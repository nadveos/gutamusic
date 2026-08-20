import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MusicDataService } from '../../../lib/api';
import { Radio, User, Calendar, ArrowLeft, CheckCircle2 } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const interview = await MusicDataService.getInterviewBySlug(slug);

  if (!interview) {
    return { title: 'Entrevista No Encontrada | GUTA MÚSICA' };
  }

  return {
    title: `${interview.title} | GUTA MÚSICA`,
    description: interview.summary,
    openGraph: {
      title: interview.title,
      description: interview.summary,
      images: [interview.thumbnailUrl],
    },
  };
}

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const interview = await MusicDataService.getInterviewBySlug(slug);

  if (!interview) {
    notFound();
  }

  const artist = await MusicDataService.getArtistBySlug(interview.artistSlug);

  return (
    <article className="max-w-4xl mx-auto space-y-8">
      {/* Back button */}
      <Link
        href="/entrevistas"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8c887f] hover:text-[#e6cca0] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Volver a todas las entrevistas</span>
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded bg-terracotta-soft">
            {interview.category}
          </span>
          <span className="text-xs text-[#aba79e] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#93a887]" />
            {interview.date}
          </span>
          <span className="text-xs text-[#aba79e] flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-[#e6cca0]" />
            Conducción: <strong className="text-[#f3f1ec]">{interview.host}</strong>
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-[#f3f1ec] leading-tight">
          {interview.title}
        </h1>

        {interview.subtitle && (
          <p className="text-base text-[#c5c0b6] leading-relaxed">
            {interview.subtitle}
          </p>
        )}
      </div>

      {/* Video Player */}
      <div className="natural-card p-3 sm:p-4 rounded-2xl space-y-2.5">
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-[#2d2f38]">
          <iframe
            src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0"
            title={interview.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>

      {/* Artist Link Bar */}
      {artist && (
        <div className="p-4 rounded-xl natural-panel flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-[#31333d]">
              <Image src={artist.photoUrl} alt={artist.stageName} fill sizes="44px" className="object-cover" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#f3f1ec]">{artist.stageName}</h4>
              <p className="text-xs text-[#8c887f]">{artist.city}, {artist.province}</p>
            </div>
          </div>

          <Link
            href={`/artistas/${artist.slug}`}
            className="px-3.5 py-1.5 rounded-lg bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors"
          >
            Ver Perfil Completo
          </Link>
        </div>
      )}

      {/* Key Highlights */}
      <div className="natural-card p-5 rounded-2xl space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0]">
          Puntos Clave de la Charla
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#aba79e]">
          {interview.keyHighlights.map((hl, idx) => (
            <li key={idx} className="flex items-start gap-2 bg-[#24252c] p-2 rounded-lg border border-[#31333d]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#93a887] flex-shrink-0 mt-0.5" />
              <span>{hl}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Editorial Article Body */}
      <div className="natural-card p-6 sm:p-8 rounded-2xl space-y-4 text-[#aba79e] leading-relaxed text-xs sm:text-sm whitespace-pre-line">
        <h2 className="text-xl font-bold text-[#f3f1ec]">Crónica & Reseña Periodística</h2>
        {interview.editorialText}
      </div>
    </article>
  );
}
