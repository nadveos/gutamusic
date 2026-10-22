import { NextRequest, NextResponse } from 'next/server';
import {
  extractSpotifyArtistId,
  searchSpotifyArtist,
  getSpotifyArtistDiscography,
} from '@/lib/services/spotifyService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spotifyUrl = '', stageName = '' } = body;

    if (!spotifyUrl && !stageName) {
      return NextResponse.json(
        { success: false, error: 'Proporcioná una URL de Spotify o el nombre del artista.' },
        { status: 400 }
      );
    }

    let spotifyArtistId = extractSpotifyArtistId(spotifyUrl);
    let officialArtist: any = null;

    // Si no se extrajo directamente de la URL, buscar por nombre
    if (!spotifyArtistId && stageName) {
      officialArtist = await searchSpotifyArtist(stageName);
      if (officialArtist?.id) {
        spotifyArtistId = officialArtist.id;
      }
    } else if (spotifyArtistId) {
      // Si tenemos el ID, podemos intentar buscar sus datos básicos
      officialArtist = await searchSpotifyArtist(stageName || spotifyArtistId);
    }

    if (!spotifyArtistId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No pudimos identificar un perfil válido de artista en Spotify con el enlace proporcionado.',
        },
        { status: 404 }
      );
    }

    // Traer discografía oficial desde Spotify Web API
    const discography = await getSpotifyArtistDiscography(spotifyArtistId);

    // Detección de discrepancias
    const discrepancies: string[] = [];
    if (stageName && officialArtist?.name) {
      const cleanUser = stageName.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const cleanSp = officialArtist.name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      if (cleanUser !== cleanSp) {
        discrepancies.push(
          `El nombre del artista ingresado ("${stageName}") difiere del nombre en el perfil oficial de Spotify ("${officialArtist.name}").`
        );
      }
    }

    if (discography.length === 0) {
      discrepancies.push(
        'El perfil de Spotify fue localizado pero no cuenta con álbumes o sencillos públicos disponibles.'
      );
    }

    return NextResponse.json({
      success: true,
      spotifyArtistId,
      officialArtistName: officialArtist?.name || stageName,
      officialSpotifyUrl: `https://open.spotify.com/artist/${spotifyArtistId}`,
      officialPhotoUrl: officialArtist?.photoUrl || '',
      discography,
      hasDiscrepancies: discrepancies.length > 0,
      discrepancies,
      summary: `Se vincularon exitosamente ${discography.length} lanzamientos de Spotify.`,
    });
  } catch (error: any) {
    console.error('Error en /api/artist-portal/sync-spotify:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al conectar con Spotify.' },
      { status: 500 }
    );
  }
}
