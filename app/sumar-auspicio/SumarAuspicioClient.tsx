'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  SPONSOR_PLANS,
  SponsorPlan,
  getPlanBySector,
} from '@/lib/constants/sponsorPricing';
import { AllianceSector } from '@/lib/types';
import { AllianceCard } from '@/components/BrandAllianceShowcase';
import { SponsorQrPaymentModal } from '@/components/SponsorQrPaymentModal';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Phone,
  Globe,
  ArrowRight,
  Lock,
  Layers,
  HelpCircle,
  AlertCircle,
  ChevronRight,
  Store,
  QrCode,
} from 'lucide-react';
import { InstagramIcon } from '@/lib/socialUtils';

const CATEGORY_SUGGESTIONS = [
  'Luthier & Instrumentos',
  'Grabación & Mastering',
  'Salas de Ensayo',
  'Audio en Vivo & Técnica',
  'Difusión & Prensa Musical',
  'Indumentaria & Escenario',
  'Diseño & Audiovisual',
  'Espacio Cultural & Gastronomía',
  'Salud & Bienestar',
  'Desarrollo & Software',
];

export const SumarAuspicioClient: React.FC = () => {
  const router = useRouter();

  // Selección de Plan (Preseleccionamos el Más Elegido)
  const [selectedSector, setSelectedSector] = useState<AllianceSector>('home_mid');

  // Datos de la Marca
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState(CATEGORY_SUGGESTIONS[0]);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Cuenta de Usuario (Auspiciante)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados de carga y error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingProvider, setSubmittingProvider] = useState<
    'mercadopago' | 'mercadopago_qr' | 'paypal'
  >('mercadopago');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [qrModalState, setQrModalState] = useState<{
    isOpen: boolean;
    qrData: string;
    initPoint?: string;
    allianceId: string;
    amountArs: number;
    isInteroperableEmvco?: boolean;
  } | null>(null);

  const currentPlan = getPlanBySector(selectedSector);

  // Objeto simulado para vista previa en vivo
  const previewItem = {
    id: 'preview',
    name: brandName.trim() || 'Nombre de tu Marca o Empresa',
    category: category || 'Categoría',
    description:
      description.trim() ||
      'Breve descripción de los productos o servicios culturales que ofrecés a la comunidad.',
    imageUrl: imageUrl.trim() || '',
    phone: phone.trim() || '',
    whatsapp: whatsapp.trim() || phone.trim() || '',
    instagramUrl: instagramUrl.trim() || '',
    websiteUrl: websiteUrl.trim() || '',
    sector: selectedSector,
    active: true,
  };

  const handleCheckout = async (
    e?: React.FormEvent,
    paymentProvider: 'mercadopago' | 'mercadopago_qr' | 'paypal' = 'mercadopago'
  ) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!brandName.trim()) {
      setErrorMessage('Por favor ingresá el nombre de tu marca o empresa.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Por favor ingresá un email de contacto.');
      return;
    }

    if (!whatsapp.trim() && !phone.trim() && !websiteUrl.trim() && !instagramUrl.trim()) {
      setErrorMessage('Ingresá al menos una vía de contacto comercial (WhatsApp, Instagram, Teléfono o Sitio Web).');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('Ingresá una contraseña de al menos 8 caracteres para gestionar tu auspicio.');
      return;
    }

    setSubmittingProvider(paymentProvider);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sponsors/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandName.trim(),
          sector: selectedSector,
          category,
          description: description.trim(),
          imageUrl: imageUrl.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          instagramUrl: instagramUrl.trim(),
          websiteUrl: websiteUrl.trim(),
          email: email.trim().toLowerCase(),
          password,
          paymentProvider,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ocurrió un error al procesar tu solicitud.');
      }

      if (data.allianceId) {
        localStorage.setItem('guta_pending_alliance_id', data.allianceId);
        localStorage.setItem('guta_sponsor_email', email.trim().toLowerCase());
      }

      if (paymentProvider === 'mercadopago_qr' && data.qrData) {
        setQrModalState({
          isOpen: true,
          qrData: data.qrData,
          initPoint: data.initPoint,
          allianceId: data.allianceId,
          amountArs: data.amountArs || currentPlan.priceArs,
          isInteroperableEmvco: data.isInteroperableEmvco,
        });
        setIsSubmitting(false);
        return;
      }

      if (data.initPoint) {
        // Redireccionar a Mercado Pago o PayPal
        window.location.href = data.initPoint;
      } else {
        throw new Error('No se pudo generar el enlace de pago.');
      }
    } catch (err: any) {
      console.error('Error al contratar auspicio:', err);
      setErrorMessage(err.message || 'Error de conexión. Por favor reintentá.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111215] text-[#f3f1ec] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#22242c] text-[#e6cca0] border border-[#353846]">
            <Sparkles className="w-3.5 h-3.5 text-[#d97d64]" />
            <span>Alianzas & Publicidad Cultural</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#f3f1ec] tracking-tight leading-tight">
            Impulsá tu Marca junto al <span className="text-[#e6cca0]">Movimiento Musical Latinoamericano</span>
          </h1>
          <p className="text-sm sm:text-base text-[#aba79e] leading-relaxed">
            Elegí tu espacio publicitario por <b className="text-[#f3f1ec]">30 días corridos</b>. Conectá de forma directa con miles de músicos independientes, bandas, productores y amantes de la música de todo el país.
          </p>
        </div>

        {/* Formulario & Selección */}
        <form onSubmit={handleCheckout} className="space-y-12">
          {/* PASO 1: SELECCIONAR ESPACIO PUBLICITARIO */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-[#262832] pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#d97d64] text-[#121316] font-black text-sm">
                1
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#f3f1ec]">Elegí la Ubicación de tu Auspicio (Planes por 30 Días)</h2>
                <p className="text-xs text-[#aba79e]">
                  Tarifas transparentes en pesos argentinos, sin comisiones ocultas ni letra chica.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 items-stretch">
              {SPONSOR_PLANS.map((plan) => {
                const isSelected = selectedSector === plan.sector;
                const isPopular = plan.isPopular;
                const isBestValue = plan.isBestValue;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedSector(plan.sector)}
                    className={`relative rounded-xl p-3.5 cursor-pointer transition-all duration-200 flex flex-col justify-between border ${
                      isSelected
                        ? isBestValue
                          ? 'bg-gradient-to-b from-[#26241a] via-[#1d1f27] to-[#15161c] border-[#e6cca0] shadow-lg shadow-[#e6cca0]/15 ring-2 ring-[#e6cca0]'
                          : isPopular
                          ? 'bg-gradient-to-b from-[#271e1d] via-[#1d1f27] to-[#15161c] border-[#d97d64] shadow-lg shadow-[#d97d64]/15 ring-2 ring-[#d97d64]'
                          : 'bg-[#1e2027] border-[#e6cca0] shadow-md shadow-[#e6cca0]/10 ring-1 ring-[#e6cca0]'
                        : isBestValue
                        ? 'bg-gradient-to-b from-[#201e17] to-[#16171d] border-[#e6cca0]/50 hover:border-[#e6cca0] hover:shadow-md'
                        : isPopular
                        ? 'bg-gradient-to-b from-[#221a19] to-[#16171d] border-[#d97d64]/50 hover:border-[#d97d64] hover:shadow-md'
                        : 'bg-[#16171c] border-[#272933] hover:border-[#3c3f4e] hover:bg-[#1a1b22]'
                    }`}
                  >
                    <div>
                      {/* Badge / Tag superior */}
                      <div className="min-h-[22px] flex items-center">
                        {isBestValue ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#e6cca0] text-[#121316] shadow-sm">
                            👑 MÁS CONVENIENTE
                          </span>
                        ) : isPopular ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#d97d64] text-[#121316] shadow-sm">
                            ⭐ MÁS ELEGIDO
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[9px] font-semibold text-[#a09c93] bg-[#22242c] px-2 py-0.5 rounded-full border border-[#2e313d]">
                            {plan.badge}
                          </span>
                        )}
                      </div>

                      {/* Título & Precio */}
                      <div className="pt-2">
                        <h3 className="text-sm font-bold text-[#f3f1ec] leading-snug truncate">
                          {plan.name}
                        </h3>

                        <div className="pt-1 flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-xl font-black text-[#e6cca0]">
                            ${plan.priceArs.toLocaleString('es-AR')}
                          </span>
                          <span className="text-[10px] font-bold text-[#FFC439] bg-[#FFC439]/10 px-1.5 py-0.5 rounded">
                            US$ {plan.priceUsd}
                          </span>
                          <span className="text-[10px] text-[#78746c]">/30 días</span>
                        </div>

                        <p className="text-[11px] text-[#aba79e] leading-snug line-clamp-2 pt-1 min-h-[32px]">
                          {plan.tagline}
                        </p>
                      </div>

                      {/* Beneficios Clave (Compactos: 2 ítems) */}
                      <ul className="space-y-1 pt-2 mt-2 border-t border-[#232530]">
                        {plan.benefits.slice(0, 2).map((benefit, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-1.5 text-[10px] text-[#cfcbc4] leading-tight">
                            <CheckCircle2 className="w-3 h-3 text-[#5ce487] shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Selector Inferior Compacto */}
                    <div className="pt-2.5 mt-2.5 border-t border-[#232530] flex items-center justify-between">
                      <span
                        className={`text-[11px] font-semibold ${
                          isSelected ? (isPopular ? 'text-[#d97d64]' : 'text-[#e6cca0]') : 'text-[#78746c]'
                        }`}
                      >
                        {isSelected ? '✓ Seleccionado' : 'Elegir'}
                      </span>
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? isPopular
                              ? 'border-[#d97d64] bg-[#d97d64]'
                              : 'border-[#e6cca0] bg-[#e6cca0]'
                            : 'border-[#4a4e60]'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#121316]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* PASO 2: DATOS DE LA MARCA & CONTACTO */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-[#262832] pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#d97d64] text-[#121316] font-black text-sm">
                2
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#f3f1ec]">Datos de tu Marca & Vías de Contacto</h2>
                <p className="text-xs text-[#aba79e]">
                  Completá cómo querés que se muestre tu marca en la plataforma.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Formulario de Carga */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                    Nombre de la Marca o Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Ej: Luthier Guitarras del Norte"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] placeholder-[#605d56] focus:outline-none focus:border-[#e6cca0]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#aba79e]">
                    Categoría de Rubro
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_SUGGESTIONS.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                          category === cat
                            ? 'bg-[#e6cca0] text-[#121316] font-bold'
                            : 'bg-[#1c1d24] text-[#a09c93] hover:text-[#f3f1ec] border border-[#2c2e39]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Input para categoría personalizada */}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="O escribí tu rubro personalizado (ej: Tienda de Vinilos, Iluminación, Merchandising...)"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#17181d] border border-[#2c2e39] text-xs text-[#f3f1ec] placeholder-[#605d56] focus:outline-none focus:border-[#e6cca0]"
                    />
                    <p className="text-[11px] text-[#78746c] mt-1">
                      Podés seleccionar una sugerencia o escribir un rubro a medida para tu marca.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                    URL del Logo o Imagen de Marca
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://tuweb.com/logo.png"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] placeholder-[#605d56] focus:outline-none focus:border-[#e6cca0]"
                  />
                  <p className="text-[11px] text-[#78746c] mt-1">
                    Formatos JPG, PNG, WebP o SVG. Si no tenés URL, podés dejarlo vacío y tu marca se mostrará con un sello institucional.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      WhatsApp Comercial (Recomendado)
                    </label>
                    <div className="relative">
                      <MessageCircle className="absolute left-3 top-3 w-4 h-4 text-[#25D366]" />
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="Ej: +54 9 387 4567890"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] placeholder-[#605d56] focus:outline-none focus:border-[#25D366]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Teléfono de Llamada
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-[#aba79e]" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej: 387 4567890"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] placeholder-[#605d56] focus:outline-none focus:border-[#e6cca0]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Instagram (Opcional)
                    </label>
                    <div className="relative">
                      <InstagramIcon className="absolute left-3 top-3 w-4 h-4 text-[#E1306C]" />
                      <input
                        type="text"
                        value={instagramUrl}
                        onChange={(e) => setInstagramUrl(e.target.value)}
                        placeholder="@tu_marca o link"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] placeholder-[#605d56] focus:outline-none focus:border-[#E1306C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Sitio Web / Tienda (Opcional)
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 w-4 h-4 text-[#aba79e]" />
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://tumarca.com.ar"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] placeholder-[#605d56] focus:outline-none focus:border-[#e6cca0]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                    Breve Reseña o Eslogan (hasta 120 caracteres)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={140}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej: Fabricación artesanal de instrumentos criollos con maderas nativas seleccionadas."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] placeholder-[#605d56] focus:outline-none focus:border-[#e6cca0]"
                  />
                </div>
              </div>

              {/* Vista Previa en Vivo de la Tarjeta */}
              <div className="lg:col-span-5 flex flex-col justify-start space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#e6cca0] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#d97d64]" />
                  Vista Previa en Vivo en la Web
                </span>
                <p className="text-xs text-[#78746c]">
                  Así verán los usuarios tu marca en la sección <b>{currentPlan.name}</b>:
                </p>

                <div className="p-4 rounded-2xl bg-[#121316] border border-[#292b34]">
                  <AllianceCard item={previewItem as any} isPreview={true} />
                </div>
              </div>
            </div>
          </section>

          {/* PASO 3: CUENTA DE GESTIÓN Y PAGO */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-[#262832] pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#d97d64] text-[#121316] font-black text-sm">
                3
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#f3f1ec]">Cuenta de Gestión & Confirmación</h2>
                <p className="text-xs text-[#aba79e]">
                  Con estos datos podrás ingresar a tu panel para ver los días restantes de tu campaña, editar tus enlaces y renovar.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                  Email de Gestión *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contacto@tumarca.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] placeholder-[#605d56] focus:outline-none focus:border-[#e6cca0]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                  Contraseña (mínimo 8 caracteres) *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] placeholder-[#605d56] focus:outline-none focus:border-[#e6cca0]"
                />
              </div>
            </div>

            {/* Error banner si hubo */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-[#d97d64]/10 border border-[#d97d64]/40 flex items-center gap-3 text-sm text-[#f3f1ec]">
                <AlertCircle className="w-5 h-5 text-[#d97d64] shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Resumen Final de Cobro & CTA Mercado Pago / PayPal */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1a1b22] to-[#14151a] border border-[#2c2e39] flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center lg:text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#a09c93]">
                  Resumen de tu Contratación
                </span>
                <h3 className="text-xl font-bold text-[#f3f1ec]">
                  {currentPlan.name} — <span className="text-[#e6cca0]">30 Días Corridos</span>
                </h3>
                <p className="text-xs text-[#78746c]">
                  Activación inmediata al aprobarse el pago mediante Mercado Pago (ARS) o PayPal (USD).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <div className="text-right hidden xl:block pr-2">
                  <span className="block text-xl font-black text-[#e6cca0]">
                    ${currentPlan.priceArs.toLocaleString('es-AR')} ARS
                  </span>
                  <span className="text-[11px] text-[#FFC439] font-semibold">
                    o US$ {currentPlan.priceUsd} vía PayPal
                  </span>
                </div>

                {/* Botón QR Interoperable (GOcuotas, Naranja X, MODO, MP, Ualá) */}
                <button
                  type="button"
                  onClick={() => handleCheckout(undefined, 'mercadopago_qr')}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-4 py-3.5 rounded-xl bg-gradient-to-r from-[#1f2937] to-[#111827] hover:from-[#009ee3]/25 hover:to-[#00b489]/25 border border-[#009ee3]/60 text-[#f3f1ec] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-[#38bdf8]" />
                  <div className="text-left leading-tight">
                    <span className="block">
                      {isSubmitting && submittingProvider === 'mercadopago_qr'
                        ? 'Generando QR Interoperable...'
                        : 'Pagar con QR (Billeteras)'}
                    </span>
                    <span className="block text-[10px] font-medium text-[#38bdf8]">
                      GOcuotas • Naranja X • MODO • MP
                    </span>
                  </div>
                </button>

                {/* Botón Mercado Pago Checkout (ARS) */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-[#009ee3] hover:bg-[#0086c3] text-[#f3f1ec] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#009ee3]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-white" />
                  <span>
                    {isSubmitting && submittingProvider === 'mercadopago'
                      ? 'Conectando con Mercado Pago...'
                      : `Mercado Pago $${currentPlan.priceArs.toLocaleString('es-AR')} ARS`}
                  </span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>

                {/* Botón PayPal (USD) */}
                <button
                  type="button"
                  onClick={() => handleCheckout(undefined, 'paypal')}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-[#FFC439] hover:bg-[#f2b324] text-[#121316] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FFC439]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-[#121316]" />
                  <span>
                    {isSubmitting && submittingProvider === 'paypal'
                      ? 'Conectando con PayPal...'
                      : `PayPal US$ ${currentPlan.priceUsd} USD`}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#121316]" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-[#78746c] pt-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#5ce487]" /> Pago 100% Seguro por QR Interoperable 3.0, Mercado Pago o PayPal
              </span>
              <span>•</span>
              <span>Acepta GOcuotas, Naranja X, MODO, Ualá, MP (ARS) y PayPal (USD)</span>
              <span>•</span>
              <span>Sin débitos sorpresa: renovación manual al finalizar los 30 días</span>
            </div>
          </section>
        </form>

        {/* Modal de Pago con QR Interoperable */}
        {qrModalState && (
          <SponsorQrPaymentModal
            isOpen={qrModalState.isOpen}
            onClose={() => setQrModalState(null)}
            qrData={qrModalState.qrData}
            initPoint={qrModalState.initPoint}
            allianceId={qrModalState.allianceId}
            brandName={brandName.trim() || 'Tu Marca'}
            planName={currentPlan.name}
            amountArs={qrModalState.amountArs}
            isInteroperableEmvco={qrModalState.isInteroperableEmvco}
            onPaymentConfirmed={(confirmedId) => {
              setQrModalState(null);
              router.push(`/panel-auspiciante?payment=success&id=${confirmedId}`);
            }}
          />
        )}
      </div>
    </div>
  );
};
