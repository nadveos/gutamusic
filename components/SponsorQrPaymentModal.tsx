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
  Info,
} from 'lucide-react';

interface SponsorQrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrData: string;
  staticPosQrImage?: string | null;
  initPoint?: string;
  allianceId: string;
  brandName: string;
  planName: string;
  amountArs: number;
  isInteroperableEmvco?: boolean;
  onPaymentConfirmed: (allianceId: string) => void;
}

const SUPPORTED_WALLETS = [
  { name: 'Mercado Pago', badgeClass: 'bg-[#009ee3]/15 text-[#38bdf8] border-[#009ee3]/40' },
  { name: 'MODO', badgeClass: 'bg-[#00b489]/15 text-[#34d399] border-[#00b489]/40' },
  { name: 'Naranja X', badgeClass: 'bg-[#ff6600]/15 text-[#ff8533] border-[#ff6600]/40' },
  { name: 'GOcuotas', badgeClass: 'bg-[#ec4899]/15 text-[#f472b6] border-[#ec4899]/40' },
  { name: 'Ualá', badgeClass: 'bg-[#ef4444]/15 text-[#f87171] border-[#ef4444]/40' },
  { name: 'Personal Pay', badgeClass: 'bg-[#6366f1]/15 text-[#818cf8] border-[#6366f1]/40' },
  { name: 'Cuenta DNI / BNA+', badgeClass: 'bg-[#22c55e]/15 text-[#4ade80] border-[#22c55e]/40' },
];

export const SponsorQrPaymentModal: React.FC<SponsorQrPaymentModalProps> = ({
  isOpen,
  onClose,
  qrData,
  staticPosQrImage,
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
  const [qrMode, setQrMode] = useState<'dynamic' | 'pos'>('dynamic');

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

  const isStaticPosUrl =
    typeof staticPosQrImage === 'string' && staticPosQrImage.startsWith('http');

  const activeQrData =
    qrMode === 'pos' && staticPosQrImage && !isStaticPosUrl ? staticPosQrImage : qrData;

  const primaryQrImageUrl =
    qrMode === 'pos' && isStaticPosUrl
      ? staticPosQrImage!
      : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=12&ecc=M&data=${encodeURIComponent(
          activeQrData
        )}`;
  const fallbackQrImageUrl = `https://quickchart.io/qr?size=300&margin=2&text=${encodeURIComponent(
    activeQrData
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-[#16181f] border border-[#2e313d] shadow-2xl p-5 sm:p-6 text-[#f3f1ec] space-y-4 my-auto">
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
        <div className="text-center space-y-1 pr-6">
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
            {/* Selector de modo QR si hay QR de Caja Abierta disponible */}
            {staticPosQrImage && (
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#111217] border border-[#262936] text-[11px]">
                <button
                  type="button"
                  onClick={() => setQrMode('dynamic')}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-colors cursor-pointer ${
                    qrMode === 'dynamic'
                      ? 'bg-[#009ee3] text-white'
                      : 'text-[#aba79e] hover:text-white'
                  }`}
                >
                  QR Monto Automático
                </button>
                <button
                  type="button"
                  onClick={() => setQrMode('pos')}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-colors cursor-pointer ${
                    qrMode === 'pos'
                      ? 'bg-[#ec4899] text-white'
                      : 'text-[#aba79e] hover:text-white'
                  }`}
                >
                  QR Caja (GOcuotas / Cuotas)
                </button>
              </div>
            )}

            {/* Recuadro del QR */}
            <div className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white text-[#121316] shadow-inner mx-auto max-w-[260px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={useFallbackQrServer ? fallbackQrImageUrl : primaryQrImageUrl}
                alt="Código QR de pago interoperable"
                width={215}
                height={215}
                onError={() => {
                  if (!useFallbackQrServer) setUseFallbackQrServer(true);
                }}
                className="w-[215px] h-[215px] object-contain rounded-lg"
              />
              <div className="mt-2 pt-2 border-t border-gray-200 w-full flex items-center justify-between text-xs font-bold text-[#121316] px-1">
                <span className="text-gray-500">Total a pagar:</span>
                <span className="text-base font-black text-[#009ee3]">
                  ${amountArs.toLocaleString('es-AR')} ARS
                </span>
              </div>
            </div>

            {/* Billeteras compatibles */}
            <div className="space-y-1.5 text-center">
              <p className="text-[11px] font-semibold text-[#aba79e] flex items-center justify-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-[#e6cca0]" />
                <span>Compatible con Transferencia 3.0 y Billeteras:</span>
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

            {/* Aviso especial para pagos en cuotas con GOcuotas / Naranja X */}
            {initPoint && (
              <div className="p-3 rounded-xl bg-[#ec4899]/10 border border-[#ec4899]/35 space-y-2">
                <div className="flex items-start gap-2 text-[11px] text-[#f3f1ec] leading-snug">
                  <Info className="w-4 h-4 text-[#f472b6] shrink-0 mt-0.5" />
                  <span>
                    <b className="text-[#f472b6]">¿Querés pagar en cuotas con GOcuotas o Naranja X?</b>{' '}
                    Si el lector QR de tu app no habilita cuotas sobre QR dinámico, usá tu{' '}
                    <b>Tarjeta Virtual de GOcuotas / Naranja X</b> directamente acá:
                  </span>
                </div>
                <a
                  href={initPoint}
                  className="w-full py-2 px-3 rounded-lg bg-[#ec4899] hover:bg-[#db2777] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pagar con Tarjeta Virtual GOcuotas / Naranja X</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

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

            <p className="text-[10px] text-center text-[#78746c] flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5ce487]" />
              <span>Activación automática de los 30 días al instante de acreditarse.</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
