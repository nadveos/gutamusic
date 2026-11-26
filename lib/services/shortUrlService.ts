import { getServerAdminPb } from '../pocketbase';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.musica.ar';

// Caché en memoria en el servidor para evitar consultas repetidas a PocketBase
const serverShortLinkCache = new Map<string, { code: string; shortUrl: string; targetUrl: string }>();

function escapePbFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// Caracteres limpios para códigos cortos (sin caracteres confusos como 0/O, 1/l/I)
const ALPHABET = '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';

function generateRandomCode(length = 5): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
  }
  return result;
}

/**
 * Normaliza una URL para almacenar solo la ruta relativa si pertenece al sitio
 */
function normalizeTargetPath(url: string): string {
  if (!url) return '/';
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url);
      return parsed.pathname + parsed.search;
    }
  } catch {}
  return url.startsWith('/') ? url : `/${url}`;
}

/**
 * Obtiene o crea un link corto único para una URL dada
 */
export async function getOrCreateShortLink(params: {
  targetUrl: string;
  title?: string;
}): Promise<{ code: string; shortUrl: string; targetUrl: string }> {
  const targetPath = normalizeTargetPath(params.targetUrl);
  const cached = serverShortLinkCache.get(targetPath);
  if (cached) {
    return cached;
  }

  const pb = await getServerAdminPb();
  const safeTargetPath = escapePbFilterValue(targetPath);

  // 1. Verificar si ya existe un link acortado para esta misma ruta
  try {
    const existing = await pb.collection('short_links').getFirstListItem(`targetUrl="${safeTargetPath}"`, {
      requestKey: null,
    });
    if (existing && existing.code) {
      const result = {
        code: existing.code,
        shortUrl: `${SITE_URL}/g/${existing.code}`,
        targetUrl: targetPath,
      };
      serverShortLinkCache.set(targetPath, result);
      return result;
    }
  } catch {}

  // 2. Si no existe, generar un código nuevo que no colisione
  let code = generateRandomCode(5);
  let attempts = 0;

  while (attempts < 5) {
    try {
      await pb.collection('short_links').getFirstListItem(`code="${code}"`, { requestKey: null });
      // Si existe, probamos otro
      code = generateRandomCode(5);
      attempts++;
    } catch {
      // No existe, código disponible
      break;
    }
  }

  // 3. Crear el registro en PocketBase
  try {
    await pb.collection('short_links').create({
      code,
      targetUrl: targetPath,
      clicks: 0,
      title: params.title || '',
    });
  } catch (err: any) {
    console.error('❌ Error al guardar link corto en PocketBase:', err);
    // Fallback: si falla por base de datos, devolvemos el código igualmente para resolver
  }

  const result = {
    code,
    shortUrl: `${SITE_URL}/g/${code}`,
    targetUrl: targetPath,
  };
  serverShortLinkCache.set(targetPath, result);
  return result;
}

/**
 * Resuelve un código de link corto a su URL de destino final
 */
export async function resolveShortLink(code: string): Promise<string> {
  if (!code) return '/';

  const cleanCode = code.trim();
  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(cleanCode)) return '/';
  const safeCode = escapePbFilterValue(cleanCode);
  const pb = await getServerAdminPb();

  // 1. Buscar en la colección short_links
  try {
    const record = await pb.collection('short_links').getFirstListItem(`code="${safeCode}"`, {
      requestKey: null,
    });

    if (record && record.targetUrl) {
      // Incrementar contador de clics de forma asíncrona
      pb.collection('short_links')
        .update(record.id, {
          clicks: (record.clicks || 0) + 1,
        })
        .catch(() => {});

      return record.targetUrl;
    }
  } catch {}

  // 2. Fallbacks inteligentes: si el código es un ID directo o slug de artista
  try {
    const artist = await pb.collection('artists').getFirstListItem(`id="${safeCode}" || slug="${safeCode}"`, {
      requestKey: null,
    });
    if (artist && artist.slug) {
      return `/artistas/${artist.slug}`;
    }
  } catch {}

  // 3. Fallbacks inteligentes: si el código es un ID directo o slug de entrevista
  try {
    const interview = await pb.collection('interviews').getFirstListItem(`id="${safeCode}" || slug="${safeCode}"`, {
      requestKey: null,
    });
    if (interview && interview.slug) {
      return `/entrevistas/${interview.slug}`;
    }
  } catch {}

  return '/';
}
