'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldCheck, HeartHandshake, Mail, X, CheckCircle2 } from 'lucide-react';
import { useL10n } from './I18nProvider';
import { SupportedLocale } from '../lib/i18n/l10n';

interface NoticeCopy {
  badge: string;
  title: string;
  paragraph1: string;
  paragraph2Highlight: string;
  paragraph2: string;
  supportLabel: string;
  acceptBtn: string;
}

const NOTICE_TRANSLATIONS: Record<SupportedLocale, NoticeCopy> = {
  es: {
    badge: 'Aviso Oficial de Transparencia & Comunidad',
    title: 'Difusión 100% Gratuita y Autogestiva',
    paragraph1:
      'GUTA MÚSICA se sostiene exclusivamente gracias a los aportes solidarios y voluntarios de visitantes, usuarios, artistas y profesionales que apoyan la cultura independiente.',
    paragraph2Highlight: 'Importante:',
    paragraph2:
      'NUNCA vamos a solicitar aportes de dinero para y por difusión, entrevistas, ni para incluirlos en la Playlist Oficial de GUTA MÚSICA en Spotify, ni por ningún concepto editorial.',
    supportLabel: 'Ante cualquier duda o consulta oficial, contactanos siempre en:',
    acceptBtn: 'Entendido, continuar al sitio',
  },
  en: {
    badge: 'Official Transparency & Community Notice',
    title: '100% Free & Community-Driven Music Platform',
    paragraph1:
      'GUTA MÚSICA is sustained exclusively through voluntary contributions from visitors, users, artists, and music professionals who support independent culture.',
    paragraph2Highlight: 'Important:',
    paragraph2:
      'We will NEVER ask for money for promotion, interviews, inclusion in the Official GUTA MÚSICA Spotify Playlist, or any other editorial concept.',
    supportLabel: 'If you have any questions or doubts, please contact our official support:',
    acceptBtn: 'Understood, continue to site',
  },
  pt: {
    badge: 'Aviso Oficial de Transparência & Comunidade',
    title: 'Difusão 100% Gratuita e Comunitária',
    paragraph1:
      'A GUTA MÚSICA se mantém exclusivamente com contribuições solidárias e voluntárias de visitantes, usuários, artistas e profissionais que apoiam a cultura independente.',
    paragraph2Highlight: 'Importante:',
    paragraph2:
      'NUNCA solicitaremos dinheiro para ou por divulgação, entrevistas, inclusão na Playlist Oficial da GUTA MÚSICA no Spotify ou por qualquer outro conceito editorial.',
    supportLabel: 'Em caso de qualquer dúvida, entre em contato com nosso suporte oficial:',
    acceptBtn: 'Entendi, continuar para o site',
  },
  fr: {
    badge: 'Avis Officiel de Transparence & Communauté',
    title: 'Diffusion 100% Gratuite et Indépendante',
    paragraph1:
      'GUTA MÚSICA est soutenue exclusivement par les contributions solidaires et volontaires des visiteurs, utilisateurs, artistes et professionnels.',
    paragraph2Highlight: 'Important :',
    paragraph2:
      "Nous ne demanderons JAMAIS d'argent pour la diffusion, les interviews, l'inclusion dans la Playlist Officielle GUTA MÚSICA sur Spotify ou tout autre concept éditorial.",
    supportLabel: 'En cas de doute, contactez notre support officiel :',
    acceptBtn: 'Compris, continuer vers le site',
  },
  it: {
    badge: 'Avviso Ufficiale di Trasparenza & Comunità',
    title: 'Diffusione 100% Gratuita e Indipendente',
    paragraph1:
      'GUTA MÚSICA si sostiene esclusivamente grazie ai contributi solidali e volontari di visitatori, utenti, artisti e professionisti della musica.',
    paragraph2Highlight: 'Importante:',
    paragraph2:
      'NON chiederemo MAI denaro per diffusione, interviste, inclusione nella Playlist Ufficiale di GUTA MÚSICA su Spotify o per qualsiasi altro concetto editoriale.',
    supportLabel: 'Per qualsiasi dubbio o segnalazione, contatta il nostro supporto ufficiale:',
    acceptBtn: 'Ho capito, continua sul sito',
  },
};

const STORAGE_KEY = 'guta_community_notice_seen_v1';
const EXPIRY_MS = 24 * 60 * 60 * 1000;

export const CommunityNoticeDialog: React.FC = () => {
  const pathname = usePathname();
  const { locale } = useL10n();
  const [visible, setVisible] = useState(false);

  const isExcluded = pathname?.startsWith('/admin');

  useEffect(() => {
    if (isExcluded || typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const ts = Number(raw);
        if (Number.isFinite(ts) && Date.now() - ts < EXPIRY_MS) {
          return;
        }
      }
    } catch {}

    const timer = setTimeout(() => {
      setVisible(true);
    }, 900);

    return () => clearTimeout(timer);
  }, [isExcluded]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {}
  };

  if (isExcluded || !visible) return null;

  const copy = NOTICE_TRANSLATIONS[locale] || NOTICE_TRANSLATIONS.es;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guta-integrity-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-[#181920] border border-[#343746] shadow-2xl p-6 sm:p-7 text-[#f3f1ec] space-y-5">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#23252f] hover:bg-[#2d303d] text-[#aba79e] hover:text-[#f3f1ec] transition-colors cursor-pointer"
          aria-label="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-11 h-11 rounded-xl bg-[#93a887]/15 border border-[#93a887]/35 text-[#93a887] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#93a887] bg-[#93a887]/10 px-2.5 py-0.5 rounded-full border border-[#93a887]/25">
              {copy.badge}
            </span>
            <h2
              id="guta-integrity-heading"
              className="text-lg sm:text-xl font-black text-[#f3f1ec] leading-snug"
            >
              {copy.title}
            </h2>
          </div>
        </div>

        <div className="space-y-3.5 text-xs sm:text-sm text-[#aba79e] leading-relaxed">
          <p className="flex items-start gap-2.5">
            <HeartHandshake className="w-4 h-4 text-[#e6cca0] shrink-0 mt-1" />
            <span>{copy.paragraph1}</span>
          </p>

          <div className="p-3.5 rounded-xl bg-[#221b1b] border border-[#d97d64]/40 text-[#f3f1ec] text-xs sm:text-[13px] leading-relaxed">
            <strong className="text-[#d97d64] uppercase tracking-wider mr-1.5">
              🛡️ {copy.paragraph2Highlight}
            </strong>
            <span>{copy.paragraph2}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#131419] border border-[#292b36] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-[#8c887f] text-[11px]">{copy.supportLabel}</span>
          <a
            href="mailto:soporte@guta.musica.ar"
            className="notranslate inline-flex items-center gap-1.5 font-bold text-[#e6cca0] hover:text-[#d97d64] transition-colors shrink-0"
          >
            <Mail className="w-3.5 h-3.5 text-[#d97d64]" />
            <span>soporte@guta.musica.ar</span>
          </a>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-[#d97d64] to-[#e6cca0] hover:opacity-95 text-[#151618] font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#d97d64]/20 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{copy.acceptBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
