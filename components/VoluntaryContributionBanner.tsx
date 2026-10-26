'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Heart, Sparkles, CheckCircle2, ShieldCheck, Loader2, MessageSquare, User, ArrowRight } from 'lucide-react';

const PRESET_AMOUNTS = [
  { value: 1500, label: '$1.500', hint: 'Cafecito' },
  { value: 3000, label: '$3.000', hint: 'Difusión' },
  { value: 5000, label: '$5.000', hint: 'Recomendado', popular: true },
  { value: 10000, label: '$10.000', hint: 'Mecenas' },
];

export const VoluntaryContributionBanner: React.FC = () => {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  const [selectedAmount, setSelectedAmount] = useState<number>(3000);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (paymentStatus === 'success') {
      setShowSuccessToast(true);
      const timer = setTimeout(() => setShowSuccessToast(false), 9000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus]);

  const effectiveAmount = isCustom ? (parseInt(customAmount, 10) || 0) : selectedAmount;

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (effectiveAmount < 300) {
      setErrorMsg('El aporte mínimo es de $300 ARS.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/mercadopago/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'donation',
          amount: effectiveAmount,
          donorName: donorName.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.initPoint) {
        throw new Error(data.error || 'No se pudo generar el enlace de pago.');
      }

      // Redirigir a Mercado Pago Checkout Pro
      window.location.href = data.initPoint;
    } catch (err: any) {
      console.error('Error al iniciar colaboración:', err);
      setErrorMsg(err.message || 'Error al conectar con Mercado Pago. Intentá nuevamente.');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toast de Agradecimiento si el pago fue aprobado */}
      {showSuccessToast && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-50 p-4 rounded-2xl bg-[#1d261e] border border-[#93a887]/50 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#93a887]/20 flex items-center justify-center flex-shrink-0 text-[#93a887]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#f3f1ec]">¡Muchísimas gracias por tu aporte! 💙</h4>
              <p className="text-xs text-[#aba79e] mt-1 leading-relaxed">
                Tu colaboración voluntaria hace posible que sigamos difundiendo bandas emergentes de toda la Argentina de manera 100% gratuita.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Banner Principal de Colaboración Voluntaria */}
      <section className="relative rounded-3xl bg-gradient-to-br from-[#1c1d23] via-[#1a1b21] to-[#15161a] border border-[#2e303b] p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden">
        {/* Glow de fondo decorativo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d97d64]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#e6cca0]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Columna Izquierda: Mensaje y Filosofía */}
          <div className="lg:col-span-6 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-[#e6cca0] bg-[#e6cca0]/10 border border-[#e6cca0]/20">
              <Heart className="w-3.5 h-3.5 text-[#d97d64] fill-[#d97d64]" />
              Colaboración Voluntaria & Comunitaria
            </span>

            <h3 className="text-2xl sm:text-3xl font-black text-[#f3f1ec] tracking-tight leading-snug">
              Impulsá la Música Federal y la Difusión Independiente
            </h3>

            <p className="text-xs sm:text-sm text-[#aba79e] leading-relaxed">
              En <b>GUTA MÚSICA</b> la postulación, producción de notas y difusión para las bandas es <b>100% gratuita</b>. Tu aporte voluntario nos ayuda a sostener los servidores, cubrir festivales y dar voz a talentos emergentes de todas las provincias.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[#7e7a71]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#93a887]" />
                Pago 100% seguro con Mercado Pago
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#e6cca0]" />
                Aporte único sin suscripciones forzadas
              </span>
            </div>
          </div>

          {/* Columna Derecha: Selector de Monto y Checkout */}
          <div className="lg:col-span-6">
            <form
              onSubmit={handleDonate}
              className="bg-[#141518]/90 border border-[#2d2f38] p-5 sm:p-6 rounded-2xl space-y-4 backdrop-blur-md shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-[#24262f] pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#f3f1ec]">
                  Elegí tu monto de apoyo
                </span>
                <span className="text-[11px] text-[#8c887f] font-mono">ARS (Pesos Argentinos)</span>
              </div>

              {/* Botones de montos sugeridos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((item) => {
                  const isSelected = !isCustom && selectedAmount === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        setIsCustom(false);
                        setSelectedAmount(item.value);
                      }}
                      className={`relative py-2.5 px-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                        isSelected
                          ? 'bg-[#d97d64] text-[#151618] border-[#d97d64] shadow-md shadow-[#d97d64]/20 scale-[1.02]'
                          : 'bg-[#1e1f25] text-[#aba79e] border-[#2e303a] hover:border-[#464958] hover:text-[#f3f1ec]'
                      }`}
                    >
                      <div className="text-sm font-black">{item.label}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-[#151618]/80 font-semibold' : 'text-[#7e7a71]'}`}>
                        {item.hint}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Opción Monto Libre */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsCustom(!isCustom)}
                  className={`text-xs font-semibold flex items-center gap-1 transition-colors ${
                    isCustom ? 'text-[#e6cca0]' : 'text-[#aba79e] hover:text-[#f3f1ec]'
                  }`}
                >
                  <span>{isCustom ? '✓ Ingresar otro monto:' : '+ Prefiero aportar otro monto libre'}</span>
                </button>

                {isCustom && (
                  <div className="mt-2 relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#aba79e] font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      min="300"
                      step="100"
                      autoFocus
                      placeholder="Ej: 2500"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-[#191a1f] border border-[#d97d64] text-[#f3f1ec] text-sm font-bold focus:outline-none focus:ring-1 focus:ring-[#d97d64]"
                    />
                  </div>
                )}
              </div>

              {/* Campos opcionales: Nombre y Mensaje */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7e7a71]" />
                  <input
                    type="text"
                    maxLength={50}
                    placeholder="Tu nombre o banda (opcional)"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#18191e] border border-[#2b2d36] text-xs text-[#f3f1ec] placeholder-[#6e6b63] focus:outline-none focus:border-[#d97d64]"
                  />
                </div>
                <div className="relative">
                  <MessageSquare className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7e7a71]" />
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="Mensaje de aliento (opcional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#18191e] border border-[#2b2d36] text-xs text-[#f3f1ec] placeholder-[#6e6b63] focus:outline-none focus:border-[#d97d64]"
                  />
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-[#d97d64] font-medium animate-in fade-in">
                  ⚠️ {errorMsg}
                </p>
              )}

              {/* Botón de Pago con Mercado Pago */}
              <button
                type="submit"
                disabled={loading || effectiveAmount < 300}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-[#121316] bg-[#009EE3] hover:bg-[#0089c7] transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg shadow-[#009EE3]/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#121316]" />
                    <span>Conectando con Mercado Pago...</span>
                  </>
                ) : (
                  <>
                    <span>Aportar ${effectiveAmount.toLocaleString('es-AR')} con Mercado Pago</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#78746c] pt-1">
                <span>Dinero en cuenta MP</span>
                <span>•</span>
                <span>Débito</span>
                <span>•</span>
                <span>Crédito</span>
                <span>•</span>
                <span>Transferencia</span>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};
