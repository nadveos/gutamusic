'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  UserCheck,
  UserX,
  Mail,
  KeyRound,
  Link as LinkIcon,
  Unlink,
  Trash2,
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Music2,
  Calendar,
  X,
  Check,
} from 'lucide-react';
import { AdminHeader } from '../../../components/admin/AdminHeader';

interface LinkedArtist {
  id: string;
  stageName: string;
  slug: string;
  photoUrl?: string;
  status?: string;
  isExplicitOwner?: boolean;
}

interface UserItem {
  id: string;
  email: string;
  name: string;
  verified: boolean;
  created: string;
  updated: string;
  avatar?: string;
  artist: LinkedArtist | null;
}

interface AvailableArtist {
  id: string;
  stageName: string;
  slug: string;
  owner: string;
  contactEmail?: string;
  photoUrl?: string;
}

export function AdminUsuariosClient() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [artists, setArtists] = useState<AvailableArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'verified' | 'unverified' | 'linked' | 'unlinked'>('all');

  // Toasts
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Modal Vincular Artista
  const [linkingUser, setLinkingUser] = useState<UserItem | null>(null);
  const [artistSearchQuery, setArtistSearchQuery] = useState('');

  // Modal Nuevo Usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    verified: true,
    artistId: '',
  });

  // Modal Confirmar Eliminación
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setArtists(data.artists || []);
      } else {
        showToast('error', data.error || 'Error al cargar usuarios.');
      }
    } catch (err: any) {
      showToast('error', 'Error al conectar con la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        u.email.toLowerCase().includes(query) ||
        u.name.toLowerCase().includes(query) ||
        (u.artist && u.artist.stageName.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      if (filterTab === 'verified') return u.verified;
      if (filterTab === 'unverified') return !u.verified;
      if (filterTab === 'linked') return Boolean(u.artist);
      if (filterTab === 'unlinked') return !u.artist;

      return true;
    });
  }, [users, searchQuery, filterTab]);

  // Métricas
  const stats = useMemo(() => {
    const total = users.length;
    const verified = users.filter((u) => u.verified).length;
    const unverified = total - verified;
    const linked = users.filter((u) => Boolean(u.artist)).length;
    return { total, verified, unverified, linked };
  }, [users]);

  // Acciones: Toggle Verificado
  const handleToggleVerified = async (user: UserItem) => {
    setActionLoadingId(user.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_verified',
          userId: user.id,
          verified: !user.verified,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, verified: !u.verified } : u))
        );
      } else {
        showToast('error', data.error || 'Error al cambiar estado.');
      }
    } catch (err: any) {
      showToast('error', 'Error al procesar la solicitud.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Acciones: Enviar reseteo de clave
  const handleRequestPasswordReset = async (user: UserItem) => {
    setActionLoadingId(user.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request_password_reset',
          email: user.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
      } else {
        showToast('error', data.error || 'Error enviando correo de reseteo.');
      }
    } catch (err: any) {
      showToast('error', 'Error de conexión.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Acciones: Vincular Artista
  const handleLinkArtist = async (artistId: string) => {
    if (!linkingUser) return;
    setActionLoadingId(linkingUser.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'link_artist',
          userId: linkingUser.id,
          artistId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        setLinkingUser(null);
        loadData();
      } else {
        showToast('error', data.error || 'Error al vincular artista.');
      }
    } catch (err: any) {
      showToast('error', 'Error de red.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Acciones: Desvincular Artista
  const handleUnlinkArtist = async (user: UserItem) => {
    if (!user.artist?.id) return;
    if (!confirm(`¿Desvincular a "${user.artist.stageName}" de la cuenta ${user.email}?`)) return;

    setActionLoadingId(user.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unlink_artist',
          artistId: user.artist.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        loadData();
      } else {
        showToast('error', data.error || 'Error al desvincular.');
      }
    } catch (err: any) {
      showToast('error', 'Error de red.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Acciones: Eliminar Usuario
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setActionLoadingId(userToDelete.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_user',
          userId: userToDelete.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        setUserToDelete(null);
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      } else {
        showToast('error', data.error || 'Error al eliminar usuario.');
      }
    } catch (err: any) {
      showToast('error', 'Error de conexión.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Acciones: Crear Usuario
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.email || !newUserForm.password) {
      showToast('error', 'Completá email y contraseña.');
      return;
    }
    setActionLoadingId('create_modal');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_user',
          ...newUserForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        setShowCreateModal(false);
        setNewUserForm({
          name: '',
          email: '',
          password: '',
          verified: true,
          artistId: '',
        });
        loadData();
      } else {
        showToast('error', data.error || 'Error creando usuario.');
      }
    } catch (err: any) {
      showToast('error', 'Error de red.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all ${
            toast.type === 'success'
              ? 'bg-[#18231c]/90 border-[#3a5840] text-[#93a887]'
              : toast.type === 'error'
              ? 'bg-[#291819]/90 border-[#632f34] text-[#e06c75]'
              : 'bg-[#1a1b22]/90 border-[#333644] text-[#aba79e]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-xs opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <AdminHeader
        title="Gestión de Cuentas & Usuarios"
        subtitle="Administrá las cuentas de artistas registradas, verificación OTP, restablecimiento de accesos y vinculación con fichas del catálogo."
        actionText="Nuevo Usuario"
        onActionClick={() => setShowCreateModal(true)}
      />

      {/* Ribbon de Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="natural-card p-4 rounded-xl border border-[#2a2c35] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#aba79e]">
            <span>Total Cuentas</span>
            <Users className="w-4 h-4 text-[#d97d64]" />
          </div>
          <div className="text-2xl font-black text-[#f3f1ec]">{stats.total}</div>
        </div>

        <div className="natural-card p-4 rounded-xl border border-[#2a2c35] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#aba79e]">
            <span>Verificados</span>
            <UserCheck className="w-4 h-4 text-[#93a887]" />
          </div>
          <div className="text-2xl font-black text-[#93a887]">{stats.verified}</div>
        </div>

        <div className="natural-card p-4 rounded-xl border border-[#2a2c35] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#aba79e]">
            <span>Pendientes OTP</span>
            <UserX className="w-4 h-4 text-[#e6cca0]" />
          </div>
          <div className="text-2xl font-black text-[#e6cca0]">{stats.unverified}</div>
        </div>

        <div className="natural-card p-4 rounded-xl border border-[#2a2c35] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#aba79e]">
            <span>Con Artista Vinculado</span>
            <Music2 className="w-4 h-4 text-[#d97d64]" />
          </div>
          <div className="text-2xl font-black text-[#d97d64]">{stats.linked}</div>
        </div>
      </div>

      {/* Filtros & Barra de Búsqueda */}
      <div className="natural-card p-4 rounded-xl border border-[#2a2c35] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78746c]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por email, nombre o banda..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-lg bg-[#202228] border border-[#2d2f38] text-[#f3f1ec] placeholder-[#78746c] focus:outline-none focus:border-[#d97d64]"
          />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: `Todos (${users.length})` },
            { id: 'verified', label: `Verificados (${stats.verified})` },
            { id: 'unverified', label: `Pendientes (${stats.unverified})` },
            { id: 'linked', label: `Con Artista (${stats.linked})` },
            { id: 'unlinked', label: `Sin Artista (${stats.total - stats.linked})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterTab === tab.id
                  ? 'bg-[#d97d64] text-[#121316] font-bold'
                  : 'bg-[#202228] text-[#aba79e] hover:text-[#f3f1ec] border border-[#2d2f38]'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={loadData}
            title="Refrescar datos"
            className="p-2 rounded-lg bg-[#202228] border border-[#2d2f38] text-[#aba79e] hover:text-[#f3f1ec] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#d97d64]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="natural-card rounded-xl border border-[#2a2c35] overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="p-12 text-center text-[#78746c] space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#d97d64]" />
            <p className="text-sm">Cargando base de usuarios...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-[#78746c] space-y-2">
            <Users className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-sm font-medium text-[#aba79e]">No se encontraron usuarios</p>
            <p className="text-xs">Probá cambiando el filtro o la búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#202228] text-[#aba79e] uppercase text-[10px] tracking-wider border-b border-[#2a2c35]">
                <tr>
                  <th className="py-3 px-4">Usuario / Email</th>
                  <th className="py-3 px-4">Registro</th>
                  <th className="py-3 px-4">Estado OTP</th>
                  <th className="py-3 px-4">Ficha de Artista</th>
                  <th className="py-3 px-4 text-right">Acciones de Soporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242630]">
                {filteredUsers.map((u) => {
                  const isActionBusy = actionLoadingId === u.id;
                  const initials = (u.name || u.email.split('@')[0])
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[#1f2128]/60 transition-colors group"
                    >
                      {/* Usuario */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#272931] border border-[#353844] flex items-center justify-center font-bold text-xs text-[#e6cca0]">
                            {initials}
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#f3f1ec] block">
                              {u.name || 'Sin nombre'}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#aba79e]">
                              <Mail className="w-3 h-3 text-[#78746c]" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Registro */}
                      <td className="py-3.5 px-4 text-[#aba79e]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#78746c]" />
                          <span>{u.created || 'Reciente'}</span>
                        </div>
                      </td>

                      {/* Estado OTP / Verificación */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleVerified(u)}
                          disabled={isActionBusy}
                          title="Hacé clic para alternar verificación manual"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                            u.verified
                              ? 'bg-[#18231c] text-[#93a887] border-[#3a5840] hover:bg-[#202e25]'
                              : 'bg-[#292218] text-[#e6cca0] border-[#5e4b2d] hover:bg-[#382e20]'
                          }`}
                        >
                          {u.verified ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verificado</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3 h-3" />
                              <span>Pendiente OTP</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Artista Vinculado */}
                      <td className="py-3.5 px-4">
                        {u.artist ? (
                          <div className="flex items-center gap-2">
                            {u.artist.photoUrl ? (
                              <img
                                src={u.artist.photoUrl}
                                alt={u.artist.stageName}
                                className="w-6 h-6 rounded-full object-cover border border-[#353844]"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#272931] flex items-center justify-center text-[#d97d64]">
                                <Music2 className="w-3 h-3" />
                              </div>
                            )}
                            <div>
                              <Link
                                href={`/artistas/${u.artist.slug}`}
                                target="_blank"
                                className="font-bold text-[#f3f1ec] hover:text-[#d97d64] inline-flex items-center gap-1 group/art"
                              >
                                <span>{u.artist.stageName}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover/art:opacity-100" />
                              </Link>
                              <span className="block text-[10px] text-[#78746c]">
                                {u.artist.isExplicitOwner ? 'Propietario asignado' : 'Coincidencia por email'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleUnlinkArtist(u)}
                              disabled={isActionBusy}
                              title="Desvincular artista"
                              className="ml-1 text-[#78746c] hover:text-[#e06c75] p-1 rounded transition-colors"
                            >
                              <Unlink className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setLinkingUser(u);
                              setArtistSearchQuery('');
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#242630] hover:bg-[#2e313e] text-[#e6cca0] border border-[#353844] transition-colors"
                          >
                            <LinkIcon className="w-3 h-3" />
                            <span>Vincular Artista</span>
                          </button>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Cambiar vinculación si ya tiene */}
                          {u.artist && (
                            <button
                              onClick={() => {
                                setLinkingUser(u);
                                setArtistSearchQuery('');
                              }}
                              disabled={isActionBusy}
                              title="Cambiar artista vinculado"
                              className="p-1.5 rounded-lg bg-[#202228] hover:bg-[#2b2d38] text-[#aba79e] hover:text-[#f3f1ec] border border-[#2d2f38] transition-colors"
                            >
                              <LinkIcon className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Enviar reseteo de clave */}
                          <button
                            onClick={() => handleRequestPasswordReset(u)}
                            disabled={isActionBusy}
                            title="Enviar correo de restablecimiento de contraseña"
                            className="p-1.5 rounded-lg bg-[#202228] hover:bg-[#2b2d38] text-[#aba79e] hover:text-[#e6cca0] border border-[#2d2f38] transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar usuario */}
                          <button
                            onClick={() => setUserToDelete(u)}
                            disabled={isActionBusy}
                            title="Eliminar usuario"
                            className="p-1.5 rounded-lg bg-[#202228] hover:bg-[#341d21] text-[#aba79e] hover:text-[#e06c75] border border-[#2d2f38] transition-colors"
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
        )}
      </div>

      {/* MODAL 1: Vincular Artista */}
      {linkingUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1a1b22] border border-[#2e313d] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#2a2c35] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#f3f1ec] flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-[#d97d64]" />
                  <span>Vincular Ficha de Artista</span>
                </h3>
                <p className="text-xs text-[#aba79e] mt-0.5">
                  Asignar acceso a <strong className="text-[#e6cca0]">{linkingUser.email}</strong>
                </p>
              </div>
              <button
                onClick={() => setLinkingUser(null)}
                className="text-[#78746c] hover:text-[#f3f1ec]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78746c]" />
                <input
                  type="text"
                  value={artistSearchQuery}
                  onChange={(e) => setArtistSearchQuery(e.target.value)}
                  placeholder="Buscar artista por nombre en el catálogo..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#202228] border border-[#2d2f38] text-[#f3f1ec] placeholder-[#78746c] focus:outline-none focus:border-[#d97d64]"
                  autoFocus
                />
              </div>

              {/* Lista de Artistas */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {artists
                  .filter((a) =>
                    !artistSearchQuery ||
                    a.stageName.toLowerCase().includes(artistSearchQuery.toLowerCase())
                  )
                  .slice(0, 30)
                  .map((art) => {
                    const isAlreadyLinkedToThis = linkingUser.artist?.id === art.id;
                    const hasOtherOwner = Boolean(art.owner && art.owner !== linkingUser.id);

                    return (
                      <div
                        key={art.id}
                        onClick={() => handleLinkArtist(art.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isAlreadyLinkedToThis
                            ? 'bg-[#1e2a22] border-[#3a5840] text-[#93a887]'
                            : 'bg-[#202228] hover:bg-[#272931] border-[#2d2f38] text-[#f3f1ec]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {art.photoUrl ? (
                            <img
                              src={art.photoUrl}
                              alt={art.stageName}
                              className="w-8 h-8 rounded-lg object-cover border border-[#353844]"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[#292b35] flex items-center justify-center text-[#d97d64]">
                              <Music2 className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-xs block">{art.stageName}</span>
                            <span className="text-[10px] text-[#78746c]">slug: {art.slug}</span>
                          </div>
                        </div>

                        <div>
                          {isAlreadyLinkedToThis ? (
                            <span className="text-[11px] font-bold text-[#93a887] flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Vinculado
                            </span>
                          ) : hasOtherOwner ? (
                            <span className="text-[10px] text-[#e6cca0] px-2 py-0.5 rounded bg-[#2c261c] border border-[#4d3d25]">
                              Reasignar
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#aba79e] px-2 py-0.5 rounded bg-[#242630]">
                              Asignar
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="p-4 bg-[#151619] border-t border-[#2a2c35] flex justify-end">
              <button
                onClick={() => setLinkingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#aba79e] hover:text-[#f3f1ec]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Nuevo Usuario */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1a1b22] border border-[#2e313d] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#2a2c35] flex items-center justify-between">
              <h3 className="text-base font-bold text-[#f3f1ec] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#d97d64]" />
                <span>Crear Cuenta de Usuario</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#78746c] hover:text-[#f3f1ec]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#aba79e] mb-1.5">
                  Nombre o Identificador
                </label>
                <input
                  type="text"
                  value={newUserForm.name}
                  onChange={(e) =>
                    setNewUserForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ej. Juan Pérez (Los Nocheros)"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#202228] border border-[#2d2f38] text-[#f3f1ec] focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#aba79e] mb-1.5">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) =>
                    setNewUserForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="artista@guta.com.ar"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#202228] border border-[#2d2f38] text-[#f3f1ec] focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#aba79e] mb-1.5">
                  Contraseña Inicial *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newUserForm.password}
                  onChange={(e) =>
                    setNewUserForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#202228] border border-[#2d2f38] text-[#f3f1ec] focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#aba79e] mb-1.5">
                  Vincular a Ficha de Artista (Opcional)
                </label>
                <select
                  value={newUserForm.artistId}
                  onChange={(e) =>
                    setNewUserForm((prev) => ({ ...prev, artistId: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#202228] border border-[#2d2f38] text-[#f3f1ec] focus:outline-none focus:border-[#d97d64]"
                >
                  <option value="">-- Sin vincular por ahora --</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.stageName} ({a.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="verifiedCheck"
                  checked={newUserForm.verified}
                  onChange={(e) =>
                    setNewUserForm((prev) => ({ ...prev, verified: e.target.checked }))
                  }
                  className="rounded border-[#353844] bg-[#202228] text-[#d97d64] focus:ring-0"
                />
                <label
                  htmlFor="verifiedCheck"
                  className="text-xs text-[#aba79e] cursor-pointer"
                >
                  Marcar como <strong className="text-[#93a887]">Verificado</strong> (evita el paso de OTP por correo)
                </label>
              </div>

              <div className="pt-3 border-t border-[#2a2c35] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#aba79e] hover:text-[#f3f1ec]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === 'create_modal'}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#d97d64] hover:bg-[#cb7159] text-[#121316] transition-colors"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Confirmar Eliminación */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1a1b22] border border-[#3b2326] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#341d21] text-[#e06c75] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#f3f1ec]">
                ¿Eliminar cuenta de usuario?
              </h3>
              <p className="text-xs text-[#aba79e] leading-relaxed">
                Estás a punto de eliminar a <strong className="text-[#f3f1ec]">{userToDelete.email}</strong>.
                Si tenía un artista vinculado, se liberará la ficha para que pueda asignarse a otro usuario.
                Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="p-4 bg-[#151619] border-t border-[#2a2c35] flex items-center justify-end gap-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#aba79e] hover:text-[#f3f1ec]"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={actionLoadingId === userToDelete.id}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#e06c75] hover:bg-[#cc5862] text-white transition-colors"
              >
                Sí, Eliminar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
