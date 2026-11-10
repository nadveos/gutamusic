'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  PROFESSIONAL_CATEGORIES,
  PROFESSIONAL_FEATURED_PRICE_ARS,
  PROFESSIONAL_FEATURED_PRICE_USD,
  getProfessionalCategoryInfo,
} from '@/lib/constants/professionalCategories';
import {
  ProfessionalCard,
  EnrichedProfessional,
} from '@/app/profesionales/ProfessionalsDirectoryClient';
import { SponsorQrPaymentModal } from '@/components/SponsorQrPaymentModal';
import { ProfessionalCategoryKey, ProfessionalModality } from '@/lib/types';
import {
  Headphones,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Globe,
  RefreshCw,
  Save,
  Eye,
  LogOut,
  Plus,
  X,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { InstagramIcon } from '@/lib/socialUtils';

export const ProfessionalDashboardClient: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const paymentStatus = searchParams?.get('payment');
  const welcomeStatus = searchParams?.get('welcome');
  const profIdQuery = searchParams?.get('id');

  const [prof, setProf] = useState<EnrichedProfessional | null>(null);
  const [loading, setLoading] = useState(true);
  const [lookupEmail, setLookupEmail] = useState('');

  // Estados de edición
  const [name, setName] = useState('');
  const [roleCategory, setRoleCategory] =
    useState<ProfessionalCategoryKey>('productor_musical');
  const [specialty, setSpecialty] = useState('');
  const [modality, setModality] =
    useState<ProfessionalModality>('Presencial y Online');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [spotify, setSpotify] = useState('');
  const [youtube, setYoutube] = useState('');
  const [website, setWebsite] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [servicesList, setServicesList] = useState<string[]>([]);
  const [serviceInput, setServiceInput] = useState('');

  const [saveLoading, setSaveLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const [qrModalState, setQrModalState] = useState<{
    isOpen: boolean;
    qrData: string;
    staticPosQrImage?: string | null;
    initPoint?: string;
    professionalId: string;
    amountArs: number;
    isInteroperableEmvco?: boolean;
  } | null>(null);

  const populateState = (data: EnrichedProfessional) => {
    setProf(data);
    setName(data.name || '');
    setRoleCategory(data.roleCategory || 'productor_musical');
    setSpecialty(data.specialty || '');
    setModality(data.modality || 'Presencial y Online');
    setCity(data.city || '');
    setProvince(data.province || '');
    setBio(data.bio || '');
    setPhotoUrl(data.photoUrl || '');
    setWhatsapp(data.whatsapp || '');
    setPhone(data.phone || '');
    setInstagram(data.socials?.instagram || '');
    setSpotify(data.socials?.spotify || '');
    setYoutube(data.socials?.youtube || '');
    setWebsite(data.socials?.website || '');
    setPortfolioUrl(data.portfolioUrl || '');
    setServicesList(Array.isArray(data.servicesList) ? data.servicesList : []);
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const id =
          profIdQuery ||
          (typeof window !== 'undefined'
            ? localStorage.getItem('guta_professional_id')
            : null);
        const email =
          typeof window !== 'undefined'
            ? localStorage.getItem('guta_professional_email')
            : null;

        let url = '/api/professionals/my-profile?';
        if (id) url += `id=${encodeURIComponent(id)}`;
        else if (email) url += `email=${encodeURIComponent(email)}`;
        else {
          setLoading(false);
          return;
        }

        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.professional) {
          populateState(data.professional);
        }
      } catch (err) {
        console.warn('Error cargando perfil profesional:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [profIdQuery]);

  const handleLookupByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim()) return;
    setLoading(true);
    setErrorToast(null);
    try {
      const res = await fetch(
        `/api/professionals/my-profile?email=${encodeURIComponent(
          lookupEmail.trim().toLowerCase()
        )}`
      );
      const data = await res.json();
      if (data.success && data.professional) {
        localStorage.setItem('guta_professional_id', data.professional.id);
        localStorage.setItem(
          'guta_professional_email',
          lookupEmail.trim().toLowerCase()
        );
        populateState(data.professional);
      } else {
        setErrorToast('No encontramos un perfil profesional con ese email.');
      }
    } catch {
      setErrorToast('Error al buscar tu perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prof?.id) return;
    setSaveLoading(true);
    setSuccessToast(null);
    setErrorToast(null);

    try {
      const res = await fetch('/api/professionals/my-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: prof.id,
          name: name.trim(),
          roleCategory,
          specialty: specialty.trim(),
          modality,
          city: city.trim(),
          province: province.trim(),
          bio: bio.trim(),
          shortBio: bio.trim().slice(0, 150),
          photoUrl: photoUrl.trim(),
          whatsapp: whatsapp.trim(),
          phone: phone.trim(),
          servicesList,
          portfolioUrl: portfolioUrl.trim(),
          socials: {
            instagram: instagram.trim(),
            spotify: spotify.trim(),
            youtube: youtube.trim(),
            website: website.trim(),
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.professional) {
        populateState(data.professional);
        setSuccessToast(
          '¡Tu perfil profesional y servicios se actualizaron en vivo!'
        );
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        throw new Error(data.error || 'No se pudo actualizar el perfil');
      }
    } catch (err: any) {
      setErrorToast(err.message || 'Error al guardar');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleFeaturedCheckout = async (
    paymentProvider: 'mercadopago' | 'mercadopago_qr' | 'paypal'
  ) => {
    if (!prof?.id) return;
    setCheckoutLoading(true);
    setErrorToast(null);

    try {
      const res = await fetch('/api/professionals/featured-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professionalId: prof.id,
          paymentProvider,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'No se pudo iniciar el pago');
      }

      if (paymentProvider === 'mercadopago_qr' && data.qrData) {
        setQrModalState({
          isOpen: true,
          qrData: data.qrData,
          staticPosQrImage: data.staticPosQrImage,
          initPoint: data.initPoint,
          professionalId: prof.id,
          amountArs: data.amountArs || PROFESSIONAL_FEATURED_PRICE_ARS,
          isInteroperableEmvco: data.isInteroperableEmvco,
        });
        setCheckoutLoading(false);
        return;
      }

      if (data.initPoint) {
        window.location.href = data.initPoint;
      }
    } catch (err: any) {
      setErrorToast(err.message || 'Error al conectar con la pasarela de pago.');
      setCheckoutLoading(false);
    }
  };

  const feat = prof?.featuredStatus;
  const catInfo = prof ? getProfessionalCategoryInfo(prof.roleCategory) : null;

  return (
    <div className="min-h-screen bg-[#111215] text-[#f3f1ec] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Mensajes de retorno de pago o bienvenida */}
        {welcomeStatus === 'courtesy' && (
          <div className="p-5 rounded-2xl bg-[#5ce487]/10 border border-[#5ce487]/40 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#5ce487] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-[#f3f1ec]">
                ¡Postulación publicada y Perfil Destacado Activado!
              </h4>
              <p className="text-xs text-[#a0d29f]">
                Tu perfil ya aparece al inicio de la sección Profesionales & Servicios Musicales. Desde este panel podés actualizar tus datos o extender tu destaque por 7 días adicionales cuando quieras.
              </p>
            </div>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="p-5 rounded-2xl bg-[#5ce487]/10 border border-[#5ce487]/40 flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#5ce487] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-[#f3f1ec]">
                ¡Pago Aprobado! Ya contás con 7 Días de Profesional Destacado Semanal
              </h4>
              <p className="text-xs text-[#a0d29f]">
                Tu perfil figura con insignia dorada en la cima del directorio de Profesionales & Servicios Musicales.
              </p>
            </div>
          </div>
        )}

        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262832] pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#e6cca0]">
              <Headphones className="w-4 h-4 text-[#d97d64]" />
              <span>Panel de Autogestión Profesional</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#f3f1ec]">
              {prof ? prof.name : 'Mi Perfil de Servicios Musicales'}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {prof && (
              <Link
                href={`/profesionales/${prof.slug || prof.id}`}
                className="px-3.5 py-2 rounded-xl bg-[#222530] hover:bg-[#2c303e] text-xs font-bold text-[#e6cca0] flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver mi Ficha Pública</span>
              </Link>
            )}
            {prof && (
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('guta_professional_id');
                  localStorage.removeItem('guta_professional_email');
                  setProf(null);
                }}
                className="px-3 py-2 rounded-xl bg-[#1c1d24] hover:bg-[#252730] text-xs text-[#aba79e] flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cambiar cuenta</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-12 rounded-2xl bg-[#16181f] border border-[#2a2d38] text-center text-sm text-[#e6cca0]">
            Cargando tu panel profesional...
          </div>
        ) : !prof ? (
          <div className="p-8 rounded-2xl bg-[#16181f] border border-[#2a2d38] max-w-lg mx-auto space-y-5">
            <div className="space-y-1 text-center">
              <h2 className="text-lg font-bold text-[#f3f1ec]">
                Ingresá a tu Panel de Profesional
              </h2>
              <p className="text-xs text-[#aba79e]">
                Ingresá el email con el que registraste tus servicios para gestionar tu perfil y tu destacado.
              </p>
            </div>
            <form onSubmit={handleLookupByEmail} className="space-y-3">
              <input
                type="email"
                required
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                placeholder="tuemail@ejemplo.com"
                className="w-full px-4 py-2.5 rounded-xl bg-[#111216] border border-[#2c2f3c] text-sm text-[#f3f1ec]"
              />
              {errorToast && (
                <p className="text-xs text-[#d97d64]">{errorToast}</p>
              )}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#d97d64] hover:bg-[#c96d54] text-[#121316] font-black text-xs cursor-pointer"
              >
                Acceder a Mi Panel
              </button>
            </form>
            <div className="pt-3 border-t border-[#262832] text-center">
              <Link
                href="/sumar-profesional"
                className="text-xs font-bold text-[#e6cca0] hover:underline"
              >
                ¿Aún no estás registrado? Registrate 100% Gratis →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Banner de Vigencia de Destacado (Cortesía 3 días o Pago 7 días) */}
            {feat && (
              <div
                className={`p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                  !feat.isFeaturedNow
                    ? 'bg-[#1c1d25] border-[#323646]'
                    : feat.isExpiringSoon
                      ? 'bg-[#d97d64]/15 border-[#d97d64]/60'
                      : 'bg-[#5ce487]/10 border-[#5ce487]/40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      !feat.isFeaturedNow
                        ? 'bg-[#262936] text-[#aba79e]'
                        : feat.isExpiringSoon
                          ? 'bg-[#d97d64]/25 text-[#d97d64]'
                          : 'bg-[#5ce487]/20 text-[#5ce487]'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-[#f3f1ec]">
                        {feat.countdownMessage}
                      </span>
                      {feat.statusBadgeLabel && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#e6cca0] text-[#121316]">
                          {feat.statusBadgeLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#aba79e]">
                      Activá o extendé tu <b>Destacado Semanal (7 días corridos)</b> por{' '}
                      <b className="text-[#e6cca0]">
                        ${PROFESSIONAL_FEATURED_PRICE_ARS.toLocaleString('es-AR')} ARS
                      </b>{' '}
                      (o <b>US$ {PROFESSIONAL_FEATURED_PRICE_USD}</b> vía PayPal) para mantener tu perfil primero en el directorio.
                    </p>
                  </div>
                </div>

                {/* Botones de Destacado Semanal (7 días) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleFeaturedCheckout('mercadopago_qr')}
                    disabled={checkoutLoading}
                    className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#1f2937] to-[#111827] hover:from-[#009ee3]/25 hover:to-[#00b489]/25 border border-[#009ee3]/60 text-xs font-bold text-[#f3f1ec] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>QR (Billeteras)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFeaturedCheckout('mercadopago')}
                    disabled={checkoutLoading}
                    className="px-3.5 py-2.5 rounded-xl bg-[#009ee3] hover:bg-[#0086c3] text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      MP ${PROFESSIONAL_FEATURED_PRICE_ARS.toLocaleString('es-AR')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFeaturedCheckout('paypal')}
                    disabled={checkoutLoading}
                    className="px-3.5 py-2.5 rounded-xl bg-[#FFC439] hover:bg-[#f2b324] text-xs font-bold text-[#121316] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>PayPal US${PROFESSIONAL_FEATURED_PRICE_USD}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Formulario de Edición + Vista Previa */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <form
                onSubmit={handleSave}
                className="lg:col-span-7 p-6 rounded-2xl bg-[#17181f] border border-[#2a2d38] space-y-4"
              >
                <h2 className="text-base font-bold text-[#f3f1ec] border-b border-[#262834] pb-3">
                  Editar Información & Servicios
                </h2>

                {successToast && (
                  <div className="p-3 rounded-xl bg-[#5ce487]/15 border border-[#5ce487]/40 text-xs font-bold text-[#5ce487]">
                    {successToast}
                  </div>
                )}
                {errorToast && (
                  <div className="p-3 rounded-xl bg-[#d97d64]/15 border border-[#d97d64]/40 text-xs font-bold text-[#d97d64]">
                    {errorToast}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Nombre Profesional / Sello
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2c2f3c] text-sm text-[#f3f1ec]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Rubro Principal
                    </label>
                    <select
                      value={roleCategory}
                      onChange={(e) =>
                        setRoleCategory(e.target.value as ProfessionalCategoryKey)
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2c2f3c] text-sm text-[#f3f1ec]"
                    >
                      {PROFESSIONAL_CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Especialidad / Instrumento
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2c2f3c] text-sm text-[#f3f1ec]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Modalidad
                    </label>
                    <select
                      value={modality}
                      onChange={(e) =>
                        setModality(e.target.value as ProfessionalModality)
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2c2f3c] text-sm text-[#f3f1ec]"
                    >
                      <option value="Presencial y Online">
                        Presencial y Online
                      </option>
                      <option value="Online">Online</option>
                      <option value="Presencial">Presencial</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2c2f3c] text-sm text-[#f3f1ec]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Provincia
                    </label>
                    <input
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2c2f3c] text-sm text-[#f3f1ec]"
                    />
                  </div>
                </div>

                {/* Servicios */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#aba79e]">
                    Servicios Ofrecidos
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={serviceInput}
                      onChange={(e) => setServiceInput(e.target.value)}
                      placeholder="Sumar otro servicio..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#111216] border border-[#2c2f3c] text-xs text-[#f3f1ec]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (serviceInput.trim()) {
                          setServicesList((prev) => [
                            ...prev,
                            serviceInput.trim(),
                          ]);
                          setServiceInput('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#e6cca0] text-[#121316] font-bold text-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {servicesList.map((srv) => (
                      <span
                        key={srv}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#222530] text-xs text-[#f3f1ec]"
                      >
                        <span>{srv}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setServicesList((prev) =>
                              prev.filter((s) => s !== srv)
                            )
                          }
                          className="text-[#aba79e] hover:text-[#d97d64] cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                    Descripción / Presentación
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2c2f3c] text-sm text-[#f3f1ec]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2c2f3c] text-sm text-[#f3f1ec]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Instagram
                    </label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2c2f3c] text-sm text-[#f3f1ec]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      URL Foto / Logo
                    </label>
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2c2f3c] text-sm text-[#f3f1ec]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Link Portfolio (YouTube / Spotify)
                    </label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#111216] border border-[#2c2f3c] text-sm text-[#f3f1ec]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full py-3 rounded-xl bg-[#e6cca0] hover:bg-[#d97d64] text-[#121316] font-black text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {saveLoading ? 'Guardando cambios...' : 'Guardar Cambios'}
                  </span>
                </button>
              </form>

              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#e6cca0] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#d97d64]" />
                  Vista Previa en Vivo
                </span>
                <div className="p-4 rounded-2xl bg-[#121316] border border-[#292b34]">
                  <ProfessionalCard
                    item={{
                      ...prof,
                      name,
                      roleCategory,
                      specialty,
                      modality,
                      city,
                      province,
                      bio,
                      shortBio: bio.slice(0, 150),
                      photoUrl,
                      whatsapp,
                      phone,
                      servicesList,
                      socials: {
                        instagram,
                        spotify,
                        youtube,
                        website,
                      },
                    }}
                    isPreview={true}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Pago QR Interoperable */}
        {qrModalState && prof && (
          <SponsorQrPaymentModal
            isOpen={qrModalState.isOpen}
            onClose={() => setQrModalState(null)}
            qrData={qrModalState.qrData}
            staticPosQrImage={qrModalState.staticPosQrImage}
            initPoint={qrModalState.initPoint}
            allianceId={qrModalState.professionalId}
            brandName={prof.name}
            planName={`Destaque Semanal 7 Días (${catInfo?.label || 'Profesional'})`}
            amountArs={qrModalState.amountArs}
            isInteroperableEmvco={qrModalState.isInteroperableEmvco}
            checkPaymentUrl={`/api/professionals/featured-checkout?professionalId=${encodeURIComponent(
              qrModalState.professionalId
            )}`}
            onPaymentConfirmed={(confirmedId) => {
              setQrModalState(null);
              window.location.href = `/panel-profesional?payment=success&id=${confirmedId}`;
            }}
          />
        )}
      </div>
    </div>
  );
};
