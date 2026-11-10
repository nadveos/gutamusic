'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Mic2,
  Users,
  Video,
  BookOpen,
  Radio,
  Sparkles,
  LogOut,
  ExternalLink,
  FileSpreadsheet,
  ShieldCheck,
  HeartHandshake,
  Heart,
  Headphones,
  Share2,
  X,
  GripVertical,
  RotateCcw,
} from 'lucide-react';
import { logoutSuperUser } from '../../lib/pocketbase';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
  onLogout?: () => void;
}

interface SidebarMenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEFAULT_MENU_ITEMS: SidebarMenuItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/colaboraciones', label: 'Colaboraciones Recibidas', icon: Heart },
  { href: '/admin/artistas', label: 'Gestión de Artistas', icon: Mic2 },
  { href: '/admin/profesionales', label: 'Profesionales & Servicios', icon: Headphones },
  { href: '/admin/usuarios', label: 'Usuarios & Cuentas', icon: Users },
  { href: '/admin/entrevistas', label: 'Entrevistas & Lives', icon: Radio },
  { href: '/admin/redes', label: 'Redes @sesionesrg', icon: Share2 },
  { href: '/admin/aliados', label: 'Auspiciantes & Alianzas', icon: HeartHandshake },
  { href: '/admin/postulaciones', label: 'Postulaciones / Convocatorias', icon: FileSpreadsheet },
  { href: '/admin/ia', label: 'IA Editorial & SEO', icon: Sparkles },
  { href: '/admin/videos', label: 'Cargar Videos', icon: Video },
  { href: '/admin/efemerides', label: 'Efemérides', icon: BookOpen },
  { href: '/admin/seguridad', label: 'Seguridad & 2FA', icon: ShieldCheck },
];

const STORAGE_KEY = 'guta_admin_sidebar_order_v1';

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile, onLogout }) => {
  const pathname = usePathname();
  const [items, setItems] = useState<SidebarMenuItem[]>(DEFAULT_MENU_ITEMS);
  const [draggedHref, setDraggedHref] = useState<string | null>(null);
  const [dragOverHref, setDragOverHref] = useState<string | null>(null);
  const [hasCustomOrder, setHasCustomOrder] = useState(false);

  // Cargar orden personalizado desde localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const savedHrefs: string[] = JSON.parse(raw);
      if (!Array.isArray(savedHrefs) || savedHrefs.length === 0) return;

      const byHref = new Map(DEFAULT_MENU_ITEMS.map((item) => [item.href, item]));
      const ordered: SidebarMenuItem[] = [];

      for (const href of savedHrefs) {
        const found = byHref.get(href);
        if (found) {
          ordered.push(found);
          byHref.delete(href);
        }
      }
      // Agregar al final cualquier módulo nuevo que no estuviera guardado aún
      for (const remaining of byHref.values()) {
        ordered.push(remaining);
      }

      setItems(ordered);
      setHasCustomOrder(true);
    } catch {}
  }, []);

  const persistOrder = (newItems: SidebarMenuItem[]) => {
    setItems(newItems);
    setHasCustomOrder(true);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(newItems.map((i) => i.href))
      );
    } catch {}
  };

  const handleResetOrder = () => {
    setItems(DEFAULT_MENU_ITEMS);
    setHasCustomOrder(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const handleDragStart = (e: React.DragEvent, href: string) => {
    setDraggedHref(href);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', href);
  };

  const handleDragOver = (e: React.DragEvent, targetHref: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverHref !== targetHref) {
      setDragOverHref(targetHref);
    }
  };

  const handleDrop = (e: React.DragEvent, targetHref: string) => {
    e.preventDefault();
    const sourceHref = draggedHref || e.dataTransfer.getData('text/plain');
    setDraggedHref(null);
    setDragOverHref(null);

    if (!sourceHref || sourceHref === targetHref) return;

    const fromIndex = items.findIndex((i) => i.href === sourceHref);
    const toIndex = items.findIndex((i) => i.href === targetHref);
    if (fromIndex === -1 || toIndex === -1) return;

    const updated = [...items];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    persistOrder(updated);
  };

  const handleDragEnd = () => {
    setDraggedHref(null);
    setDragOverHref(null);
  };

  const handleLogout = () => {
    logoutSuperUser();
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/admin';
    }
  };

  return (
    <aside className="w-64 bg-[#18191e] border-r border-[#2a2c35] flex flex-col justify-between h-full min-h-screen text-[#aba79e]">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#2a2c35] space-y-3">
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 group"
          >
            <img
              src="/brand/guta-musica-favicon.svg"
              alt="GUTA"
              className="w-8 h-8 rounded-lg object-contain transition-transform group-hover:scale-105"
            />
            <div>
              <span className="font-black text-base text-[#f3f1ec] tracking-tight">
                GUTA{' '}
                <span className="text-[#e6cca0] text-[10px] px-1 py-0.5 rounded bg-[#24252c] border border-[#353844]">
                  CMS
                </span>
              </span>
              <p className="text-[10px] text-[#78746c]">Panel de Control</p>
            </div>
          </Link>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-[#aba79e] hover:text-[#f3f1ec] hover:bg-[#22232a]"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

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

      {/* Navigation Menu (Drag & Drop Reorderable) */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider text-[#78746c]"
            title="Arrastrá y soltá los módulos para reordenarlos"
          >
            Módulos (Arrastrar ↕)
          </span>
          {hasCustomOrder && (
            <button
              type="button"
              onClick={handleResetOrder}
              title="Restaurar orden original del menú"
              className="inline-flex items-center gap-1 text-[10px] text-[#8c887f] hover:text-[#e6cca0] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));
          const isDragged = draggedHref === item.href;
          const isDragOver = dragOverHref === item.href && draggedHref !== item.href;

          return (
            <div
              key={item.href}
              draggable
              onDragStart={(e) => handleDragStart(e, item.href)}
              onDragOver={(e) => handleDragOver(e, item.href)}
              onDrop={(e) => handleDrop(e, item.href)}
              onDragEnd={handleDragEnd}
              className={`group/nav relative rounded-lg transition-all ${
                isDragged ? 'opacity-40 scale-[0.98]' : 'opacity-100'
              } ${
                isDragOver
                  ? 'ring-2 ring-[#e6cca0] bg-[#252730]'
                  : ''
              }`}
            >
              <Link
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#d97d64] text-[#151618] font-bold'
                    : 'text-[#aba79e] hover:text-[#f3f1ec] hover:bg-[#202228]'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                <GripVertical
                  className={`w-3.5 h-3.5 shrink-0 cursor-grab active:cursor-grabbing transition-opacity ${
                    isActive
                      ? 'text-[#151618]/60 opacity-80'
                      : 'text-[#6e6b64] opacity-0 group-hover/nav:opacity-100'
                  }`}
                  aria-label="Arrastrar para reordenar"
                />
              </Link>
            </div>
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

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-[#c0909b] hover:bg-[#202228] hover:text-[#e6a8b4] transition-colors text-left cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};
