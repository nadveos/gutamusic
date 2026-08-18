import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { MusicDataService } from '../../lib/api';
import { Calendar, MapPin, Ticket, Sparkles, Music2, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Agenda Cultural & Cartelera de Recitales | GUTA MÚSICA',
  description: 'Próximas fechas, festivales independientes, peñas y conciertos de artistas emergentes en Argentina.',
};

export default async function AgendaPage() {
  const events = await MusicDataService.getUpcomingEvents();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
          <Calendar className="w-4 h-4" />
          <span>Cartelera Federal en Vivo</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white">
          Agenda de Recitales & Festivales
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-2xl">
          Enterate de las próximas presentaciones, peñas folklóricas, noches de tango y festivales de música independiente en todo el país.
        </p>
      </div>

      {/* Events List */}
      <div className="space-y-5">
        {events.map((event) => (
          <article
            key={event.id}
            className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 hover:border-amber-400/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group"
          >
            {/* Left: Date badge + Details */}
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex flex-col items-center justify-center text-center p-2 flex-shrink-0">
                <span className="text-[10px] uppercase font-bold text-amber-400">FECHA</span>
                <span className="text-lg sm:text-2xl font-black text-white leading-tight">
                  {event.date.split(' ')[0].split('-').slice(1).reverse().join('/')}
                </span>
                <span className="text-[9px] text-gray-400">{event.date.split(' ')[1] || '21:00'} hs</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md bg-white/5 text-amber-400 border border-white/10">
                    {event.type}
                  </span>
                  {event.isFree && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400">
                      Entrada Gratuita
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-white group-hover:text-amber-300 transition-colors">
                  {event.title}
                </h2>

                <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span><strong>{event.venue}</strong> — {event.city}, {event.province}</span>
                </p>
              </div>
            </div>

            {/* Right: Ticket & Actions */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-white/5">
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-gray-400 block">Entrada</span>
                <span className="text-sm font-black text-white">
                  {event.isFree ? 'Gratis' : event.ticketPrice || 'En boletería'}
                </span>
              </div>

              {event.ticketUrl ? (
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Conseguir Entrada</span>
                </a>
              ) : (
                <span className="text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
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
