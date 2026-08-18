import React from 'react';
import { Metadata } from 'next';
import { MusicDataService } from '../../lib/api';
import { Calendar, MapPin, Ticket } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Agenda Cultural & Cartelera de Recitales | GUTA MÚSICA',
  description: 'Próximas fechas, festivales independientes, peñas y conciertos de artistas emergentes en Argentina.',
};

export default async function AgendaPage() {
  const events = await MusicDataService.getUpcomingEvents();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#e6cca0]">
          <Calendar className="w-3.5 h-3.5" />
          <span>Cartelera Federal en Vivo</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#f3f1ec]">
          Agenda de Recitales & Festivales
        </h1>
        <p className="text-[#aba79e] text-xs sm:text-sm max-w-2xl">
          Enterate de las próximas presentaciones, peñas folklóricas, noches de tango y festivales de música independiente en todo el país.
        </p>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.map((event) => (
          <article
            key={event.id}
            className="natural-card p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5"
          >
            {/* Left: Date badge + Details */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-[#24252c] border border-[#353844] flex flex-col items-center justify-center text-center p-1.5 flex-shrink-0">
                <span className="text-[9px] uppercase font-bold text-[#e6cca0]">FECHA</span>
                <span className="text-base sm:text-xl font-black text-[#f3f1ec] leading-tight">
                  {event.date.split(' ')[0].split('-').slice(1).reverse().join('/')}
                </span>
                <span className="text-[9px] text-[#8c887f]">{event.date.split(' ')[1] || '21:00'} hs</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-sand-soft">
                    {event.type}
                  </span>
                  {event.isFree && (
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-sage-soft">
                      Entrada Gratuita
                    </span>
                  )}
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-[#f3f1ec]">
                  {event.title}
                </h2>

                <p className="text-xs text-[#aba79e] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#d97d64] flex-shrink-0" />
                  <span><strong>{event.venue}</strong> — {event.city}, {event.province}</span>
                </p>
              </div>
            </div>

            {/* Right: Ticket & Actions */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-[#2a2c35]">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-[#8c887f] block">Entrada</span>
                <span className="text-xs font-bold text-[#f3f1ec]">
                  {event.isFree ? 'Gratis' : event.ticketPrice || 'En boletería'}
                </span>
              </div>

              {event.ticketUrl ? (
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Conseguir Entrada</span>
                </a>
              ) : (
                <span className="text-[11px] text-[#8c887f] bg-[#24252c] px-2.5 py-1 rounded-lg border border-[#31333d]">
                  Ingreso por orden de llegada
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
