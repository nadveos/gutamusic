'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Mic2,
  Video,
  BookOpen,
  Calendar,
  Radio,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  Sparkles,
  Music2
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/artistas', label: 'Gestión de Artistas', icon: Mic2 },
    { href: '/admin/videos', label: 'Cargar Videos', icon: Video },
    { href: '/admin/efemerides', label: 'Efemérides', icon: BookOpen },
    { href: '/admin/entrevistas', label: 'Entrevistas & Lives', icon: Radio },
    { href: '/admin/agenda', label: 'Agenda & Eventos', icon: Calendar },
    { href: '/admin/usuarios', label: 'Roles & Permisos', icon: Users },
  ];

  return (
    <aside className="w-64 bg-[#0d101a] border-r border-white/10 flex flex-col justify-between min-h-screen text-gray-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 space-y-4">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Music2 className="w-5 h-5 text-black font-black" />
          </div>
          <div>
            <span className="font-black text-lg text-white tracking-wider">
              GUTA <span className="text-amber-400 text-xs px-1.5 py-0.5 rounded bg-amber-400/20 border border-amber-400/30">CMS</span>
            </span>
            <p className="text-[10px] text-gray-400">Panel de Administración</p>
          </div>
        </Link>

        {/* User Card */}
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-xs">
            GF
          </div>
          <div className="flex-1 overflow-hidden">
            <span className="text-xs font-bold text-white block truncate">Guta Flores</span>
            <span className="text-[10px] text-amber-400 font-semibold uppercase">Super Admin</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-2 block">
          Módulos de Contenido
        </span>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-gray-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            Ver Portal Público
          </span>
          <span className="text-[10px] text-gray-400">↗</span>
        </Link>

        <Link
          href="/admin/login"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </Link>
      </div>
    </aside>
  );
};
