import { NextRequest, NextResponse } from 'next/server';
import { searchArtistMusicBrainz, getArtistReleasesMusicBrainz } from '@/lib/services/musicbrainzService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function extractJson(text: string): any {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    const clean = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    try {
      return JSON.parse(clean);
    } catch (err) {}

    const objMatch = clean.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch (err) {}
    }
  }
  return null;
}

const SEARCH_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-1.5-flash',
];

async function callGeminiWithGrounding(prompt: string, apiKey: string) {
  for (const model of SEARCH_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(35000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) continue;

      const rawText = await response.text();
      let resultJson: any = {};
      try {
        resultJson = JSON.parse(rawText);
      } catch (e) {}

      const parts = resultJson?.candidates?.[0]?.content?.parts || [];
      const generatedContent = parts.map((p: any) => p.text || '').join('');
      const parsedData = extractJson(generatedContent);

      if (parsedData) {
        return {
          data: parsedData,
          model,
        };
      }
    } catch (err) {
      console.warn(`Error en ${model}:`, err);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { stageName, genres = [], city = '', province = '', country = 'Argentina', spotifyUrl = '' } = body;

    if (!stageName || !stageName.trim()) {
      return NextResponse.json({ success: false, error: 'stageName es obligatorio.' }, { status: 400 });
    }

    const artistQuery = stageName.trim();
    const locStr = [city, province, country].filter(Boolean).join(', ');
    const genresStr = Array.isArray(genres) ? genres.join(', ') : genres || 'Música Popular / Rock / Folklore';

    // 1. Consulta paralela a MusicBrainz
    let mbReleases: any[] = [];
    try {
      const countryCode = country.toLowerCase().includes('bolivia') ? 'BO' : 'AR';
      const mbArtist = await searchArtistMusicBrainz(artistQuery, countryCode);
      if (mbArtist?.id) {
        mbReleases = await getArtistReleasesMusicBrainz(mbArtist.id);
      }
    } catch (mbErr) {
      console.warn('MusicBrainz query warning:', mbErr);
    }

    // 2. Consulta a Google Gemini con Google Search Grounding en tiempo real
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    let geminiData: any = { discography: [], agenda: [], summary: '' };

    if (geminiKey) {
      const prompt = `Sos un investigador musical experto para GUTA MÚSICA (Argentina/LATAM).
Tu misión es investigar en la web en TIEMPO REAL la información oficial del artista o banda "${artistQuery}" (${locStr}, Géneros: ${genresStr}).

Buscá en Google, Spotify, Instagram, Passline, EntradaUno, Plateanet, AllAccess, Ticketek, YouTube y prensa cultural:
1. DISCOGRAFÍA: Lista de sus álbumes de estudio, sencillos y EPs más importantes o recientes con su año de lanzamiento, tipo ('album' | 'single' | 'ep' | 'live_album'), cantidad aproximada de temas y enlace a Spotify o YouTube si está disponible.
2. SHOWS & FECHAS EN VIVO: Próximos conciertos, presentaciones, peñas o festivales confirmados para los años 2024, 2025, 2026 o 2027. Incluí fecha en formato YYYY-MM-DD (o con hora), sala/teatro/espacio, ciudad, provincia y link a venta de tickets si existe (Passline, etc.).

Devolvé exclusivamente un JSON válido con esta estructura:
{
  "discography": [
    {
      "title": "Nombre del álbum o sencillo",
      "type": "album",
      "year": 2024,
      "coverUrl": "",
      "spotifyUrl": "",
      "tracksCount": 10
    }
  ],
  "agenda": [
    {
      "title": "Gira / Presentación oficial",
      "date": "2026-11-20 21:00",
      "venue": "Nombre del teatro o espacio",
      "city": "Ciudad",
      "province": "Provincia",
      "country": "Argentina",
      "isFree": false,
      "ticketPrice": "Entradas en boletería o Passline",
      "ticketUrl": ""
    }
  ],
  "summary": "Resumen conciso de 1 oración sobre los hallazgos encontrados."
}`;

      const geminiResult = await callGeminiWithGrounding(prompt, geminiKey);
      if (geminiResult?.data) {
        geminiData = geminiResult.data;
      }
    }

    // 3. Consolidar discografía (MusicBrainz + Gemini) evitando duplicados
    const consolidatedDiscography: any[] = [];
    const seenTitles = new Set<string>();

    const normalizeTitle = (t: string) =>
      t.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

    // Primero los de Gemini (que suelen tener links de spotify o ser más modernos)
    if (Array.isArray(geminiData.discography)) {
      for (const d of geminiData.discography) {
        if (!d.title) continue;
        const norm = normalizeTitle(d.title);
        if (!seenTitles.has(norm)) {
          seenTitles.add(norm);
          consolidatedDiscography.push({
            id: `disc-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: d.title.trim(),
            type: ['album', 'single', 'ep', 'live_album'].includes(d.type) ? d.type : 'album',
            year: Number(d.year) || new Date().getFullYear(),
            coverUrl: d.coverUrl || '',
            spotifyUrl: d.spotifyUrl || spotifyUrl || '',
            tracksCount: d.tracksCount ? Number(d.tracksCount) : undefined,
          });
        }
      }
    }

    // Luego complementar con MusicBrainz si hay lanzamientos no detectados
    for (const mb of mbReleases) {
      if (!mb.title) continue;
      const norm = normalizeTitle(mb.title);
      if (!seenTitles.has(norm)) {
        seenTitles.add(norm);
        consolidatedDiscography.push({
          id: `disc-mb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: mb.title.trim(),
          type: mb.type || 'album',
          year: Number(mb.year) || new Date().getFullYear(),
          coverUrl: mb.coverUrl || '',
          spotifyUrl: spotifyUrl || '',
        });
      }
    }

    // 4. Consolidar agenda
    const consolidatedAgenda: any[] = [];
    if (Array.isArray(geminiData.agenda)) {
      for (const ev of geminiData.agenda) {
        if (!ev.title || !ev.venue) continue;
        consolidatedAgenda.push({
          id: `ev-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: ev.title.trim(),
          date: ev.date ? String(ev.date).trim() : new Date().toISOString().split('T')[0],
          venue: ev.venue.trim(),
          city: (ev.city || city || 'Ciudad').trim(),
          province: (ev.province || province || 'Provincia').trim(),
          country: ev.country || country || 'Argentina',
          type: ev.type || 'recital',
          isFree: Boolean(ev.isFree),
          ticketPrice: ev.ticketPrice || (ev.isFree ? 'Entrada Libre y Gratuita' : 'Entradas en venta'),
          ticketUrl: ev.ticketUrl || '',
        });
      }
    }

    return NextResponse.json({
      success: true,
      artist: artistQuery,
      discography: consolidatedDiscography,
      agenda: consolidatedAgenda,
      summary: geminiData.summary || `Se encontraron ${consolidatedDiscography.length} lanzamientos y ${consolidatedAgenda.length} fechas en vivo.`,
      sources: {
        musicBrainzFound: mbReleases.length,
        geminiSearchUsed: Boolean(geminiKey),
      },
    });
  } catch (error: any) {
    console.error('Error en /api/ai/enrich-artist:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
