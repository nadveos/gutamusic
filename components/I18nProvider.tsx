'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  SupportedLocale,
  SUPPORTED_LOCALES,
  L10N_DICTIONARIES,
  L10nStrings,
  LocaleMeta,
  resolveLocaleFromCountryOrLang,
} from '../lib/i18n/l10n';
import { Globe } from 'lucide-react';

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (newLocale: SupportedLocale) => void;
  t: L10nStrings;
  locales: LocaleMeta[];
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'es',
  setLocale: () => {},
  t: L10N_DICTIONARIES.es,
  locales: SUPPORTED_LOCALES,
});

export function useL10n() {
  return useContext(I18nContext);
}

const STORAGE_KEY = 'guta_locale';

function syncGoogTransCookie(targetLocale: SupportedLocale) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const host = window.location.hostname;

  if (targetLocale === 'es') {
    const paths = ['/', window.location.pathname];
    const segments = window.location.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      paths.push(`/${segments[0]}`);
    }
    const domains = ['', host, `.${host}`];
    for (const p of paths) {
      for (const d of domains) {
        const domainPart = d ? ` domain=${d};` : '';
        document.cookie = `googtrans=; path=${p};${domainPart} expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    }
  } else {
    const val = `/es/${targetLocale}`;
    document.cookie = `googtrans=${val}; path=/; SameSite=Lax`;
    if (host !== 'localhost') {
      document.cookie = `googtrans=${val}; path=/; domain=.${host}; SameSite=Lax`;
    }
  }
}

function triggerDomTranslation(targetLocale: SupportedLocale) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  syncGoogTransCookie(targetLocale);

  const selectEl = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
  if (selectEl) {
    selectEl.value = targetLocale === 'es' ? '' : targetLocale;
    selectEl.dispatchEvent(new Event('change'));
  }
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>('es');
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const scriptLoadedRef = useRef(false);

  // 1. Autodetectar idioma al entrar por primera vez (preferencia guardada -> Geo-IP / Timezone / Navegador)
  useEffect(() => {
    let isMounted = true;

    const initLocale = async () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
        if (saved && SUPPORTED_LOCALES.some((l) => l.code === saved)) {
          if (isMounted) {
            setLocaleState(saved);
            document.documentElement.lang = saved;
            if (!isAdmin && saved !== 'es') {
              triggerDomTranslation(saved);
            }
          }
          return;
        }
      } catch {}

      // Detección rápida inicial por navegador / zona horaria
      let initialGuess: SupportedLocale = 'es';
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        const navLang = navigator.language || (navigator.languages && navigator.languages[0]) || 'es';
        if (tz.includes('Sao_Paulo') || tz.includes('Fortaleza') || tz.includes('Manaus') || tz.includes('Lisbon')) {
          initialGuess = 'pt';
        } else if (tz.includes('Paris')) {
          initialGuess = 'fr';
        } else if (tz.includes('Rome')) {
          initialGuess = 'it';
        } else {
          initialGuess = resolveLocaleFromCountryOrLang(null, navLang);
        }
      } catch {}

      // Confirmar con Geo-IP del servidor (/api/i18n/detect)
      try {
        const res = await fetch('/api/i18n/detect', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.locale && SUPPORTED_LOCALES.some((l) => l.code === data.locale)) {
            initialGuess = data.locale as SupportedLocale;
          }
        }
      } catch {}

      if (isMounted) {
        setLocaleState(initialGuess);
        document.documentElement.lang = initialGuess;
        try {
          localStorage.setItem(STORAGE_KEY, initialGuess);
        } catch {}
        if (!isAdmin && initialGuess !== 'es') {
          triggerDomTranslation(initialGuess);
        }
      }
    };

    initLocale();
    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  // 2. Cargar motor silencioso de traducción DOM para contenido dinámico de la DB (bios, entrevistas, efemérides)
  useEffect(() => {
    if (isAdmin || typeof window === 'undefined') return;
    if (locale === 'es' && !scriptLoadedRef.current) return;

    if (!scriptLoadedRef.current) {
      scriptLoadedRef.current = true;
      (window as any).googleTranslateElementInit = () => {
        try {
          const g = (window as any).google;
          if (g?.translate?.TranslateElement) {
            new g.translate.TranslateElement(
              {
                pageLanguage: 'es',
                includedLanguages: 'es,en,pt,fr,it',
                autoDisplay: false,
              },
              'guta_hidden_translator'
            );
            setTimeout(() => {
              triggerDomTranslation(locale);
            }, 350);
          }
        } catch {}
      };

      const script = document.createElement('script');
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);
    } else {
      triggerDomTranslation(locale);
    }
  }, [locale, isAdmin]);

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      document.documentElement.lang = newLocale;
      try {
        localStorage.setItem(STORAGE_KEY, newLocale);
      } catch {}
      syncGoogTransCookie(newLocale);
      if (newLocale === 'es') {
        // Recargar limpiamente sin disparar change en Google Translate (que re-escribe la cookie)
        window.location.reload();
      } else {
        triggerDomTranslation(newLocale);
      }
    }
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t: L10N_DICTIONARIES[locale] || L10N_DICTIONARIES.es,
        locales: SUPPORTED_LOCALES,
      }}
    >
      {/* Ocultar cualquier barra superior o tooltip del motor de traducción DOM */}
      <style>{`
        .goog-te-banner-frame,
        .skiptranslate,
        #goog-gt-tt,
        .goog-te-balloon-frame,
        .goog-tooltip,
        .goog-tooltip:hover {
          display: none !important;
          visibility: hidden !important;
        }
        body {
          top: 0px !important;
          position: static !important;
        }
        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
        }
      `}</style>
      <div id="guta_hidden_translator" className="hidden" aria-hidden="true" />
      {children}
    </I18nContext.Provider>
  );
};

export const LanguageSwitcher: React.FC<{ variant?: 'desktop' | 'mobile' }> = ({
  variant = 'desktop',
}) => {
  const { locale, setLocale, locales } = useL10n();
  const [open, setOpen] = useState(false);
  const current = locales.find((l) => l.code === locale) || locales[0];

  if (variant === 'mobile') {
    return (
      <div className="notranslate flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#222329] border border-[#31333d]">
        <span className="text-xs font-semibold text-[#aba79e] flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-[#e6cca0]" />
          <span>Idioma / Language:</span>
        </span>
        <div className="flex items-center gap-1">
          {locales.map((item) => {
            const active = item.code === locale;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => setLocale(item.code)}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#d97d64] text-[#151618]'
                    : 'bg-[#18191e] text-[#aba79e] hover:text-[#f3f1ec]'
                }`}
                title={item.label}
              >
                {item.shortLabel}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="notranslate relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#222329] hover:bg-[#2a2c35] border border-[#31333d] text-xs font-bold text-[#f3f1ec] transition-colors cursor-pointer"
        title="Cambiar idioma / Change language"
      >
        <Globe className="w-3.5 h-3.5 text-[#e6cca0]" />
        <span>{current.shortLabel}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-[#1c1d22] border border-[#2f323d] shadow-2xl py-1.5 z-50">
            {locales.map((item) => {
              const active = item.code === locale;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setLocale(item.code);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#2a2c35] text-[#e6cca0] font-bold'
                      : 'text-[#aba79e] hover:bg-[#23252c] hover:text-[#f3f1ec]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{item.flag}</span>
                    <span>{item.label}</span>
                  </span>
                  <span className="text-[10px] font-mono opacity-75">{item.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
