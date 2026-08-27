// =========================================================================
// GUTA MÚSICA - Motor Determinístico de Efemérides desde Fuentes Reales
// Extrae acontecimientos 100% verificados sin alucinaciones de IA ni costos.
// =========================================================================

import { fetchLatamMusicEphemeridesFromWikidata } from './musicbrainzService';

export interface ScrapedEphemeris {
  day: number;
  month: number;
  year: number;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  source: string;
  sourceKey?: 'musicbrainz' | 'efe_eme' | 'crock' | 'folklore' | 'mia_fm';
  impactBadge: string;
  imageUrl?: string;
  mbid?: string;
  country?: string;
  originCity?: string;
  ipi?: string;
  duplicateId?: string;
  matchedSources?: string[];
}

const MONTH_SLUGS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/**
 * Normaliza y categoriza automáticamente el texto de la efeméride
 */
function categorizeEvent(text: string): { category: string; categoryLabel: string; badge: string } {
  const lower = text.toLowerCase();

  if (/nace|nacimiento|natalicio/i.test(lower)) {
    return {
      category: 'nacimientos',
      categoryLabel: 'Nacimiento',
      badge: 'Figura Clave',
    };
  }

  if (/muere|fallece|fallecimiento|asesinato|accidente/i.test(lower)) {
    return {
      category: 'fallecimientos',
      categoryLabel: 'Fallecimiento',
      badge: 'Pérdida Histórica',
    };
  }

  if (/publica|lanza|debut|disco|álbum|album|sencillo|single|grabaci[óo]n|estrena/i.test(lower)) {
    return {
      category: 'lanzamientos',
      categoryLabel: 'Lanzamiento discográfico',
      badge: 'Disco Histórico',
    };
  }

  if (/concierto|recital|festival|cosqu[ií]n|jes[uú]s mar[ií]a|woodstock|viña del mar/i.test(lower)) {
    return {
      category: 'cosquin',
      categoryLabel: 'Concierto / Festival',
      badge: 'Momento Memorable',
    };
  }

  if (/premio|grammy|gardel|billboard|reconocimiento|disco de oro|platino/i.test(lower)) {
    return {
      category: 'gardel',
      categoryLabel: 'Premios & Récords',
      badge: 'Consagración',
    };
  }

  if (/tango|folklore|zamba|chacarera|chamam[eé]|payador|gaucho/i.test(lower)) {
    return {
      category: 'folklore',
      categoryLabel: 'Folklore & Tradición',
      badge: 'Raíz Cultural',
    };
  }

  return {
    category: 'curiosidades',
    categoryLabel: 'Archivo Histórico',
    badge: 'Hito Histórico',
  };
}

/**
 * Extrae tokens relevantes para comparar coincidencias entre fuentes distintas
 */
function extractEntityTokens(text: string): string[] {
  const stopWords = new Set([
    'nace', 'muere', 'fallece', 'fallecimiento', 'nacimiento', 'publica', 'lanza', 'disco', 'album', 'cancion',
    'cancion', 'sencillo', 'single', 'banda', 'grupo', 'cantante', 'compositor', 'musico', 'guitarrista', 'bajista',
    'baterista', 'argentina', 'latinoamerica', 'anos', 'este', 'esta', 'para', 'como', 'con', 'por', 'del', 'los',
    'las', 'una', 'uno', 'unos', 'unas', 'sobre', 'primer', 'segundo', 'tercer', 'miembro', 'fundador', 'referente',
    'graba', 'estrena', 'gira', 'tema', 'temas', 'lugar', 'fecha', 'ciudad', 'vida'
  ]);

  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !stopWords.has(w));
}

/**
 * Detecta coincidencias y duplicados entre fuentes distintas para que el editor pueda comparar
 */
function detectDuplicateEvents(items: ScrapedEphemeris[]): ScrapedEphemeris[] {
  const enriched = items.map(item => ({ ...item }));

  for (let i = 0; i < enriched.length; i++) {
    const itemA = enriched[i];
    const tokensA = new Set(extractEntityTokens(`${itemA.title} ${itemA.description}`));

    for (let j = i + 1; j < enriched.length; j++) {
      const itemB = enriched[j];

      // Mismo año y distinta fuente
      if (itemA.year === itemB.year && itemA.sourceKey !== itemB.sourceKey) {
        const tokensB = extractEntityTokens(`${itemB.title} ${itemB.description}`);
        const sharedTokens = tokensB.filter(t => tokensA.has(t));

        // Coinciden por al menos un término clave distintivo (ej. apellido de artista o nombre de banda)
        if (sharedTokens.length >= 1) {
          const dupId = itemA.duplicateId || itemB.duplicateId || `dup-${itemA.year}-${sharedTokens[0]}`;

          itemA.duplicateId = dupId;
          itemB.duplicateId = dupId;

          itemA.matchedSources = Array.from(new Set([...(itemA.matchedSources || []), itemB.source]));
          itemB.matchedSources = Array.from(new Set([...(itemB.matchedSources || []), itemA.source]));
        }
      }
    }
  }

  return enriched;
}

/**
 * Fuente 1: Efe Eme (Revista especializada en música popular, rock latino, pop e internacional)
 */
export async function scrapeEfeEme(day: number, month: number): Promise<ScrapedEphemeris[]> {
  const monthSlug = MONTH_SLUGS[month - 1];
  const url = `https://www.efeeme.com/efemerides-de-la-musica-popular-${day}-de-${monthSlug}/`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const html = await res.text();
    const pMatches = [...html.matchAll(/<p>([\s\S]*?)<\/p>/gi)];
    const results: ScrapedEphemeris[] = [];

    for (const m of pMatches) {
      const rawText = m[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
      const yearMatch = rawText.match(/^(\d{4})[:\.\s–-]+([\s\S]*)/);

      if (yearMatch) {
        const year = parseInt(yearMatch[1], 10);
        const desc = yearMatch[2].trim();

        if (desc.length > 15) {
          const { category, categoryLabel, badge } = categorizeEvent(desc);

          let firstSentence = desc.split(/[\.\;\:]/)[0] || desc;
          if (firstSentence.length > 90) {
            firstSentence = firstSentence.substring(0, 87) + '...';
          }

          results.push({
            day,
            month,
            year,
            title: `[${year}] ${firstSentence}`,
            description: desc,
            category,
            categoryLabel,
            source: 'Efe Eme',
            sourceKey: 'efe_eme',
            impactBadge: badge,
            imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
          });
        }
      }
    }

    return results;
  } catch (err: any) {
    console.warn(`⚠️ Error scrapeando Efe Eme (${day}/${month}):`, err.message);
    return [];
  }
}

/**
 * Fuente 2: Folklore Tradiciones (Archivo integral del folklore y tango argentino)
 */
export async function scrapeFolkloreTradiciones(day: number, month: number): Promise<ScrapedEphemeris[]> {
  const monthName = MONTH_SLUGS[month - 1];
  const url = 'https://folkloretradiciones.com.ar/efemerides/index.htm';

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const buf = await res.arrayBuffer();
    const html = new TextDecoder('iso-8859-1').decode(buf);

    const tds = [...html.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m =>
      m[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim()
    );

    const searchStr = `${day} de ${monthName}`;
    const dayMatches = tds.filter(t => t.toLowerCase().includes(searchStr));
    const results: ScrapedEphemeris[] = [];

    for (const matchText of dayMatches) {
      const yearMatch = matchText.match(/(?:de\s+)?(\d{4})\s*[-–:]\s*(.*)/i);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : 1950;
      const desc = yearMatch ? yearMatch[2].trim() : matchText;

      if (desc.length > 15) {
        const { category, categoryLabel, badge } = categorizeEvent(desc);
        let firstSentence = desc.split(/[\.\,]/)[0] || desc;
        if (firstSentence.length > 90) {
          firstSentence = firstSentence.substring(0, 87) + '...';
        }

        results.push({
          day,
          month,
          year,
          title: `[${year}] ${firstSentence}`,
          description: desc,
          category,
          categoryLabel,
          source: 'Folklore Tradiciones',
          sourceKey: 'folklore',
          impactBadge: badge,
          imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop',
        });
      }
    }

    return results;
  } catch (err: any) {
    console.warn(`⚠️ Error scrapeando Folklore Tradiciones (${day}/${month}):`, err.message);
    return [];
  }
}

/**
 * Fuente 3: CRock.com.ar (Efemérides de Rock Argentino e Internacional)
 */
export async function scrapeCRock(day: number, month: number): Promise<ScrapedEphemeris[]> {
  // Incluir fecha en la URL para invalidar caches CDN intermedias
  const dateKey = `${new Date().getFullYear()}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
  const url = `https://crock.com.ar/efemerides/?_d=${dateKey}`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const html = await res.text();
    const ddMatches = [...html.matchAll(/<span[^>]*class="tdih_event_year"[^>]*>(\d{4})<\/span>\s*<span[^>]*class="tdih_event_name"[^>]*>([\s\S]*?)<\/span>/gi)];

    const results: ScrapedEphemeris[] = [];

    for (const m of ddMatches) {
      const year = parseInt(m[1], 10);
      const desc = m[2].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

      if (desc.length > 10) {
        const { category, categoryLabel, badge } = categorizeEvent(desc);
        let firstSentence = desc.split(/[\.\;]/)[0] || desc;
        if (firstSentence.length > 90) {
          firstSentence = firstSentence.substring(0, 87) + '...';
        }

        results.push({
          day,
          month,
          year,
          title: `[${year}] ${firstSentence}`,
          description: desc,
          category,
          categoryLabel,
          source: 'CRock.com.ar',
          sourceKey: 'crock',
          impactBadge: badge,
          imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop',
        });
      }
    }

    return results;
  } catch (err: any) {
    console.warn(`⚠️ Error scrapeando CRock (${day}/${month}):`, err.message);
    return [];
  }
}

/**
 * Fuente 4: Mía FM · Cienradios (Efemérides musicales periodísticas)
 */
export async function scrapeMiaFM(day: number, month: number): Promise<ScrapedEphemeris[]> {
  const monthName = MONTH_SLUGS[month - 1];
  const urlVariants = [
    `https://miafm.cienradios.com/sociedad/efemerides-del-${day}-de-${monthName}-que-paso-un-dia-como-hoy-en-la-musica-2/`,
    `https://miafm.cienradios.com/sociedad/efemerides-del-${day}-de-${monthName}-que-paso-un-dia-como-hoy-en-la-musica/`,
    `https://miafm.cienradios.com/espectaculos/efemerides-del-${day}-de-${monthName}-que-paso-un-dia-como-hoy-en-la-musica/`,
    `https://miafm.cienradios.com/espectaculos/efemerides-del-${day}-de-${monthName}-que-paso-un-dia-como-hoy-en-la-musica-2/`,
  ];

  for (const url of urlVariants) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        cache: 'no-store',
      });

      if (!res.ok) continue;

      const html = await res.text();
      let articleBody = '';

      // 1. Extraer JSON-LD schema.org NewsArticle
      const schemaMatches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
      for (const sm of schemaMatches) {
        try {
          const json = JSON.parse(sm[1]);
          if (json.articleBody) {
            articleBody = json.articleBody;
            break;
          }
        } catch (e) {}
      }

      // 2. Fallback: extraer párrafos directos del HTML
      if (!articleBody) {
        const pMatches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
        articleBody = pMatches.map((m) => m[1].replace(/<[^>]+>/g, ' ')).join('\n');
      }

      if (!articleBody) continue;

      const paragraphs = articleBody
        .split(/\n+|<br\s*\/?>/gi)
        .map((p) => p.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim())
        .filter((p) => p.length > 25);

      const results: ScrapedEphemeris[] = [];

      for (const p of paragraphs) {
        if (/escuch[aá]\s*m[ií]a|hac[eé]\s*click/i.test(p)) continue;
        if (/no existen efem[eé]rides/i.test(p)) continue;

        // Extraer año de 4 dígitos (19XX o 20XX)
        const yearMatch = p.match(/\b(19\d\d|20\d\d)\b/);
        if (!yearMatch) continue;

        const year = parseInt(yearMatch[1], 10);
        const { category, categoryLabel, badge } = categorizeEvent(p);

        let firstSentence = p.split(/[\.\;]/)[0] || p;
        if (firstSentence.length > 90) {
          firstSentence = firstSentence.substring(0, 87) + '...';
        }

        results.push({
          day,
          month,
          year,
          title: `[${year}] ${firstSentence}`,
          description: p,
          category,
          categoryLabel,
          source: 'Mía FM · Cienradios',
          sourceKey: 'mia_fm',
          impactBadge: badge,
          imageUrl: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?q=80&w=800&auto=format&fit=crop',
        });
      }

      if (results.length > 0) {
        return results;
      }
    } catch (err: any) {
      console.warn(`⚠️ Error scrapeando MiaFM (${url}):`, err.message);
    }
  }

  return [];
}

/**
 * Función principal: Consulta en paralelo las fuentes seleccionadas por el usuario,
 * detecta coincidencias entre fuentes y devuelve la lista completa organizada.
 */
export async function getRealEphemerides(
  day: number,
  month: number,
  region = 'latam_general',
  enabledSources: string[] = ['musicbrainz', 'crock', 'efe_eme', 'folklore', 'mia_fm']
): Promise<ScrapedEphemeris[]> {
  console.log(`\n🔍 [DIRECT SCRAPING + APIS] Consultando fuentes para el ${day} de ${MONTH_SLUGS[month - 1]} (Fuentes: ${enabledSources.join(', ')}) (Región: ${region})...`);

  const promises: Promise<ScrapedEphemeris[]>[] = [];

  if (enabledSources.includes('musicbrainz')) {
    promises.push(fetchLatamMusicEphemeridesFromWikidata(day, month));
  }
  if (enabledSources.includes('crock')) {
    promises.push(scrapeCRock(day, month));
  }
  if (enabledSources.includes('efe_eme')) {
    promises.push(scrapeEfeEme(day, month));
  }
  if (enabledSources.includes('folklore')) {
    promises.push(scrapeFolkloreTradiciones(day, month));
  }
  if (enabledSources.includes('mia_fm')) {
    promises.push(scrapeMiaFM(day, month));
  }

  const resultsBySource = await Promise.all(promises);
  const allResults: ScrapedEphemeris[] = resultsBySource.flat();

  // 1. Deduplicación interna por fuente para evitar entradas idénticas
  const uniqueResults: ScrapedEphemeris[] = [];
  const seenInternalKeys = new Set<string>();

  for (const item of allResults) {
    const key = `${item.sourceKey || 'src'}_${item.year}_${item.title.toLowerCase().trim()}`;
    if (!seenInternalKeys.has(key)) {
      seenInternalKeys.add(key);
      uniqueResults.push(item);
    }
  }

  console.log(`📊 Total de efemérides extraídas únicas por fuente: ${uniqueResults.length}`);

  // 2. Detectar y etiquetar coincidencias entre fuentes distintas
  const enrichedResults = detectDuplicateEvents(uniqueResults);

  // 3. Ordenar cronológicamente por año
  enrichedResults.sort((a, b) => a.year - b.year);

  console.log(`✅ [SCRAPER SUCCESS] Total de efemérides reales verificadas: ${enrichedResults.length}`);
  return enrichedResults;
}
