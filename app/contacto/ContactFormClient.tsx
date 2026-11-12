'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Headphones,
  Briefcase,
  Radio,
  HelpCircle,
  Copy,
  Check,
  ArrowUpRight,
  Sparkles,
  UserCheck,
  MessageSquare,
} from 'lucide-react';

type InquiryCategory = 'comercial' | 'prensa' | 'general' | 'soporte';

interface CategoryOption {
  id: InquiryCategory;
  label: string;
  description: string;
  inbox: 'contacto@guta.musica.ar' | 'soporte@guta.musica.ar';
  icon: React.ComponentType<{ className?: string }>;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'comercial',
    label: 'Consultas Comerciales & Auspicios',
    description: 'Alianzas estratégicas, publicidad en portada y propuestas comerciales.',
    inbox: 'contacto@guta.musica.ar',
    icon: Briefcase,
  },
  {
    id: 'prensa',
    label: 'Prensa, Notas & Difusión',
    description: 'Gacetillas, cobertura de eventos, entrevistas y medios.',
    inbox: 'contacto@guta.musica.ar',
    icon: Radio,
  },
  {
    id: 'general',
    label: 'Dudas & Consultas Generales',
    description: 'Consultas sobre la plataforma, agenda cultural o funcionamiento general.',
    inbox: 'contacto@guta.musica.ar',
    icon: HelpCircle,
  },
  {
    id: 'soporte',
    label: 'Asistencia Personalizada al Artista',
    description: 'Ayuda con tu cuenta, código OTP, sincronización de Spotify o edición de perfil.',
    inbox: 'soporte@guta.musica.ar',
    icon: Headphones,
  },
];

export const ContactFormClient: React.FC = () => {
  const [category, setCategory] = useState<InquiryCategory>('comercial');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [projectOrCompany, setProjectOrCompany] = useState('');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketId: string;
    targetInbox: string;
  } | null>(null);

  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopyEmail = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedEmail(addr);
    setTimeout(() => setCopiedEmail(null), 2200);
  };

  const activeCategoryObj =
    CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMessage('Por favor completá tu nombre, correo electrónico y tu consulta.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          projectOrCompany: projectOrCompany.trim(),
          category,
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo enviar tu consulta.');
      }

      setSubmittedTicket({
        ticketId: data.ticketId,
        targetInbox: data.targetInbox,
      });
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Ocurrió un error al enviar tu consulta. Por favor intentá nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Cabecera Principal */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d97d64]/10 border border-[#d97d64]/25 text-[#d97d64] text-xs font-semibold">
          <UserCheck className="w-3.5 h-3.5" />
          <span>Canales Humanos de Atención Directa</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#f3f1ec] tracking-tight">
          Contacto & <span className="text-[#e6cca0]">Asistencia Oficial</span>
        </h1>
        <p className="text-sm text-[#aba79e] max-w-2xl mx-auto leading-relaxed">
          Comunicate directamente con nuestro equipo editorial y técnico. Contamos con dos vías humanas de atención personalizada según tu necesidad.
        </p>
      </div>

      {/* Dos Tarjetas Destacadas: Vía Directa (Soporte) y Formulario / Vía Comercial (Contacto) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Canal 1: soporte@guta.musica.ar (Vía Directa para Artistas) */}
        <div className="natural-card p-6 sm:p-7 rounded-2xl border border-[#d97d64]/35 bg-gradient-to-br from-[#1b1c22] to-[#15161a] flex flex-col justify-between gap-5 shadow-xl relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#d97d64]/15 border border-[#d97d64]/30 text-[#d97d64] text-[11px] font-bold uppercase tracking-wider">
                <Headphones className="w-3.5 h-3.5" />
                Vía Directa • Asistencia al Artista
              </span>
              <span className="text-[11px] font-mono text-[#93a887] font-semibold">
                ● Atención Humana
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#f3f1ec]">
              soporte@guta.musica.ar
            </h2>

            <p className="text-xs sm:text-sm text-[#aba79e] leading-relaxed">
              <strong className="text-[#f3f1ec]">Asistencia personalizada al artista:</strong> escribinos directamente desde tu correo si necesitás ayuda con el registro de tu banda, verificación OTP, carga de lanzamientos de Spotify o ajustes en tu perfil.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <a
              href="mailto:soporte@guta.musica.ar?subject=Asistencia%20al%20Artista%20-%20GUTA%20M%C3%9ASICA"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] text-xs font-extrabold transition-all shadow-md shadow-[#d97d64]/20"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Escribir a Soporte Directo</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={() => handleCopyEmail('soporte@guta.musica.ar')}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#22232a] hover:bg-[#2a2c35] text-[#f3f1ec] border border-[#323440] text-xs font-semibold transition-colors cursor-pointer"
            >
              {copiedEmail === 'soporte@guta.musica.ar' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#93a887]" />
                  <span className="text-[#93a887]">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#e6cca0]" />
                  <span>Copiar correo</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Canal 2: contacto@guta.musica.ar (Comercial, Prensa y Dudas Generales + Formulario) */}
        <div className="natural-card p-6 sm:p-7 rounded-2xl border border-[#e6cca0]/35 bg-gradient-to-br from-[#1b1c22] to-[#15161a] flex flex-col justify-between gap-5 shadow-xl relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e6cca0]/15 border border-[#e6cca0]/30 text-[#e6cca0] text-[11px] font-bold uppercase tracking-wider">
                <MessageSquare className="w-3.5 h-3.5" />
                Formulario & Correo • Comercial y Prensa
              </span>
              <span className="text-[11px] font-mono text-[#e6cca0] font-semibold">
                ● Respuesta en Gmail
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#f3f1ec]">
              contacto@guta.musica.ar
            </h2>

            <p className="text-xs sm:text-sm text-[#aba79e] leading-relaxed">
              <strong className="text-[#f3f1ec]">Consultas comerciales, prensa y dudas generales:</strong> utilizá el formulario de consultas aquí debajo o escribinos para auspicios publicitarios, notas de prensa, alianzas y consultas institucionales.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <a
              href="#formulario-consultas"
              onClick={() => setCategory('comercial')}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#e6cca0] hover:bg-[#d9be91] text-[#151618] text-xs font-extrabold transition-all shadow-md shadow-[#e6cca0]/15"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Completar Formulario</span>
            </a>

            <a
              href="mailto:contacto@guta.musica.ar?subject=Consulta%20General%20/%20Comercial%20-%20GUTA%20M%C3%9ASICA"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#22232a] hover:bg-[#2a2c35] text-[#f3f1ec] border border-[#323440] text-xs font-semibold transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#e6cca0]" />
              <span>Abrir Correo</span>
            </a>

            <button
              type="button"
              onClick={() => handleCopyEmail('contacto@guta.musica.ar')}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#22232a] hover:bg-[#2a2c35] text-[#aba79e] hover:text-[#f3f1ec] border border-[#323440] text-xs font-semibold transition-colors cursor-pointer"
              title="Copiar contacto@guta.musica.ar"
            >
              {copiedEmail === 'contacto@guta.musica.ar' ? (
                <Check className="w-3.5 h-3.5 text-[#93a887]" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[#e6cca0]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bloque Principal: Formulario de Consultas + Accesos Rápidos */}
      <div id="formulario-consultas" className="grid grid-cols-1 lg:grid-cols-12 gap-8 scroll-mt-24">
        {/* Columna Izquierda: Formulario */}
        <div className="lg:col-span-8 natural-card p-6 sm:p-8 rounded-2xl border border-[#2e3039] shadow-2xl">
          {submittedTicket ? (
            <div className="py-10 px-4 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#93a887]/20 border border-[#93a887]/35 text-[#93a887] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-xs uppercase font-bold tracking-wider text-[#e6cca0]">
                  Consulta Enviada • Ref: {submittedTicket.ticketId}
                </span>
                <h3 className="text-2xl font-black text-[#f3f1ec]">
                  ¡Gracias por escribirnos, {name}!
                </h3>
                <p className="text-xs sm:text-sm text-[#aba79e] max-w-md mx-auto leading-relaxed">
                  Tu mensaje fue derivado directamente a nuestra casilla humana{' '}
                  <strong className="text-[#e6cca0]">{submittedTicket.targetInbox}</strong>. Te responderemos a{' '}
                  <strong className="text-[#f3f1ec]">{email}</strong> a la brevedad.
                </p>
              </div>
              <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedTicket(null);
                    setMessage('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] text-xs font-bold transition-colors cursor-pointer"
                >
                  Enviar otra consulta
                </button>
                <Link
                  href="/"
                  className="px-5 py-2.5 rounded-xl bg-[#222329] hover:bg-[#282a32] text-[#aba79e] text-xs font-semibold border border-[#31333d] transition-colors"
                >
                  Volver al Inicio
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#262832]">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-[#f3f1ec]">
                    Formulario de Consultas
                  </h3>
                  <p className="text-xs text-[#8c887f]">
                    Elegí el motivo de tu mensaje para derivarlo al canal correspondiente.
                  </p>
                </div>
                <span className="text-[11px] font-mono px-3 py-1 rounded-lg bg-[#18191e] border border-[#2d2f38] text-[#e6cca0]">
                  Destino: <strong>{activeCategoryObj.inbox}</strong>
                </span>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Selector de motivo */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#aba79e] block">
                  Motivo de la consulta *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CATEGORIES.map((item) => {
                    const Icon = item.icon;
                    const isSelected = category === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCategory(item.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-[#23252e] border-[#d97d64] text-[#f3f1ec] shadow-md shadow-[#d97d64]/10'
                            : 'bg-[#18191e] border-[#2d2f38] text-[#aba79e] hover:border-[#3e414f] hover:text-[#f3f1ec]'
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-[#d97d64]/20 text-[#d97d64]'
                              : 'bg-[#22232a] text-[#8c887f]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold leading-snug">{item.label}</div>
                          <div className="text-[11px] text-[#8c887f] mt-0.5 line-clamp-2">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Datos personales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#aba79e] font-semibold block mb-1">
                    Tu Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Martín Gómez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#aba79e] font-semibold block mb-1">
                    Tu Correo Electrónico (para responderte) *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#aba79e] font-semibold block mb-1">
                    WhatsApp / Teléfono (opcional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+54 9 11 ..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                  />
                </div>

                <div>
                  <label className="text-xs text-[#aba79e] font-semibold block mb-1">
                    Banda, Proyecto, Medio o Marca (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre de tu banda, productora o comercio"
                    value={projectOrCompany}
                    onChange={(e) => setProjectOrCompany(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                  />
                </div>
              </div>

              {/* Mensaje */}
              <div>
                <label className="text-xs text-[#aba79e] font-semibold block mb-1">
                  Detalle de tu consulta *
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Escribí aquí tu consulta comercial, propuesta de prensa, duda general o pedido de asistencia..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs leading-relaxed focus:outline-none focus:border-[#d97d64] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-[#d97d64]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando consulta...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Consulta a {activeCategoryObj.inbox}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Columna Derecha: Guía de Canales y Accesos Directos */}
        <div className="lg:col-span-4 space-y-5">
          <div className="natural-card p-6 rounded-2xl border border-[#2e3039] space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#e6cca0]">
              👤 Resumen de Canales Humanos
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2a2c35] space-y-1">
                <span className="text-[11px] font-bold uppercase text-[#e6cca0] block">
                  Comercial, Prensa & Dudas
                </span>
                <a
                  href="mailto:contacto@guta.musica.ar"
                  className="text-sm font-bold text-[#f3f1ec] hover:text-[#d97d64] transition-colors block break-all"
                >
                  contacto@guta.musica.ar
                </a>
                <p className="text-[11px] text-[#8c887f]">
                  Publicidad, notas periodísticas, alianzas culturales y consultas generales.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#18191e] border border-[#2a2c35] space-y-1">
                <span className="text-[11px] font-bold uppercase text-[#d97d64] block">
                  Asistencia Personalizada al Artista
                </span>
                <a
                  href="mailto:soporte@guta.musica.ar"
                  className="text-sm font-bold text-[#f3f1ec] hover:text-[#d97d64] transition-colors block break-all"
                >
                  soporte@guta.musica.ar
                </a>
                <p className="text-[11px] text-[#8c887f]">
                  Vía directa para artistas registrados, ayuda con perfiles, accesos y soporte técnico.
                </p>
              </div>
            </div>
          </div>

          {/* Accesos rápidos de autogestión */}
          <div className="natural-card p-6 rounded-2xl border border-[#2e3039] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#f3f1ec] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#d97d64]" />
              <span>¿Querés sumarte a la plataforma?</span>
            </h3>
            <p className="text-xs text-[#8c887f] leading-relaxed">
              Si buscás crear tu perfil en GUTA MÚSICA, podés hacerlo directamente desde nuestros portales de autogestión:
            </p>
            <div className="space-y-2 pt-1">
              <Link
                href="/registro"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191e] hover:bg-[#22232a] border border-[#2e3039] hover:border-[#d97d64]/50 text-xs font-bold text-[#f3f1ec] flex items-center justify-between transition-colors"
              >
                <span>🎸 Sumar mi Banda / Proyecto</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#d97d64]" />
              </Link>
              <Link
                href="/sumar-profesional"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191e] hover:bg-[#22232a] border border-[#2e3039] hover:border-[#5ce487]/50 text-xs font-bold text-[#f3f1ec] flex items-center justify-between transition-colors"
              >
                <span>🎧 Sumarme como Profesional / Servicio</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#5ce487]" />
              </Link>
              <Link
                href="/sumar-auspicio"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191e] hover:bg-[#22232a] border border-[#2e3039] hover:border-[#e6cca0]/50 text-xs font-bold text-[#f3f1ec] flex items-center justify-between transition-colors"
              >
                <span>💎 Auspiciar en GUTA MÚSICA</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#e6cca0]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
