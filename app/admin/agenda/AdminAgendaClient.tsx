'use client';

import React, { useState } from 'react';
import { AgendaEvent } from '../../../lib/types';
import { pb } from '../../../lib/pocketbase';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { ConfirmModal } from '../../../components/admin/ConfirmModal';
import { Calendar, MapPin, Trash2 } from 'lucide-react';

interface AdminAgendaClientProps {
  initialEvents: AgendaEvent[];
}

export const AdminAgendaClient: React.FC<AdminAgendaClientProps> = ({
  initialEvents,
}) => {
  const [events, setEvents] = useState<AgendaEvent[]>(initialEvents);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

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
      <AdminHeader
        title="Gestión de Agenda & Cartelera"
        subtitle="Programación de recitales, peñas, festivales y acústicos"
        actionText="Publicar Nueva Fecha"
        actionHref="/agenda"
      />

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
