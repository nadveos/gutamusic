import { NextRequest, NextResponse } from 'next/server';
import { resolveLocaleFromCountryOrLang } from '@/lib/i18n/l10n';

export const dynamic = 'force-dynamic';

/**
 * GET /api/i18n/detect
 * Autodetecta el país e idioma del visitante mediante cabeceras de Cloudflare / Reverse Proxy y Accept-Language
 */
export async function GET(req: NextRequest) {
  const country =
    req.headers.get('cf-ipcountry') ||
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('x-country-code') ||
    req.headers.get('x-geo-country') ||
    '';

  const acceptLang = req.headers.get('accept-language') || '';
  const detectedLocale = resolveLocaleFromCountryOrLang(country, acceptLang);

  return NextResponse.json({
    success: true,
    country: country.toUpperCase() || null,
    locale: detectedLocale,
  });
}
