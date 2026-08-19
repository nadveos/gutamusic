'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio, Music2, Calendar, Mic2, BookOpen, Menu, X, Search } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Inicio', icon: Music2 },
    { href: '/artistas', label: 'Artistas', icon: Mic2 },
    { href: '/entrevistas', label: 'Entrevistas & Lives', icon: Radio },
    { href: '/efemerides', label: 'Efemérides', icon: BookOpen },
    { href: '/agenda', label: 'Agenda Cultural', icon: Calendar },
  ];

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const now = new Date();
  const todayFormatted = `${now.getDate()} de ${monthNames[now.getMonth()]}`;

  return (
    <>
      {/* Skip to Main Content Link for Keyboard / Screen Reader Users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#d97d64] focus:text-[#151618] focus:font-bold focus:rounded-lg focus:shadow-xl focus:outline-none"
      >
        Saltar al contenido principal
      </a>

      <header className="sticky top-0 z-50 w-full natural-panel border-b border-[#2d2f38]">
        {/* Top Banner Ticker */}
        <div className="bg-[#1c1d22] text-xs py-1.5 px-4 border-b border-[#2a2c34] flex items-center justify-between text-[#aba79e]">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-[11px]">
            <span className="font-semibold text-[#e6cca0]">
              GUTA MÚSICA —
            </span>
            <span className="text-[#a09c93]">
              Plataforma Federal de Difusión para Artistas Independientes & Emergentes
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-[11px]">
            <Link href="/efemerides" className="flex items-center gap-1.5 text-[#93a887] hover:text-[#e6cca0] transition-colors">
              <span className="w-1.5 h-1.5 rounded-full bg-[#93a887]" aria-hidden="true"></span>
              <span>Efeméride del Día: {todayFormatted}</span>
            </Link>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97d64] rounded-lg p-1"
              aria-label="GUTA MÚSICA - Inicio"
            >
              <div className="w-9 h-9 rounded-lg bg-[#d97d64] flex items-center justify-center text-[#151618] transition-transform group-hover:scale-105" aria-hidden="true">
                <Music2 className="w-5 h-5 font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg tracking-tight text-[#f3f1ec] group-hover:text-[#e6cca0] transition-colors">
                    GUTA
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2a2c35] text-[#e6cca0] font-medium tracking-wider">
                    MÚSICA
                  </span>
                </div>
                <p className="text-[10px] text-[#a09c93] font-normal">
                  Cultura & Artistas Emergentes
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97d64] ${
                      isActive
                        ? 'bg-[#2a2c35] text-[#f3f1ec] font-semibold border border-[#3c3f4c]'
                        : 'text-[#aba79e] hover:text-[#f3f1ec] hover:bg-[#23252c]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#e6cca0]' : 'text-[#a09c93]'}`} aria-hidden="true" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* CTA & Search Action */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/artistas"
                className="flex items-center gap-1.5 text-xs text-[#aba79e] hover:text-[#f3f1ec] px-3 py-1.5 rounded-lg bg-[#222329] border border-[#31333d] hover:border-[#464957] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97d64]"
              >
                <Search className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Explorar Artistas</span>
              </Link>
              <Link
                href="/artistas"
                className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97d64]"
              >
                + Difundir Artista
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg bg-[#222329] text-[#aba79e] hover:text-[#f3f1ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97d64]"
                aria-label={isOpen ? 'Cerrar menú principal' : 'Abrir menú principal'}
                aria-expanded={isOpen}
                aria-controls="mobile-navigation"
              >
                {isOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Menú móvil"
            className="md:hidden bg-[#1c1d22] border-t border-[#2d2f38] px-4 pt-3 pb-6 space-y-2 animate-in fade-in duration-150"
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97d64] ${
                    isActive ? 'bg-[#2a2c35] text-[#e6cca0]' : 'text-[#aba79e] hover:bg-[#222329]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#d97d64]" aria-hidden="true" />
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-[#2d2f38]">
              <Link
                href="/artistas"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center text-center font-bold text-xs py-2.5 rounded-lg bg-[#d97d64] text-[#151618] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97d64]"
              >
                + Sumar mi Banda / Proyecto
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
};
