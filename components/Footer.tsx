'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music2 } from 'lucide-react';
import { OfficialSocialsBar } from './OfficialSocialsBar';
import { useL10n } from './I18nProvider';
import { MusicDataService } from '../lib/api';
import { DEFAULT_OFFICIAL_SOCIALS } from '../lib/socialUtils';
import { OfficialSocialsSettings } from '../lib/types';

export const Footer: React.FC = () => {
  const [socials, setSocials] = useState<OfficialSocialsSettings>(DEFAULT_OFFICIAL_SOCIALS);
  const pathname = usePathname();
  const { t } = useL10n();

  useEffect(() => {
    let isMounted = true;
    MusicDataService.getOfficialSocials()
      .then((data) => {
        if (isMounted && data) {
          setSocials(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="border-t border-[#2a2c35] bg-[#111214] text-[#8c887f] pt-14 pb-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#24262f]">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-3.5 md:col-span-1">
            <Link href="/" className="inline-block group" aria-label="GUTA MÚSICA - Inicio">
              <img
                src="/brand/guta-musica-logo.svg"
                alt="GUTA MÚSICA"
                className="h-10 w-auto object-contain transition-opacity group-hover:opacity-90"
              />
            </Link>
            <p className="text-xs text-[#8c887f] leading-relaxed">
              {t.footerMission}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#18191e] border border-[#2c2f3a] text-[11px] text-[#aba79e]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e6cca0] shrink-0" />
              <span>
                <strong className="notranslate text-[#f3f1ec] font-semibold">Guta Música</strong> es un producto de{' '}
                <strong className="notranslate text-[#e6cca0] font-semibold"> G-Music Producciones®</strong>
              </span>
            </div>
            <div className="pt-1">
              <OfficialSocialsBar settings={socials} variant="footer" showLabel={true} />
            </div>
          </div>


          {/* Col 2: Secciones */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#f3f1ec]">
              {t.footerSections}
            </h4>
            <ul className="space-y-1.5 text-xs text-[#aba79e]">
              <li>
                <Link href="/artistas" className="hover:text-[#e6cca0] transition-colors">{t.navArtists}</Link>
              </li>
              <li>
                <Link href="/profesionales" className="hover:text-[#e6cca0] transition-colors">{t.navProfessionals}</Link>
              </li>
              <li>
                <Link href="/entrevistas" className="hover:text-[#e6cca0] transition-colors">{t.navInterviews}</Link>
              </li>
              <li>
                <Link href="/efemerides" className="hover:text-[#e6cca0] transition-colors">{t.navEphemerides}</Link>
              </li>
              <li>
                <Link href="/contacto" className="hover:text-[#e6cca0] transition-colors font-medium text-[#f3f1ec]">{t.navContact}</Link>
              </li>
              <li>
                <Link href="/registro" className="text-[#d97d64] hover:text-[#e6cca0] font-semibold transition-colors">+ {t.registerBandBtn}</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Géneros & Cobertura */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#f3f1ec]">
              {t.footerGenres}
            </h4>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['Folklore', 'Rock', 'Tango', 'Hip Hop', 'Música Urbana', 'Música Popular', 'Indie', 'Fusión'].map((g) => (
                <Link
                  key={g}
                  href={`/artistas?genre=${encodeURIComponent(g)}`}
                  className="px-2 py-0.5 rounded bg-[#1c1d22] border border-[#2b2d36] hover:border-[#404351] hover:text-[#f3f1ec] text-[#aba79e] text-[11px] transition-colors"
                >
                  {g}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 4: Canales Humanos & Dirección */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#f3f1ec]">
              {t.footerContactChannels}
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#18191e] border border-[#272932] space-y-0.5">
                <span className="text-[#e6cca0] font-bold text-[10px] uppercase tracking-wider block">
                  {t.footerCommercialPress}
                </span>
                <a
                  href="mailto:contacto@guta.musica.ar"
                  className="notranslate text-[#f3f1ec] hover:text-[#d97d64] font-semibold transition-colors block break-all"
                >
                  contacto@guta.musica.ar
                </a>
                <Link
                  href="/contacto#formulario-consultas"
                  className="text-[11px] text-[#d97d64] hover:underline inline-block pt-0.5 font-medium"
                >
                  {t.footerOpenForm}
                </Link>
              </div>

              <div className="p-2.5 rounded-lg bg-[#18191e] border border-[#272932] space-y-0.5">
                <span className="text-[#d97d64] font-bold text-[10px] uppercase tracking-wider block">
                  {t.footerArtistSupport}
                </span>
                <a
                  href="mailto:soporte@guta.musica.ar"
                  className="notranslate text-[#f3f1ec] hover:text-[#e6cca0] font-semibold transition-colors block break-all"
                >
                  soporte@guta.musica.ar
                </a>
              </div>

              <div className="px-2.5 py-2 rounded-lg bg-[#18191e]/60 border border-[#24262f] text-[11px] flex items-center justify-between">
                <span className="text-[#8c887f]">{t.footerEditorialDir}</span>
                <span className="notranslate text-[#f3f1ec] font-semibold">Guta Flores</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom credits */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-[#78746c] gap-3">
          <p>
            © {new Date().getFullYear()} <span className="notranslate">GUTA MÚSICA</span>. {t.footerRights}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[#78746c]">
            <span>{t.footerMadeWith}</span>
            <span className="text-[#363842]">•</span>
            <span>
              Desarrollado por <strong className="notranslate text-[#aba79e] font-semibold"> Milonguita</strong>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
