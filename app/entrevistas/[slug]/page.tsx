import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MusicDataService } from '../../../lib/api';
import { Radio, User, Calendar, Play, ArrowLeft, CheckCircle2, MapPin, Sparkles, Share2 } from 'lucide-react';

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
    <article className="max-w-4xl mx-auto space-y-10">
      {/* Back button */}
      <Link
        href="/entrevistas"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-amber-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a todas las entrevistas</span>
      </Link>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-600/20 text-rose-400 border border-rose-600/30">
            {interview.category}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            {interview.date}
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-amber-400" />
            Conducción: <strong className="text-gray-200">{interview.host}</strong>
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
          {interview.title}
        </h1>

        {interview.subtitle && (
          <p className="text-lg text-gray-300 font-light leading-relaxed">
            {interview.subtitle}
          </p>
        )}
      </div>

      {/* Video Player */}
      <div className="glass-card p-3 sm:p-4 rounded-3xl border border-white/10 shadow-2xl space-y-3">
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10">
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
        <div className="p-4 rounded-2xl glass-panel border border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-400/40">
              <Image src={artist.photoUrl} alt={artist.stageName} fill className="object-cover" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{artist.stageName}</h4>
              <p className="text-xs text-gray-400">{artist.city}, {artist.province}</p>
            </div>
          </div>

          <Link
            href={`/artistas/${artist.slug}`}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md transition-all"
          >
            Ver Perfil Completo
          </Link>
        </div>
      )}

      {/* Key Highlights */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Puntos Clave de la Charla
        </h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-300">
          {interview.keyHighlights.map((hl, idx) => (
            <li key={idx} className="flex items-start gap-2 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{hl}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Editorial Article Body */}
      <div className="glass-card p-6 sm:p-10 rounded-3xl border border-white/10 space-y-6 text-gray-300 leading-relaxed text-sm sm:text-base whitespace-pre-line font-light">
        <h2 className="text-2xl font-bold text-white">Crónica & Reseña Periodística</h2>
        {interview.editorialText}
      </div>
    </article>
  );
}
