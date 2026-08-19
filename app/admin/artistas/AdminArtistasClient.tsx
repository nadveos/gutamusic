'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Artist } from '../../../lib/types';
import { pb } from '../../../lib/pocketbase';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { ConfirmModal } from '../../../components/admin/ConfirmModal';
import { Edit, Trash2, Eye, MapPin } from 'lucide-react';

interface AdminArtistasClientProps {
  initialArtists: Artist[];
}

export const AdminArtistasClient: React.FC<AdminArtistasClientProps> = ({
  initialArtists,
}) => {
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const confirmDelete = async () => {
    if (deleteTarget) {
      const id = deleteTarget.id;
      setArtists((prev) => prev.filter((a) => a.id !== id));
      try {
        await pb.collection('artists').delete(id);
      } catch (e) {
        console.warn('Error al eliminar de PocketBase:', e);
      }
      setDeleteTarget(null);
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

      {/* Artists Table */}
      <div className="natural-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#aba79e]">
            <thead className="bg-[#24252c] border-b border-[#2a2c35] text-[#8c887f] uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Artista</th>
                <th className="py-3 px-3">Géneros</th>
                <th className="py-3 px-3">Ubicación</th>
                <th className="py-3 px-3">Discografía</th>
                <th className="py-3 px-3">Destacado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24252c]">
              {artists.map((artist) => (
                <tr key={artist.id} className="hover:bg-[#24252c]/50 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-2.5">
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-[#31333d] flex-shrink-0">
                      <Image src={artist.photoUrl} alt={artist.stageName} fill className="object-cover" />
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
                  <td className="py-3 px-4 text-right space-x-1.5">
                    <Link
                      href={`/artistas/${artist.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#aba79e] hover:text-[#f3f1ec] inline-block transition-colors"
                      title="Ver perfil público"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/admin/artistas/nuevo?edit=${artist.id}`}
                      className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#e6cca0] inline-block transition-colors"
                      title="Editar perfil"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#c0909b] inline-block transition-colors"
                      title="Eliminar artista"
                      onClick={() => setDeleteTarget({ id: artist.id, name: artist.stageName })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Eliminar Perfil de Artista"
        message={`¿Estás seguro de que deseás eliminar a "${deleteTarget?.name}"? Esta acción removerá el perfil y su discografía.`}
        confirmText="Eliminar Artista"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
