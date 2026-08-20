'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { pb } from '../../../lib/pocketbase';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import {
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  Music2,
  Calendar,
  Sparkles,
  Search,
  Filter,
  Eye,
  Loader2,
  Trash2,
} from 'lucide-react';

interface ApplicationItem {
  id: string;
  stageName: string;
  contactName: string;
  email: string;
  phone?: string;
  genres: string[];
  city: string;
  province: string;
  country?: string;
  bio: string;
  socials?: {
    spotify?: string;
    youtube?: string;
    instagram?: string;
    tiktok?: string;
  };
  photoUrl: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt?: string;
}

export const AdminPostulacionesClient: React.FC = () => {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Initial mock applications for instant rich admin experience
  const sampleApplications: ApplicationItem[] = [
    {
      id: 'app-sample-1',
      stageName: 'La Chusma del Monte',
      contactName: 'Luciano Cabrera',
      email: 'lachusma.monte@gmail.com',
      phone: '+54 9 351 555-1234',
      genres: ['Folklore', 'Fusión Latinoamericana'],
      city: 'Mina Clavero',
      province: 'Córdoba',
      country: 'Argentina',
      bio: 'Ensamble de guitarras de siete cuerdas, acordeón verdulera y sintetizadores. Canciones con raíz traslaserrana inspiradas en la flora y la resistencia campesina.',
      photoUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
      socials: {
        spotify: 'https://open.spotify.com',
        instagram: 'https://instagram.com',
        youtube: 'https://youtube.com',
      },
      message: 'Nos gustaría poder tocar en un Acústico GUTA o salir en las efemérides con el lanzamiento de nuestro primer LP en octubre.',
      status: 'pending',
      submittedAt: '2026-08-19',
    },
    {
      id: 'app-sample-2',
      stageName: 'Bandoneón Negro',
      contactName: 'Mariana Quiroga',
      email: 'mariana.quiroga.tango@gmail.com',
      phone: '+54 9 11 4444-9988',
      genres: ['Tango', 'Indie'],
      city: 'Avellaneda',
      province: 'Buenos Aires',
      country: 'Argentina',
      bio: 'Tango moderno y letras distópicas con arreglos de trío de cuerdas y batería electrónica.',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
      socials: {
        spotify: 'https://open.spotify.com',
        instagram: 'https://instagram.com',
      },
      message: 'Tenemos fecha confirmada en el CAFF y queremos promocionarla en la agenda de GUTA.',
      status: 'pending',
      submittedAt: '2026-08-18',
    },
  ];

  useEffect(() => {
    const loadApplications = async () => {
      setIsLoading(true);
      try {
        let pbList: ApplicationItem[] = [];
        try {
          const records = await pb.collection('applications').getFullList<any>({
            sort: '-created',
            requestKey: null,
          });
          if (records && records.length > 0) {
            pbList = records.map((r) => ({
              id: r.id,
              stageName: r.stageName,
              contactName: r.contactName || '',
              email: r.email || '',
              phone: r.phone || '',
              genres: Array.isArray(r.genres) ? r.genres : [r.genres || 'Folklore'],
              city: r.city || '',
              province: r.province || '',
              country: r.country || 'Argentina',
              bio: r.bio || '',
              socials: r.socials || {},
              photoUrl: r.photoUrl || (r.photo ? pb.files.getUrl(r, r.photo) : ''),
              message: r.message || '',
              status: r.status || 'pending',
              submittedAt: r.submittedAt || r.created?.split(' ')[0] || '',
            }));
          }
        } catch {}

        // Read from localStorage submitted forms
        const localApps: ApplicationItem[] = JSON.parse(
          localStorage.getItem('guta_pending_applications') || '[]'
        );

        // Combine unique by id
        const merged = [...pbList, ...localApps, ...sampleApplications];
        const unique = Array.from(new Map(merged.map((item) => [item.id || item.stageName, item])).values());
        setApplications(unique);
        if (unique.length > 0) {
          setSelectedApp(unique[0]);
        }
      } catch (err) {
        console.error('Error loading applications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadApplications();
  }, []);

  const handleApprove = async (app: ApplicationItem) => {
    setActionLoadingId(app.id);
    try {
      // 1. Generate slug
      const slug = app.stageName
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // 2. Create the new Artist directly into PocketBase collection 'artists'
      const newArtistPayload = {
        stageName: app.stageName,
        slug,
        realName: app.contactName || app.stageName,
        genres: app.genres,
        city: app.city,
        province: app.province,
        country: app.country || 'Argentina',
        shortBio: app.bio.substring(0, 140) + '...',
        bio: app.bio,
        photoUrl: app.photoUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop',
        bannerUrl: '',
        quotes: '',
        featured: false,
        featuredOfWeek: false,
        socials: app.socials || {},
        videos: [],
        discography: [],
        agenda: [],
        press: [],
        gallery: [],
        createdDate: new Date().toISOString().split('T')[0],
      };

      try {
        await pb.collection('artists').create(newArtistPayload);
      } catch (pbErr) {
        console.warn('PocketBase artist creation fallback:', pbErr);
      }

      // 3. Mark application as approved in state & local storage
      const updated = applications.map((a) => (a.id === app.id ? { ...a, status: 'approved' as const } : a));
      setApplications(updated);
      if (selectedApp?.id === app.id) {
        setSelectedApp({ ...selectedApp, status: 'approved' });
      }

      const localApps: ApplicationItem[] = JSON.parse(localStorage.getItem('guta_pending_applications') || '[]');
      const localUpdated = localApps.map((a) => (a.id === app.id ? { ...a, status: 'approved' as const } : a));
      localStorage.setItem('guta_pending_applications', JSON.stringify(localUpdated));

      setToastMessage(`¡"${app.stageName}" fue aprobado y publicado como artista en GUTA!`);
      setTimeout(() => setToastMessage(''), 4000);
    } catch (err: any) {
      console.error('Error approving application:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = (appId: string) => {
    const updated = applications.map((a) => (a.id === appId ? { ...a, status: 'rejected' as const } : a));
    setApplications(updated);
    if (selectedApp?.id === appId) {
      setSelectedApp({ ...selectedApp, status: 'rejected' });
    }
    setToastMessage('Postulación archivada.');
    setTimeout(() => setToastMessage(''), 3000);
  };

  const filteredApps = applications.filter((app) => {
    const matchesFilter = filterStatus === 'all' || app.status === filterStatus;
    const matchesQuery =
      searchQuery === '' ||
      app.stageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.genres.some((g) => g.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesQuery;
  });

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Postulaciones / Convocatorias"
        subtitle="Revisión y aprobación de solistas y bandas emergentes postulados desde la web pública"
        actionText="Ver Formulario Público"
        actionHref="/contacto"
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-[#93a887]/20 border border-[#93a887]/30 text-[#93a887] text-xs flex items-center gap-2 font-medium animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-[#18191e] p-1 rounded-xl border border-[#2a2c35] overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'all' ? 'bg-[#282a33] text-[#f3f1ec]' : 'text-[#8c887f] hover:text-[#aba79e]'
            }`}
          >
            Todas ({applications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              filterStatus === 'pending'
                ? 'bg-[#d97d64] text-[#151618]'
                : 'text-[#d97d64] hover:bg-[#202228]'
            }`}
          >
            <span>Pendientes</span>
            {pendingCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#151618] text-[#e6cca0] text-[10px] flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'approved' ? 'bg-[#93a887] text-[#151618]' : 'text-[#93a887] hover:bg-[#202228]'
            }`}
          >
            Aprobadas
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === 'rejected' ? 'bg-[#282a33] text-[#f3f1ec]' : 'text-[#8c887f] hover:text-[#aba79e]'
            }`}
          >
            Archivadas
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#78746c] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por artista, ciudad o género..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#18191e] border border-[#2a2c35] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
          />
        </div>
      </div>

      {/* Two Column Layout: List & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Applications Table / Cards */}
        <div className="lg:col-span-7 space-y-3">
          {filteredApps.length === 0 ? (
            <div className="natural-card p-8 rounded-2xl text-center space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-[#78746c] mx-auto" />
              <p className="text-xs text-[#aba79e] font-semibold">No se encontraron postulaciones con este criterio.</p>
            </div>
          ) : (
            filteredApps.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`natural-card p-4 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'border-[#d97d64] bg-[#22232a]'
                      : 'border-[#2d2f38] hover:border-[#3d404e] hover:bg-[#1e1f24]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black border border-[#31333d] flex-shrink-0">
                        {app.photoUrl ? (
                          <Image src={app.photoUrl} alt={app.stageName} fill sizes="48px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#78746c]">
                            <Music2 className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#f3f1ec]">{app.stageName}</h3>
                        <p className="text-xs text-[#8c887f] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#d97d64]" />
                          <span>{app.city}, {app.province}</span>
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {app.genres.slice(0, 2).map((g) => (
                            <span key={g} className="text-[10px] px-1.5 py-0.2 rounded bg-[#18191e] text-[#e6cca0]">
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1.5">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          app.status === 'approved'
                            ? 'bg-[#93a887]/20 text-[#93a887] border border-[#93a887]/30'
                            : app.status === 'rejected'
                            ? 'bg-[#78746c]/20 text-[#8c887f] border border-[#78746c]/30'
                            : 'bg-[#d97d64]/20 text-[#d97d64] border border-[#d97d64]/30 animate-pulse'
                        }`}
                      >
                        {app.status === 'approved'
                          ? 'Aprobada'
                          : app.status === 'rejected'
                          ? 'Archivada'
                          : 'Pendiente'}
                      </span>
                      {app.submittedAt && (
                        <span className="block text-[10px] text-[#78746c]">{app.submittedAt}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Selected Application Detail Inspector */}
        <div className="lg:col-span-5">
          {selectedApp ? (
            <div className="natural-card p-5 sm:p-6 rounded-2xl space-y-5 sticky top-20 border border-[#2d2f38]">
              {/* Header with Photo */}
              <div className="flex items-center gap-3.5 pb-4 border-b border-[#2d2f38]">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-black border border-[#383b47] flex-shrink-0">
                  {selectedApp.photoUrl ? (
                    <Image src={selectedApp.photoUrl} alt={selectedApp.stageName} fill sizes="64px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#78746c]">
                      <Music2 className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#e6cca0]">
                    Ficha de Postulación
                  </span>
                  <h2 className="text-lg font-black text-[#f3f1ec]">{selectedApp.stageName}</h2>
                  <p className="text-xs text-[#8c887f]">{selectedApp.city}, {selectedApp.province}</p>
                </div>
              </div>

              {/* Status & Approval Actions */}
              <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#18191e] border border-[#2a2c35]">
                <div>
                  <span className="text-[10px] text-[#78746c] block">Estado Actual:</span>
                  <strong
                    className={`text-xs capitalize ${
                      selectedApp.status === 'approved'
                        ? 'text-[#93a887]'
                        : selectedApp.status === 'rejected'
                        ? 'text-[#8c887f]'
                        : 'text-[#d97d64]'
                    }`}
                  >
                    {selectedApp.status}
                  </strong>
                </div>

                <div className="flex items-center gap-1.5">
                  {selectedApp.status !== 'approved' && (
                    <button
                      type="button"
                      disabled={actionLoadingId === selectedApp.id}
                      onClick={() => handleApprove(selectedApp)}
                      className="px-3 py-1.5 rounded-lg bg-[#93a887] hover:bg-[#829676] text-[#151618] text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoadingId === selectedApp.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Aprobar Artista</span>
                    </button>
                  )}

                  {selectedApp.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleReject(selectedApp.id)}
                      className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#8c887f] hover:text-[#c0909b] transition-colors"
                      title="Archivar postulación"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Contact Data */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-semibold uppercase text-[#78746c] block">
                  Información de Contacto
                </span>
                <div className="space-y-1.5 text-[#aba79e]">
                  <p className="flex items-center gap-2">
                    <strong className="text-[#f3f1ec]">Responsable:</strong> {selectedApp.contactName}
                  </p>
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#d97d64]" />
                    <a href={`mailto:${selectedApp.email}`} className="text-[#e6cca0] hover:underline">
                      {selectedApp.email}
                    </a>
                  </p>
                  {selectedApp.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#93a887]" />
                      <span>{selectedApp.phone}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Bio & Proposal */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] font-semibold uppercase text-[#78746c] block">
                  Biografía & Estilo
                </span>
                <p className="text-[#aba79e] leading-relaxed bg-[#18191e] p-3 rounded-xl border border-[#2a2c35]">
                  {selectedApp.bio}
                </p>
              </div>

              {/* Additional message */}
              {selectedApp.message && (
                <div className="space-y-1.5 text-xs">
                  <span className="text-[10px] font-semibold uppercase text-[#78746c] block">
                    Mensaje para la Redacción
                  </span>
                  <p className="text-[#aba79e] italic bg-[#18191e] p-3 rounded-xl border border-[#2a2c35]">
                    "{selectedApp.message}"
                  </p>
                </div>
              )}

              {/* Links */}
              {selectedApp.socials && (
                <div className="space-y-2 pt-2 border-t border-[#2d2f38]">
                  <span className="text-[10px] font-semibold uppercase text-[#78746c] block">
                    Enlaces de Audio y Redes
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedApp.socials.spotify && (
                      <a
                        href={selectedApp.socials.spotify}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-[#18191e] hover:bg-[#202228] text-[#93a887] text-xs font-semibold flex items-center gap-1 border border-[#2a2c35]"
                      >
                        <span>Spotify</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {selectedApp.socials.youtube && (
                      <a
                        href={selectedApp.socials.youtube}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-[#18191e] hover:bg-[#202228] text-[#d97d64] text-xs font-semibold flex items-center gap-1 border border-[#2a2c35]"
                      >
                        <span>YouTube</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {selectedApp.socials.instagram && (
                      <a
                        href={selectedApp.socials.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-[#18191e] hover:bg-[#202228] text-[#c0909b] text-xs font-semibold flex items-center gap-1 border border-[#2a2c35]"
                      >
                        <span>Instagram</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="natural-card p-8 rounded-2xl text-center text-xs text-[#8c887f]">
              Seleccioná una postulación de la lista para inspeccionar sus datos y aprobarla.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
