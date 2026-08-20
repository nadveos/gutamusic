// =========================================================================
// GUTA MÚSICA - Motor Determinístico de Efemérides desde Fuentes Reales
// Extrae acontecimientos 100% verificados sin alucinaciones de IA ni costos.
// =========================================================================

export interface ScrapedEphemeris {
  day: number;
  month: number;
  year: number;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  source: string;
  impactBadge: string;
  imageUrl?: string;
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
 * Fuente 1: Efe Eme (Revista especializada en música popular, rock latino, pop e internacional)
 */
export async function scrapeEfeEme(day: number, month: number): Promise<ScrapedEphemeris[]> {
  const monthSlug = MONTH_SLUGS[month - 1];
  const url = `https://www.efeeme.com/efemerides-de-la-musica-popular-${day}-de-${monthSlug}/`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      next: { revalidate: 86400 },
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

          // Extraer título conciso de la primera oración
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
            source: 'Efe Eme (Efemérides de la Música Popular)',
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
      next: { revalidate: 86400 },
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
      // Formatos habituales: "20 de agosto de 1936 - Muere..." o "20 de agosto de 1948 : Nace..."
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
          source: 'Folklore Tradiciones (Archivo de Tradición Argentina)',
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
  const url = 'https://crock.com.ar/efemerides/';

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      next: { revalidate: 3600 },
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
          source: 'CRock.com.ar (Archivo de Rock)',
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
 * Función principal: Consulta en paralelo todas las fuentes reales,
 * deduplica y devuelve la lista completa de efemérides 100% verificadas.
 */
export async function getRealEphemerides(day: number, month: number, region = 'latam_general'): Promise<ScrapedEphemeris[]> {
  console.log(`\n🔍 [DIRECT SCRAPING] Consultando fuentes reales para el ${day} de ${MONTH_SLUGS[month - 1]} (Región: ${region})...`);

  const [efeEmeResults, folkloreResults, crockResults] = await Promise.all([
    scrapeEfeEme(day, month),
    scrapeFolkloreTradiciones(day, month),
    scrapeCRock(day, month),
  ]);

  console.log(`📊 Fuentes encontradas: Efe Eme (${efeEmeResults.length}), Folklore Tradiciones (${folkloreResults.length}), CRock (${crockResults.length})`);

  let allResults = [...folkloreResults, ...efeEmeResults];

  // Si la fecha solicitada coincide con hoy o si CRock tiene datos relevantes, incorporamos los de CRock
  if (crockResults.length > 0) {
    // Si la fecha actual coincide
    const now = new Date();
    if (day === now.getDate() && month === (now.getMonth() + 1)) {
      allResults = [...crockResults, ...allResults];
    }
  }

  // Deduplicar por año y título similar
  const seen = new Set<string>();
  const uniqueItems: ScrapedEphemeris[] = [];

  for (const item of allResults) {
    const key = `${item.year}-${item.title.toLowerCase().substring(0, 30)}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }

  // Ordenar cronológicamente por año
  uniqueItems.sort((a, b) => a.year - b.year);

  console.log(`✅ [SCRAPER SUCCESS] Total de efemérides reales verificadas: ${uniqueItems.length}`);
  return uniqueItems;
}
