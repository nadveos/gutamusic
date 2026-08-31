'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlliancePartner, AllianceSector } from '../lib/types';
import { MusicDataService } from '../lib/api';
import { Phone, MessageCircle, Globe, Sparkles, ExternalLink, ShieldCheck } from 'lucide-react';

interface BrandAllianceShowcaseProps {
  sector?: AllianceSector;
  items?: AlliancePartner[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
  isPreview?: boolean;
}

export const BrandAllianceShowcase: React.FC<BrandAllianceShowcaseProps> = ({
  sector = 'global_footer',
  items: directItems,
  title,
  subtitle,
  compact = false,
  isPreview = false,
}) => {
  const pathname = usePathname();
  const [alliances, setAlliances] = useState<AlliancePartner[]>(directItems || []);
  const [loading, setLoading] = useState(!directItems);

  // Do not render on /admin pages unless explicitly in preview mode
  const isAdmin = pathname?.startsWith('/admin');
  if (isAdmin && !isPreview) {
    return null;
  }

  useEffect(() => {
    if (directItems) {
      setAlliances(directItems);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchAlliances = async () => {
      try {
        const data = await MusicDataService.getAlliances(sector, true);
        if (isMounted) {
          setAlliances(data);
        }
      } catch (err) {
        console.warn('Error loading alliances in showcase:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAlliances();
    return () => {
      isMounted = false;
    };
  }, [sector, directItems]);

  if (loading && !directItems) {
    return null;
  }

  if (!alliances || alliances.length === 0) {
    return null;
  }

  // Helper to format clean phone for WhatsApp
  const getCleanWhatsappUrl = (rawWa?: string, rawPhone?: string, name?: string) => {
    const targetNumber = (rawWa || rawPhone || '').replace(/\D/g, '');
    if (!targetNumber) return null;
    const msg = encodeURIComponent(`Hola ${name || ''}, me contacto desde la plataforma GUTA MÚSICA.`);
    return `https://wa.me/${targetNumber}?text=${msg}`;
  };

  return (
    <section
      aria-label="Espacio de Alianzas & Auspiciantes Culturales"
      className="my-10 pt-8 pb-8 border-t border-[#262832] space-y-6"
    >
      {/* Header with Title and Call to Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-sand-soft text-[#e6cca0] tracking-wider uppercase">
            <Sparkles className="w-3 h-3 text-[#e6cca0]" />
            <span>Alianzas & Auspicios Culturales</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[#f3f1ec] tracking-tight">
            {title || 'Empresas & Proyectos que Impulsan la Cultura'}
          </h3>
          <p className="text-xs text-[#aba79e] max-w-2xl">
            {subtitle ||
              'Acompañan la difusión de la música federal, luthería, producción técnica e industria independiente.'}
          </p>
        </div>

        {!isPreview && (
          <Link
            href="/contacto"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e6cca0] hover:text-[#f3f1ec] transition-colors self-start sm:self-auto py-1 px-2.5 rounded-lg bg-[#202228] border border-[#2d2f38] hover:border-[#424552]"
          >
            <span>+ Sumar mi Auspicio / Marca</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Grid of Alliances / Sponsors */}
      <div
        className={`grid grid-cols-1 ${
          compact
            ? 'sm:grid-cols-2 lg:grid-cols-3'
            : 'sm:grid-cols-2 lg:grid-cols-4'
        } gap-4`}
      >
        {alliances.map((item) => {
          const waUrl = getCleanWhatsappUrl(item.whatsapp, item.phone, item.name);
          const rawPhone = item.phone ? `tel:${item.phone.replace(/[^\d+]/g, '')}` : null;

          return (
            <div
              key={item.id || item.name}
              className="group rounded-2xl bg-[#1a1b21] border border-[#2c2e39] hover:border-[#d97d64]/60 transition-all duration-200 p-4 flex flex-col justify-between hover:shadow-xl hover:shadow-[#121316]/50"
            >
              <div className="space-y-3.5">
                {/* Adaptive Image Container: handles ANY aspect ratio (wide, square, tall) with clean framing */}
                <div className="relative w-full h-28 sm:h-32 rounded-xl bg-[#111215] border border-[#252731] p-3 flex items-center justify-center overflow-hidden transition-colors group-hover:border-[#383b48]">
                  {item.imageUrl ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={item.imageUrl}
                        alt={item.name || 'Auspiciante'}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-contain object-center transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-[#78746c] text-center p-2">
                      <ShieldCheck className="w-6 h-6 text-[#a09c93] mb-1" />
                      <span className="text-[11px] font-semibold text-[#aba79e]">{item.name}</span>
                    </div>
                  )}

                  {/* Category Pill Overlaid at Top Right */}
                  {item.category && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#1c1d24]/90 backdrop-blur-xs text-[#e6cca0] border border-[#333644] max-w-[70%] truncate">
                      {item.category}
                    </span>
                  )}
                </div>

                {/* Info block */}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#f3f1ec] group-hover:text-[#e6cca0] transition-colors leading-snug truncate">
                    {item.name}
                  </h4>
                  {item.description && (
                    <p className="text-[11px] text-[#aba79e] line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons: WhatsApp, Call, Web Link */}
              <div className="pt-3.5 mt-3 border-t border-[#262832] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#242730] hover:bg-[#25D366]/20 text-[#a0d29f] hover:text-[#5ce487] border border-[#343846] hover:border-[#25D366]/50 text-xs font-semibold transition-colors"
                      title="Contactar por WhatsApp"
                      aria-label={`WhatsApp para ${item.name}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-[11px]">WhatsApp</span>
                    </a>
                  )}

                  {rawPhone && !waUrl && (
                    <a
                      href={rawPhone}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#242730] hover:bg-[#2d313d] text-[#e6cca0] border border-[#343846] text-xs font-medium transition-colors truncate"
                      title="Llamar por teléfono"
                      aria-label={`Llamar a ${item.name}`}
                    >
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-[11px] truncate">{item.phone}</span>
                    </a>
                  )}
                </div>

                {item.websiteUrl && (
                  <a
                    href={item.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-[#202228] hover:bg-[#282b35] text-[#aba79e] hover:text-[#f3f1ec] border border-[#2d2f38] transition-colors flex-shrink-0"
                    title="Visitar sitio web / red social"
                    aria-label={`Sitio web de ${item.name}`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
