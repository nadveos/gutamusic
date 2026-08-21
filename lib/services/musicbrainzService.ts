// =========================================================================
// GUTA MÚSICA - Servicio MusicBrainz API & Efemérides de LATAM
// Consulta metadatos institucionales (IPI, ISNI, Cover Art Archive, Áreas)
// =========================================================================

export interface MusicBrainzArtist {
  id: string;
  name: string;
  sortName?: string;
  disambiguation?: string;
  country?: string;
  areaName?: string;
  cityName?: string;
  birthDate?: string;
  deathDate?: string;
  ipis?: string[];
  isnis?: string[];
  tags?: string[];
  aliases?: string[];
  photoUrl?: string;
}

export interface MusicBrainzEphemeris {
  day: number;
  month: number;
  year: number;
  title: string;
  description: string;
  category: 'nacimientos' | 'fallecimientos' | 'lanzamientos' | 'curiosidades' | 'folklore' | 'gardel';
  categoryLabel: string;
  source: string;
  sourceKey?: 'musicbrainz' | 'efe_eme' | 'crock' | 'folklore';
  impactBadge: string;
  imageUrl?: string;
  mbid?: string;
  country?: string;
  originCity?: string;
  ipi?: string;
}

// Configuración de User-Agent requerida por la API de MusicBrainz
const MB_USER_AGENT = 'GutaMusica/1.0.0 (https://guta.meapp.com.ar; contacto@guta.meapp.com.ar)';
const MB_BASE_URL = 'https://musicbrainz.org/ws/2';

// Cache en memoria para respetar el rate limit de MusicBrainz (1 req/seg)
const memoryCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 horas

let lastRequestTime = 0;

/**
 * Controla el rate limit de 1 segundo entre llamadas consecutivas a MusicBrainz
 */
async function rateLimitDelay(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1100) {
    const wait = 1100 - elapsed;
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  lastRequestTime = Date.now();
}

/**
 * Petición genérica con rate-limit y caché para MusicBrainz
 */
export async function fetchMusicBrainz<T = any>(endpoint: string, queryParams: Record<string, string> = {}): Promise<T | null> {
  const url = new URL(`${MB_BASE_URL}/${endpoint}`);
  url.searchParams.set('fmt', 'json');
  for (const [k, v] of Object.entries(queryParams)) {
    url.searchParams.set(k, v);
  }

  const cacheKey = url.toString();
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as T;
  }

  try {
    await rateLimitDelay();

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': MB_USER_AGENT,
        'Accept': 'application/json',
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      if (res.status === 429) {
        console.warn('⚠️ [MUSICBRAINZ API] Rate limit alcanzado (429). Esperando reintento...');
      }
      return null;
    }

    const data = await res.json();
    memoryCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL_MS });
    return data as T;
  } catch (err) {
    console.error('❌ [MUSICBRAINZ API ERROR]', err);
    return null;
  }
}

/**
 * Busca un artista en MusicBrainz por nombre y país
 */
export async function searchArtistMusicBrainz(artistName: string, countryCode: string = 'AR'): Promise<MusicBrainzArtist | null> {
  const query = `artist:"${artistName}" AND country:${countryCode}`;
  const result = await fetchMusicBrainz<{ artists: any[] }>('artist', { query, limit: '1' });

  if (!result || !result.artists || result.artists.length === 0) {
    // Intentar búsqueda más flexible sin comillas
    const flexResult = await fetchMusicBrainz<{ artists: any[] }>('artist', { query: `artist:${artistName}`, limit: '1' });
    if (!flexResult || !flexResult.artists || flexResult.artists.length === 0) {
      return null;
    }
    return normalizeMbArtist(flexResult.artists[0]);
  }

  return normalizeMbArtist(result.artists[0]);
}

/**
 * Obtiene los detalles completos de un artista por su MBID
 */
export async function getArtistDetailsByMBID(mbid: string): Promise<MusicBrainzArtist | null> {
  const data = await fetchMusicBrainz<any>(`artist/${mbid}`, {
    inc: 'url-rels+tags+aliases+ratings',
  });

  if (!data) return null;
  return normalizeMbArtist(data);
}

function normalizeMbArtist(raw: any): MusicBrainzArtist {
  return {
    id: raw.id,
    name: raw.name,
    sortName: raw['sort-name'],
    disambiguation: raw.disambiguation,
    country: raw.country,
    areaName: raw.area?.name,
    cityName: raw['begin-area']?.name,
    birthDate: raw['life-span']?.begin,
    deathDate: raw['life-span']?.end,
    ipis: raw.ipis || [],
    isnis: raw.isnis || [],
    tags: raw.tags?.map((t: any) => t.name) || [],
    aliases: raw.aliases?.map((a: any) => a.name) || [],
  };
}

/**
 * Puente SPARQL de Wikidata + MusicBrainz para efemérides exactas de LATAM
 * Permite buscar instantáneamente nacimientos y fallecimientos de músicos con MBID para un día/mes dado.
 */
export async function fetchLatamMusicEphemeridesFromWikidata(day: number, month: number): Promise<MusicBrainzEphemeris[]> {
  const cacheKey = `wikidata_mb_ephemerides_${day}_${month}`;
  const cached = memoryCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data as MusicBrainzEphemeris[];
  }

  // Países de LATAM: Argentina (Q414), Uruguay (Q77), Chile (Q298), Brasil (Q155), México (Q96), Colombia (Q739), Perú (Q419), Cuba (Q241), Venezuela (Q717), Bolivia (Q750), Paraguay (Q733)
  const latamCountriesFilter = 'VALUES ?country { wd:Q414 wd:Q77 wd:Q298 wd:Q155 wd:Q96 wd:Q739 wd:Q419 wd:Q241 wd:Q717 wd:Q750 wd:Q733 }';

  const query = `
    SELECT DISTINCT ?item ?itemLabel ?mbid ?birthDate ?deathDate ?countryLabel ?cityLabel ?image ?description WHERE {
      ${latamCountriesFilter}
      ?item wdt:P106 ?occ .
      FILTER(?occ IN (wd:Q177220, wd:Q639669, wd:Q753110, wd:Q488205, wd:Q36834)) # Músico, Cantante, Compositor, Cantautor
      ?item wdt:P27 ?country .
      OPTIONAL { ?item wdt:P434 ?mbid . } # MusicBrainz Artist ID
      OPTIONAL { ?item wdt:P19 ?city . }
      OPTIONAL { ?item wdt:P18 ?image . }
      OPTIONAL { ?item wdt:P569 ?birthDate . }
      OPTIONAL { ?item wdt:P570 ?deathDate . }
      OPTIONAL {
        ?item schema:description ?description .
        FILTER(LANG(?description) = "es")
      }
      
      FILTER(
        (BOUND(?birthDate) && MONTH(?birthDate) = ${month} && DAY(?birthDate) = ${day}) ||
        (BOUND(?deathDate) && MONTH(?deathDate) = ${month} && DAY(?deathDate) = ${day})
      )
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    LIMIT 60
  `;

  try {
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': MB_USER_AGENT,
        'Accept': 'application/sparql-results+json',
      },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      console.warn(`[WIKIDATA/MB SPARQL] Respuesta no OK: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const results: MusicBrainzEphemeris[] = [];
    const seenEventKeys = new Set<string>();

    for (const binding of data.results?.bindings || []) {
      const name = binding.itemLabel?.value?.trim();
      if (!name || name.startsWith('Q')) continue; // Ignorar entidades sin etiqueta legible

      const mbid = binding.mbid?.value;
      const country = binding.countryLabel?.value;
      const city = binding.cityLabel?.value;
      const imageUrl = binding.image?.value;
      const rawDesc = binding.description?.value || `Músico y compositor de ${country || 'Latinoamérica'}.`;

      const birth = binding.birthDate?.value;
      const death = binding.deathDate?.value;

      if (birth) {
        const birthDateObj = new Date(birth);
        if (birthDateObj.getUTCMonth() + 1 === month && birthDateObj.getUTCDate() === day) {
          const year = birthDateObj.getUTCFullYear();
          const eventKey = `${name.toLowerCase()}_nacimiento_${year}`;

          if (!seenEventKeys.has(eventKey)) {
            seenEventKeys.add(eventKey);
            results.push({
              day,
              month,
              year,
              title: `Nacimiento de ${name}`,
              description: `En ${year}, nace en ${city ? `${city}, ` : ''}${country || 'Latinoamérica'} ${name}. ${rawDesc}`,
              category: 'nacimientos',
              categoryLabel: 'Nacimiento',
              source: mbid ? 'MusicBrainz / Wikidata LATAM' : 'Wikidata LATAM',
              sourceKey: 'musicbrainz',
              impactBadge: country === 'Argentina' ? 'Figura Clave Nacional' : 'Ícono de LATAM',
              imageUrl: imageUrl ? imageUrl.replace('http://', 'https://') : undefined,
              mbid,
              country,
              originCity: city,
            });
          }
        }
      }

      if (death) {
        const deathDateObj = new Date(death);
        if (deathDateObj.getUTCMonth() + 1 === month && deathDateObj.getUTCDate() === day) {
          const year = deathDateObj.getUTCFullYear();
          const eventKey = `${name.toLowerCase()}_fallecimiento_${year}`;

          if (!seenEventKeys.has(eventKey)) {
            seenEventKeys.add(eventKey);
            results.push({
              day,
              month,
              year,
              title: `Fallecimiento de ${name}`,
              description: `En ${year}, fallece ${name}, referente de la música de ${country || 'la región'}. ${rawDesc}`,
              category: 'fallecimientos',
              categoryLabel: 'Fallecimiento',
              source: mbid ? 'MusicBrainz / Wikidata LATAM' : 'Wikidata LATAM',
              sourceKey: 'musicbrainz',
              impactBadge: 'Pérdida Histórica',
              imageUrl: imageUrl ? imageUrl.replace('http://', 'https://') : undefined,
              mbid,
              country,
              originCity: city,
            });
          }
        }
      }
    }

    memoryCache.set(cacheKey, { data: results, expiry: Date.now() + CACHE_TTL_MS });
    return results;
  } catch (err) {
    console.error('❌ [WIKIDATA/MB SPARQL ERROR]', err);
    return [];
  }
}

/**
 * Obtiene la carátula oficial en alta resolución desde el Cover Art Archive
 */
export function getCoverArtArchiveUrl(releaseMbid: string, size: '250' | '500' | '1200' = '500'): string {
  return `https://coverartarchive.org/release/${releaseMbid}/front-${size}`;
}
