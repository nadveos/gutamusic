import { NextRequest, NextResponse } from 'next/server';
import { checkAndRotateWeeklyFeatured } from '@/lib/services/featuredRotationService';
import { rotateOfficialSpotifyPlaylist } from '@/lib/services/spotifyPlaylistRotationService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/featured-rotation
 * 1. Ejecuta la verificación de vencimiento de los 7 días para artistas destacados semanales.
 * 2. Ejecuta la rotación automática de artistas en la Playlist Oficial de GUTA MÚSICA en Spotify
 *    (#1 Prioridad Fija: Raúl Domingo + rotación de artistas del sitio + Carlos Yoel Moreno protegido).
 */
export async function GET(req: NextRequest) {
  try {
    const result = await checkAndRotateWeeklyFeatured();
    const spotifyPlaylistRotation = await rotateOfficialSpotifyPlaylist().catch((err: any) => ({
      success: false,
      error: err?.message || 'Error al rotar playlist oficial de Spotify',
    }));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
      spotifyPlaylistRotation,
    });
  } catch (error: any) {
    console.error('❌ Error en cron featured-rotation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error en rotación semanal' },
      { status: 500 }
    );
  }
}
