'use client';

import React, { useState } from 'react';
import { AgendaEvent } from '../../../lib/types';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { Calendar, Plus, MapPin, Ticket, Edit, Trash2 } from 'lucide-react';

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
    <div className="space-y-8">
      <AdminHeader
        title="Gestión de Agenda & Cartelera"
        subtitle="Programación de recitales, peñas, festivales y acústicos"
        actionText="Publicar Nueva Fecha"
        actionHref="/agenda"
      />

      <div className="space-y-4">
        {events.map((ev) => (
          <div
            key={ev.id}
            className="glass-card p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 font-bold text-xs text-center border border-amber-500/30">
                <Calendar className="w-5 h-5 mx-auto mb-0.5" />
                <span>{ev.date.split(' ')[0]}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-amber-400 px-2 py-0.5 rounded bg-white/5">
                  {ev.type}
                </span>
                <h3 className="text-base font-bold text-white">{ev.title}</h3>
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-400" />
                  {ev.venue} — {ev.city}, {ev.province}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="text-xs font-bold text-gray-200">
                {ev.isFree ? 'Entrada Libre' : ev.ticketPrice}
              </span>
              <button
                onClick={() => handleDelete(ev.id, ev.title)}
                className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
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
