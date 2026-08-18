import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MusicDataService } from '../../lib/api';
import { AdminHeader } from '../../components/admin/AdminHeader';
import {
  Mic2,
  Video,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  Eye,
  Edit,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const artists = await MusicDataService.getArtists();
  const videos = await MusicDataService.getVideos();
  const ephemerides = await MusicDataService.getAllEphemerides();
  const events = await MusicDataService.getUpcomingEvents();

  const stats = [
    {
      label: 'Artistas Registrados',
      value: artists.length,
      icon: Mic2,
      badgeColor: 'bg-terracotta-soft text-[#d97d64]',
      href: '/admin/artistas',
    },
    {
      label: 'Videos en Videoteca',
      value: videos.length,
      icon: Video,
      badgeColor: 'bg-sage-soft text-[#93a887]',
      href: '/admin/videos',
    },
    {
      label: 'Efemérides Históricas',
      value: ephemerides.length,
      icon: BookOpen,
      badgeColor: 'bg-sand-soft text-[#e6cca0]',
      href: '/admin/efemerides',
    },
    {
      label: 'Fechas en Cartelera',
      value: events.length,
      icon: Calendar,
      badgeColor: 'bg-slate-soft text-[#a7b8c8]',
      href: '/admin/agenda',
    },
  ];

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Dashboard de Gestión Editorial"
        subtitle="Panel central para administración de artistas emergentes, videos multiformato y efemérides"
        actionText="Nuevo Artista"
        actionHref="/admin/artistas/nuevo"
      />

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={idx}
              href={stat.href}
              className="natural-card p-4 rounded-xl flex items-center justify-between transition-colors hover:border-[#464956]"
            >
              <div className="space-y-0.5">
                <span className="text-xs text-[#8c887f] font-medium">{stat.label}</span>
                <p className="text-2xl font-black text-[#f3f1ec]">{stat.value}</p>
              </div>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.badgeColor}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Action Shortcuts */}
      <section className="natural-card p-5 rounded-2xl space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0]">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/admin/artistas/nuevo"
            className="p-3.5 rounded-xl bg-[#24252c] hover:bg-[#2a2c34] border border-[#31333d] transition-colors flex items-center gap-2.5 text-xs font-semibold text-[#f3f1ec]"
          >
            <div className="p-1.5 rounded bg-terracotta-soft">
              <Plus className="w-3.5 h-3.5" />
            </div>
            <span>Dar de alta nuevo artista</span>
          </Link>

          <Link
            href="/admin/videos"
            className="p-3.5 rounded-xl bg-[#24252c] hover:bg-[#2a2c34] border border-[#31333d] transition-colors flex items-center gap-2.5 text-xs font-semibold text-[#f3f1ec]"
          >
            <div className="p-1.5 rounded bg-sage-soft">
              <Video className="w-3.5 h-3.5" />
            </div>
            <span>Cargar video por URL</span>
          </Link>

          <Link
            href="/admin/efemerides"
            className="p-3.5 rounded-xl bg-[#24252c] hover:bg-[#2a2c34] border border-[#31333d] transition-colors flex items-center gap-2.5 text-xs font-semibold text-[#f3f1ec]"
          >
            <div className="p-1.5 rounded bg-sand-soft">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span>Añadir efeméride histórica</span>
          </Link>
        </div>
      </section>

      {/* Recent Artists Table */}
      <section className="natural-card p-5 rounded-2xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#f3f1ec]">Artistas en la Plataforma</h2>
            <p className="text-xs text-[#8c887f]">Listado activo y estado de perfiles</p>
          </div>
          <Link
            href="/admin/artistas"
            className="text-xs font-semibold text-[#e6cca0] hover:underline flex items-center gap-1"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

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
                      <Image src={artist.photoUrl} alt={artist.stageName} fill className="object-cover" />
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
                  <td className="py-3 px-3 text-[#aba79e]">{artist.city}, {artist.province}</td>
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
      </section>
    </div>
  );
}
