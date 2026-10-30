'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  DollarSign,
  TrendingUp,
  Calendar,
  Search,
  RefreshCw,
  Plus,
  Copy,
  Check,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  CreditCard,
  MessageSquare,
  User,
} from 'lucide-react';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { VoluntaryContribution } from '../../../lib/types';

interface AdminColaboracionesClientProps {
  initialContributions?: VoluntaryContribution[];
}

export function AdminColaboracionesClient({
  initialContributions = [],
}: AdminColaboracionesClientProps) {
  const [contributions, setContributions] = useState<VoluntaryContribution[]>(initialContributions);
  const [loading, setLoading] = useState(initialContributions.length === 0);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'mp' | 'paypal' | 'manual'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Modal Registrar Aporte Manual / Importar ID MP
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [savingForm, setSavingForm] = useState(false);
  const [newForm, setNewForm] = useState({
    donorName: '',
    donorEmail: '',
    amount: '5000',
    paymentMethod: 'Transferencia / Alias',
    paymentId: '',
    message: '',
  });

  // Modal Editar Colaboración
  const [editingItem, setEditingItem] = useState<VoluntaryContribution | null>(null);
  const [editForm, setEditForm] = useState({
    donorName: '',
    donorEmail: '',
    message: '',
    amount: '',
  });

  // Modal Eliminar
  const [deletingItem, setDeletingItem] = useState<VoluntaryContribution | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const fetchContributions = async (forceSync = false) => {
    if (forceSync) setSyncing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/admin/contributions${forceSync ? '?sync=true' : ''}`);
      const data = await res.json();
      if (data.success) {
        setContributions(data.contributions || []);
        if (forceSync) {
          showToast('success', 'Historial sincronizado con Mercado Pago.');
        }
      } else {
        showToast('error', data.error || 'No se pudo cargar el historial.');
      }
    } catch {
      showToast('error', 'Error de conexión al consultar colaboraciones.');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchContributions(false);
  }, []);

  const handleCopyPaymentId = (paymentId: string) => {
    navigator.clipboard.writeText(paymentId);
    setCopiedId(paymentId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtrado
  const filteredContributions = useMemo(() => {
    return contributions.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.paymentId.toLowerCase().includes(q) ||
        item.donorName.toLowerCase().includes(q) ||
        (item.donorEmail && item.donorEmail.toLowerCase().includes(q)) ||
        (item.message && item.message.toLowerCase().includes(q)) ||
        String(item.amount).includes(q);

      if (!matchesSearch) return false;

      const isPayPalItem =
        item.paymentId.startsWith('PP-') ||
        (item.paymentMethod && item.paymentMethod.toLowerCase().includes('paypal'));
      const isManualItem =
        item.paymentType === 'manual' || item.paymentId.startsWith('MANUAL-');

      if (filterTab === 'paypal') {
        return Boolean(isPayPalItem);
      }
      if (filterTab === 'mp') {
        return !isPayPalItem && !isManualItem;
      }
      if (filterTab === 'manual') {
        return isManualItem;
      }

      return true;
    });
  }, [contributions, searchQuery, filterTab]);

  // Estadísticas
  const stats = useMemo(() => {
    const approved = contributions.filter((c) => c.status === 'approved' || !c.status);
    const totalAmount = approved.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
    const totalNet = approved.reduce((acc, c) => acc + (Number(c.netAmount || c.amount) || 0), 0);
    const count = approved.length;
    const avgAmount = count > 0 ? Math.round(totalAmount / count) : 0;
    const latest = approved[0] || null;

    return {
      totalAmount,
      totalNet,
      count,
      avgAmount,
      latest,
    };
  }, [contributions]);

  const formatDateAr = (isoDate: string) => {
    if (!isoDate) return '-';
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return isoDate;
      return new Intl.DateTimeFormat('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoDate;
    }
  };

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingForm(true);
    try {
      const res = await fetch('/api/admin/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          donorName: newForm.donorName || 'Anónimo',
          donorEmail: newForm.donorEmail,
          amount: Number(newForm.amount),
          paymentMethod: newForm.paymentMethod,
          paymentId: newForm.paymentId,
          message: newForm.message,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContributions(data.contributions || []);
        setShowCreateModal(false);
        setNewForm({
          donorName: '',
          donorEmail: '',
          amount: '5000',
          paymentMethod: 'Transferencia / Alias',
          paymentId: '',
          message: '',
        });
        showToast('success', 'Colaboración registrada en el historial.');
      } else {
        showToast('error', data.error || 'Error al registrar aporte.');
      }
    } catch {
      showToast('error', 'Error de red al guardar el aporte.');
    } finally {
      setSavingForm(false);
    }
  };

  const openEditModal = (item: VoluntaryContribution) => {
    setEditingItem(item);
    setEditForm({
      donorName: item.donorName || 'Anónimo',
      donorEmail: item.donorEmail || '',
      message: item.message || '',
      amount: String(item.amount || 0),
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingForm(true);
    try {
      const res = await fetch('/api/admin/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: editingItem.id,
          paymentId: editingItem.paymentId,
          donorName: editForm.donorName,
          donorEmail: editForm.donorEmail,
          message: editForm.message,
          amount: Number(editForm.amount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContributions(data.contributions || []);
        setEditingItem(null);
        showToast('success', 'Datos de la colaboración actualizados.');
      } else {
        showToast('error', data.error || 'No se pudo actualizar.');
      }
    } catch {
      showToast('error', 'Error al guardar los cambios.');
    } finally {
      setSavingForm(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setSavingForm(true);
    try {
      const res = await fetch('/api/admin/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id: deletingItem.id,
          paymentId: deletingItem.paymentId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setContributions(data.contributions || []);
        setDeletingItem(null);
        showToast('info', 'Registro eliminado del historial.');
      } else {
        showToast('error', data.error || 'No se pudo eliminar.');
      }
    } catch {
      showToast('error', 'Error al eliminar registro.');
    } finally {
      setSavingForm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold transition-all ${
            toast.type === 'success'
              ? 'bg-[#1d261e] border-[#93a887]/40 text-[#f3f1ec]'
              : toast.type === 'error'
                ? 'bg-[#2a1c1e] border-[#d97d64]/40 text-[#f3f1ec]'
                : 'bg-[#202228] border-[#353844] text-[#f3f1ec]'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-[#93a887]" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[#d97d64]" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <AdminHeader
        title="Colaboraciones Voluntarias"
        subtitle="Historial de aportes recibidos para sostener la difusión federal en GUTA MÚSICA (con protección anti-duplicados activa)"
        actionText="Registrar Aporte Manual"
        onActionClick={() => setShowCreateModal(true)}
      />

      {/* Resumen de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="natural-card p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-[#8c887f] font-medium">Total Recaudado</span>
            <p className="text-2xl font-black text-[#93a887]">
              ${stats.totalAmount.toLocaleString('es-AR')} <span className="text-xs font-bold">ARS</span>
            </p>
            {stats.totalNet !== stats.totalAmount && (
              <span className="text-[10px] text-[#78746c] block">
                Neto MP: ${stats.totalNet.toLocaleString('es-AR')} ARS
              </span>
            )}
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-sage-soft text-[#93a887]">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="natural-card p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-[#8c887f] font-medium">Aportes Recibidos</span>
            <p className="text-2xl font-black text-[#f3f1ec]">{stats.count}</p>
            <span className="text-[10px] text-[#78746c] block">Colaboraciones aprobadas</span>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-terracotta-soft text-[#d97d64]">
            <Heart className="w-5 h-5" />
          </div>
        </div>

        <div className="natural-card p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-[#8c887f] font-medium">Aporte Promedio</span>
            <p className="text-2xl font-black text-[#e6cca0]">
              ${stats.avgAmount.toLocaleString('es-AR')} <span className="text-xs font-bold">ARS</span>
            </p>
            <span className="text-[10px] text-[#78746c] block">Por cada colaborador</span>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-sand-soft text-[#e6cca0]">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="natural-card p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-[#8c887f] font-medium">Último Aporte</span>
            <p className="text-xl font-black text-[#f3f1ec]">
              {stats.latest ? `$${Number(stats.latest.amount).toLocaleString('es-AR')} ARS` : '—'}
            </p>
            <span className="text-[10px] text-[#78746c] block truncate max-w-[160px]">
              {stats.latest ? formatDateAr(stats.latest.date) : 'Sin registros aún'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-soft text-[#a7b8c8]">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda, Filtros y Sincronización con Mercado Pago */}
      <div className="natural-card p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#78746c] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por ID Pago MP (ej. 185782556551), nombre o nota..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#151618] border border-[#2a2c35] text-xs text-[#f3f1ec] placeholder-[#78746c] focus:outline-none focus:border-[#d97d64]"
            />
          </div>

          {/* Pestañas de filtro */}
          <div className="flex items-center gap-1 bg-[#151618] p-1 rounded-xl border border-[#2a2c35]">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterTab === 'all'
                  ? 'bg-[#d97d64] text-[#151618] font-bold'
                  : 'text-[#aba79e] hover:text-[#f3f1ec]'
              }`}
            >
              Todos ({contributions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('mp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterTab === 'mp'
                  ? 'bg-[#009EE3] text-[#151618] font-bold'
                  : 'text-[#aba79e] hover:text-[#f3f1ec]'
              }`}
            >
              Mercado Pago
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('paypal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterTab === 'paypal'
                  ? 'bg-[#FFC439] text-[#151618] font-bold'
                  : 'text-[#aba79e] hover:text-[#f3f1ec]'
              }`}
            >
              PayPal
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filterTab === 'manual'
                  ? 'bg-[#e6cca0] text-[#151618] font-bold'
                  : 'text-[#aba79e] hover:text-[#f3f1ec]'
              }`}
            >
              Manuales
            </button>
          </div>
        </div>

        {/* Botón Sincronizar con Mercado Pago */}
        <button
          type="button"
          onClick={() => fetchContributions(true)}
          disabled={syncing}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#202228] hover:bg-[#282b33] border border-[#323540] text-xs font-semibold text-[#e6cca0] transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Sincronizando con MP...' : 'Sincronizar con Mercado Pago'}</span>
        </button>
      </div>

      {/* Tabla de Historial de Colaboraciones */}
      <section className="natural-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[#2a2c35] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#f3f1ec]">
              Registro Histórico de Aportes
            </h2>
            <p className="text-xs text-[#8c887f]">
              Cada pago aprobado en Mercado Pago se guarda automáticamente aquí y envía una única alerta a Telegram
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-2">
            <RefreshCw className="w-6 h-6 text-[#d97d64] animate-spin mx-auto" />
            <p className="text-xs text-[#aba79e]">Cargando historial de colaboraciones...</p>
          </div>
        ) : filteredContributions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#202228] border border-[#2d2f38] flex items-center justify-center mx-auto text-[#d97d64]">
              <Heart className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#f3f1ec]">
                No se encontraron colaboraciones con ese criterio
              </p>
              <p className="text-xs text-[#8c887f]">
                Podés sincronizar con Mercado Pago o registrar un aporte manual.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#aba79e]">
              <thead className="border-b border-[#2a2c35] bg-[#18191e] text-[#8c887f] uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Monto Aportado</th>
                  <th className="py-3 px-4">Medio de Pago</th>
                  <th className="py-3 px-4">ID Pago MP</th>
                  <th className="py-3 px-4">Mensaje / Nota</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#24252c]">
                {filteredContributions.map((item) => {
                  const isPayPal =
                    item.paymentId.startsWith('PP-') ||
                    Boolean(item.paymentMethod && item.paymentMethod.toLowerCase().includes('paypal'));
                  const isMp =
                    !isPayPal &&
                    item.paymentType !== 'manual' &&
                    !item.paymentId.startsWith('MANUAL-');
                  return (
                    <tr
                      key={item.id || item.paymentId}
                      className="hover:bg-[#24252c]/50 transition-colors"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-[#f3f1ec]">
                        {formatDateAr(item.date)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#24252c] border border-[#323540] flex items-center justify-center text-[#e6cca0] font-bold text-[11px] shrink-0">
                            {(item.donorName || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-[#f3f1ec] block text-xs">
                              {item.donorName || 'Anónimo'}
                            </strong>
                            {item.donorEmail && (
                              <span className="text-[10px] text-[#78746c] block">
                                {item.donorEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-sage-soft text-[#93a887] font-black text-xs inline-block">
                          ${Number(item.amount).toLocaleString('es-AR')} ARS
                        </span>
                        {item.netAmount && item.netAmount !== item.amount && (
                          <span className="block text-[10px] text-[#78746c] mt-0.5">
                            Neto: ${Number(item.netAmount).toLocaleString('es-AR')}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                            isPayPal
                              ? 'bg-[#FFC439]/15 text-[#FFC439] border border-[#FFC439]/30'
                              : isMp
                                ? 'bg-[#009EE3]/15 text-[#3bbdf5] border border-[#009EE3]/25'
                                : 'bg-[#24252c] text-[#e6cca0] border border-[#323540]'
                          }`}
                        >
                          <CreditCard className="w-3 h-3" />
                          {item.paymentMethod || 'Mercado Pago'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#151618] border border-[#2a2c35] font-mono text-[11px] text-[#e6cca0]">
                          <span>{item.paymentId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyPaymentId(item.paymentId)}
                            className="text-[#78746c] hover:text-[#f3f1ec] transition-colors cursor-pointer"
                            title="Copiar ID de Pago"
                          >
                            {copiedId === item.paymentId ? (
                              <Check className="w-3 h-3 text-[#93a887]" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {item.message ? (
                          <span className="text-xs text-[#d6d3cb] italic line-clamp-2">
                            &ldquo;{item.message}&rdquo;
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#636059]">Sin mensaje</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sage-soft text-[#93a887]">
                          Aprobado
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#e6cca0] inline-block transition-colors cursor-pointer"
                          title="Editar nombre o nota"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingItem(item)}
                          className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#3a2226] text-[#c0909b] hover:text-[#e6a8b4] inline-block transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal: Registrar Aporte Manual */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18191e] border border-[#2d2f38] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2c35] pb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-[#d97d64]" />
                <h3 className="text-sm font-bold text-[#f3f1ec]">
                  Registrar Colaboración Manual
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#8c887f] hover:text-[#f3f1ec] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManual} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#aba79e] mb-1">
                  Monto recibido (ARS) *
                </label>
                <input
                  type="number"
                  required
                  min="100"
                  value={newForm.amount}
                  onChange={(e) => setNewForm({ ...newForm, amount: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#151618] border border-[#2a2c35] text-xs font-bold text-[#f3f1ec]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#aba79e] mb-1">
                    Nombre del Colaborador
                  </label>
                  <input
                    type="text"
                    placeholder="Anónimo o Nombre"
                    value={newForm.donorName}
                    onChange={(e) => setNewForm({ ...newForm, donorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#151618] border border-[#2a2c35] text-xs text-[#f3f1ec]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#aba79e] mb-1">
                    Medio de Pago
                  </label>
                  <input
                    type="text"
                    placeholder="Transferencia / Alias / MP"
                    value={newForm.paymentMethod}
                    onChange={(e) => setNewForm({ ...newForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#151618] border border-[#2a2c35] text-xs text-[#f3f1ec]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#aba79e] mb-1">
                  ID de Pago / Comprobante (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Se autogenera si se deja vacío"
                  value={newForm.paymentId}
                  onChange={(e) => setNewForm({ ...newForm, paymentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#151618] border border-[#2a2c35] text-xs text-[#f3f1ec]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#aba79e] mb-1">
                  Nota o Mensaje
                </label>
                <textarea
                  rows={2}
                  placeholder="Nota interna o mensaje del colaborador..."
                  value={newForm.message}
                  onChange={(e) => setNewForm({ ...newForm, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#151618] border border-[#2a2c35] text-xs text-[#f3f1ec]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#202228] text-xs font-semibold text-[#aba79e] hover:text-[#f3f1ec] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingForm}
                  className="px-4 py-2 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {savingForm ? 'Guardando...' : 'Guardar Colaboración'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Colaboración */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18191e] border border-[#2d2f38] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2a2c35] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#f3f1ec]">
                  Editar Datos de Colaboración
                </h3>
                <p className="text-[11px] text-[#8c887f]">
                  ID Pago MP: <span className="font-mono text-[#e6cca0]">{editingItem.paymentId}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-[#8c887f] hover:text-[#f3f1ec] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#aba79e] mb-1">
                  Nombre del Colaborador
                </label>
                <input
                  type="text"
                  value={editForm.donorName}
                  onChange={(e) => setEditForm({ ...editForm, donorName: e.target.value })}
                  placeholder="Ej. Juan Pérez / Anónimo"
                  className="w-full px-3 py-2 rounded-xl bg-[#151618] border border-[#2a2c35] text-xs text-[#f3f1ec]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#aba79e] mb-1">
                  Email de contacto (opcional)
                </label>
                <input
                  type="email"
                  value={editForm.donorEmail}
                  onChange={(e) => setEditForm({ ...editForm, donorEmail: e.target.value })}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3 py-2 rounded-xl bg-[#151618] border border-[#2a2c35] text-xs text-[#f3f1ec]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#aba79e] mb-1">
                  Nota / Mensaje
                </label>
                <textarea
                  rows={3}
                  value={editForm.message}
                  onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                  placeholder="Agregar nota o dedicatoria del aporte..."
                  className="w-full px-3 py-2 rounded-xl bg-[#151618] border border-[#2a2c35] text-xs text-[#f3f1ec]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-[#202228] text-xs font-semibold text-[#aba79e] hover:text-[#f3f1ec] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingForm}
                  className="px-4 py-2 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {savingForm ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Eliminación */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#18191e] border border-[#2d2f38] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-[#f3f1ec]">¿Eliminar este registro?</h3>
            <p className="text-xs text-[#aba79e]">
              Se quitará del historial el aporte de{' '}
              <strong className="text-[#f3f1ec]">
                ${Number(deletingItem.amount).toLocaleString('es-AR')} ARS
              </strong>{' '}
              (ID: <span className="font-mono">{deletingItem.paymentId}</span>).
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl bg-[#202228] text-xs font-semibold text-[#aba79e] hover:text-[#f3f1ec] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={savingForm}
                className="px-4 py-2 rounded-xl bg-[#c05a68] hover:bg-[#a84a57] text-[#f3f1ec] text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {savingForm ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
