import { NextRequest, NextResponse } from 'next/server';
import { searchArtistMusicBrainz, getArtistReleasesMusicBrainz } from '@/lib/services/musicbrainzService';
import {
  extractSpotifyArtistId,
  searchSpotifyArtist,
  getSpotifyArtistDiscography,
} from '@/lib/services/spotifyService';

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
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
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

    // 1. Consulta oficial a Spotify Web API (Máxima prioridad y fidelidad)
    let spotifyAlbums: any[] = [];
    let detectedSpotifyUrl = spotifyUrl.trim();
    let spotifyArtistId = extractSpotifyArtistId(detectedSpotifyUrl);

    if (!spotifyArtistId) {
      try {
        const spSearch = await searchSpotifyArtist(artistQuery);
        if (spSearch?.id) {
          spotifyArtistId = spSearch.id;
          if (!detectedSpotifyUrl) detectedSpotifyUrl = spSearch.url;
        }
      } catch (spSearchErr) {
        console.warn('Spotify search warning:', spSearchErr);
      }
    }

    if (spotifyArtistId) {
      try {
        spotifyAlbums = await getSpotifyArtistDiscography(spotifyArtistId);
      } catch (spAlbumErr) {
        console.warn('Spotify albums fetch warning:', spAlbumErr);
      }
    }

    // 2. Consulta a MusicBrainz (complementaria)
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

    // 3. Consulta a Google Gemini con Google Search Grounding en tiempo real para Shows y Fechas
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    let geminiData: any = { discography: [], agenda: [], summary: '' };

    if (geminiKey) {
      const spotifyContext = detectedSpotifyUrl
        ? `Perfil oficial de Spotify: ${detectedSpotifyUrl}`
        : '';

      const prompt = `Sos un investigador musical experto para GUTA MÚSICA (Argentina/LATAM).
Tu misión es investigar en la web en TIEMPO REAL la información del artista o banda "${artistQuery}" (${locStr}, Géneros: ${genresStr}).
${spotifyContext}

Instrucciones específicas:
1. PRÓXIMOS SHOWS, RECITALES Y GIRAS (PRIORIDAD ALTA):
Buscá las fechas de conciertos y giras oficiales confirmadas en:
- El perfil de Spotify del artista (sección "De gira" / "Conciertos" / "On Tour").
- Carteleras y plataformas de tickets: Passline, EntradaUno, Plateanet, AllAccess, Songkick, Bandsintown, Eventim, Ticketmaster, Queen's Disco, Instagram oficial.
- Extraé todas las fechas confirmadas (tanto en Argentina, Bolivia, España, Alemania o giras internacionales).
- Incluí: fecha (formato YYYY-MM-DD o con hora si está disponible), nombre del recinto o sala (ej: "Queen's Disco", "Staufenstraße 1", "Teatro Ópera"), ciudad, provincia/país, precio o tipo de entrada y enlace a tickets si existe.

2. DISCOGRAFÍA ADICIONAL:
Si hay sencillos o producciones muy recientes de 2024, 2025 o 2026 que puedan complementar el catálogo.

Devolvé exclusivamente un JSON válido con esta estructura:
{
  "discography": [
    {
      "title": "Nombre del álbum o sencillo",
      "type": "album",
      "year": 2026,
      "coverUrl": "",
      "spotifyUrl": "",
      "tracksCount": 10
    }
  ],
  "agenda": [
    {
      "title": "Gira o presentación en vivo",
      "date": "2026-11-06 23:00",
      "venue": "Queen's Disco...",
      "city": "Cornellà de Llobregat",
      "province": "Barcelona",
      "country": "España",
      "isFree": false,
      "ticketPrice": "Entradas en venta",
      "ticketUrl": ""
    }
  ],
  "summary": "Resumen conciso de 1 oración sobre los hallazgos."
}`;

      const geminiResult = await callGeminiWithGrounding(prompt, geminiKey);
      if (geminiResult?.data) {
        geminiData = geminiResult.data;
      }
    }

    // 4. Consolidar discografía con Spotify a la cabeza
    const consolidatedDiscography: any[] = [];
    const seenTitles = new Set<string>();

    const normalizeTitle = (t: string) =>
      t.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

    // Primero: Discografía oficial directa de Spotify
    for (const sp of spotifyAlbums) {
      if (!sp.title) continue;
      const norm = normalizeTitle(sp.title);
      if (!seenTitles.has(norm)) {
        seenTitles.add(norm);
        consolidatedDiscography.push(sp);
      }
    }

    // Segundo: Incorporar de Gemini lo que no estuviera ya en Spotify
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
            spotifyUrl: d.spotifyUrl || detectedSpotifyUrl || '',
            tracksCount: d.tracksCount ? Number(d.tracksCount) : undefined,
          });
        }
      }
    }

    // Tercero: Complementar con MusicBrainz si hubiera algún disco histórico faltante
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
          spotifyUrl: detectedSpotifyUrl || '',
        });
      }
    }

    // 5. Consolidar agenda de shows y giras
    const consolidatedAgenda: any[] = [];
    const seenShowKeys = new Set<string>();

    if (Array.isArray(geminiData.agenda)) {
      for (const ev of geminiData.agenda) {
        if (!ev.title && !ev.venue) continue;
        const eventTitle = ev.title || `${artistQuery} en Vivo`;
        const venueName = ev.venue || 'Teatro / Espacio';
        const key = `${normalizeTitle(eventTitle)}_${ev.date}_${normalizeTitle(venueName)}`;

        if (!seenShowKeys.has(key)) {
          seenShowKeys.add(key);
          consolidatedAgenda.push({
            id: `ev-ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: eventTitle.trim(),
            date: ev.date ? String(ev.date).trim() : new Date().toISOString().split('T')[0],
            venue: venueName.trim(),
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
    }

    return NextResponse.json({
      success: true,
      artist: artistQuery,
      spotifyArtistId: spotifyArtistId || null,
      discography: consolidatedDiscography,
      agenda: consolidatedAgenda,
      summary: geminiData.summary || `Se encontraron ${consolidatedDiscography.length} lanzamientos en Spotify/MusicBrainz y ${consolidatedAgenda.length} fechas en vivo.`,
      sources: {
        spotifyAlbumsFound: spotifyAlbums.length,
        musicBrainzFound: mbReleases.length,
        geminiSearchUsed: Boolean(geminiKey),
      },
    });
  } catch (error: any) {
    console.error('Error en /api/ai/enrich-artist:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
