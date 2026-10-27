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
} from 'lucide-react';

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

  // Selección de Plan
  const [selectedSector, setSelectedSector] = useState<AllianceSector>('global_footer');

  // Datos de la Marca
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState(CATEGORY_SUGGESTIONS[0]);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  // Cuenta de Usuario (Auspiciante)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados de carga y error
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    websiteUrl: websiteUrl.trim() || '',
    sector: selectedSector,
    active: true,
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!brandName.trim()) {
      setErrorMessage('Por favor ingresá el nombre de tu marca o empresa.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Por favor ingresá un email de contacto.');
      return;
    }

    if (!whatsapp.trim() && !phone.trim() && !websiteUrl.trim()) {
      setErrorMessage('Ingresá al menos una vía de contacto comercial (WhatsApp, Teléfono o Sitio Web).');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('Ingresá una contraseña de al menos 8 caracteres para gestionar tu auspicio.');
      return;
    }

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
          websiteUrl: websiteUrl.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ocurrió un error al procesar tu solicitud.');
      }

      if (data.initPoint) {
        // Guardar referencia en localStorage para recuperación en panel
        if (data.allianceId) {
          localStorage.setItem('guta_pending_alliance_id', data.allianceId);
          localStorage.setItem('guta_sponsor_email', email.trim().toLowerCase());
        }

        // Redireccionar a Mercado Pago Checkout Pro
        window.location.href = data.initPoint;
      } else {
        throw new Error('No se pudo generar el enlace de pago de Mercado Pago.');
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
            Impulsá tu Marca junto al <span className="text-[#e6cca0]">Movimiento Musical Federal</span>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SPONSOR_PLANS.map((plan) => {
                const isSelected = selectedSector === plan.sector;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedSector(plan.sector)}
                    className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between border ${
                      isSelected
                        ? 'bg-[#1e2027] border-[#e6cca0] shadow-xl shadow-[#e6cca0]/10 ring-1 ring-[#e6cca0]'
                        : 'bg-[#17181d] border-[#292b34] hover:border-[#3d4150] hover:bg-[#1a1b22]'
                    }`}
                  >
                    {plan.badge && (
                      <span className="inline-block self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#252834] text-[#e6cca0] border border-[#3b3f52] mb-3">
                        {plan.badge}
                      </span>
                    )}

                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-[#f3f1ec]">{plan.name}</h3>
                      <p className="text-xs text-[#aba79e] leading-relaxed">{plan.tagline}</p>

                      <div className="pt-2 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-[#e6cca0]">
                          ${plan.priceArs.toLocaleString('es-AR')}
                        </span>
                        <span className="text-xs text-[#78746c]">/ 30 días</span>
                      </div>

                      <p className="text-[11px] text-[#78746c] pt-2 border-t border-[#262832]">
                        <b className="text-[#a09c93]">Audiencia:</b> {plan.audience}
                      </p>

                      <ul className="space-y-1.5 pt-2">
                        {plan.benefits.slice(0, 3).map((benefit, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-1.5 text-[11px] text-[#cfcbc4]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#5ce487] shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#262832] flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-[#e6cca0]' : 'text-[#78746c]'
                        }`}
                      >
                        {isSelected ? '✓ Seleccionado' : 'Seleccionar este espacio'}
                      </span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#e6cca0] bg-[#e6cca0]' : 'border-[#4a4e60]'
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

                <div>
                  <label className="block text-xs font-semibold text-[#aba79e] mb-1.5">
                    Categoría de Rubro
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_SUGGESTIONS.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                          category === cat
                            ? 'bg-[#e6cca0] text-[#121316] font-bold'
                            : 'bg-[#1c1d24] text-[#a09c93] hover:text-[#f3f1ec] border border-[#2c2e39]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
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

                <div>
                  <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                    Sitio Web o Instagram
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 w-4 h-4 text-[#aba79e]" />
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://instagram.com/tu_marca"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] placeholder-[#605d56] focus:outline-none focus:border-[#e6cca0]"
                    />
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

            {/* Resumen Final de Cobro & CTA Mercado Pago */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1a1b22] to-[#14151a] border border-[#2c2e39] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#a09c93]">
                  Resumen de tu Contratación
                </span>
                <h3 className="text-xl font-bold text-[#f3f1ec]">
                  {currentPlan.name} — <span className="text-[#e6cca0]">30 Días Corridos</span>
                </h3>
                <p className="text-xs text-[#78746c]">
                  Activación inmediata al aprobarse el pago mediante Mercado Pago.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="text-right hidden sm:block">
                  <span className="block text-2xl font-black text-[#e6cca0]">
                    ${currentPlan.priceArs.toLocaleString('es-AR')}
                  </span>
                  <span className="text-[11px] text-[#78746c]">ARS Final (Pago Único)</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#009ee3] hover:bg-[#0086c3] text-[#f3f1ec] font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#009ee3]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-white" />
                  <span>
                    {isSubmitting
                      ? 'Conectando con Mercado Pago...'
                      : `Pagar con Mercado Pago $${currentPlan.priceArs.toLocaleString('es-AR')}`}
                  </span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-[#78746c] pt-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#5ce487]" /> Pago 100% Seguro por Mercado Pago
              </span>
              <span>•</span>
              <span>Acepta Saldo en cuenta, Débito, Crédito y Transferencias</span>
              <span>•</span>
              <span>Sin débitos sorpresa: renovación manual al finalizar los 30 días</span>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
};
