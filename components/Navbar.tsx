'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio, Music2, Calendar, Mic2, BookOpen, Menu, X, Sparkles, Search } from 'lucide-react';

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

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10">
      {/* Top Banner Ticker */}
      <div className="bg-gradient-to-r from-amber-500/15 via-cyan-500/10 to-rose-500/15 text-xs py-1 px-4 border-b border-white/5 flex items-center justify-between text-gray-300">
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            GUTA MÚSICA:
          </span>
          <span className="text-gray-400">
            Plataforma Federal de Difusión para Artistas Independientes & Emergentes
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Efeméride del Día: 18 de Agosto
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Music2 className="w-5 h-5 text-black font-black" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-wider text-white group-hover:text-amber-400 transition-colors">
                  GUTA
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-400 border border-amber-400/30 font-semibold tracking-wide">
                  MÚSICA
                </span>
              </div>
              <p className="text-[10px] text-gray-400 tracking-tight">
                Cultura & Artistas Emergentes
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-amber-400 shadow-inner'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-gray-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* CTA & Search Action */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/artistas"
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-md bg-white/5 border border-white/10 hover:border-amber-400/50 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Explorar 100+ Artistas</span>
            </Link>
            <Link
              href="/artistas"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              + Difundir Artista
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-white/5 text-gray-300 hover:text-white focus:outline-none"
              aria-label="Abrir menú"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isOpen && (
        <div className="md:hidden glass-panel border-t border-white/10 px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive ? 'bg-amber-500/20 text-amber-400' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5 text-amber-400" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-white/10">
            <Link
              href="/artistas"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center text-center font-bold text-sm py-2.5 rounded-lg bg-amber-500 text-black"
            >
              + Sumar mi Banda / Proyecto
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
