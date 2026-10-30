'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Artist } from '../../../lib/types';
import { pb } from '../../../lib/pocketbase';
import { getWeeklyFeaturedStatus } from '../../../lib/services/featuredRotationService';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { ConfirmModal } from '../../../components/admin/ConfirmModal';
import { Edit, Trash2, Eye, MapPin, CheckSquare, Square } from 'lucide-react';

interface AdminArtistasClientProps {
  initialArtists: Artist[];
}

export const AdminArtistasClient: React.FC<AdminArtistasClientProps> = ({
  initialArtists,
}) => {
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setArtists(initialArtists);
  }, [initialArtists]);

  useEffect(() => {
    const refreshFromPocketBase = async () => {
      try {
        const records = await pb.collection('artists').getFullList<any>({
          requestKey: null,
        });
        if (records && records.length > 0) {
          const visibleRecords = records
            .filter((r) => !r.status || r.status === 'approved')
            .reverse();
          const mapped: Artist[] = visibleRecords.map((r) => ({
            id: r.id,
            slug: r.slug,
            stageName: r.stageName,
            realName: r.realName || '',
            genres: Array.isArray(r.genres) ? r.genres : (r.genres ? [r.genres] : []),
            city: r.city || '',
            province: r.province || '',
            country: r.country || 'Argentina',
            bio: r.bio || '',
            shortBio: r.shortBio || '',
            photoUrl: r.photoUrl || (r.photo ? pb.files.getUrl(r, r.photo) : '') || '/brand/guta-musica-favicon-512.png',
            bannerUrl: r.bannerUrl || '',
            featured: Boolean(r.featured),
            featuredOfWeek: Boolean(r.featuredOfWeek),
            featuredOfWeekDate: r.featuredOfWeekDate || '',
            socials: r.socials || {},
            videos: Array.isArray(r.videos) ? r.videos : [],
            discography: Array.isArray(r.discography) ? r.discography : [],
            agenda: r.agenda || [],
            press: r.press || [],
            gallery: Array.isArray(r.gallery) ? r.gallery : [],
            quotes: r.quotes || '',
            createdDate: r.createdDate || r.created?.split(' ')[0] || '',
            likesCount: typeof r.likesCount === 'number' ? r.likesCount : (parseInt(r.likesCount, 10) || 0),
          }));
          setArtists(mapped);
        }
      } catch (err) {
        console.warn('No se pudo refrescar artistas en cliente:', err);
      }
    };

    refreshFromPocketBase();
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.length === artists.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(artists.map((a) => a.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      const id = deleteTarget.id;
      const artistName = deleteTarget.name;
      try {
        await pb.collection('artists').delete(id);
        setArtists((prev) => prev.filter((a) => a.id !== id));
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        setNotification({ type: 'success', text: `Artista "${artistName}" eliminado de PocketBase exitosamente.` });
      } catch (e: any) {
        console.error('Error al eliminar de PocketBase:', e);
        if (e?.status === 403 || e?.message?.includes('superusers')) {
          setNotification({
            type: 'error',
            text: `Error de permisos (403): Solo superusuarios pueden eliminar en PocketBase. Desbloqueá la Delete Rule de la colección 'artists' en PocketBase o iniciá sesión como _superuser.`
          });
        } else {
          setNotification({ type: 'error', text: `Error al eliminar de PocketBase: ${e?.message || 'Error desconocido'}` });
        }
      }
      setDeleteTarget(null);
    }
  };

  const confirmBulkDelete = async () => {
    const idsToDelete = [...selectedIds];
    setIsBulkDeleteOpen(false);

    let deletedCount = 0;
    let hasPermissionError = false;

    for (const id of idsToDelete) {
      try {
        await pb.collection('artists').delete(id);
        deletedCount++;
      } catch (e: any) {
        console.error('Error al eliminar masivamente de PocketBase:', id, e);
        if (e?.status === 403 || e?.message?.includes('superusers')) {
          hasPermissionError = true;
        }
      }
    }

    if (deletedCount > 0) {
      setArtists((prev) => prev.filter((a) => !idsToDelete.slice(0, deletedCount).includes(a.id)));
      setSelectedIds([]);
      setNotification({ type: 'success', text: `Se eliminaron ${deletedCount} artistas de PocketBase.` });
    }

    if (hasPermissionError) {
      setNotification({
        type: 'error',
        text: `Error de permisos (403): PocketBase bloqueó la eliminación porque las API Rules de 'artists' requieren _superuser. Desbloqueá la 'Delete Rule' en el panel de PocketBase.`
      });
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Gestión de Artistas & Bandas"
        subtitle="Alta, baja y modificación de perfiles de artistas emergentes"
        actionText="Crear Nuevo Artista"
        actionHref="/admin/artistas/nuevo"
      />

      {/* Aviso de Vigencia de Artistas Destacados de la Semana */}
      {(() => {
        const weeklyFeatured = artists
          .filter((a) => a.featuredOfWeek)
          .map((a) => ({
            artist: a,
            status: getWeeklyFeaturedStatus(a.featuredOfWeekDate),
          }));
        if (weeklyFeatured.length === 0) return null;

        return (
          <div className="p-4 rounded-2xl bg-[#1c1d24] border border-[#e6cca0]/35 space-y-2.5">
            <div className="text-xs font-bold text-[#e6cca0] uppercase tracking-wider">
              ⏱️ Control de Vigencia — Artistas Destacados de la Semana (7 días)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {weeklyFeatured.map(({ artist, status }) => {
                const isSoon = status.daysRemaining <= 2;
                return (
                  <div
                    key={artist.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                      isSoon
                        ? 'bg-[#d97d64]/15 border-[#d97d64]/50'
                        : 'bg-[#24252c] border-[#323542]'
                    }`}
                  >
                    <div>
                      <strong className="text-[#f3f1ec] block">{artist.stageName}</strong>
                      <span className="text-[10px] text-[#8c887f]">
                        Vence: {status.expiryDateStr}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                        isSoon
                          ? 'bg-[#d97d64] text-[#151618]'
                          : 'bg-[#e6cca0]/20 text-[#e6cca0]'
                      }`}
                    >
                      {status.daysRemaining === 1
                        ? '⚠️ Queda 1 día'
                        : `${isSoon ? '⚠️ ' : ''}Quedan ${status.daysRemaining} días`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-[#c0909b]/15 border-[#c0909b]/30 text-[#e6a8b4]'
          }`}
        >
          <span>{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-[10px] uppercase font-bold underline opacity-80 hover:opacity-100"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#24262f] border border-[#3c3f4e] rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-[#f3f1ec]">
            <span className="w-2 h-2 rounded-full bg-[#d97d64] animate-pulse" />
            <span>
              {selectedIds.length} {selectedIds.length === 1 ? 'artista seleccionado' : 'artistas seleccionados'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#aba79e] hover:text-[#f3f1ec] bg-[#1a1b22] hover:bg-[#252730] border border-[#31333e] transition-colors"
            >
              Deseleccionar
            </button>
            <button
              type="button"
              onClick={() => setIsBulkDeleteOpen(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#151618] bg-[#d97d64] hover:bg-[#cb7159] transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar seleccionados ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Artists Table */}
      <div className="natural-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#aba79e]">
            <thead className="bg-[#24252c] border-b border-[#2a2c35] text-[#8c887f] uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={artists.length > 0 && selectedIds.length === artists.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded bg-[#18191e] border-[#353844] accent-[#d97d64] cursor-pointer align-middle"
                    aria-label="Seleccionar todos los artistas"
                  />
                </th>
                <th className="py-3 px-4">Artista</th>
                <th className="py-3 px-3">Géneros</th>
                <th className="py-3 px-3">Ubicación</th>
                <th className="py-3 px-3">Discografía</th>
                <th className="py-3 px-3">Destacado</th>
                <th className="py-3 px-4 text-right whitespace-nowrap min-w-[130px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24252c]">
              {artists.map((artist) => {
                const isSelected = selectedIds.includes(artist.id);
                return (
                  <tr
                    key={artist.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-[#d97d64]/10' : 'hover:bg-[#24252c]/50'
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(artist.id)}
                        className="w-4 h-4 rounded bg-[#18191e] border-[#353844] accent-[#d97d64] cursor-pointer align-middle"
                        aria-label={`Seleccionar ${artist.stageName}`}
                      />
                    </td>
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[#31333d] flex-shrink-0 bg-[#1e1f24]">
                        <Image src={artist.photoUrl || '/brand/guta-musica-favicon-512.png'} alt={artist.stageName} fill sizes="36px" className="object-cover" />
                      </div>
                      <div>
                        <strong className="text-[#f3f1ec] text-xs block">{artist.stageName}</strong>
                        <span className="text-[10px] text-[#78746c] font-mono">/artistas/{artist.slug}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {artist.genres.map((g) => (
                          <span key={g} className="px-2 py-0.5 rounded bg-[#24252c] text-[#e6cca0] font-medium text-[11px]">
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1 text-[#aba79e]">
                        <MapPin className="w-3 h-3 text-[#d97d64]" />
                        {artist.city}, {artist.province}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[#aba79e]">{artist.discography.length} lanzamientos</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col gap-1">
                        {artist.featured && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#d97d64]/20 border border-[#d97d64]/40 text-[#d97d64] inline-block self-start">
                            ⭐ Consagrado (Fijo)
                          </span>
                        )}
                        {artist.featuredOfWeek && (() => {
                          const st = getWeeklyFeaturedStatus(artist.featuredOfWeekDate);
                          const isSoon = st.daysRemaining <= 2;
                          return (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-block self-start ${
                                isSoon
                                  ? 'bg-[#d97d64]/25 border border-[#d97d64]/50 text-[#f3f1ec]'
                                  : 'bg-[#e6cca0]/20 border border-[#e6cca0]/40 text-[#e6cca0]'
                              }`}
                            >
                              ⏱️ Semanal • Quedan {st.daysRemaining}d
                            </span>
                          );
                        })()}
                        {!artist.featured && !artist.featuredOfWeek && (
                          <span className="text-[#78746c] text-[11px]">Estándar</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/artistas/${artist.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#aba79e] hover:text-[#f3f1ec] transition-colors"
                          title="Ver perfil público"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/admin/artistas/nuevo?edit=${artist.id}`}
                          className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#e6cca0] transition-colors"
                          title="Editar perfil"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#c0909b] hover:text-[#e07a8b] transition-colors"
                          title="Eliminar artista"
                          onClick={() => setDeleteTarget({ id: artist.id, name: artist.stageName })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para eliminar individual */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Eliminar Perfil de Artista"
        message={`¿Estás seguro de que deseás eliminar a "${deleteTarget?.name}"? Esta acción removerá el perfil y su discografía.`}
        confirmText="Eliminar Artista"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Modal para eliminación masiva */}
      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        title="Eliminación Masiva de Artistas"
        message={`¿Estás seguro de que deseás eliminar ${selectedIds.length} ${
          selectedIds.length === 1 ? 'artista seleccionado' : 'artistas seleccionados'
        }? Esta acción no se puede deshacer.`}
        confirmText={`Eliminar ${selectedIds.length} ${selectedIds.length === 1 ? 'Artista' : 'Artistas'}`}
        onConfirm={confirmBulkDelete}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />
    </div>
  );
};
