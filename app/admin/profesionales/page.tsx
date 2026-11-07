'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PROFESSIONAL_CATEGORIES,
  getProfessionalCategoryInfo,
} from '@/lib/constants/professionalCategories';
import { EnrichedProfessional } from '@/app/profesionales/ProfessionalsDirectoryClient';
import {
  Headphones,
  Sparkles,
  Clock,
  CheckCircle2,
  Trash2,
  ExternalLink,
  RefreshCw,
  Eye,
  EyeOff,
  Search,
  UserPlus,
} from 'lucide-react';

export default function AdminProfesionalesPage() {
  const [list, setList] = useState<EnrichedProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('all');
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/professionals?all=true', {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.professionals)) {
        setList(data.professionals);
      }
    } catch (err) {
      console.error('Error cargando profesionales en admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const handleToggleActive = async (prof: EnrichedProfessional) => {
    setActionLoadingId(prof.id);
    try {
      await fetch('/api/professionals/my-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: prof.id,
          active: !prof.active,
        }),
      });
      await fetchProfessionals();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleGrantWeeklyFeatured = async (prof: EnrichedProfessional) => {
    setActionLoadingId(prof.id);
    try {
      await fetch('/api/professionals/my-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: prof.id,
          grantPaidFeaturedDays: true,
        }),
      });
      await fetchProfessionals();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveFeatured = async (prof: EnrichedProfessional) => {
    setActionLoadingId(prof.id);
    try {
      await fetch('/api/professionals/my-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: prof.id,
          paidFeatured: false,
          paidFeaturedUntil: '',
          courtesyFeaturedUntil: '2000-01-01T00:00:00.000Z',
        }),
      });
      await fetchProfessionals();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (prof: EnrichedProfessional) => {
    if (!confirm(`¿Seguro que querés eliminar a "${prof.name}"?`)) return;
    setActionLoadingId(prof.id);
    try {
      await fetch(
        `/api/professionals/my-profile?id=${encodeURIComponent(prof.id)}`,
        { method: 'DELETE' }
      );
      await fetchProfessionals();
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = list.filter((p) => {
    const matchesCat = filterCat === 'all' || p.roleCategory === filterCat;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.specialty.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const expiringSoon = list.filter(
    (p) => p.featuredStatus?.isFeaturedNow && p.featuredStatus.isExpiringSoon
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#f3f1ec] flex items-center gap-2.5">
            <Headphones className="w-6 h-6 text-[#d97d64]" />
            <span>Profesionales & Servicios Musicales</span>
          </h1>
          <p className="text-xs text-[#aba79e] mt-1">
            Sellos Independientes, Productores, DJ&apos;s, Profesores de Instrumento/Canto, Armonizadores y Sesionistas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchProfessionals}
            className="px-3 py-2 rounded-xl bg-[#202229] hover:bg-[#282b34] border border-[#2f323e] text-xs font-bold text-[#e6cca0] flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <Link
            href="/sumar-profesional"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-[#d97d64] hover:bg-[#c96d54] text-[#121316] text-xs font-black flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Nuevo Profesional</span>
          </Link>
        </div>
      </div>

      {/* Aviso de próximos vencimientos de destacados */}
      {expiringSoon.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#d97d64]/15 border border-[#d97d64]/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#e6cca0]">
            <Clock className="w-4 h-4 text-[#d97d64]" />
            <span>
              Aviso Previo de Vencimiento de Destacados ({expiringSoon.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {expiringSoon.map((p) => (
              <span
                key={p.id}
                className="px-2.5 py-1 rounded-lg bg-[#181920] border border-[#d97d64]/40 text-[11px] text-[#f3f1ec]"
              >
                <b>{p.name}</b>: le{' '}
                {p.featuredStatus.daysRemaining === 1
                  ? 'queda 1 día'
                  : `quedan ${p.featuredStatus.daysRemaining} días`}{' '}
                ({p.featuredStatus.statusBadgeLabel})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#aba79e] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, especialidad o email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#18191e] border border-[#2d2f39] text-xs text-[#f3f1ec]"
          />
        </div>

        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#18191e] border border-[#2d2f39] text-xs text-[#f3f1ec]"
        >
          <option value="all">Todos los rubros ({list.length})</option>
          {PROFESSIONAL_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.pluralLabel}
            </option>
          ))}
        </select>
      </div>

      {/* Tabla de Profesionales */}
      <div className="rounded-2xl bg-[#18191e] border border-[#2a2c35] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#2a2c35] bg-[#141519] text-[#aba79e]">
                <th className="py-3 px-4">Profesional / Sello</th>
                <th className="py-3 px-4">Rubro & Modalidad</th>
                <th className="py-3 px-4">Estado de Destacado</th>
                <th className="py-3 px-4">Visibilidad</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#252730]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#aba79e]">
                    Cargando registros...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#aba79e]">
                    No hay profesionales registrados todavía.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const cat = getProfessionalCategoryInfo(item.roleCategory);
                  const feat = item.featuredStatus;
                  const isBusy = actionLoadingId === item.id;

                  return (
                    <tr key={item.id} className="hover:bg-[#1e2028]/60">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#f3f1ec]">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-[#aba79e]">
                          {item.specialty}
                        </div>
                        <div className="text-[10px] text-[#78746c]">
                          {item.email} {item.whatsapp ? `• WA: ${item.whatsapp}` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${cat.badgeColor}`}
                        >
                          {cat.label}
                        </span>
                        <div className="text-[11px] text-[#aba79e] mt-1">
                          {item.modality} •{' '}
                          {[item.city, item.province].filter(Boolean).join(', ')}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {feat?.isFeaturedNow ? (
                          <div className="space-y-1">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                feat.featuredType === 'paid'
                                  ? 'bg-[#e6cca0] text-[#121316]'
                                  : 'bg-[#d97d64]/20 text-[#e6cca0] border border-[#d97d64]/50'
                              }`}
                            >
                              {feat.statusBadgeLabel}
                            </span>
                            <div
                              className={`text-[11px] font-semibold ${
                                feat.isExpiringSoon
                                  ? 'text-[#d97d64]'
                                  : 'text-[#5ce487]'
                              }`}
                            >
                              Quedan {feat.daysRemaining} día(s) (vence {feat.expiryDateStr})
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#78746c]">
                            Estándar (Destacado finalizado)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleActive(item)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                            item.active
                              ? 'bg-[#5ce487]/15 text-[#5ce487] border border-[#5ce487]/30'
                              : 'bg-[#d97d64]/15 text-[#d97d64] border border-[#d97d64]/30'
                          }`}
                        >
                          {item.active ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Publicado</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Pausado</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleGrantWeeklyFeatured(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#e6cca0]/15 hover:bg-[#e6cca0] text-[#e6cca0] hover:text-[#121316] text-[11px] font-bold transition-colors cursor-pointer"
                          title="Activar 7 días de Destacado Semanal"
                        >
                          ⭐ +7 Días
                        </button>

                        {feat?.isFeaturedNow && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleRemoveFeatured(item)}
                            className="px-2 py-1.5 rounded-lg bg-[#252834] hover:bg-[#303443] text-[#aba79e] text-[11px] cursor-pointer"
                            title="Quitar destacado"
                          >
                            Quitar ⭐
                          </button>
                        )}

                        <Link
                          href={`/profesionales/${item.slug || item.id}`}
                          target="_blank"
                          className="inline-flex items-center p-1.5 rounded-lg bg-[#22242d] hover:bg-[#2c2f3b] text-[#e6cca0]"
                          title="Ver ficha pública"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg bg-[#22242d] hover:bg-[#d97d64]/20 text-[#aba79e] hover:text-[#d97d64] cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
