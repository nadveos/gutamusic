'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music2 } from 'lucide-react';
import { OfficialSocialsBar } from './OfficialSocialsBar';
import { MusicDataService } from '../lib/api';
import { DEFAULT_OFFICIAL_SOCIALS } from '../lib/socialUtils';
import { OfficialSocialsSettings } from '../lib/types';

export const Footer: React.FC = () => {
  const [socials, setSocials] = useState<OfficialSocialsSettings>(DEFAULT_OFFICIAL_SOCIALS);
  const pathname = usePathname();

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
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#d97d64] flex items-center justify-center text-[#151618]">
                <Music2 className="w-4 h-4 font-bold" />
              </div>
              <span className="font-bold text-lg tracking-tight text-[#f3f1ec]">
                GUTA <span className="text-[#e6cca0] text-xs font-semibold">MÚSICA</span>
              </span>
            </div>
            <p className="text-xs text-[#8c887f] leading-relaxed">
              Medio digital musical, agenda cultural y videoteca dedicada a descubrir, amplificar y visibilizar a artistas y bandas emergentes argentinas y latinoamericanas.
            </p>
            <div className="pt-1">
              <OfficialSocialsBar settings={socials} variant="footer" showLabel={true} />
            </div>
          </div>


          {/* Col 2: Secciones */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#f3f1ec]">
              Secciones
            </h4>
            <ul className="space-y-1.5 text-xs text-[#aba79e]">
              <li>
                <Link href="/artistas" className="hover:text-[#e6cca0] transition-colors">Directorio de Artistas</Link>
              </li>
              <li>
                <Link href="/entrevistas" className="hover:text-[#e6cca0] transition-colors">Entrevistas & Sesiones en Vivo</Link>
              </li>
              <li>
                <Link href="/efemerides" className="hover:text-[#e6cca0] transition-colors">Efemérides Musicales Históricas</Link>
              </li>
              <li>
                <Link href="/agenda" className="hover:text-[#e6cca0] transition-colors">Agenda de Recitales y Festivales</Link>
              </li>
              <li>
                <Link href="/contacto" className="text-[#d97d64] hover:text-[#e6cca0] font-semibold transition-colors">+ Sumá tu Banda (Convocatoria)</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Géneros & Cobertura */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#f3f1ec]">
              Géneros Principales
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

          {/* Col 4: Identidad & Autores */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#f3f1ec]">
              Cultura Federal
            </h4>
            <p className="text-xs text-[#8c887f] leading-relaxed">
              Impulsado con pasión por el patrimonio sonoro de nuestro país y la nueva generación de creadores musicales.
            </p>
            <div className="p-2.5 rounded-lg bg-[#18191e] border border-[#272932] text-xs space-y-0.5">
              <span className="text-[#e6cca0] font-medium text-[11px] block">Conducción & Dirección Editorial</span>
              <span className="text-[#f3f1ec] font-semibold">Guta Flores</span>
            </div>
          </div>
        </div>

        {/* Bottom credits */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-[#78746c] gap-3">
          <p>© {new Date().getFullYear()} GUTA MÚSICA. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1 text-[#78746c]">
            <span>Hecho con dedicación para la música emergente de América Latina</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
