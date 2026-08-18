'use client';

import React, { useState } from 'react';
import { AgendaEvent } from '../../../lib/types';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { Calendar, MapPin, Trash2 } from 'lucide-react';

interface AdminAgendaClientProps {
  initialEvents: AgendaEvent[];
}

export const AdminAgendaClient: React.FC<AdminAgendaClientProps> = ({
  initialEvents,
}) => {
  const [events, setEvents] = useState<AgendaEvent[]>(initialEvents);

  const handleDelete = (id: string, title: string) => {
    if (confirm(`¿Deseás eliminar la fecha "${title}"?`)) {
      setEvents(events.filter((e) => e.id !== id));
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

      <div className="space-y-3">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="natural-card p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-[#24252c] text-[#e6cca0] font-bold text-xs text-center border border-[#353844]">
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
                onClick={() => handleDelete(ev.id, ev.title)}
                className="p-1.5 rounded-lg bg-[#24252c] text-[#c0909b] hover:bg-[#2e303b] transition-colors"
                title="Eliminar evento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
