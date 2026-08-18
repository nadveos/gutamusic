import React from 'react';
import Link from 'next/link';
import { Music2, Radio, Heart, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-[#06070a] text-gray-400 pt-16 pb-12 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center">
                <Music2 className="w-5 h-5 text-black font-black" />
              </div>
              <span className="font-extrabold text-xl tracking-wider text-white">
                GUTA <span className="text-amber-400 text-sm font-semibold">MÚSICA</span>
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Medio digital musical, agenda cultural y videoteca dedicada a descubrir, amplificar y visibilizar a artistas y bandas emergentes argentinas y latinoamericanas.
            </p>
            <div className="pt-2 flex items-center gap-3 text-gray-400">
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:text-rose-400 hover:bg-white/10 transition-colors" aria-label="YouTube">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:text-amber-400 hover:bg-white/10 transition-colors" aria-label="Instagram">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 hover:text-blue-400 hover:bg-white/10 transition-colors" aria-label="Facebook">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>
          </div>

          {/* Col 2: Secciones */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400" /> Secciones
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/artistas" className="hover:text-amber-400 transition-colors">Directorio de Artistas</Link>
              </li>
              <li>
                <Link href="/entrevistas" className="hover:text-amber-400 transition-colors">Entrevistas & Sesiones en Vivo</Link>
              </li>
              <li>
                <Link href="/efemerides" className="hover:text-amber-400 transition-colors">Efemérides Musicales Históricas</Link>
              </li>
              <li>
                <Link href="/agenda" className="hover:text-amber-400 transition-colors">Agenda de Recitales y Festivales</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Géneros & Cobertura */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Géneros Principales
            </h4>
            <div className="flex flex-wrap gap-1.5 text-xs">
              {['Folklore', 'Rock', 'Tango', 'Hip Hop', 'Música Urbana', 'Música Popular', 'Indie', 'Fusión'].map((g) => (
                <Link
                  key={g}
                  href={`/artistas?genre=${encodeURIComponent(g)}`}
                  className="px-2.5 py-1 rounded bg-white/5 border border-white/5 hover:border-amber-400/40 hover:text-white transition-colors"
                >
                  {g}
                </Link>
              ))}
            </div>
          </div>

          {/* Col 4: Identidad & Autores */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Cultura Federal
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Impulsado con pasión por el patrimonio sonoro de nuestro país y la nueva generación de creadores musicales.
            </p>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
              <span className="text-amber-400 font-semibold block">Conducción & Dirección Editorial</span>
              <span className="text-gray-200">Guta Flores</span>
            </div>
          </div>
        </div>

        {/* Bottom credits */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} GUTA MÚSICA. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1 text-gray-400">
            <span>Diseñado con</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>para la música emergente de América Latina</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
