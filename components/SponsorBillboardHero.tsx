'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlliancePartner, MusicProfessional } from '../lib/types';
import { MusicDataService } from '../lib/api';
import {
  getProfessionalCategoryInfo,
  PROFESSIONAL_COURTESY_DAYS,
} from '../lib/constants/professionalCategories';
import {
  Sparkles,
  MessageCircle,
  Globe,
  Phone,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Headphones,
  MapPin,
  ArrowRight,
  UserPlus,
  Star,
} from 'lucide-react';
import { InstagramIcon } from '../lib/socialUtils';

interface SponsorBillboardHeroProps {
  initialSponsors?: AlliancePartner[];
  professionals?: MusicProfessional[];
}

function checkIsProfessionalFeatured(prof: MusicProfessional): {
  isFeatured: boolean;
  type: 'paid' | 'courtesy' | 'none';
} {
  const now = Date.now();
  if (prof.paidFeatured && prof.paidFeaturedUntil) {
    const endMs =
      prof.paidFeaturedUntil.length <= 10
        ? new Date(`${prof.paidFeaturedUntil}T23:59:59.999Z`).getTime()
        : new Date(prof.paidFeaturedUntil).getTime();
    if (!isNaN(endMs) && endMs > now) {
      return { isFeatured: true, type: 'paid' };
    }
  }

  const courtesyRaw =
    prof.courtesyFeaturedUntil ||
    (prof.submittedAt
      ? new Date(
          new Date(prof.submittedAt).getTime() +
            PROFESSIONAL_COURTESY_DAYS * 24 * 60 * 60 * 1000
        ).toISOString()
      : '');
  if (courtesyRaw) {
    const endMs =
      courtesyRaw.length <= 10
        ? new Date(`${courtesyRaw}T23:59:59.999Z`).getTime()
        : new Date(courtesyRaw).getTime();
    if (!isNaN(endMs) && endMs > now) {
      return { isFeatured: true, type: 'courtesy' };
    }
  }

  return { isFeatured: false, type: 'none' };
}

const PLACEHOLDER_SLOTS = [
  {
    badge: 'Productores & Sellos',
    title: '¿Producís música o tenés un sello?',
    subtitle: 'Ofrecé grabación, mezcla, mastering o distribución.',
    badgeClass: 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/35',
  },
  {
    badge: "DJ's & Eventos",
    title: '¿Sos DJ o musicalizás eventos?',
    subtitle: 'Sumá tu perfil, sets y contacto directo para fechas.',
    badgeClass: 'bg-[#c084fc]/15 text-[#c084fc] border-[#c084fc]/35',
  },
  {
    badge: 'Docentes & Coach Vocal',
    title: '¿Das clases de canto o instrumento?',
    subtitle: 'Conectá con alumnos de forma presencial u online.',
    badgeClass: 'bg-[#5ce487]/15 text-[#5ce487] border-[#5ce487]/35',
  },
  {
    badge: 'Sesionistas & Arreglos',
    title: '¿Sos músico, voz sesionista o arreglador?',
    subtitle: 'Mostrá tu portfolio para grabaciones y shows en vivo.',
    badgeClass: 'bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/35',
  },
];

export const SponsorBillboardHero: React.FC<SponsorBillboardHeroProps> = ({
  initialSponsors,
  professionals: initialProfessionals,
}) => {
  const [sponsors, setSponsors] = useState<AlliancePartner[]>(
    initialSponsors ? initialSponsors.filter((s) => s.sector === 'all_sections') : []
  );
  const [professionals, setProfessionals] = useState<MusicProfessional[]>(
    initialProfessionals || []
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profPage, setProfPage] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Cargar sponsors que tengan sector === 'all_sections' si no vinieron por SSR
  useEffect(() => {
    if (initialSponsors && initialSponsors.length > 0) {
      setSponsors(initialSponsors.filter((s) => s.sector === 'all_sections'));
      return;
    }

    let isMounted = true;
    const fetchSponsors = async () => {
      try {
        const all = await MusicDataService.getAlliances('all_sections', true);
        const premiumOnly = all.filter((s) => s.sector === 'all_sections');
        if (isMounted) {
          setSponsors(premiumOnly);
        }
      } catch (err) {
        console.warn('Error fetching billboard sponsors:', err);
      }
    };

    fetchSponsors();
    return () => {
      isMounted = false;
    };
  }, [initialSponsors]);

  // Cargar profesionales si no vinieron por SSR
  useEffect(() => {
    if (initialProfessionals && initialProfessionals.length > 0) {
      setProfessionals(initialProfessionals);
      return;
    }

    let isMounted = true;
    fetch('/api/professionals')
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && Array.isArray(data?.professionals)) {
          setProfessionals(data.professionals);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [initialProfessionals]);

  // Rotación automática si hay más de 1 sponsor premium
  useEffect(() => {
    if (sponsors.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sponsors.length);
    }, 7500);

    return () => clearInterval(interval);
  }, [sponsors.length]);

  const current = sponsors[currentIndex] || sponsors[0];

  const getCleanWhatsappUrl = (rawWa?: string, rawPhone?: string, name?: string) => {
    const targetNumber = (rawWa || rawPhone || '').replace(/\D/g, '');
    if (!targetNumber) return null;
    const msg = encodeURIComponent(`Hola ${name || ''}, me contacto a través de GUTA MÚSICA.`);
    return `https://wa.me/${targetNumber}?text=${msg}`;
  };

  const isInstagramUrl = (url?: string) => {
    if (!url) return false;
    return url.includes('instagram.com') || url.includes('instagr.am');
  };

  const getCleanInstagramUrl = (rawIg?: string, rawWeb?: string) => {
    const candidate = rawIg || (isInstagramUrl(rawWeb) ? rawWeb : '');
    if (!candidate) return null;
    const clean = candidate.trim();
    if (!clean) return null;
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }
    const handle = clean.replace(/^@/, '');
    return `https://www.instagram.com/${handle}`;
  };

  const waUrl = current ? getCleanWhatsappUrl(current.whatsapp, current.phone, current.name) : null;
  const igUrl = current ? getCleanInstagramUrl(current.instagramUrl, current.websiteUrl) : null;
  const showWeb =
    current?.websiteUrl && !isInstagramUrl(current.websiteUrl) ? current.websiteUrl : null;
  const rawPhone = current?.phone ? `tel:${current.phone.replace(/[^\d+]/g, '')}` : null;

  // Paginación de la fila de 4 profesionales
  const ITEMS_PER_ROW = 4;
  const totalProfPages = Math.max(1, Math.ceil(professionals.length / ITEMS_PER_ROW));
  const visibleProfessionals = professionals.slice(
    profPage * ITEMS_PER_ROW,
    profPage * ITEMS_PER_ROW + ITEMS_PER_ROW
  );
  const emptySlotsCount = Math.max(0, ITEMS_PER_ROW - visibleProfessionals.length);
  const fillerCards = PLACEHOLDER_SLOTS.slice(0, emptySlotsCount);

  return (
    <div ref={containerRef} className="my-6">
      <div className="w-full rounded-2xl border border-[#2d303e] bg-gradient-to-r from-[#13141b] via-[#181a23] to-[#13141b] p-3 sm:p-3.5 shadow-2xl">
        {/* Layout: Auspiciante más compacto a la izquierda (280px–300px) y todo el resto del ancho para los 4 boxes de Profesionales */}
        <div className="grid grid-cols-1 lg:grid-cols-[285px_minmax(0,1fr)] xl:grid-cols-[305px_minmax(0,1fr)] gap-3.5 items-stretch">
          {/* =====================================================================
              BOX IZQUIERDO COMPACTO: AUSPICIANTE PREMIUM
          ===================================================================== */}
          <div className="flex">
            {current ? (
              <div className="relative w-full rounded-xl overflow-hidden border border-[#e6cca0]/70 bg-gradient-to-br from-[#191b25] via-[#1f212d] to-[#14151c] p-3.5 flex flex-col justify-between gap-2.5 shadow-md group">
                <div className="absolute -top-14 -left-14 w-36 h-36 bg-[#e6cca0]/10 rounded-full blur-2xl pointer-events-none" />

                {/* Controles si hay más de 1 sponsor */}
                {sponsors.length > 1 && (
                  <div className="absolute top-2 right-2 z-20 flex items-center gap-0.5 bg-[#121318]/90 px-1.5 py-0.5 rounded-full border border-[#2e313d]">
                    <button
                      onClick={() =>
                        setCurrentIndex((prev) => (prev - 1 + sponsors.length) % sponsors.length)
                      }
                      className="p-0.5 hover:text-[#e6cca0] transition-colors"
                      aria-label="Anterior sponsor"
                    >
                      <ChevronLeft className="w-2.5 h-2.5" />
                    </button>
                    <span className="text-[9px] font-mono text-[#aba79e]">
                      {currentIndex + 1}/{sponsors.length}
                    </span>
                    <button
                      onClick={() => setCurrentIndex((prev) => (prev + 1) % sponsors.length)}
                      className="p-0.5 hover:text-[#e6cca0] transition-colors"
                      aria-label="Siguiente sponsor"
                    >
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}

                {/* Cabecera compacta del Auspiciante */}
                <div className="relative z-10 flex items-start gap-2.5">
                  <div className="relative w-12 h-12 rounded-xl bg-[#0f1013] border border-[#e6cca0]/50 p-1 flex items-center justify-center shrink-0 shadow-sm overflow-hidden group-hover:border-[#e6cca0] transition-colors">
                    {current.imageUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={current.imageUrl}
                          alt={current.name}
                          fill
                          sizes="48px"
                          className="object-contain object-center transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <ShieldCheck className="w-6 h-6 text-[#e6cca0]" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1">
                      {current.category && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#252834] text-[#e6cca0] border border-[#3a3e4e] leading-none">
                          {current.category}
                        </span>
                      )}
                      <span className="text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#e6cca0]/15 text-[#e6cca0] leading-none">
                        Premium
                      </span>
                    </div>

                    <h3 className="text-xs sm:text-[13px] font-black text-white leading-snug line-clamp-2 pt-0.5">
                      {current.name}
                    </h3>
                  </div>
                </div>

                <p className="relative z-10 text-[11px] text-[#cfc9bf] leading-snug line-clamp-2">
                  {current.description ||
                    'Acompaña el desarrollo del movimiento musical independiente.'}
                </p>

                {/* Botones compactos de contacto del auspiciante */}
                <div className="relative z-10 pt-2 border-t border-[#2b2e3b] flex items-center justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-1">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#20ba5a] text-[#121316] font-extrabold text-[10px] transition-all"
                      >
                        <MessageCircle className="w-3 h-3 fill-current" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {igUrl && (
                      <a
                        href={igUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#252732] hover:bg-[#E1306C]/20 text-[#f3f1ec] hover:text-[#E1306C] border border-[#3b3e4e] font-bold text-[10px] transition-colors"
                      >
                        <InstagramIcon className="w-3 h-3 text-[#E1306C]" />
                        <span>IG</span>
                      </a>
                    )}

                    {showWeb && (
                      <a
                        href={showWeb.startsWith('http') ? showWeb : `https://${showWeb}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#252732] hover:bg-[#313543] text-[#f3f1ec] border border-[#3b3e4e] font-bold text-[10px] transition-colors"
                      >
                        <Globe className="w-3 h-3 text-[#e6cca0]" />
                        <span>Web</span>
                      </a>
                    )}

                    {rawPhone && !waUrl && (
                      <a
                        href={rawPhone}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#252732] hover:bg-[#313543] text-[#e6cca0] border border-[#3b3e4e] font-bold text-[10px] transition-colors"
                      >
                        <Phone className="w-3 h-3 text-[#e6cca0]" />
                        <span>Llamar</span>
                      </a>
                    )}
                  </div>

                  <Link
                    href="/sumar-auspicio"
                    className="text-[9px] text-[#8c887f] hover:text-[#e6cca0] italic transition-colors shrink-0"
                  >
                    * Auspicio
                  </Link>
                </div>
              </div>
            ) : (
              /* Fallback si no hay sponsor activo */
              <div className="w-full rounded-xl border border-dashed border-[#e6cca0]/40 bg-[#181922] p-3.5 flex flex-col justify-between gap-2.5">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#e6cca0]">
                    <Sparkles className="w-3 h-3" /> Auspicio Premium
                  </span>
                  <h3 className="text-xs font-black text-[#f3f1ec]">
                    Impulsá la cultura con tu marca
                  </h3>
                  <p className="text-[11px] text-[#aba79e]">
                    Destacá tu comercio o empresa en portada.
                  </p>
                </div>
                <Link
                  href="/sumar-auspicio"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e6cca0] hover:bg-[#d8bc8e] text-[#151618] font-bold text-[11px] transition-colors"
                >
                  <span>Sumar Auspicio</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* =====================================================================
              ROW DERECHO AMPLIO: PROFESIONALES & SERVICIOS MUSICALES (4 BOXES)
          ===================================================================== */}
          <div className="flex flex-col justify-between rounded-xl bg-[#161821]/90 border border-[#2a2d3a] p-3 sm:p-3.5 min-w-0">
            {/* Cabecera en una sola línea limpia */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-[#d97d64]/15 border border-[#d97d64]/35 flex items-center justify-center text-[#d97d64] shrink-0">
                  <Headphones className="w-3.5 h-3.5" />
                </span>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#f3f1ec] truncate">
                  Profesionales & Servicios Musicales
                </h4>
                <span className="hidden 2xl:inline-block text-[10px] px-2 py-0.5 rounded-full bg-[#232634] text-[#e6cca0] border border-[#34384b] font-semibold shrink-0">
                  Sellos • Productores • DJ&apos;s • Docentes • Sesionistas
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {totalProfPages > 1 && (
                  <div className="flex items-center gap-1 bg-[#1f222e] px-1.5 py-0.5 rounded-lg border border-[#313545]">
                    <button
                      type="button"
                      onClick={() =>
                        setProfPage((prev) => (prev - 1 + totalProfPages) % totalProfPages)
                      }
                      className="p-0.5 text-[#aba79e] hover:text-[#e6cca0] cursor-pointer"
                      aria-label="Página anterior de profesionales"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] font-mono text-[#aba79e]">
                      {profPage + 1}/{totalProfPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setProfPage((prev) => (prev + 1) % totalProfPages)}
                      className="p-0.5 text-[#aba79e] hover:text-[#e6cca0] cursor-pointer"
                      aria-label="Siguiente página de profesionales"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <Link
                  href="/sumar-profesional"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#d97d64] hover:bg-[#c96d55] text-[#151618] font-extrabold text-[11px] transition-colors"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Registrate 100% Gratis</span>
                </Link>

                <Link
                  href="/profesionales"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#e6cca0] hover:text-[#f3f1ec] transition-colors"
                >
                  <span>Ver todos</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Grid de 4 tarjetas de Profesionales sin elementos encimados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 flex-1">
              {visibleProfessionals.map((prof) => {
                const catInfo = getProfessionalCategoryInfo(prof.roleCategory);
                const feat = checkIsProfessionalFeatured(prof);

                return (
                  <Link
                    key={prof.id}
                    href={`/profesionales/${prof.slug}`}
                    className={`group/card rounded-xl p-3 flex flex-col justify-between gap-2 transition-all border min-w-0 ${
                      feat.isFeatured
                        ? 'bg-gradient-to-b from-[#212330] to-[#191b24] border-[#e6cca0]/50 hover:border-[#e6cca0]'
                        : 'bg-[#1b1d27] border-[#2c2f3f] hover:border-[#d97d64]/60'
                    }`}
                  >
                    <div className="space-y-1.5 min-w-0">
                      {/* Fila 1: Avatar a la izquierda + Badges a la derecha (sin pisarse nunca) */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-[#111217] border border-[#353849] shrink-0">
                          <Image
                            src={prof.photoUrl || '/brand/guta-musica-logo.png'}
                            alt={prof.name}
                            fill
                            sizes="36px"
                            className="object-cover group-hover/card:scale-105 transition-transform"
                          />
                        </div>

                        <div className="flex flex-col items-end gap-1 min-w-0">
                          {feat.isFeatured && (
                            <span
                              title="Profesional Destacado"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-[#e6cca0]/20 text-[#e6cca0] border border-[#e6cca0]/40 leading-none shrink-0"
                            >
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span>Destacado</span>
                            </span>
                          )}
                          <span
                            className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none truncate max-w-full ${catInfo.badgeColor}`}
                          >
                            {catInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Fila 2: Nombre completo al 100% de ancho de la tarjeta + Especialidad */}
                      <div className="pt-0.5 min-w-0">
                        <h5 className="text-xs font-extrabold text-[#f3f1ec] group-hover/card:text-[#e6cca0] transition-colors truncate">
                          {prof.name}
                        </h5>
                        <p className="text-[10px] text-[#aba79e] line-clamp-1 leading-snug mt-0.5">
                          {prof.specialty || prof.shortBio || catInfo.shortDescription}
                        </p>
                      </div>
                    </div>

                    {/* Fila 3: Ubicación + CTA */}
                    <div className="pt-1.5 border-t border-[#282b38] flex items-center justify-between gap-1 text-[10px] text-[#8c887f]">
                      <span className="inline-flex items-center gap-1 truncate">
                        <MapPin className="w-2.5 h-2.5 text-[#d97d64] shrink-0" />
                        <span className="truncate">
                          {prof.city ? `${prof.city}` : prof.province || 'Argentina'}
                        </span>
                      </span>
                      <span className="font-bold text-[#d97d64] group-hover/card:translate-x-0.5 transition-transform shrink-0">
                        Contactar →
                      </span>
                    </div>
                  </Link>
                );
              })}

              {/* Tarjetas de invitación para completar los 4 espacios */}
              {fillerCards.map((slot, idx) => (
                <Link
                  key={`filler-${idx}`}
                  href="/sumar-profesional"
                  className="group/slot rounded-xl p-3 flex flex-col justify-between gap-2 bg-[#181a23]/70 hover:bg-[#1e212d] border border-dashed border-[#34384a] hover:border-[#d97d64]/60 transition-all min-w-0"
                >
                  <div className="space-y-1.5">
                    <span
                      className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border leading-none ${slot.badgeClass}`}
                    >
                      {slot.badge}
                    </span>
                    <h5 className="text-xs font-bold text-[#f3f1ec] group-hover/slot:text-[#e6cca0] transition-colors leading-snug line-clamp-2">
                      {slot.title}
                    </h5>
                    <p className="text-[10px] text-[#8c887f] line-clamp-2 leading-snug">
                      {slot.subtitle}
                    </p>
                  </div>

                  <div className="pt-1.5 border-t border-[#262936] flex items-center justify-between text-[10px] font-extrabold text-[#d97d64]">
                    <span>Registrate 100% Gratis</span>
                    <ArrowRight className="w-3 h-3 group-hover/slot:translate-x-0.5 transition-transform shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
