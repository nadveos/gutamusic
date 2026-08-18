'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Artist } from '../../../lib/types';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { Mic2, Plus, Edit, Trash2, Eye, MapPin, Sparkles } from 'lucide-react';

interface AdminArtistasClientProps {
  initialArtists: Artist[];
}

export const AdminArtistasClient: React.FC<AdminArtistasClientProps> = ({
  initialArtists,
}) => {
  const [artists, setArtists] = useState<Artist[]>(initialArtists);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de que deseás eliminar a "${name}"?`)) {
      setArtists(artists.filter((a) => a.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Gestión de Artistas & Bandas"
        subtitle="Alta, baja y modificación de perfiles de artistas emergentes"
        actionText="Crear Nuevo Artista"
        actionHref="/admin/artistas/nuevo"
      />

      {/* Artists Table */}
      <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3.5 px-5">Artista</th>
                <th className="py-3.5 px-4">Géneros</th>
                <th className="py-3.5 px-4">Ubicación</th>
                <th className="py-3.5 px-4">Discografía</th>
                <th className="py-3.5 px-4">Destacado</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {artists.map((artist) => (
                <tr key={artist.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-5 flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                      <Image src={artist.photoUrl} alt={artist.stageName} fill className="object-cover" />
                    </div>
                    <div>
                      <strong className="text-white text-sm block">{artist.stageName}</strong>
                      <span className="text-[11px] text-gray-400 font-mono">/artistas/{artist.slug}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {artist.genres.map((g) => (
                        <span key={g} className="px-2 py-0.5 rounded bg-white/5 text-amber-400 font-medium">
                          {g}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="flex items-center gap-1 text-gray-300">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      {artist.city}, {artist.province}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-300">{artist.discography.length} lanzamientos</span>
                  </td>
                  <td className="py-4 px-4">
                    {artist.featured ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        ⭐ Destacado
                      </span>
                    ) : (
                      <span className="text-gray-400">Estándar</span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right space-x-2">
                    <Link
                      href={`/artistas/${artist.slug}`}
                      target="_blank"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white inline-block transition-colors"
                      title="Ver perfil público"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/admin/artistas/nuevo?edit=${artist.id}`}
                      className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 inline-block transition-colors"
                      title="Editar perfil"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 inline-block transition-colors"
                      title="Eliminar artista"
                      onClick={() => handleDelete(artist.id, artist.stageName)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
