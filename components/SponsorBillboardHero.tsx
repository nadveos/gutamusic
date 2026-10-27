'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlliancePartner } from '../lib/types';
import { MusicDataService } from '../lib/api';
import {
  Sparkles,
  MessageCircle,
  Globe,
  Phone,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
} from 'lucide-react';

interface SponsorBillboardHeroProps {
  initialSponsors?: AlliancePartner[];
}

export const SponsorBillboardHero: React.FC<SponsorBillboardHeroProps> = ({ initialSponsors }) => {
  const [sponsors, setSponsors] = useState<AlliancePartner[]>(initialSponsors || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Cargar sponsors que tengan sector === 'all_sections'
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

  // Animación de scroll reveal con IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Rotación automática si hay más de 1 sponsor premium
  useEffect(() => {
    if (sponsors.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sponsors.length);
    }, 7500);

    return () => clearInterval(interval);
  }, [sponsors.length]);

  if (!sponsors || sponsors.length === 0) {
    return null;
  }

  const current = sponsors[currentIndex] || sponsors[0];

  const getCleanWhatsappUrl = (rawWa?: string, rawPhone?: string, name?: string) => {
    const targetNumber = (rawWa || rawPhone || '').replace(/\D/g, '');
    if (!targetNumber) return null;
    const msg = encodeURIComponent(`Hola ${name || ''}, me contacto a través de GUTA MÚSICA.`);
    return `https://wa.me/${targetNumber}?text=${msg}`;
  };

  const waUrl = getCleanWhatsappUrl(current.whatsapp, current.phone, current.name);
  const rawPhone = current.phone ? `tel:${current.phone.replace(/[^\d+]/g, '')}` : null;

  // Si tiene un banner horizontal expreso o no
  const hasDedicatedBanner = Boolean(current.bannerUrl);

  return (
    <div
      ref={containerRef}
      className={`my-8 transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.98]'
      }`}
    >
      <div className="relative w-full rounded-2xl overflow-hidden border-2 border-[#e6cca0]/80 shadow-2xl shadow-[#e6cca0]/15 bg-gradient-to-r from-[#171821] via-[#1f212c] to-[#14151b] group">
        {/* Efecto de luz ambiental animada en esquina */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#e6cca0]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#d97d64]/15 rounded-full blur-3xl pointer-events-none" />

        {/* CASO A: TIENE BANNER HORIZONTAL PERSONALIZADO */}
        {hasDedicatedBanner && current.bannerUrl ? (
          <div className="relative w-full min-h-[180px] sm:min-h-[220px] flex items-center p-6 sm:p-8">
            <Image
              src={current.bannerUrl}
              alt={current.name}
              fill
              className="object-cover object-center"
              sizes="100vw"
            />
            {/* Overlay gradiente para legibilidad óptima */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#121316]/95 via-[#121316]/80 to-transparent z-10" />

            <div className="relative z-20 max-w-xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-[#e6cca0] to-[#d97d64] text-[#121316] shadow-sm">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Patrocinador Oficial de la Música Federal</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                {current.name}
              </h3>
              {current.description && (
                <p className="text-xs sm:text-sm text-[#e0ded8] line-clamp-2 max-w-lg leading-relaxed">
                  {current.description}
                </p>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-3">
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-[#121316] font-bold text-xs transition-all shadow-md shadow-[#25D366]/20"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Contactar por WhatsApp</span>
                  </a>
                )}
                {current.websiteUrl && (
                  <a
                    href={current.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#242732]/90 hover:bg-[#313543] text-[#f3f1ec] border border-[#3f4354] font-semibold text-xs transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#e6cca0]" />
                    <span>Sitio Web / Redes</span>
                    <ExternalLink className="w-3 h-3 text-[#aba79e]" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* CASO B: GENERADOR EDITORIAL AUTOMÁTICO PURO CSS/HTML (Ultra Impactante) */
          <div className="relative z-20 p-5 sm:p-7 flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Lado Izquierdo: Logo enmarcado + Información de la Marca */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5 flex-1 min-w-0">
              {/* Contenedor del Logo / Imagen enmarcado con relieve */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#0f1013] border-2 border-[#e6cca0]/50 p-2.5 flex items-center justify-center shrink-0 shadow-lg shadow-[#0f1013]/60 overflow-hidden group-hover:border-[#e6cca0] transition-colors">
                {current.imageUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={current.imageUrl}
                      alt={current.name}
                      fill
                      sizes="112px"
                      className="object-contain object-center transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <ShieldCheck className="w-10 h-10 text-[#e6cca0]" />
                )}
              </div>

              {/* Textos y Eslogan */}
              <div className="space-y-1.5 flex-1 min-w-0">
                {current.category && (
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#252834] text-[#e6cca0] border border-[#3a3e4e]">
                      {current.category}
                    </span>
                  </div>
                )}

                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                  {current.name}
                </h3>

                <p className="text-xs sm:text-sm text-[#d4cfc7] leading-relaxed max-w-2xl line-clamp-2">
                  {current.description ||
                    'Acompaña con su auspicio el desarrollo y difusión del movimiento musical independiente federal.'}
                </p>
              </div>
            </div>

            {/* Lado Derecho: Acciones Comerciales Directas + Texto chico en margen inferior derecho */}
            <div className="flex flex-col items-center sm:items-end gap-2.5 shrink-0 w-full lg:w-auto justify-center sm:justify-end border-t lg:border-t-0 lg:border-l border-[#2e313d] pt-4 lg:pt-0 lg:pl-6">
              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-[#121316] font-black text-xs transition-all shadow-lg shadow-[#25D366]/25 hover:scale-[1.02] active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Contactar por WhatsApp</span>
                  </a>
                )}

                {current.websiteUrl && (
                  <a
                    href={current.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#252732] hover:bg-[#313543] text-[#f3f1ec] border border-[#3b3e4e] hover:border-[#e6cca0]/50 font-bold text-xs transition-colors"
                  >
                    <Globe className="w-4 h-4 text-[#e6cca0]" />
                    <span>Visitar Web</span>
                    <ExternalLink className="w-3 h-3 text-[#aba79e]" />
                  </a>
                )}

                {rawPhone && !waUrl && (
                  <a
                    href={rawPhone}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#252732] hover:bg-[#313543] text-[#e6cca0] border border-[#3b3e4e] font-bold text-xs transition-colors"
                  >
                    <Phone className="w-4 h-4 text-[#e6cca0]" />
                    <span>Llamar Directo</span>
                  </a>
                )}
              </div>

              {/* Texto discreto de aviso publicitario en el margen inferior derecho */}
              <span className="text-[10px] text-[#78746c] italic tracking-wider text-right block pt-1 select-none">
                * Este es un auspiciante PREMIUM de GUTA MÚSICA
              </span>
            </div>
          </div>
        )}

        {/* Paginador en caso de múltiples sponsors premium */}
        {sponsors.length > 1 && (
          <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-[#14151b]/80 backdrop-blur-md px-2 py-1 rounded-full border border-[#2e313d]">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + sponsors.length) % sponsors.length)}
              className="p-1 hover:text-[#e6cca0] transition-colors"
              aria-label="Anterior sponsor"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono text-[#aba79e]">
              {currentIndex + 1}/{sponsors.length}
            </span>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % sponsors.length)}
              className="p-1 hover:text-[#e6cca0] transition-colors"
              aria-label="Siguiente sponsor"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
