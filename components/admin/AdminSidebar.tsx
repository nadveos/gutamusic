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
  LogOut,
  ExternalLink,
  Music2,
  Sparkles
} from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/ia', label: 'IA Editorial & SEO', icon: Sparkles },
    { href: '/admin/artistas', label: 'Gestión de Artistas', icon: Mic2 },
    { href: '/admin/videos', label: 'Cargar Videos', icon: Video },
    { href: '/admin/efemerides', label: 'Efemérides', icon: BookOpen },
    { href: '/admin/entrevistas', label: 'Entrevistas & Lives', icon: Radio },
    { href: '/admin/agenda', label: 'Agenda & Eventos', icon: Calendar },
  ];

  return (
    <aside className="w-64 bg-[#18191e] border-r border-[#2a2c35] flex flex-col justify-between min-h-screen text-[#aba79e]">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#2a2c35] space-y-3">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#d97d64] flex items-center justify-center text-[#151618]">
            <Music2 className="w-4 h-4 font-bold" />
          </div>
          <div>
            <span className="font-black text-base text-[#f3f1ec] tracking-tight">
              GUTA <span className="text-[#e6cca0] text-[10px] px-1 py-0.5 rounded bg-[#24252c] border border-[#353844]">CMS</span>
            </span>
            <p className="text-[10px] text-[#78746c]">Panel de Control</p>
          </div>
        </Link>

        {/* User Card */}
        <div className="p-2 rounded-lg bg-[#202228] border border-[#2d2f38] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#2d2f38] text-[#e6cca0] flex items-center justify-center font-bold text-[11px]">
            GF
          </div>
          <div className="flex-1 overflow-hidden">
            <span className="text-xs font-bold text-[#f3f1ec] block truncate">Guta Flores</span>
            <span className="text-[10px] text-[#d97d64] font-medium">_superusers</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#78746c] px-3 py-1.5 block">
          Módulos
        </span>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#d97d64] text-[#151618] font-bold'
                  : 'text-[#aba79e] hover:text-[#f3f1ec] hover:bg-[#202228]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[#2a2c35] space-y-1.5">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium bg-[#202228] hover:bg-[#272932] text-[#aba79e] hover:text-[#f3f1ec] transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-[#e6cca0]" />
            Ver Portal Público
          </span>
          <span className="text-[10px] text-[#78746c]">↗</span>
        </Link>

        <Link
          href="/admin/login"
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-[#c0909b] hover:bg-[#202228] transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </Link>
      </div>
    </aside>
  );
};
