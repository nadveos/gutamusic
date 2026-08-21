'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Artist } from '../../../lib/types';
import { pb } from '../../../lib/pocketbase';
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
                        <Image src={artist.photoUrl} alt={artist.stageName} fill sizes="36px" className="object-cover" />
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
                      {artist.featured ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sand-soft">
                          Destacado
                        </span>
                      ) : (
                        <span className="text-[#78746c]">Estándar</span>
                      )}
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
