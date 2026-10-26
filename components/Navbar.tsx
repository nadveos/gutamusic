'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio, Music2, Calendar, Mic2, BookOpen, Menu, X, Search, Sparkles } from 'lucide-react';
import { ShareButton } from './ShareButton';
import { OfficialSocialsBar } from './OfficialSocialsBar';
import { SearchModal } from './SearchModal';
import { MusicDataService } from '../lib/api';
import { DEFAULT_OFFICIAL_SOCIALS } from '../lib/socialUtils';
import { OfficialSocialsSettings } from '../lib/types';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [socials, setSocials] = useState<OfficialSocialsSettings>(DEFAULT_OFFICIAL_SOCIALS);
  const pathname = usePathname();

  // Atajo global Ctrl+K / Cmd+K para abrir el buscador modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const navLinks = [
    { href: '/', label: 'Inicio', icon: Music2 },
    { href: '/artistas', label: 'Artistas', icon: Mic2 },
    { href: '/entrevistas', label: 'Entrevistas & Lives', icon: Radio },
    { href: '/efemerides', label: 'Efemérides', icon: BookOpen },
    { href: '/registro', label: 'Sumá tu Banda', icon: Sparkles },
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
        {/* Top Banner Ticker with Official Socials */}
        <div className="bg-[#18191e] text-xs py-1 px-4 border-b border-[#2a2c34] flex items-center justify-between text-[#aba79e]">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-[11px]">
            <span className="font-bold text-[#e6cca0]">
              GUTA MÚSICA —
            </span>
            <span className="hidden sm:inline text-[#a09c93]">
              Plataforma Federal de Difusión para Artistas Independientes
            </span>
            <Link href="/efemerides" className="hidden lg:flex items-center gap-1.5 text-[#93a887] hover:text-[#e6cca0] transition-colors ml-2 pl-2 border-l border-[#2e3039]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#93a887]" aria-hidden="true"></span>
              <span>Efeméride: {todayFormatted}</span>
            </Link>
          </div>

          {/* Official Social Links in Header Topbar */}
          <div className="flex items-center gap-2 text-[11px]">
            <OfficialSocialsBar settings={socials} variant="header" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex items-center group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97d64] rounded-lg p-1 transition-opacity hover:opacity-95"
              aria-label="GUTA MÚSICA - Inicio"
            >
              <img
                src="/brand/guta-musica-logo.svg"
                alt="GUTA MÚSICA"
                className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              />
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
            <div className="hidden lg:flex items-center gap-2.5">
              <ShareButton
                title="GUTA MÚSICA — Plataforma Federal de Difusión"
                text="Descubrí la plataforma federal para artistas independientes y emergentes en GUTA MÚSICA."
                variant="icon"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 text-xs text-[#aba79e] hover:text-[#f3f1ec] px-3 py-1.5 rounded-lg bg-[#222329] border border-[#31333d] hover:border-[#464957] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97d64] cursor-pointer"
                aria-label="Abrir buscador rápido (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-[#e6cca0]" aria-hidden="true" />
                <span>Explorar</span>
                <kbd className="hidden xl:inline-block text-[10px] text-[#7d7970] font-mono bg-[#18191e] px-1.5 py-0.5 rounded border border-[#2d2f38]">
                  ⌘K
                </kbd>
              </button>
              <Link
                href="/login"
                className="text-xs font-bold px-3.5 py-2 rounded-lg bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97d64] shadow-sm shadow-[#d97d64]/20"
              >
                Acceso Artistas
              </Link>
              <Link
                href="/registro"
                className="text-xs font-bold px-3.5 py-2 rounded-lg border border-[#d97d64] bg-[#222329]/80 hover:bg-[#d97d64]/10 text-[#d97d64] hover:text-[#f3f1ec] transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97d64] shadow-sm"
              >
                + Sumar Mi Banda
              </Link>
            </div>

            {/* Mobile menu and search buttons */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-lg bg-[#222329] text-[#aba79e] hover:text-[#f3f1ec] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d97d64] cursor-pointer"
                aria-label="Abrir buscador"
              >
                <Search className="w-4 h-4 text-[#e6cca0]" aria-hidden="true" />
              </button>
              <ShareButton
                title="GUTA MÚSICA — Plataforma Federal de Difusión"
                text="Descubrí la plataforma federal para artistas independientes y emergentes en GUTA MÚSICA."
                variant="icon"
              />
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
            <div className="pt-3 border-t border-[#2d2f38] space-y-2.5">
              <OfficialSocialsBar settings={socials} variant="drawer" />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center text-center font-bold text-xs py-2 rounded-lg bg-[#d97d64] text-[#151618]"
                >
                  Acceso Artistas
                </Link>
                <Link
                  href="/registro"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center text-center font-bold text-xs py-2 rounded-lg border border-[#d97d64] text-[#d97d64] bg-[#222329]"
                >
                  + Registrar Banda
                </Link>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Buscador Modal Global */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

