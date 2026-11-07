'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PROFESSIONAL_CATEGORIES,
  getProfessionalCategoryInfo,
} from '@/lib/constants/professionalCategories';
import { ProfessionalCategoryKey, ProfessionalModality } from '@/lib/types';
import {
  ProfessionalCard,
  EnrichedProfessional,
} from '@/app/profesionales/ProfessionalsDirectoryClient';
import {
  Headphones,
  Sparkles,
  CheckCircle2,
  MessageCircle,
  Phone,
  Globe,
  Plus,
  X,
  AlertCircle,
  ArrowRight,
  Gift,
  ShieldCheck,
} from 'lucide-react';
import { InstagramIcon } from '@/lib/socialUtils';

export const SumarProfesionalClient: React.FC = () => {
  const router = useRouter();

  const [roleCategory, setRoleCategory] =
    useState<ProfessionalCategoryKey>('productor_musical');
  const [secondaryCategories, setSecondaryCategories] = useState<
    ProfessionalCategoryKey[]
  >([]);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [modality, setModality] =
    useState<ProfessionalModality>('Presencial y Online');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('Argentina');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [spotify, setSpotify] = useState('');
  const [youtube, setYoutube] = useState('');
  const [website, setWebsite] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  const [serviceInput, setServiceInput] = useState('');
  const [servicesList, setServicesList] = useState<string[]>([
    'Presupuesto sin cargo',
  ]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedCatInfo = getProfessionalCategoryInfo(roleCategory);

  const toggleSecondaryCategory = (key: ProfessionalCategoryKey) => {
    if (key === roleCategory) return;
    setSecondaryCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleAddService = () => {
    const trimmed = serviceInput.trim();
    if (!trimmed) return;
    if (!servicesList.includes(trimmed)) {
      setServicesList((prev) => [...prev, trimmed]);
    }
    setServiceInput('');
  };

  const handleRemoveService = (srv: string) => {
    setServicesList((prev) => prev.filter((s) => s !== srv));
  };

  const previewItem: EnrichedProfessional = {
    id: 'preview',
    slug: 'preview',
    name: name.trim() || 'Tu Nombre Artístico / Estudio / Sello',
    roleCategory,
    secondaryCategories,
    specialty: specialty.trim() || selectedCatInfo.placeholderSpecialty,
    modality,
    city: city.trim() || 'Tu Ciudad',
    province: province.trim() || 'Provincia',
    country: country.trim() || 'Argentina',
    bio:
      bio.trim() ||
      'Descripción de tu experiencia, equipamiento, metodología de clases o servicios musicales.',
    shortBio:
      bio.trim().slice(0, 150) ||
      'Descripción de tu experiencia, equipamiento, metodología de clases o servicios musicales.',
    servicesList,
    photoUrl: photoUrl.trim(),
    whatsapp: whatsapp.trim() || phone.trim(),
    phone: phone.trim(),
    email: email.trim(),
    socials: {
      instagram: instagram.trim(),
      spotify: spotify.trim(),
      youtube: youtube.trim(),
      website: website.trim(),
    },
    portfolioUrl: portfolioUrl.trim(),
    active: true,
    submittedAt: new Date().toISOString(),
    courtesyFeaturedUntil: new Date(
      Date.now() + 3 * 24 * 60 * 60 * 1000
    ).toISOString(),
    paidFeatured: false,
    featuredStatus: {
      isFeaturedNow: true,
      featuredType: 'courtesy',
      daysRemaining: 3,
      isExpiringSoon: false,
      expiryDateStr: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      statusBadgeLabel: '✨ Destacado Cortesía',
      countdownMessage: 'Te quedan 3 días de Destacado de Cortesía gratuito.',
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Por favor ingresá tu nombre profesional, estudio o sello.');
      return;
    }

    if (!email.trim()) {
      setErrorMessage('Por favor ingresá un email para tu cuenta de autogestión.');
      return;
    }

    if (!password || password.length < 8) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!whatsapp.trim() && !phone.trim() && !instagram.trim() && !website.trim()) {
      setErrorMessage(
        'Ingresá al menos una vía de contacto directo (WhatsApp, Teléfono, Instagram o Web).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          roleCategory,
          secondaryCategories,
          specialty: specialty.trim(),
          modality,
          city: city.trim(),
          province: province.trim(),
          country: country.trim() || 'Argentina',
          bio: bio.trim(),
          shortBio: bio.trim().slice(0, 150),
          servicesList,
          photoUrl: photoUrl.trim(),
          whatsapp: whatsapp.trim(),
          phone: phone.trim(),
          email: email.trim().toLowerCase(),
          password,
          socials: {
            instagram: instagram.trim(),
            spotify: spotify.trim(),
            youtube: youtube.trim(),
            website: website.trim(),
          },
          portfolioUrl: portfolioUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo completar el registro.');
      }

      if (data.professional?.id) {
        localStorage.setItem('guta_professional_id', data.professional.id);
        localStorage.setItem(
          'guta_professional_email',
          email.trim().toLowerCase()
        );
      }

      router.push(
        `/panel-profesional?welcome=courtesy&id=${data.professional.id}`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión. Intentá nuevamente.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111215] text-[#f3f1ec] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#d97d64]/15 text-[#e6cca0] border border-[#d97d64]/40">
            <Gift className="w-4 h-4 text-[#d97d64]" />
            <span>Registro 100% Gratis y Permanente en el Directorio Federal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#f3f1ec] tracking-tight leading-tight">
            Sumate al Directorio de{' '}
            <span className="text-[#e6cca0]">Profesionales & Servicios Musicales</span>
          </h1>
          <p className="text-sm sm:text-base text-[#aba79e]">
            Espacio diseñado para <b className="text-[#f3f1ec]">Sellos Independientes, Productores Artísticos y Musicales, DJ&apos;s, Profesores de Instrumento y Canto, Armonizadores, Músicos y Voces Sesionistas</b>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* PASO 1: ELEGIR RUBRO PRINCIPAL */}
          <section className="space-y-5">
            <div className="flex items-center gap-3 border-b border-[#262832] pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#d97d64] text-[#121316] font-black text-sm">
                1
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#f3f1ec]">
                  Seleccioná tu Rubro Principal
                </h2>
                <p className="text-xs text-[#aba79e]">
                  Elegí la categoría que mejor define tu actividad principal en la música.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {PROFESSIONAL_CATEGORIES.map((cat) => {
                const isSelected = roleCategory === cat.key;
                return (
                  <div
                    key={cat.key}
                    onClick={() => {
                      setRoleCategory(cat.key);
                      setSecondaryCategories((prev) =>
                        prev.filter((k) => k !== cat.key)
                      );
                    }}
                    className={`rounded-2xl p-4 cursor-pointer transition-all border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#25221a] to-[#171820] border-[#e6cca0] ring-2 ring-[#e6cca0] shadow-lg'
                        : 'bg-[#17181f] border-[#292c38] hover:border-[#3e4254]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cat.badgeColor}`}
                        >
                          {cat.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#e6cca0]" />
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-[#f3f1ec] pt-1">
                        {cat.pluralLabel}
                      </h3>
                      <p className="text-[11px] text-[#aba79e] leading-snug">
                        {cat.shortDescription}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rubros secundarios opcionales */}
            <div className="pt-2 space-y-2">
              <label className="block text-xs font-semibold text-[#aba79e]">
                ¿También ofrecés servicios en otro rubro complementario? (Opcional)
              </label>
              <div className="flex flex-wrap gap-2">
                {PROFESSIONAL_CATEGORIES.filter((c) => c.key !== roleCategory).map(
                  (cat) => {
                    const active = secondaryCategories.includes(cat.key);
                    return (
                      <button
                        type="button"
                        key={cat.key}
                        onClick={() => toggleSecondaryCategory(cat.key)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#e6cca0] text-[#121316] font-bold'
                            : 'bg-[#1b1d25] text-[#aba79e] hover:text-white border border-[#2c2f3c]'
                        }`}
                      >
                        {active ? `✓ ${cat.label}` : `+ ${cat.label}`}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </section>

          {/* PASO 2: DATOS DEL PERFIL & SERVICIOS */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-[#262832] pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#d97d64] text-[#121316] font-black text-sm">
                2
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#f3f1ec]">
                  Tu Perfil Profesional, Servicios & Portfolio
                </h2>
                <p className="text-xs text-[#aba79e]">
                  Detallá qué servicios brindás, tu instrumento o especialidad y vías de contacto.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Nombre Artístico / Profesional / Sello *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Estudio Sur / Juan Pérez"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Modalidad de Trabajo / Clases
                    </label>
                    <select
                      value={modality}
                      onChange={(e) =>
                        setModality(e.target.value as ProfessionalModality)
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                    >
                      <option value="Presencial y Online">
                        Presencial y Online (A distancia)
                      </option>
                      <option value="Online">100% Online / A distancia</option>
                      <option value="Presencial">Presencial</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                    Especialidad / Instrumentos / Enfoque *
                  </label>
                  <input
                    type="text"
                    required
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder={selectedCatInfo.placeholderSpecialty}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Ej: Córdoba / Salta / CABA"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
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
                      placeholder="Ej: Córdoba"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      País
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Argentina"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                    />
                  </div>
                </div>

                {/* Lista de Servicios */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[#aba79e]">
                    Servicios que ofrecés (agregá etiquetas rápidas)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={serviceInput}
                      onChange={(e) => setServiceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddService();
                        }
                      }}
                      placeholder="Ej: Grabación de sesión en 48hs, Clases personalizadas, Mezcla estéreo..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#17181d] border border-[#2c2e39] text-xs text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                    />
                    <button
                      type="button"
                      onClick={handleAddService}
                      className="px-3.5 py-2 rounded-xl bg-[#e6cca0] text-[#121316] font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Sumar</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {servicesList.map((srv) => (
                      <span
                        key={srv}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#20232e] border border-[#323646] text-xs text-[#f3f1ec]"
                      >
                        <span>{srv}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveService(srv)}
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
                    Descripción de tus Servicios, Experiencia y Equipamiento *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Contale a las bandas y colegas sobre tu trayectoria, qué incluye tu servicio, artistas con los que trabajaste o cómo son tus clases..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      URL de tu Foto o Logo
                    </label>
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Link de Portfolio (Video YouTube o Playlist Spotify)
                    </label>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://youtube.com/watch?v=... o link de Spotify"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      WhatsApp Profesional (Recomendado)
                    </label>
                    <div className="relative">
                      <MessageCircle className="w-4 h-4 text-[#25D366] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+54 9 387 ..."
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] focus:outline-none focus:border-[#25D366]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Instagram (@usuario o link)
                    </label>
                    <div className="relative">
                      <InstagramIcon className="w-4 h-4 text-[#E1306C] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="@tu_usuario"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] focus:outline-none focus:border-[#E1306C]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Canal de YouTube / Spotify (Opcional)
                    </label>
                    <input
                      type="url"
                      value={spotify}
                      onChange={(e) => setSpotify(e.target.value)}
                      placeholder="https://open.spotify.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                      Sitio Web / Linktree (Opcional)
                    </label>
                    <div className="relative">
                      <Globe className="w-4 h-4 text-[#aba79e] absolute left-3 top-3" />
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://..."
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vista Previa en Vivo */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#e6cca0] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#d97d64]" />
                  Vista Previa con tus 3 Días de Cortesía Activos
                </span>
                <p className="text-xs text-[#78746c]">
                  Así se verá tu tarjeta destacada apenas envíes tu postulación:
                </p>
                <div className="p-4 rounded-2xl bg-[#121316] border border-[#292b34]">
                  <ProfessionalCard item={previewItem} isPreview={true} />
                </div>
              </div>
            </div>
          </section>

          {/* PASO 3: CUENTA DE AUTOGESTIÓN Y ENVÍO */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-[#262832] pb-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#d97d64] text-[#121316] font-black text-sm">
                3
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#f3f1ec]">
                  Cuenta de Autogestión & Activación de Cortesía (3 Días)
                </h2>
                <p className="text-xs text-[#aba79e]">
                  Con tu email y contraseña podrás editar tu perfil cuando quieras y ver los días restantes de tu destacado.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-[#aba79e] mb-1">
                  Email de Acceso *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tuemail@ejemplo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#17181d] border border-[#2c2e39] text-sm text-[#f3f1ec] focus:outline-none focus:border-[#e6cca0]"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-[#d97d64]/10 border border-[#d97d64]/40 flex items-center gap-3 text-sm text-[#f3f1ec]">
                <AlertCircle className="w-5 h-5 text-[#d97d64] shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1d1e27] to-[#14151b] border border-[#2e313f] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5ce487]">
                  <Gift className="w-4 h-4" />
                  <span>Registro Gratuito + 3 Días de Destacado de Cortesía</span>
                </div>
                <h3 className="text-lg font-black text-[#f3f1ec]">
                  Publicación inmediata en el Directorio de Profesionales
                </h3>
                <p className="text-xs text-[#aba79e]">
                  Durante tus primeros 3 días aparecerás en las primeras posiciones de forma gratuita. Luego desde tu panel podrás contratar el <b>Destacado Semanal (7 días)</b> cuando lo desees.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-[#d97d64] hover:bg-[#c96d54] text-[#121316] font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#d97d64]/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Headphones className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Registrando tu perfil...'
                    : 'Registrate 100% Gratis'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        </form>
      </div>
    </div>
  );
};
