'use client';

import React, { useState } from 'react';
import { AgendaEvent, Artist } from '../../../lib/types';
import { pb } from '../../../lib/pocketbase';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { ConfirmModal } from '../../../components/admin/ConfirmModal';
import { Calendar, MapPin, Trash2, Plus, Check, AlertCircle, Ticket, User } from 'lucide-react';

interface AdminAgendaClientProps {
  initialEvents: AgendaEvent[];
  artists?: Artist[];
}

export const AdminAgendaClient: React.FC<AdminAgendaClientProps> = ({
  initialEvents,
  artists = [],
}) => {
  const [events, setEvents] = useState<AgendaEvent[]>(initialEvents);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    venue: '',
    city: '',
    province: '',
    type: 'recital' as 'recital' | 'festival' | 'pena' | 'acustico' | 'feria',
    isFree: false,
    ticketPrice: '',
    ticketUrl: '',
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleArtistSelectChange = (artistId: string) => {
    setSelectedArtistId(artistId);
    if (!artistId) return;
    const selected = artists.find((a) => a.id === artistId);
    if (selected) {
      setNewEvent((prev) => ({
        ...prev,
        title: `${selected.stageName} en Vivo`,
        city: selected.city || prev.city,
        province: selected.province || prev.province,
      }));
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim() || !newEvent.date.trim() || !newEvent.venue.trim()) {
      setNotification({ type: 'error', text: 'Por favor completá título, fecha y lugar del evento.' });
      return;
    }

    const payload = {
      title: newEvent.title.trim(),
      date: newEvent.date.trim(),
      venue: newEvent.venue.trim(),
      city: newEvent.city.trim() || 'Ciudad',
      province: newEvent.province.trim() || 'Provincia',
      country: 'Argentina',
      type: newEvent.type,
      isFree: newEvent.isFree,
      ticketPrice: newEvent.isFree ? 'Entrada Libre y Gratuita' : (newEvent.ticketPrice.trim() || 'Entradas en boletería'),
      ticketUrl: newEvent.ticketUrl.trim() || '',
      artistId: selectedArtistId || undefined,
    };

    try {
      let createdRecord: any = null;
      try {
        createdRecord = await pb.collection('events').create(payload);
      } catch (err: any) {
        console.warn('PocketBase events collection notice:', err);
      }

      const itemToAdd: AgendaEvent = {
        id: createdRecord?.id || `ev-${Date.now()}`,
        ...payload,
      };

      setEvents([itemToAdd, ...events]);
      setNotification({ type: 'success', text: `¡Fecha "${payload.title}" publicada en la cartelera cultural!` });
      setShowAddForm(false);
      setSelectedArtistId('');
      setNewEvent({
        title: '',
        date: '',
        venue: '',
        city: '',
        province: '',
        type: 'recital',
        isFree: false,
        ticketPrice: '',
        ticketUrl: '',
      });
    } catch (e: any) {
      setNotification({ type: 'error', text: `Error al publicar: ${e?.message}` });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === events.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(events.map((e) => e.id));
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
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      try {
        await pb.collection('events').delete(id);
      } catch (e) {
        console.warn('Error deleting event:', e);
      }
      setDeleteTarget(null);
    }
  };

  const confirmBulkDelete = async () => {
    const idsToDelete = [...selectedIds];
    setEvents((prev) => prev.filter((e) => !idsToDelete.includes(e.id)));
    setSelectedIds([]);
    setIsBulkDeleteOpen(false);

    for (const id of idsToDelete) {
      try {
        await pb.collection('events').delete(id);
      } catch (e) {
        console.warn('Error deleting event in bulk:', id, e);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#f3f1ec]">Gestión de Agenda & Cartelera</h1>
          <p className="text-xs text-[#8c887f]">Programación de recitales, peñas, festivales y fechas de artistas</p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Ocultar Formulario' : 'Publicar Nueva Fecha'}</span>
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 border animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-[11px] opacity-70 hover:opacity-100 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Formulario para Publicar Nueva Fecha */}
      {showAddForm && (
        <form onSubmit={handleCreateEvent} className="natural-card p-5 sm:p-6 rounded-2xl space-y-4 border border-[#3d4150] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#2d2f38]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Nueva Fecha para la Cartelera & Perfil
            </h2>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-xs text-[#8c887f] hover:text-[#f3f1ec]"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Vincular con Artista */}
            {artists.length > 0 && (
              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
                  Vincular con Artista (Opcional)
                </label>
                <select
                  value={selectedArtistId}
                  onChange={(e) => handleArtistSelectChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                >
                  <option value="">-- Evento General / Sin artista vinculado --</option>
                  {artists.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.stageName} ({a.city}, {a.province})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">
                Título del Evento / Show *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Serenata Gaucha en Vivo / Festival del Poncho"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Fecha & Hora *</label>
              <input
                type="text"
                required
                placeholder="Ej: 15 de Septiembre - 21:00 hs"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Lugar / Sala / Venue *</label>
              <input
                type="text"
                required
                placeholder="Ej: Teatro San Martín / Plaza Próspero Molina"
                value={newEvent.venue}
                onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Tipo de Evento</label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              >
                <option value="recital">Recital / Concierto</option>
                <option value="festival">Festival</option>
                <option value="pena">Peña Folklórica</option>
                <option value="acustico">Acústico Íntimo</option>
                <option value="feria">Feria / Fiesta Regional</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Ciudad *</label>
              <input
                type="text"
                required
                placeholder="Ej: Salta"
                value={newEvent.city}
                onChange={(e) => setNewEvent({ ...newEvent, city: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Provincia *</label>
              <input
                type="text"
                required
                placeholder="Ej: Salta"
                value={newEvent.province}
                onChange={(e) => setNewEvent({ ...newEvent, province: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Entrada / Valor</label>
              <div className="flex items-center gap-2 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-[#aba79e] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEvent.isFree}
                    onChange={(e) => setNewEvent({ ...newEvent, isFree: e.target.checked })}
                    className="rounded accent-[#d97d64]"
                  />
                  <span>Entrada Libre</span>
                </label>
                {!newEvent.isFree && (
                  <input
                    type="text"
                    placeholder="Ej: $10.000"
                    value={newEvent.ticketPrice}
                    onChange={(e) => setNewEvent({ ...newEvent, ticketPrice: e.target.value })}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Link de Boletería / Passline / EntradaUno (Opcional)</label>
            <input
              type="text"
              placeholder="https://passline.com/..."
              value={newEvent.ticketUrl}
              onChange={(e) => setNewEvent({ ...newEvent, ticketUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#e6cca0] hover:bg-[#d8bd8d] text-[#151618] font-bold text-xs transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar y Publicar Fecha</span>
            </button>
          </div>
        </form>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#24262f] border border-[#3c3f4e] rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-[#f3f1ec]">
            <span className="w-2 h-2 rounded-full bg-[#d97d64] animate-pulse" />
            <span>
              {selectedIds.length} {selectedIds.length === 1 ? 'fecha seleccionada' : 'fechas seleccionadas'}
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
              <span>Eliminar seleccionadas ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Select All Checkbox Header */}
      {events.length > 0 && (
        <div className="flex items-center gap-2 px-2 py-1 text-xs text-[#8c887f]">
          <input
            type="checkbox"
            checked={events.length > 0 && selectedIds.length === events.length}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded bg-[#18191e] border-[#353844] accent-[#d97d64] cursor-pointer"
            id="select-all-events"
          />
          <label htmlFor="select-all-events" className="cursor-pointer text-[11px] font-semibold text-[#aba79e]">
            Seleccionar todas las fechas ({events.length})
          </label>
        </div>
      )}

      <div className="space-y-3">
        {events.map((ev) => {
          const isSelected = selectedIds.includes(ev.id);
          return (
            <div
              key={ev.id}
              className={`natural-card p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                isSelected ? 'bg-[#d97d64]/10 border-[#d97d64]/30' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(ev.id)}
                  className="w-4 h-4 rounded bg-[#18191e] border-[#353844] accent-[#d97d64] cursor-pointer flex-shrink-0"
                  aria-label={`Seleccionar ${ev.title}`}
                />
                <div className="p-2.5 rounded-lg bg-[#24252c] text-[#e6cca0] font-bold text-xs text-center border border-[#353844] flex-shrink-0">
                  <Calendar className="w-4 h-4 mx-auto mb-0.5" />
                  <span>{ev.date.split(' ')[0]}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-semibold text-[#e6cca0] px-2 py-0.5 rounded bg-sand-soft">
                    {ev.type}
                  </span>
                  <h3 className="text-sm font-bold text-[#f3f1ec]">{ev.title}</h3>
                  <p className="text-xs text-[#aba79e] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#d97d64]" />
                    {ev.venue} — {ev.city}, {ev.province}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <span className="text-xs font-semibold text-[#f3f1ec]">
                  {ev.isFree ? 'Entrada Libre' : ev.ticketPrice}
                </span>
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ id: ev.id, title: ev.title })}
                  className="p-1.5 rounded-lg bg-[#24252c] text-[#c0909b] hover:text-[#e07a8b] hover:bg-[#2e303b] transition-colors"
                  title="Eliminar evento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Eliminar Fecha de la Agenda"
        message={`¿Deseás eliminar la fecha "${deleteTarget?.title}" de la cartelera cultural?`}
        confirmText="Eliminar Fecha"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        title="Eliminación Masiva de Fechas"
        message={`¿Estás seguro de que deseás eliminar ${selectedIds.length} ${
          selectedIds.length === 1 ? 'fecha seleccionada' : 'fechas seleccionadas'
        }?`}
        confirmText={`Eliminar ${selectedIds.length} ${selectedIds.length === 1 ? 'Fecha' : 'Fechas'}`}
        onConfirm={confirmBulkDelete}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />
    </div>
  );
};
