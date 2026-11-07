'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  PROFESSIONAL_CATEGORIES,
  getProfessionalCategoryInfo,
} from '@/lib/constants/professionalCategories';
import { MusicProfessional, ProfessionalCategoryKey } from '@/lib/types';
import { ProfessionalFeaturedStatus } from '@/lib/services/professionalsService';
import {
  Headphones,
  Sparkles,
  Search,
  MapPin,
  MessageCircle,
  Globe,
  ExternalLink,
  CheckCircle2,
  SlidersHorizontal,
  UserPlus,
  LogIn,
  Laptop,
  Award,
} from 'lucide-react';
import { InstagramIcon, SpotifyIcon, YouTubeIcon } from '@/lib/socialUtils';

export interface EnrichedProfessional extends MusicProfessional {
  featuredStatus: ProfessionalFeaturedStatus;
}

export const ProfessionalCard: React.FC<{
  item: EnrichedProfessional;
  isPreview?: boolean;
}> = ({ item, isPreview = false }) => {
  const catInfo = getProfessionalCategoryInfo(item.roleCategory);
  const feat = item.featuredStatus;
  const isPaidFeatured = feat?.featuredType === 'paid' && feat.isFeaturedNow;
  const isCourtesyFeatured = feat?.featuredType === 'courtesy' && feat.isFeaturedNow;

  const getCleanWhatsappUrl = (rawWa?: string, rawPhone?: string, name?: string) => {
    const targetNumber = (rawWa || rawPhone || '').replace(/\D/g, '');
    if (!targetNumber) return null;
    const msg = encodeURIComponent(
      `Hola ${name || ''}, vi tu perfil profesional (${catInfo.label}) en GUTA MÚSICA y quería consultarte por tus servicios.`
    );
    return `https://wa.me/${targetNumber}?text=${msg}`;
  };

  const waUrl = getCleanWhatsappUrl(item.whatsapp, item.phone, item.name);

  return (
    <div
      className={`group rounded-2xl transition-all duration-300 p-5 flex flex-col justify-between relative ${
        isPaidFeatured
          ? 'bg-gradient-to-b from-[#26231b] via-[#1b1c23] to-[#131418] border-2 border-[#e6cca0] shadow-xl shadow-[#e6cca0]/10 ring-1 ring-[#e6cca0]/30'
          : isCourtesyFeatured
          ? 'bg-gradient-to-b from-[#231d1c] via-[#1a1b22] to-[#131418] border border-[#d97d64]/70 shadow-lg shadow-[#d97d64]/10'
          : 'bg-[#181920] border border-[#2a2d38] hover:border-[#e6cca0]/50 hover:shadow-xl'
      }`}
    >
      <div className="space-y-4">
        {/* Top Row: Badges de Rubro y Destacado */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.badgeColor}`}
          >
            {catInfo.label}
          </span>

          {isPaidFeatured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#e6cca0] text-[#121316] shadow-sm">
              ⭐ Destacado Semanal
            </span>
          )}

          {isCourtesyFeatured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#d97d64]/20 text-[#e6cca0] border border-[#d97d64]/50">
              ✨ Nuevo • Cortesía 3 Días
            </span>
          )}
        </div>

        {/* Header con Foto/Logo + Nombre + Especialidad */}
        <div className="flex items-start gap-3.5">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-[#111216] border border-[#2e313d] shrink-0">
            {item.photoUrl ? (
              <Image
                src={item.photoUrl}
                alt={item.name}
                fill
                sizes="64px"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#e6cca0]">
                <Headphones className="w-6 h-6" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-base font-black text-[#f3f1ec] group-hover:text-[#e6cca0] transition-colors truncate">
              {item.name}
            </h3>
            {item.specialty && (
              <p className="text-xs font-semibold text-[#e6cca0] line-clamp-1">
                {item.specialty}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#aba79e]">
              {(item.city || item.province) && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#d97d64]" />
                  <span>
                    {[item.city, item.province].filter(Boolean).join(', ')}
                  </span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#22242e] text-[#cfcbc4] text-[10px]">
                <Laptop className="w-2.5 h-2.5 text-[#5ce487]" />
                {item.modality}
              </span>
            </div>
          </div>
        </div>

        {/* Descripción breve */}
        {item.shortBio || item.bio ? (
          <p className="text-xs text-[#aba79e] line-clamp-3 leading-relaxed">
            {item.shortBio || item.bio}
          </p>
        ) : null}

        {/* Lista de servicios concretos */}
        {Array.isArray(item.servicesList) && item.servicesList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {item.servicesList.slice(0, 4).map((srv, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1f212b] border border-[#2d303e] text-[10px] text-[#cfcbc4]"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-[#5ce487] shrink-0" />
                <span className="truncate max-w-[180px]">{srv}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer de Acciones */}
      <div className="pt-3.5 mt-4 border-t border-[#262834] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {item.socials?.instagram && (
            <a
              href={
                item.socials.instagram.startsWith('http')
                  ? item.socials.instagram
                  : `https://instagram.com/${item.socials.instagram.replace(/^@/, '')}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-[#20222b] hover:bg-[#E1306C]/15 text-[#aba79e] hover:text-[#E1306C] border border-[#2d2f3b] transition-colors"
              title="Instagram"
            >
              <InstagramIcon className="w-3.5 h-3.5" />
            </a>
          )}
          {item.socials?.spotify && (
            <a
              href={item.socials.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-[#20222b] hover:bg-[#1DB954]/15 text-[#aba79e] hover:text-[#1DB954] border border-[#2d2f3b] transition-colors"
              title="Spotify"
            >
              <SpotifyIcon className="w-3.5 h-3.5" />
            </a>
          )}
          {item.socials?.youtube && (
            <a
              href={item.socials.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-[#20222b] hover:bg-[#FF0000]/15 text-[#aba79e] hover:text-[#FF0000] border border-[#2d2f3b] transition-colors"
              title="YouTube"
            >
              <YouTubeIcon className="w-3.5 h-3.5" />
            </a>
          )}
          {item.socials?.website && (
            <a
              href={
                item.socials.website.startsWith('http')
                  ? item.socials.website
                  : `https://${item.socials.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-[#20222b] hover:bg-[#2a2d3a] text-[#aba79e] hover:text-[#f3f1ec] border border-[#2d2f3b] transition-colors"
              title="Sitio Web"
            >
              <Globe className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#5ce487] border border-[#25D366]/40 text-xs font-bold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          )}

          {!isPreview && (
            <Link
              href={`/profesionales/${item.slug || item.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#242733] hover:bg-[#e6cca0] text-[#f3f1ec] hover:text-[#121316] text-xs font-bold transition-colors"
            >
              <span>Ver Ficha</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export const ProfessionalsDirectoryClient: React.FC<{
  initialProfessionals: EnrichedProfessional[];
}> = ({ initialProfessionals }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredList = useMemo(() => {
    return initialProfessionals.filter((p) => {
      const matchesCat =
        selectedCategory === 'all' ||
        p.roleCategory === selectedCategory ||
        (Array.isArray(p.secondaryCategories) &&
          p.secondaryCategories.includes(selectedCategory as ProfessionalCategoryKey));

      const matchesModality =
        selectedModality === 'all' ||
        p.modality === selectedModality ||
        p.modality === 'Presencial y Online';

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.specialty.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.province.toLowerCase().includes(q) ||
        p.servicesList.some((s) => s.toLowerCase().includes(q));

      return matchesCat && matchesModality && matchesSearch;
    });
  }, [initialProfessionals, selectedCategory, selectedModality, searchQuery]);

  const featuredProfessionals = useMemo(
    () => filteredList.filter((p) => p.featuredStatus?.isFeaturedNow),
    [filteredList]
  );

  return (
    <div className="min-h-screen bg-[#111215] text-[#f3f1ec] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Hero Header */}
        <div className="rounded-3xl bg-gradient-to-br from-[#1c1e27] via-[#161820] to-[#121318] border border-[#2d303e] p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#d97d64]/15 text-[#e6cca0] border border-[#d97d64]/40">
              <Headphones className="w-3.5 h-3.5 text-[#d97d64]" />
              <span>Red Federal de Profesionales & Servicios Musicales</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-[#f3f1ec] tracking-tight leading-tight">
              Sellos Independientes, Productores, DJ&apos;s, Docentes &{' '}
              <span className="text-[#e6cca0]">Músicos Sesionistas</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#aba79e] leading-relaxed">
              Conectá de forma directa con productores artísticos y musicales, sellos independientes, profesores de canto e instrumentos, armonizadores, DJ&apos;s y sesionistas de todo el país.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
            <Link
              href="/sumar-profesional"
              className="px-5 py-3 rounded-xl bg-[#d97d64] hover:bg-[#c96d54] text-[#121316] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#d97d64]/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Ofrecer mis Servicios (3 Días Destacado Gratis)</span>
            </Link>
            <Link
              href="/panel-profesional"
              className="px-5 py-2.5 rounded-xl bg-[#222530] hover:bg-[#2b2f3d] border border-[#353949] text-[#e6cca0] font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Acceso a Mi Panel Profesional</span>
            </Link>
          </div>
        </div>

        {/* Barra de Filtros por Rubro + Buscador */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#aba79e] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, instrumento, servicio (ej: mezcla, guitarra, canto, mastering, sello)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#17181f] border border-[#2c2f3c] text-xs sm:text-sm text-[#f3f1ec] placeholder-[#6e6b64] focus:outline-none focus:border-[#e6cca0]"
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#e6cca0] shrink-0 hidden sm:block" />
              {(['all', 'Presencial', 'Online'] as const).map((mod) => (
                <button
                  key={mod}
                  type="button"
                  onClick={() => setSelectedModality(mod)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    selectedModality === mod
                      ? 'bg-[#e6cca0] text-[#121316]'
                      : 'bg-[#17181f] text-[#aba79e] hover:text-white border border-[#2c2f3c]'
                  }`}
                >
                  {mod === 'all' ? 'Todas las Modalidades' : mod}
                </button>
              ))}
            </div>
          </div>

          {/* Píldoras de los 9 Rubros */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#d97d64] text-[#121316] shadow-md'
                  : 'bg-[#181a22] text-[#aba79e] hover:text-white border border-[#2b2e3b]'
              }`}
            >
              Todos los Rubros ({initialProfessionals.length})
            </button>
            {PROFESSIONAL_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#e6cca0] text-[#121316] shadow-md'
                      : 'bg-[#181a22] text-[#cfcbc4] hover:text-white border border-[#2b2e3b]'
                  }`}
                >
                  {cat.pluralLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Listado de Resultados */}
        {filteredList.length === 0 ? (
          <div className="rounded-3xl bg-[#161820] border border-[#2a2d3a] p-12 text-center space-y-4">
            <Award className="w-12 h-12 text-[#e6cca0] mx-auto opacity-80" />
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-[#f3f1ec]">
                Sé el primero en ofrecer tus servicios en este rubro
              </h3>
              <p className="text-xs text-[#aba79e]">
                Sumate ahora y recibí automáticamente <b>3 días de Destacado de Cortesía</b> en la parte superior del directorio.
              </p>
            </div>
            <Link
              href="/sumar-profesional"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#c96d54] text-[#121316] font-bold text-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Registrarme como Profesional Musical</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {featuredProfessionals.length > 0 && (
              <div className="flex items-center gap-2 text-xs font-bold text-[#e6cca0]">
                <Sparkles className="w-4 h-4 text-[#d97d64]" />
                <span>
                  Profesionales Destacados al inicio ({featuredProfessionals.length}) — seguidos por orden cronológico
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredList.map((item) => (
                <ProfessionalCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
