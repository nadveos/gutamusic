'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { AllianceCard } from '@/components/BrandAllianceShowcase';
import { SponsorQrPaymentModal } from '@/components/SponsorQrPaymentModal';
import { getPlanBySector } from '@/lib/constants/sponsorPricing';
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Phone,
  Globe,
  RefreshCw,
  Save,
  ArrowRight,
  ShieldCheck,
  Eye,
  LogOut,
  Store,
  QrCode,
} from 'lucide-react';
import { InstagramIcon } from '@/lib/socialUtils';

export const SponsorDashboardClient: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentStatus = searchParams?.get('payment');
  const allianceIdQuery = searchParams?.get('id');

  const [alliance, setAlliance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [renewLoading, setRenewLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [qrModalState, setQrModalState] = useState<{
    isOpen: boolean;
    qrData: string;
    initPoint?: string;
    allianceId: string;
    amountArs: number;
    isInteroperableEmvco?: boolean;
  } | null>(null);

  // Formulario de edición
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [category, setCategory] = useState('');

  // Cargar datos del auspicio
  useEffect(() => {
    const fetchAlliance = async () => {
      setLoading(true);
      try {
        const id =
          allianceIdQuery ||
          (typeof window !== 'undefined' ? localStorage.getItem('guta_pending_alliance_id') : null);
        const email =
          typeof window !== 'undefined' ? localStorage.getItem('guta_sponsor_email') : null;

        let url = '/api/sponsors/my-alliance?';
        if (id) url += `id=${id}`;
        else if (email) url += `email=${encodeURIComponent(email)}`;
        else {
          setLoading(false);
          return;
        }

        const res = await fetch(url);
        const data = await res.json();

        if (data.success && data.alliance) {
          setAlliance(data.alliance);
          setDescription(data.alliance.description || '');
          setImageUrl(data.alliance.imageUrl || '');
          setWhatsapp(data.alliance.whatsapp || '');
          setPhone(data.alliance.phone || '');
          setInstagramUrl(data.alliance.instagramUrl || '');
          setWebsiteUrl(data.alliance.websiteUrl || '');
          setCategory(data.alliance.category || '');
        }
      } catch (err) {
        console.warn('Error fetching sponsor alliance:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlliance();
  }, [allianceIdQuery]);

  // Manejar guardado de cambios
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alliance?.id) return;

    setSaveLoading(true);
    setSuccessToast(null);
    setErrorToast(null);

    try {
      const res = await fetch('/api/sponsors/my-alliance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: alliance.id,
          description,
          imageUrl,
          whatsapp,
          phone,
          instagramUrl,
          websiteUrl,
          category,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAlliance((prev: any) => ({
          ...prev,
          description,
          imageUrl,
          whatsapp,
          phone,
          instagramUrl,
          websiteUrl,
          category,
        }));
        setSuccessToast('¡Datos de tu marca actualizados correctamente en toda la web!');
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        throw new Error(data.error || 'No se pudieron guardar los cambios');
      }
    } catch (err: any) {
      setErrorToast(err.message || 'Error al guardar');
    } finally {
      setSaveLoading(false);
    }
  };

  // Manejar renovación de 30 días
  const handleRenew = async (
    paymentProvider: 'mercadopago' | 'mercadopago_qr' | 'paypal' = 'mercadopago'
  ) => {
    if (!alliance?.id) return;
    setRenewLoading(true);
    setErrorToast(null);

    try {
      const res = await fetch('/api/sponsors/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allianceId: alliance.id, paymentProvider }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'No se pudo generar la renovación.');
      }

      if (paymentProvider === 'mercadopago_qr' && data.qrData) {
        setQrModalState({
          isOpen: true,
          qrData: data.qrData,
          initPoint: data.initPoint,
          allianceId: alliance.id,
          amountArs: data.amountArs || plan?.priceArs || 0,
          isInteroperableEmvco: data.isInteroperableEmvco,
        });
        setRenewLoading(false);
        return;
      }

      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        throw new Error('No se pudo generar la renovación.');
      }
    } catch (err: any) {
      setErrorToast(err.message || 'Error al renovar auspicio.');
      setRenewLoading(false);
    }
  };

  const plan = alliance ? getPlanBySector(alliance.sector) : null;

  return (
    <div className="min-h-screen bg-[#111215] text-[#f3f1ec] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Banner de estado de pago si proviene de Mercado Pago */}
        {paymentStatus === 'success' && (
          <div className="p-5 rounded-2xl bg-[#5ce487]/10 border border-[#5ce487]/40 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#5ce487] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-[#f3f1ec]">
                ¡Pago Aprobado y Auspicio Activo por 30 Días!
              </h4>
              <p className="text-xs text-[#a0d29f]">
                Tu marca ya está visible en la sección contratada de GUTA MÚSICA. Podés gestionar tus enlaces y actualizar tu información cuando lo necesites.
              </p>
            </div>
          </div>
        )}

        {paymentStatus === 'failure' && (
          <div className="p-5 rounded-2xl bg-[#d97d64]/10 border border-[#d97d64]/40 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-[#d97d64] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-[#f3f1ec]">
                El pago no se pudo completar
              </h4>
              <p className="text-xs text-[#aba79e]">
                No te preocupes, podés reintentar el pago con cualquier otro medio de Mercado Pago utilizando el botón de renovación abajo.
              </p>
            </div>
          </div>
        )}

        {/* Encabezado del Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262832] pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#1e2027] text-[#e6cca0] border border-[#303340]">
              <Sparkles className="w-3 h-3 text-[#d97d64]" />
              <span>Panel de Control de Auspiciante</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#f3f1ec]">
              {alliance ? alliance.name : 'Mi Auspicio Publicitario'}
            </h1>
            <p className="text-xs text-[#aba79e]">
              Administrá la presencia de tu marca, revisá la vigencia y actualizá tus canales de contacto directo.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1c1d23] hover:bg-[#252731] text-xs font-semibold text-[#cfcbc4] border border-[#2d2f3b] transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Web en Vivo</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#78746c] space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#e6cca0]" />
            <p className="text-sm">Cargando datos de tu auspicio...</p>
          </div>
        ) : !alliance ? (
          <div className="p-10 rounded-2xl bg-[#17181e] border border-[#262832] text-center space-y-4 max-w-lg mx-auto">
            <Store className="w-10 h-10 text-[#e6cca0] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#f3f1ec]">No tenés un auspicio activo registrado</h3>
              <p className="text-xs text-[#aba79e]">
                ¿Querés posicionar tu marca o proyecto cultural en GUTA MÚSICA? Podés contratar un espacio publicitario por 30 días ahora mismo.
              </p>
            </div>
            <Link
              href="/sumar-auspicio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e6cca0] hover:bg-[#d97d64] text-[#121316] font-bold text-xs transition-colors"
            >
              <span>+ Contratar Espacio por 30 Días</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Banner de Aviso de Días Restantes / Próximo Vencimiento */}
            {alliance.endDate && (
              <div
                className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
                  alliance.isExpired
                    ? 'bg-[#d97d64]/15 border-[#d97d64]/50'
                    : alliance.daysRemaining <= 7
                      ? 'bg-[#e6cca0]/15 border-[#e6cca0]/50'
                      : 'bg-[#5ce487]/10 border-[#5ce487]/30'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      alliance.isExpired
                        ? 'bg-[#d97d64]/25 text-[#d97d64]'
                        : alliance.daysRemaining <= 7
                          ? 'bg-[#e6cca0]/25 text-[#e6cca0]'
                          : 'bg-[#5ce487]/20 text-[#5ce487]'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#f3f1ec] text-sm block">
                      {alliance.isExpired
                        ? 'Tu período de Anunciante Destacado ha finalizado'
                        : alliance.daysRemaining <= 7
                          ? `¡Aviso previo de vencimiento! Te ${alliance.daysRemaining === 1 ? 'queda 1 día' : `quedan ${alliance.daysRemaining} días`} de Anunciante Destacado`
                          : `Te quedan ${alliance.daysRemaining} días de Anunciante Destacado en ${plan?.name || 'GUTA MÚSICA'}`}
                    </span>
                    <p className="text-[#aba79e]">
                      {alliance.isExpired
                        ? `Tu campaña venció el ${alliance.endDate}. Podés renovar por 30 días para reactivar tu marca inmediatamente.`
                        : `Vigencia activa hasta el ${alliance.endDate}. Podés renovar antes del vencimiento para extender 30 días adicionales.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Métricas y Estado de Vigencia (30 Días) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#17181e] border border-[#292b34] space-y-1">
                <span className="text-[11px] font-semibold text-[#78746c] uppercase tracking-wider">
                  Espacio Asignado
                </span>
                <p className="text-sm font-bold text-[#f3f1ec] truncate">
                  {plan?.name || alliance.sector}
                </p>
                <span className="text-[10px] text-[#e6cca0]">
                  {alliance.sector === 'global_footer'
                    ? '100% de las páginas'
                    : 'Ubicación específica'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#17181e] border border-[#292b34] space-y-1">
                <span className="text-[11px] font-semibold text-[#78746c] uppercase tracking-wider">
                  Vigencia de Campaña
                </span>
                <div className="flex items-center gap-2">
                  <Clock
                    className={`w-4 h-4 ${
                      alliance.isExpired ? 'text-[#d97d64]' : 'text-[#5ce487]'
                    }`}
                  />
                  <p className="text-sm font-bold text-[#f3f1ec]">
                    {alliance.statusLabel}
                  </p>
                </div>
                <span className="text-[10px] text-[#78746c]">
                  Vence: {alliance.endDate || 'Activo sin vencimiento'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#17181e] border border-[#292b34] space-y-1">
                <span className="text-[11px] font-semibold text-[#78746c] uppercase tracking-wider">
                  Estado Publicitario
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      alliance.active && !alliance.isExpired
                        ? 'bg-[#5ce487]'
                        : 'bg-[#d97d64]'
                    }`}
                  />
                  <p className="text-sm font-bold text-[#f3f1ec]">
                    {alliance.active && !alliance.isExpired ? 'Publicado' : 'Pausado'}
                  </p>
                </div>
                <span className="text-[10px] text-[#78746c]">
                  {alliance.active ? 'Visible para los usuarios' : 'Requiere renovación'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#1a1b23] border border-[#d97d64]/40 flex flex-col justify-between space-y-2">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-semibold text-[#e6cca0] uppercase tracking-wider">
                    Renovación 30 Días
                  </span>
                  <p className="text-xs text-[#aba79e]">
                    Extendé 30 días con QR Billeteras, Mercado Pago o PayPal.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleRenew('mercadopago_qr')}
                    disabled={renewLoading}
                    className="w-full py-2 px-2.5 rounded-xl bg-gradient-to-r from-[#1f2937] to-[#111827] hover:from-[#009ee3]/25 hover:to-[#00b489]/25 border border-[#009ee3]/60 text-[#f3f1ec] font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>QR (GOcuotas / Naranja X / MODO)</span>
                  </button>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRenew('mercadopago')}
                      disabled={renewLoading}
                      className="w-full py-2 px-2 rounded-xl bg-[#009ee3] hover:bg-[#0086c3] text-white font-bold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${renewLoading ? 'animate-spin' : ''}`} />
                      <span>Mercado Pago</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRenew('paypal')}
                      disabled={renewLoading}
                      className="w-full py-2 px-2 rounded-xl bg-[#FFC439] hover:bg-[#f2b324] text-[#121316] font-bold text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Globe className="w-3 h-3" />
                      <span>PayPal {plan?.priceUsd ? `US$${plan.priceUsd}` : 'USD'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Vista Previa en Vivo vs Editor de Datos */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Formulario de Edición */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-6 rounded-2xl bg-[#17181e] border border-[#292b34] space-y-5">
                  <div className="flex items-center justify-between border-b border-[#262832] pb-3">
                    <h3 className="text-base font-bold text-[#f3f1ec]">
                      Editar Canales Comerciales
                    </h3>
                    <span className="text-[11px] text-[#78746c]">
                      Los cambios impactan al instante
                    </span>
                  </div>

                  {successToast && (
                    <div className="p-3 rounded-xl bg-[#5ce487]/10 border border-[#5ce487]/40 text-xs text-[#5ce487] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{successToast}</span>
                    </div>
                  )}

                  {errorToast && (
                    <div className="p-3 rounded-xl bg-[#d97d64]/10 border border-[#d97d64]/40 text-xs text-[#d97d64] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorToast}</span>
                    </div>
                  )}

                  <form onSubmit={handleSaveChanges} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                          Rubro / Categoría
                        </label>
                        <input
                          type="text"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          placeholder="Ej: Luthier, Sala de Ensayo..."
                          className="w-full px-3 py-2 rounded-xl bg-[#111215] border border-[#2b2d38] text-xs text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                          URL de Logo / Imagen
                        </label>
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-2 rounded-xl bg-[#111215] border border-[#2b2d38] text-xs text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                          WhatsApp Comercial
                        </label>
                        <input
                          type="text"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="+54 9 387 1234567"
                          className="w-full px-3 py-2 rounded-xl bg-[#111215] border border-[#2b2d38] text-xs text-[#f3f1ec] focus:outline-none focus:border-[#25D366]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                          Teléfono de Contacto
                        </label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="387 1234567"
                          className="w-full px-3 py-2 rounded-xl bg-[#111215] border border-[#2b2d38] text-xs text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-[#aba79e] mb-1 flex items-center gap-1.5">
                          <InstagramIcon className="w-3.5 h-3.5 text-[#E1306C]" />
                          <span>Instagram (Opcional)</span>
                        </label>
                        <input
                          type="text"
                          value={instagramUrl}
                          onChange={(e) => setInstagramUrl(e.target.value)}
                          placeholder="@tu_marca o link"
                          className="w-full px-3 py-2 rounded-xl bg-[#111215] border border-[#2b2d38] text-xs text-[#f3f1ec] focus:outline-none focus:border-[#E1306C]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                          Sitio Web / Tienda (Opcional)
                        </label>
                        <input
                          type="url"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          placeholder="https://tumarca.com.ar"
                          className="w-full px-3 py-2 rounded-xl bg-[#111215] border border-[#2b2d38] text-xs text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                        Breve Reseña Comercial
                      </label>
                      <textarea
                        rows={2}
                        maxLength={140}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descripción breve..."
                        className="w-full px-3 py-2 rounded-xl bg-[#111215] border border-[#2b2d38] text-xs text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={saveLoading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e6cca0] hover:bg-[#d97d64] text-[#121316] font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saveLoading ? 'Guardando...' : 'Guardar y Publicar Cambios'}</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Vista Previa en Vivo */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#e6cca0] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#d97d64]" />
                  Vista Previa en Vivo
                </span>
                <p className="text-xs text-[#78746c]">
                  Así está apareciendo tu marca en este momento:
                </p>

                <div className="p-4 rounded-2xl bg-[#121316] border border-[#292b34]">
                  <AllianceCard
                    item={{
                      ...alliance,
                      description,
                      imageUrl,
                      whatsapp,
                      phone,
                      instagramUrl,
                      websiteUrl,
                      category,
                    }}
                    isPreview={true}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Pago con QR Interoperable para Renovación */}
        {qrModalState && alliance && (
          <SponsorQrPaymentModal
            isOpen={qrModalState.isOpen}
            onClose={() => setQrModalState(null)}
            qrData={qrModalState.qrData}
            initPoint={qrModalState.initPoint}
            allianceId={qrModalState.allianceId}
            brandName={alliance.name}
            planName={plan?.name || alliance.sector}
            amountArs={qrModalState.amountArs}
            isInteroperableEmvco={qrModalState.isInteroperableEmvco}
            onPaymentConfirmed={(confirmedId) => {
              setQrModalState(null);
              window.location.href = `/panel-auspiciante?payment=success&id=${confirmedId}`;
            }}
          />
        )}
      </div>
    </div>
  );
};
