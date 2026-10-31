'use client';

import React, { useState, useEffect } from 'react';
import {
  QrCode,
  X,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

interface SponsorQrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrData: string;
  initPoint?: string;
  allianceId: string;
  brandName: string;
  planName: string;
  amountArs: number;
  isInteroperableEmvco?: boolean;
  onPaymentConfirmed: (allianceId: string) => void;
}

const SUPPORTED_WALLETS = [
  { name: 'GOcuotas', badgeClass: 'bg-[#ec4899]/15 text-[#f472b6] border-[#ec4899]/40' },
  { name: 'Naranja X', badgeClass: 'bg-[#ff6600]/15 text-[#ff8533] border-[#ff6600]/40' },
  { name: 'MODO', badgeClass: 'bg-[#00b489]/15 text-[#34d399] border-[#00b489]/40' },
  { name: 'Mercado Pago', badgeClass: 'bg-[#009ee3]/15 text-[#38bdf8] border-[#009ee3]/40' },
  { name: 'Ualá', badgeClass: 'bg-[#ef4444]/15 text-[#f87171] border-[#ef4444]/40' },
  { name: 'Personal Pay', badgeClass: 'bg-[#6366f1]/15 text-[#818cf8] border-[#6366f1]/40' },
  { name: 'Cuenta DNI / BNA+', badgeClass: 'bg-[#22c55e]/15 text-[#4ade80] border-[#22c55e]/40' },
];

export const SponsorQrPaymentModal: React.FC<SponsorQrPaymentModalProps> = ({
  isOpen,
  onClose,
  qrData,
  initPoint,
  allianceId,
  brandName,
  planName,
  amountArs,
  onPaymentConfirmed,
}) => {
  const [isPaid, setIsPaid] = useState(false);
  const [checkingManual, setCheckingManual] = useState(false);
  const [useFallbackQrServer, setUseFallbackQrServer] = useState(false);

  // Consultar automáticamente cada 3.5 segundos si el pago del QR ya se acreditó
  useEffect(() => {
    if (!isOpen || !allianceId || isPaid) return;

    let active = true;
    const checkStatus = async () => {
      try {
        const res = await fetch(
          `/api/sponsors/check-payment?allianceId=${encodeURIComponent(allianceId)}`,
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (active && data?.paid) {
          setIsPaid(true);
          setTimeout(() => {
            onPaymentConfirmed(allianceId);
          }, 1500);
        }
      } catch {}
    };

    const interval = setInterval(checkStatus, 3500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isOpen, allianceId, isPaid, onPaymentConfirmed]);

  const handleManualCheck = async () => {
    if (!allianceId || checkingManual) return;
    setCheckingManual(true);
    try {
      const res = await fetch(
        `/api/sponsors/check-payment?allianceId=${encodeURIComponent(allianceId)}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (data?.paid) {
        setIsPaid(true);
        setTimeout(() => {
          onPaymentConfirmed(allianceId);
        }, 1200);
      }
    } catch {
    } finally {
      setCheckingManual(false);
    }
  };

  if (!isOpen) return null;

  const primaryQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&ecc=M&data=${encodeURIComponent(
    qrData
  )}`;
  const fallbackQrImageUrl = `https://quickchart.io/qr?size=300&margin=2&text=${encodeURIComponent(
    qrData
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#16181f] border border-[#2e313d] shadow-2xl p-6 text-[#f3f1ec] space-y-5">
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#222530] hover:bg-[#2c303e] text-[#aba79e] hover:text-white transition-colors cursor-pointer"
          title="Cerrar ventana"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado */}
        <div className="text-center space-y-1.5 pr-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#009ee3]/15 border border-[#009ee3]/40 text-[#38bdf8] text-[11px] font-bold">
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Interoperable 3.0 — Todas las Billeteras</span>
          </div>
          <h3 className="text-lg font-black text-[#f3f1ec] leading-snug">
            Escaneá con tu Billetera Favorita
          </h3>
          <p className="text-xs text-[#aba79e]">
            <b className="text-[#e6cca0]">{brandName}</b> • {planName} (30 días)
          </p>
        </div>

        {isPaid ? (
          <div className="py-10 px-4 text-center space-y-3 bg-[#5ce487]/10 border border-[#5ce487]/40 rounded-2xl">
            <CheckCircle2 className="w-14 h-14 text-[#5ce487] mx-auto animate-bounce" />
            <h4 className="text-lg font-black text-[#f3f1ec]">
              ¡Pago Aprobado y Auspicio Activado!
            </h4>
            <p className="text-xs text-[#a0d29f]">
              Tus 30 días de auspicio ya están activos. Redirigiendo a tu panel de gestión...
            </p>
          </div>
        ) : (
          <>
            {/* Recuadro del QR */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-[#121316] shadow-inner mx-auto max-w-[270px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={useFallbackQrServer ? fallbackQrImageUrl : primaryQrImageUrl}
                alt="Código QR de pago interoperable"
                width={230}
                height={230}
                onError={() => {
                  if (!useFallbackQrServer) setUseFallbackQrServer(true);
                }}
                className="w-[230px] h-[230px] object-contain rounded-lg"
              />
              <div className="mt-2 pt-2 border-t border-gray-200 w-full flex items-center justify-between text-xs font-bold text-[#121316] px-1">
                <span className="text-gray-500">Total a pagar:</span>
                <span className="text-base font-black text-[#009ee3]">
                  ${amountArs.toLocaleString('es-AR')} ARS
                </span>
              </div>
            </div>

            {/* Billeteras compatibles */}
            <div className="space-y-2 text-center">
              <p className="text-[11px] font-semibold text-[#aba79e] flex items-center justify-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#e6cca0]" />
                <span>Abrí cualquiera de tus apps y tocá &ldquo;Pagar con QR&rdquo;:</span>
              </p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {SUPPORTED_WALLETS.map((w) => (
                  <span
                    key={w.name}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${w.badgeClass}`}
                  >
                    {w.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Estado de espera en tiempo real + Botón de verificación manual */}
            <div className="p-3 rounded-xl bg-[#1e2029] border border-[#2c2f3d] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#cfcbc4]">
                <RefreshCw className="w-4 h-4 text-[#009ee3] animate-spin shrink-0" />
                <span>Esperando confirmación del pago en vivo...</span>
              </div>
              <button
                type="button"
                onClick={handleManualCheck}
                disabled={checkingManual}
                className="px-2.5 py-1.5 rounded-lg bg-[#282b38] hover:bg-[#323646] text-[11px] font-bold text-[#e6cca0] transition-colors shrink-0 cursor-pointer"
              >
                {checkingManual ? 'Verificando...' : 'Ya pagué'}
              </button>
            </div>

            {/* Alternativa si está desde el mismo celular o quiere tipear los números de su tarjeta virtual (ej. GOcuotas / Naranja X) */}
            {initPoint && (
              <div className="pt-1 border-t border-[#262832] flex flex-col gap-2">
                <a
                  href={initPoint}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#222530] hover:bg-[#2a2e3b] border border-[#353948] text-xs font-bold text-[#f3f1ec] flex items-center justify-center gap-2 transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5 text-[#e6cca0]" />
                  <span>¿Preferís ingresar los datos de tu Tarjeta Virtual (GOcuotas / Naranja X)?</span>
                  <ExternalLink className="w-3 h-3 text-[#aba79e]" />
                </a>
                <p className="text-[10px] text-center text-[#78746c] flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#5ce487]" />
                  <span>Activación automática de los 30 días al instante de acreditarse.</span>
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
