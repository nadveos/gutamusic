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
    const {
      stageName,
      genres = [],
      city = '',
      province = '',
      country = 'Argentina',
      spotifyUrl = '',
      mode = 'all', // 'all' | 'discography' | 'shows'
    } = body;

    if (!stageName || !stageName.trim()) {
      return NextResponse.json({ success: false, error: 'stageName es obligatorio.' }, { status: 400 });
    }

    const artistQuery = stageName.trim();
    const locStr = [city, province, country].filter(Boolean).join(', ');
    const genresStr = Array.isArray(genres) ? genres.join(', ') : genres || 'Música Popular / Rock / Folklore';

    // 1. Consulta oficial a Spotify Web API (si mode es 'all' o 'discography')
    let spotifyAlbums: any[] = [];
    let detectedSpotifyUrl = spotifyUrl.trim();
    let spotifyArtistId = extractSpotifyArtistId(detectedSpotifyUrl);

    if (mode !== 'shows') {
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
    }

    // 2. Consulta a MusicBrainz (si mode es 'all' o 'discography')
    let mbReleases: any[] = [];
    if (mode !== 'shows') {
      try {
        const countryCode = country.toLowerCase().includes('bolivia') ? 'BO' : 'AR';
        const mbArtist = await searchArtistMusicBrainz(artistQuery, countryCode);
        if (mbArtist?.id) {
          mbReleases = await getArtistReleasesMusicBrainz(mbArtist.id);
        }
      } catch (mbErr) {
        console.warn('MusicBrainz query warning:', mbErr);
      }
    }

    // 3. Consolidar discografía con Spotify oficial a la cabeza
    const consolidatedDiscography: any[] = [];
    const seenTitles = new Set<string>();

    const normalizeTitle = (t: string) =>
      t.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');

    for (const sp of spotifyAlbums) {
      if (!sp.title) continue;
      const norm = normalizeTitle(sp.title);
      if (!seenTitles.has(norm)) {
        seenTitles.add(norm);
        consolidatedDiscography.push(sp);
      }
    }

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

    return NextResponse.json({
      success: true,
      artist: artistQuery,
      spotifyArtistId: spotifyArtistId || null,
      discography: consolidatedDiscography,
      agenda: [],
      summary: `Se encontraron ${consolidatedDiscography.length} lanzamientos oficiales en Spotify (${spotifyAlbums.length} de Spotify Web API).`,
      sources: {
        spotifyAlbumsFound: spotifyAlbums.length,
        musicBrainzFound: mbReleases.length,
      },
    });
  } catch (error: any) {
    console.error('Error en /api/ai/enrich-artist:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
