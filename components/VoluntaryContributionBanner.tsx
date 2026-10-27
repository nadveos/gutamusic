'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Heart, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

const PRESET_AMOUNTS = [
  { value: 1500, label: '$1.500' },
  { value: 3000, label: '$3.000' },
  { value: 5000, label: '$5.000' },
];

export const VoluntaryContributionBanner: React.FC = () => {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  const [selectedAmount, setSelectedAmount] = useState<number>(3000);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (paymentStatus === 'success') {
      setShowSuccessToast(true);
      const timer = setTimeout(() => setShowSuccessToast(false), 9000);
      return () => clearTimeout(timer);
    }
  }, [paymentStatus]);

  const effectiveAmount = isCustom ? (parseInt(customAmount, 10) || 0) : selectedAmount;

  const handleDonate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (effectiveAmount < 300) {
      alert('El aporte mínimo es de $300 ARS.');
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
      alert(err.message || 'Error al conectar con Mercado Pago.');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toast de Agradecimiento si el pago fue aprobado */}
      {showSuccessToast && (
        <div className="fixed top-20 right-4 left-4 sm:left-auto sm:w-96 z-50 p-4 rounded-2xl bg-[#1d261e] border border-[#93a887]/50 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#93a887]/20 flex items-center justify-center flex-shrink-0 text-[#93a887]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#f3f1ec]">¡Gracias por tu aporte a GUTA! 💙</h4>
              <p className="text-xs text-[#aba79e] mt-1 leading-relaxed">
                Tu colaboración voluntaria sostiene la difusión 100% gratuita para bandas de todo el país.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cinta compacta, estilizada y responsive */}
      <section className="relative rounded-2xl bg-gradient-to-r from-[#1a1b20] via-[#1f2027] to-[#18191e] border border-[#2b2d37] p-3.5 sm:px-6 sm:py-3.5 shadow-md overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Lado izquierdo: Identidad y mensaje sutil */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#d97d64]/15 text-[#d97d64] flex items-center justify-center shrink-0">
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#d97d64]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm text-[#f3f1ec] tracking-tight truncate">
                  Colaboración Voluntaria
                </span>
                <span className="text-[10px] text-[#e6cca0] font-semibold bg-[#e6cca0]/10 px-2 py-0.5 rounded-full border border-[#e6cca0]/20 inline-block">
                  Música Federal
                </span>
              </div>
              <p className="text-[11px] text-[#8c887f] truncate hidden lg:block mt-0.5">
                Difusión comunitaria y gratuita para artistas. Tu aporte nos ayuda a sostener la plataforma.
              </p>
            </div>
          </div>

          {/* Lado derecho: Montos y botón (adaptativo móvil / escritorio) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            {/* Selector de montos en píldoras */}
            <div className="grid grid-cols-4 sm:flex items-center gap-1 bg-[#131418] p-1 rounded-xl border border-[#262832]">
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
                    className={`px-2.5 py-1.5 sm:py-1 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#d97d64] text-[#151618] shadow-xs'
                        : 'text-[#aba79e] hover:text-[#f3f1ec] hover:bg-[#1d1f27]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className={`px-2 py-1.5 sm:py-1 rounded-lg text-xs font-semibold text-center transition-all cursor-pointer ${
                  isCustom
                    ? 'bg-[#e6cca0] text-[#151618] font-bold'
                    : 'text-[#8c887f] hover:text-[#f3f1ec] hover:bg-[#1d1f27]'
                }`}
                title="Ingresar otro monto libre"
              >
                Otro
              </button>
            </div>

            {/* Input de monto libre si se activa */}
            {isCustom && (
              <div className="relative w-full sm:w-auto">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#aba79e] font-bold">
                  $
                </span>
                <input
                  type="number"
                  min="300"
                  step="100"
                  placeholder="2500"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full sm:w-24 pl-6 pr-2 py-1.5 sm:py-1 rounded-xl bg-[#131418] border border-[#d97d64] text-xs font-bold text-[#f3f1ec] focus:outline-none"
                />
              </div>
            )}

            {/* Botón directo a Mercado Pago */}
            <button
              type="button"
              onClick={() => handleDonate()}
              disabled={loading || effectiveAmount < 300}
              className="w-full sm:w-auto px-4 py-2 sm:py-1.5 rounded-xl bg-[#009EE3] hover:bg-[#008ac7] text-[#121316] font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-sm shadow-[#009EE3]/20 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#121316]" />
              ) : (
                <>
                  <span>Aportar ${effectiveAmount.toLocaleString('es-AR')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </section>
    </>
  );
};
