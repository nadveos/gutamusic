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
  TrendingUp,
  ExternalLink,
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
      color: 'from-amber-500 to-amber-600',
      href: '/admin/artistas',
    },
    {
      label: 'Videos en Videoteca',
      value: videos.length,
      icon: Video,
      color: 'from-cyan-500 to-cyan-600',
      href: '/admin/videos',
    },
    {
      label: 'Efemérides Históricas',
      value: ephemerides.length,
      icon: BookOpen,
      color: 'from-emerald-500 to-emerald-600',
      href: '/admin/efemerides',
    },
    {
      label: 'Fechas en Cartelera',
      value: events.length,
      icon: Calendar,
      color: 'from-rose-500 to-rose-600',
      href: '/admin/agenda',
    },
  ];

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Dashboard de Gestión Editorial"
        subtitle="Panel central para administración de artistas emergentes, videos multiformato y efemérides"
        actionText="Nuevo Artista"
        actionHref="/admin/artistas/nuevo"
      />

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Link
              key={idx}
              href={stat.href}
              className="glass-card p-5 rounded-2xl border border-white/10 hover:border-amber-400/40 transition-all flex items-center justify-between group hover:-translate-y-0.5"
            >
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-medium">{stat.label}</span>
                <p className="text-2xl sm:text-3xl font-black text-white">{stat.value}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${stat.color} flex items-center justify-center text-black shadow-lg shadow-black/40 group-hover:scale-105 transition-transform`}
              >
                <Icon className="w-6 h-6 text-black" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Action Shortcuts */}
      <section className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/admin/artistas/nuevo"
            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-400/30 transition-all flex items-center gap-3 text-xs font-bold text-gray-200"
          >
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
              <Plus className="w-4 h-4" />
            </div>
            <span>Dar de alta nuevo artista</span>
          </Link>

          <Link
            href="/admin/videos"
            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-400/30 transition-all flex items-center gap-3 text-xs font-bold text-gray-200"
          >
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
              <Video className="w-4 h-4" />
            </div>
            <span>Cargar video por URL (YouTube / TikTok)</span>
          </Link>

          <Link
            href="/admin/efemerides"
            className="p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-400/30 transition-all flex items-center gap-3 text-xs font-bold text-gray-200"
          >
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
              <BookOpen className="w-4 h-4" />
            </div>
            <span>Añadir efeméride histórica</span>
          </Link>
        </div>
      </section>

      {/* Recent Artists Table */}
      <section className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Artistas en la Plataforma</h2>
            <p className="text-xs text-gray-400">Listado activo y estado de perfiles</p>
          </div>
          <Link
            href="/admin/artistas"
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="border-b border-white/10 text-gray-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Artista</th>
                <th className="py-3 px-4">Género</th>
                <th className="py-3 px-4">Ubicación</th>
                <th className="py-3 px-4">Videos</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {artists.slice(0, 5).map((artist) => (
                <tr key={artist.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                      <Image src={artist.photoUrl} alt={artist.stageName} fill className="object-cover" />
                    </div>
                    <div>
                      <strong className="text-white block">{artist.stageName}</strong>
                      <span className="text-[10px] text-gray-400">{artist.slug}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-white/5 text-amber-400 font-semibold">
                      {artist.genres[0]}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-400">{artist.city}, {artist.province}</td>
                  <td className="py-3.5 px-4">{artist.videos.length} videos</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {artist.featured ? 'Destacado' : 'Publicado'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    <Link
                      href={`/artistas/${artist.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white inline-block transition-colors"
                      title="Ver en portal"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/admin/artistas/nuevo?edit=${artist.id}`}
                      className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 inline-block transition-colors"
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
