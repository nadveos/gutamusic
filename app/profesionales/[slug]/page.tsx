import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  getProfessionalBySlugOrId,
  getProfessionalFeaturedStatus,
} from '@/lib/services/professionalsService';
import { getProfessionalCategoryInfo } from '@/lib/constants/professionalCategories';
import {
  ArrowLeft,
  MapPin,
  Laptop,
  MessageCircle,
  Phone,
  Globe,
  CheckCircle2,
  Headphones,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { InstagramIcon, SpotifyIcon, YouTubeIcon } from '@/lib/socialUtils';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const prof = await getProfessionalBySlugOrId(slug);
  if (!prof) {
    return { title: 'Profesional no encontrado | GUTA MÚSICA' };
  }
  const cat = getProfessionalCategoryInfo(prof.roleCategory);
  const desc = prof.shortBio || prof.bio || `${prof.name} (${cat.label}) en GUTA MÚSICA.`;
  return {
    title: `${prof.name} — ${cat.label} | GUTA MÚSICA`,
    description: desc,
    openGraph: {
      title: `${prof.name} — ${cat.label} | GUTA MÚSICA`,
      description: desc,
      images: [prof.photoUrl || '/brand/guta-musica-logo.png'],
    },
  };
}

function getYoutubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function getSpotifyEmbedUrl(url?: string): string | null {
  if (!url || !url.includes('spotify.com')) return null;
  const match = url.match(/spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|artist)\/([a-zA-Z0-9]+)/);
  if (!match) return null;
  return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`;
}

export default async function ProfessionalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const prof = await getProfessionalBySlugOrId(slug);

  if (!prof) {
    notFound();
  }

  const catInfo = getProfessionalCategoryInfo(prof.roleCategory);
  const featStatus = getProfessionalFeaturedStatus(prof);

  const cleanNumber = (prof.whatsapp || prof.phone || '').replace(/\D/g, '');
  const waUrl = cleanNumber
    ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(
        `Hola ${prof.name}, vi tu perfil profesional (${catInfo.label}) en GUTA MÚSICA y quería consultarte por tus servicios.`
      )}`
    : null;

  const ytEmbed = getYoutubeEmbedUrl(prof.portfolioUrl || prof.socials?.youtube);
  const spEmbed = getSpotifyEmbedUrl(prof.portfolioUrl || prof.socials?.spotify);

  return (
    <div className="min-h-screen bg-[#111215] text-[#f3f1ec] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Volver al Directorio */}
        <div className="flex items-center justify-between">
          <Link
            href="/profesionales"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#aba79e] hover:text-[#e6cca0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Directorio de Profesionales & Servicios</span>
          </Link>
        </div>

        {/* Cabecera Principal */}
        <div className="rounded-3xl bg-gradient-to-b from-[#1d1f28] to-[#15161c] border border-[#2c2f3d] p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden bg-[#101115] border-2 border-[#e6cca0]/40 shrink-0">
              {prof.photoUrl ? (
                <Image
                  src={prof.photoUrl}
                  alt={prof.name}
                  fill
                  sizes="128px"
                  className="object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#e6cca0]">
                  <Headphones className="w-10 h-10" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border ${catInfo.badgeColor}`}
                >
                  {catInfo.label}
                </span>

                {Array.isArray(prof.secondaryCategories) &&
                  prof.secondaryCategories.map((sec) => {
                    const secInfo = getProfessionalCategoryInfo(sec);
                    return (
                      <span
                        key={sec}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#222530] text-[#cfcbc4] border border-[#323646]"
                      >
                        {secInfo.label}
                      </span>
                    );
                  })}

                {featStatus.isFeaturedNow && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-[#e6cca0] text-[#121316]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{featStatus.statusBadgeLabel}</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-[#f3f1ec]">
                {prof.name}
              </h1>

              {prof.specialty && (
                <p className="text-sm sm:text-base font-bold text-[#e6cca0]">
                  {prof.specialty}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#aba79e] pt-1">
                {(prof.city || prof.province || prof.country) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#d97d64]" />
                    <span>
                      {[prof.city, prof.province, prof.country].filter(Boolean).join(', ')}
                    </span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#222530] text-[#5ce487] font-semibold">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Modalidad: {prof.modality}</span>
                </span>
              </div>
            </div>

            {/* CTA de Contacto Directo */}
            <div className="w-full sm:w-auto flex flex-col gap-2 shrink-0">
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-[#111215] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Contactar por WhatsApp</span>
                </a>
              )}
              {prof.phone && !waUrl && (
                <a
                  href={`tel:${prof.phone}`}
                  className="px-5 py-3 rounded-xl bg-[#e6cca0] text-[#121316] font-bold text-xs flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Llamar: {prof.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Contenido en 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            {/* Sobre el Profesional / Servicios */}
            <div className="rounded-2xl bg-[#17181f] border border-[#2a2d3a] p-6 space-y-4">
              <h2 className="text-lg font-bold text-[#f3f1ec]">
                Presentación & Experiencia
              </h2>
              <p className="text-sm text-[#cfcbc4] whitespace-pre-line leading-relaxed">
                {prof.bio || prof.shortBio || 'Consultá directamente por disponibilidad, tarifas y presupuestos a medida.'}
              </p>
            </div>

            {/* Servicios Ofrecidos */}
            {Array.isArray(prof.servicesList) && prof.servicesList.length > 0 && (
              <div className="rounded-2xl bg-[#17181f] border border-[#2a2d3a] p-6 space-y-4">
                <h2 className="text-lg font-bold text-[#f3f1ec]">
                  Servicios Ofrecidos
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {prof.servicesList.map((srv, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#1d1f29] border border-[#2d303f] flex items-start gap-2.5 text-xs font-semibold text-[#f3f1ec]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#5ce487] shrink-0 mt-0.5" />
                      <span>{srv}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha: Portfolio Multimedia y Redes */}
          <div className="lg:col-span-5 space-y-6">
            {(ytEmbed || spEmbed) && (
              <div className="rounded-2xl bg-[#17181f] border border-[#2a2d3a] p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#e6cca0] uppercase tracking-wider">
                  Portfolio / Trabajos Realizados
                </h3>
                {ytEmbed && (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                    <iframe
                      src={ytEmbed}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`Portfolio de ${prof.name}`}
                    />
                  </div>
                )}
                {spEmbed && (
                  <iframe
                    src={spEmbed}
                    width="100%"
                    height="352"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    className="rounded-xl"
                    title={`Spotify de ${prof.name}`}
                  />
                )}
              </div>
            )}

            <div className="rounded-2xl bg-[#17181f] border border-[#2a2d3a] p-5 space-y-4">
              <h3 className="text-sm font-bold text-[#e6cca0] uppercase tracking-wider">
                Redes & Enlaces Oficiales
              </h3>
              <div className="space-y-2.5">
                {prof.socials?.instagram && (
                  <a
                    href={
                      prof.socials.instagram.startsWith('http')
                        ? prof.socials.instagram
                        : `https://instagram.com/${prof.socials.instagram.replace(/^@/, '')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1e202a] hover:bg-[#252836] border border-[#2d303f] text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <InstagramIcon className="w-4 h-4 text-[#E1306C]" />
                      <span>Instagram</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#aba79e]" />
                  </a>
                )}

                {prof.socials?.spotify && (
                  <a
                    href={prof.socials.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1e202a] hover:bg-[#252836] border border-[#2d303f] text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <SpotifyIcon className="w-4 h-4 text-[#1DB954]" />
                      <span>Spotify / Trabajos</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#aba79e]" />
                  </a>
                )}

                {prof.socials?.youtube && (
                  <a
                    href={prof.socials.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1e202a] hover:bg-[#252836] border border-[#2d303f] text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <YouTubeIcon className="w-4 h-4 text-[#FF0000]" />
                      <span>Canal de YouTube</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#aba79e]" />
                  </a>
                )}

                {prof.socials?.website && (
                  <a
                    href={
                      prof.socials.website.startsWith('http')
                        ? prof.socials.website
                        : `https://${prof.socials.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-[#1e202a] hover:bg-[#252836] border border-[#2d303f] text-xs font-semibold transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#e6cca0]" />
                      <span>Sitio Web / Portfolio</span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#aba79e]" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
