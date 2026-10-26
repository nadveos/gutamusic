import { NextRequest, NextResponse } from 'next/server';
import { checkAndRotateWeeklyFeatured } from '@/lib/services/featuredRotationService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/featured-rotation
 * Ejecuta la verificación de vencimiento de los 7 días para artistas destacados semanales.
 * Si ya pasaron los 7 días desde su marcado, los desmarca automáticamente en PocketBase.
 */
export async function GET(req: NextRequest) {
  try {
    const result = await checkAndRotateWeeklyFeatured();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error('❌ Error en cron featured-rotation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error en rotación semanal' },
      { status: 500 }
    );
  }
}
