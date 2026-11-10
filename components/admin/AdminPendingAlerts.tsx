'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Artist, MusicProfessional } from '../../lib/types';
import { getProfessionalCategoryInfo } from '../../lib/constants/professionalCategories';
import {
  AlertTriangle,
  CheckCircle2,
  Mic2,
  Headphones,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Check,
} from 'lucide-react';

export interface PendingArtistItem {
  id: string;
  stageName: string;
  city?: string;
  province?: string;
  submittedAt?: string;
  status?: string;
}

interface AdminPendingAlertsProps {
  initialPendingArtists: PendingArtistItem[];
  initialProfessionals: MusicProfessional[];
}

const REVIEWED_PROFS_KEY = 'guta_admin_reviewed_professionals_v1';

export const AdminPendingAlerts: React.FC<AdminPendingAlertsProps> = ({
  initialPendingArtists,
  initialProfessionals,
}) => {
  const [pendingArtists, setPendingArtists] = useState<PendingArtistItem[]>(initialPendingArtists);
  const [professionals, setProfessionals] = useState<MusicProfessional[]>(initialProfessionals);
  const [reviewedProfIds, setReviewedProfIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(REVIEWED_PROFS_KEY) || '[]');
      if (Array.isArray(saved)) {
        setReviewedProfIds(saved);
      }
    } catch {}

    // Integrar posibles postulaciones locales pendientes y refrescar desde API
    fetch('/api/admin/applications')
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          const pending = json.data.filter(
            (a: any) => !a.status || a.status === 'pending' || a.status === 'needs_revision'
          );
          setPendingArtists(pending);
        }
      })
      .catch(() => {});

    fetch('/api/professionals?all=true')
      .then((r) => r.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.professionals)) {
          setProfessionals(json.professionals);
        }
      })
      .catch(() => {});
  }, []);

  // Profesionales pendientes de revisión: los que aún no fueron marcados como revisados por el admin
  const unreviewedProfessionals = professionals.filter(
    (p) => !reviewedProfIds.includes(p.id)
  );

  const markProfReviewed = (id: string) => {
    const next = Array.from(new Set([...reviewedProfIds, id]));
    setReviewedProfIds(next);
    try {
      localStorage.setItem(REVIEWED_PROFS_KEY, JSON.stringify(next));
    } catch {}
  };

  const markAllProfsReviewed = () => {
    const next = Array.from(
      new Set([...reviewedProfIds, ...unreviewedProfessionals.map((p) => p.id)])
    );
    setReviewedProfIds(next);
    try {
      localStorage.setItem(REVIEWED_PROFS_KEY, JSON.stringify(next));
    } catch {}
  };

  const hasArtistAlerts = pendingArtists.length > 0;
  const hasProfAlerts = unreviewedProfessionals.length > 0;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* BOX 1: ARTISTAS PENDIENTES DE REVISIÓN */}
      <div
        className={`rounded-2xl p-4 sm:p-5 border transition-colors flex flex-col justify-between gap-3.5 ${
          hasArtistAlerts
            ? 'bg-gradient-to-br from-[#281c1b] via-[#1c1b22] to-[#16171d] border-[#d97d64]/70 shadow-lg shadow-[#d97d64]/10'
            : 'bg-[#18191e] border-[#2a2c35]'
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  hasArtistAlerts
                    ? 'bg-[#d97d64]/20 text-[#d97d64] border border-[#d97d64]/40'
                    : 'bg-[#24262f] text-[#93a887]'
                }`}
              >
                {hasArtistAlerts ? (
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#f3f1ec]">
                    Artistas Pendientes de Revisión
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      hasArtistAlerts
                        ? 'bg-[#d97d64] text-[#151618]'
                        : 'bg-[#252834] text-[#93a887]'
                    }`}
                  >
                    {pendingArtists.length}
                  </span>
                </div>
                <p className="text-[11px] text-[#8c887f]">
                  {hasArtistAlerts
                    ? 'Tenés postulaciones de bandas/artistas esperando aprobación.'
                    : 'No hay postulaciones de artistas pendientes en este momento.'}
                </p>
              </div>
            </div>

            <Link
              href="/admin/postulaciones"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#242630] hover:bg-[#2e313e] border border-[#383b4a] text-xs font-bold text-[#e6cca0] transition-colors shrink-0"
            >
              <span>Ver Postulaciones</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {hasArtistAlerts && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {pendingArtists.slice(0, 4).map((art) => (
                <div
                  key={art.id}
                  className="p-2.5 rounded-xl bg-[#16171d]/90 border border-[#312b2d] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Mic2 className="w-3.5 h-3.5 text-[#d97d64] shrink-0" />
                    <strong className="text-[#f3f1ec] truncate">{art.stageName}</strong>
                    {(art.city || art.province) && (
                      <span className="text-[10px] text-[#8c887f] truncate">
                        • {[art.city, art.province].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                  <Link
                    href="/admin/postulaciones"
                    className="px-2 py-0.5 rounded bg-[#d97d64]/20 hover:bg-[#d97d64]/35 text-[#e6cca0] text-[10px] font-bold shrink-0 transition-colors"
                  >
                    Revisar →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOX 2: PROFESIONALES PENDIENTES DE REVISIÓN */}
      <div
        className={`rounded-2xl p-4 sm:p-5 border transition-colors flex flex-col justify-between gap-3.5 ${
          hasProfAlerts
            ? 'bg-gradient-to-br from-[#262219] via-[#1c1b22] to-[#16171d] border-[#e6cca0]/70 shadow-lg shadow-[#e6cca0]/10'
            : 'bg-[#18191e] border-[#2a2c35]'
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  hasProfAlerts
                    ? 'bg-[#e6cca0]/20 text-[#e6cca0] border border-[#e6cca0]/40'
                    : 'bg-[#24262f] text-[#93a887]'
                }`}
              >
                {hasProfAlerts ? (
                  <Headphones className="w-4 h-4 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#f3f1ec]">
                    Profesionales Pendientes de Revisión
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                      hasProfAlerts
                        ? 'bg-[#e6cca0] text-[#151618]'
                        : 'bg-[#252834] text-[#93a887]'
                    }`}
                  >
                    {unreviewedProfessionals.length}
                  </span>
                </div>
                <p className="text-[11px] text-[#8c887f]">
                  {hasProfAlerts
                    ? 'Nuevos perfiles de profesionales registrados para verificar.'
                    : 'Todos los perfiles de profesionales fueron revisados.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {hasProfAlerts && (
                <button
                  type="button"
                  onClick={markAllProfsReviewed}
                  title="Marcar todos como revisados"
                  className="px-2.5 py-1.5 rounded-xl bg-[#242630] hover:bg-[#2e313e] border border-[#383b4a] text-[11px] font-semibold text-[#93a887] transition-colors cursor-pointer"
                >
                  ✓ Todo visto
                </button>
              )}
              <Link
                href="/admin/profesionales"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#242630] hover:bg-[#2e313e] border border-[#383b4a] text-xs font-bold text-[#e6cca0] transition-colors"
              >
                <span>Gestionar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {hasProfAlerts && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {unreviewedProfessionals.slice(0, 4).map((prof) => {
                const cat = getProfessionalCategoryInfo(prof.roleCategory);
                return (
                  <div
                    key={prof.id}
                    className="p-2.5 rounded-xl bg-[#16171d]/90 border border-[#333026] flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <strong className="text-[#f3f1ec] truncate">{prof.name}</strong>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${cat.badgeColor}`}
                      >
                        {cat.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => markProfReviewed(prof.id)}
                        title="Marcar como revisado"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#93a887]/20 hover:bg-[#93a887]/35 text-[#93a887] text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Visto</span>
                      </button>
                      <Link
                        href="/admin/profesionales"
                        className="px-2 py-0.5 rounded bg-[#e6cca0]/20 hover:bg-[#e6cca0]/35 text-[#e6cca0] text-[10px] font-bold transition-colors"
                      >
                        Ver →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export const CollapsibleDashboardArtists: React.FC<{ artists: Artist[] }> = ({ artists }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <section className="natural-card p-5 rounded-2xl space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-[#f3f1ec]">
            Artistas en la Plataforma ({artists.length})
          </h2>
          <p className="text-xs text-[#8c887f]">Listado activo y estado de perfiles</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] border border-[#343746] text-xs font-bold text-[#e6cca0] transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Desplegar listado</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Colapsar listado</span>
              </>
            )}
          </button>

          <Link
            href="/admin/artistas"
            className="text-xs font-semibold text-[#e6cca0] hover:underline flex items-center gap-1"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {!isCollapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#aba79e]">
            <thead className="border-b border-[#2a2c35] text-[#8c887f] uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-2.5 px-3">Artista</th>
                <th className="py-2.5 px-3">Género</th>
                <th className="py-2.5 px-3">Ubicación</th>
                <th className="py-2.5 px-3">Videos</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24252c]">
              {artists.slice(0, 5).map((artist) => (
                <tr key={artist.id} className="hover:bg-[#24252c]/50 transition-colors">
                  <td className="py-3 px-3 flex items-center gap-2.5">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#31333d]">
                      <Image
                        src={artist.photoUrl || '/brand/guta-musica-favicon-512.png'}
                        alt={artist.stageName}
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <strong className="text-[#f3f1ec] block text-xs">{artist.stageName}</strong>
                      <span className="text-[10px] text-[#78746c]">{artist.slug}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-[#24252c] text-[#e6cca0] font-medium text-[11px]">
                      {artist.genres[0]}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#aba79e]">
                    {artist.city}, {artist.province}
                  </td>
                  <td className="py-3 px-3">{artist.videos.length} videos</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sage-soft">
                      {artist.featured ? 'Destacado' : 'Publicado'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right space-x-1.5">
                    <Link
                      href={`/artistas/${artist.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#aba79e] hover:text-[#f3f1ec] inline-block transition-colors"
                      title="Ver en portal"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/admin/artistas/nuevo?edit=${artist.id}`}
                      className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#e6cca0] inline-block transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
