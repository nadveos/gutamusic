import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MusicDataService } from '../../lib/api';
import { pb } from '../../lib/pocketbase';
import { getContributionsFromDb } from '../../lib/services/mercadopagoService';
import { getWeeklyFeaturedStatus } from '../../lib/services/featuredRotationService';
import { getDaysRemaining } from '../../lib/constants/sponsorPricing';
import { AdminHeader } from '../../components/admin/AdminHeader';
import {
  Mic2,
  Users,
  Video,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  Eye,
  Edit,
  Radio,
  HeartHandshake,
  Heart,
  Share2,
  Clock,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const artists = await MusicDataService.getArtists();
  const videos = await MusicDataService.getVideos();
  const events = await MusicDataService.getUpcomingEvents();
  const interviews = await MusicDataService.getInterviews();
  const alliances = await MusicDataService.getAlliances(undefined, false);
  const socials = await MusicDataService.getOfficialSocials();
  const contributions = await getContributionsFromDb().catch(() => []);
  const totalDonationsArs = contributions.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  const activeSocialCount = ['tiktok', 'instagram', 'facebook', 'kick', 'twitch'].filter(
    (k) => (socials as any)[k]?.active && (socials as any)[k]?.handle
  ).length;

  let userCount = 0;
  try {
    const userRes = await pb.collection('users').getList(1, 1, { requestKey: null });
    userCount = userRes.totalItems;
  } catch {}

  let ephemeridesCount = 0;
  try {
    const ephRes = await pb.collection('ephemerides').getList(1, 1, { requestKey: null });
    ephemeridesCount = ephRes.totalItems;
  } catch {}

  const stats = [
    {
      label: 'Colaboraciones Recibidas',
      value: `${contributions.length} ($${totalDonationsArs.toLocaleString('es-AR')})`,
      icon: Heart,
      badgeColor: 'bg-sage-soft text-[#93a887]',
      href: '/admin/colaboraciones',
    },
    {
      label: 'Artistas en Catálogo',
      value: artists.length,
      icon: Mic2,
      badgeColor: 'bg-terracotta-soft text-[#d97d64]',
      href: '/admin/artistas',
    },
    {
      label: 'Cuentas de Usuarios',
      value: userCount,
      icon: Users,
      badgeColor: 'bg-sage-soft text-[#93a887]',
      href: '/admin/usuarios',
    },
    {
      label: 'Entrevistas & Lives',
      value: interviews.length,
      icon: Radio,
      badgeColor: 'bg-sand-soft text-[#e6cca0]',
      href: '/admin/entrevistas',
    },
    {
      label: 'Redes @sesionesrg',
      value: `${activeSocialCount} / 5`,
      icon: Share2,
      badgeColor: 'bg-terracotta-soft text-[#d97d64]',
      href: '/admin/redes',
    },
    {
      label: 'Auspiciantes & Alianzas',
      value: alliances.length,
      icon: HeartHandshake,
      badgeColor: 'bg-sand-soft text-[#e6cca0]',
      href: '/admin/aliados',
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
      value: ephemeridesCount,
      icon: BookOpen,
      badgeColor: 'bg-slate-soft text-[#a7b8c8]',
      href: '/admin/efemerides',
    },
  ];


  return (
    <div className="space-y-6">
      <AdminHeader
        title="Dashboard de Gestión Editorial"
        subtitle="Panel central para administración de artistas emergentes, entrevistas exclusivas, videos y convocatorias"
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

      {/* Control de Vigencias & Avisos Previos al Vencimiento (Artistas y Anunciantes) */}
      {(() => {
        const weeklyFeaturedList = artists
          .filter((a) => a.featuredOfWeek)
          .map((a) => ({
            artist: a,
            status: getWeeklyFeaturedStatus(a.featuredOfWeekDate),
          }));

        const sponsorVigenciaList = alliances
          .filter((al) => al.active && al.endDate)
          .map((al) => ({
            alliance: al,
            remaining: getDaysRemaining(al.endDate),
          }));

        if (weeklyFeaturedList.length === 0 && sponsorVigenciaList.length === 0) return null;

        return (
          <section className="natural-card p-5 rounded-2xl border border-[#d97d64]/35 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#d97d64]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#e6cca0]">
                  Vigencia & Avisos de Vencimiento (Artistas Semanales y Anunciantes)
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Columna Artistas Destacados de la Semana */}
              <div className="p-4 rounded-xl bg-[#18191e] border border-[#2a2c35] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#f3f1ec]">
                    🎸 Artistas Destacados de la Semana (7 días)
                  </span>
                  <Link href="/admin/artistas" className="text-[11px] text-[#e6cca0] hover:underline">
                    Gestionar →
                  </Link>
                </div>
                {weeklyFeaturedList.length === 0 ? (
                  <p className="text-xs text-[#78746c]">No hay artistas semanales con vencimiento activo.</p>
                ) : (
                  <div className="space-y-2">
                    {weeklyFeaturedList.map(({ artist, status }) => {
                      const isSoon = status.daysRemaining <= 2;
                      return (
                        <div
                          key={artist.id}
                          className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                            isSoon
                              ? 'bg-[#d97d64]/15 border-[#d97d64]/40'
                              : 'bg-[#202228] border-[#2d2f38]'
                          }`}
                        >
                          <div>
                            <strong className="text-[#f3f1ec] block">{artist.stageName}</strong>
                            <span className="text-[10px] text-[#8c887f]">
                              Vence: {status.expiryDateStr}
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
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
                )}
              </div>

              {/* Columna Anunciantes / Auspiciantes */}
              <div className="p-4 rounded-xl bg-[#18191e] border border-[#2a2c35] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#f3f1ec]">
                    🏢 Anunciantes & Auspicios Activos (30 días)
                  </span>
                  <Link href="/admin/aliados" className="text-[11px] text-[#e6cca0] hover:underline">
                    Gestionar →
                  </Link>
                </div>
                {sponsorVigenciaList.length === 0 ? (
                  <p className="text-xs text-[#78746c]">
                    Los auspiciantes actuales son de cortesía permanente (sin fecha de vencimiento).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sponsorVigenciaList.map(({ alliance, remaining }) => {
                      const isSoon = remaining.isExpired || remaining.days <= 7;
                      return (
                        <div
                          key={alliance.id}
                          className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                            isSoon
                              ? 'bg-[#d97d64]/15 border-[#d97d64]/40'
                              : 'bg-[#202228] border-[#2d2f38]'
                          }`}
                        >
                          <div>
                            <strong className="text-[#f3f1ec] block">{alliance.name}</strong>
                            <span className="text-[10px] text-[#8c887f]">
                              Vence: {alliance.endDate}
                            </span>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                              remaining.isExpired
                                ? 'bg-[#c05a68] text-[#f3f1ec]'
                                : isSoon
                                  ? 'bg-[#d97d64] text-[#151618]'
                                  : 'bg-[#93a887]/20 text-[#93a887]'
                            }`}
                          >
                            {remaining.isExpired
                              ? 'Vencido'
                              : `${isSoon ? '⚠️ ' : ''}Quedan ${remaining.days} días`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Quick Action Shortcuts */}
      <section className="space-y-4">
        <div className="natural-card p-5 rounded-2xl space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0]">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/admin/artistas/nuevo"
              className="p-3.5 rounded-xl bg-[#24252c] hover:bg-[#2a2c34] border border-[#31333d] transition-colors flex items-center gap-2.5 text-xs font-semibold text-[#f3f1ec]"
            >
              <div className="p-1.5 rounded bg-terracotta-soft">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <span>Nuevo Artista</span>
            </Link>

            <Link
              href="/admin/entrevistas/nuevo"
              className="p-3.5 rounded-xl bg-[#24252c] hover:bg-[#2a2c34] border border-[#31333d] transition-colors flex items-center gap-2.5 text-xs font-semibold text-[#f3f1ec]"
            >
              <div className="p-1.5 rounded bg-sand-soft">
                <Radio className="w-3.5 h-3.5" />
              </div>
              <span>Nueva Entrevista / Live</span>
            </Link>

            <Link
              href="/admin/postulaciones"
              className="p-3.5 rounded-xl bg-[#24252c] hover:bg-[#2a2c34] border border-[#31333d] transition-colors flex items-center gap-2.5 text-xs font-semibold text-[#f3f1ec]"
            >
              <div className="p-1.5 rounded bg-sage-soft">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span>Revisar Postulaciones</span>
            </Link>

            <Link
              href="/admin/redes"
              className="p-3.5 rounded-xl bg-[#24252c] hover:bg-[#2a2c34] border border-[#31333d] transition-colors flex items-center gap-2.5 text-xs font-semibold text-[#f3f1ec]"
            >
              <div className="p-1.5 rounded bg-terracotta-soft">
                <Share2 className="w-3.5 h-3.5 text-[#d97d64]" />
              </div>
              <span>Redes @sesionesrg</span>
            </Link>

            <Link
              href="/admin/colaboraciones"
              className="p-3.5 rounded-xl bg-[#24252c] hover:bg-[#2a2c34] border border-[#31333d] transition-colors flex items-center gap-2.5 text-xs font-semibold text-[#f3f1ec]"
            >
              <div className="p-1.5 rounded bg-sage-soft">
                <Heart className="w-3.5 h-3.5 text-[#93a887]" />
              </div>
              <span>Historial de Colaboraciones</span>
            </Link>

            <Link
              href="/admin/aliados"
              className="p-3.5 rounded-xl bg-[#24252c] hover:bg-[#2a2c34] border border-[#31333d] transition-colors flex items-center gap-2.5 text-xs font-semibold text-[#f3f1ec]"
            >
              <div className="p-1.5 rounded bg-sand-soft">
                <HeartHandshake className="w-3.5 h-3.5 text-[#e6cca0]" />
              </div>
              <span>Nuevo Auspiciante</span>
            </Link>

            <Link
              href="/admin/videos"
              className="p-3.5 rounded-xl bg-[#24252c] hover:bg-[#2a2c34] border border-[#31333d] transition-colors flex items-center gap-2.5 text-xs font-semibold text-[#f3f1ec]"
            >
              <div className="p-1.5 rounded bg-slate-soft">
                <Video className="w-3.5 h-3.5" />
              </div>
              <span>Cargar Video por URL</span>
            </Link>
          </div>
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
                      <Image src={artist.photoUrl || '/brand/guta-musica-favicon-512.png'} alt={artist.stageName} fill sizes="32px" className="object-cover" />
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
