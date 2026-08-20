import React from 'react';
import Link from 'next/link';
import { Music2, Radio, Heart, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
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
            <div className="pt-1 flex items-center gap-2 text-[#aba79e]">
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-[#1c1d22] hover:text-[#d97d64] transition-colors" aria-label="YouTube">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-[#1c1d22] hover:text-[#e6cca0] transition-colors" aria-label="Instagram">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-[#1c1d22] hover:text-[#a7b8c8] transition-colors" aria-label="Facebook">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
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
