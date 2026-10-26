import { getServerAdminPb } from '../pocketbase';

export interface WeeklyFeaturedStatus {
  isExpired: boolean;
  daysElapsed: number; // 1 a 7
  daysRemaining: number; // 0 a 7
  startDateStr: string;
  expiryDateStr: string;
}

/**
 * Calcula el estado de vigencia de un artista semanal (7 días corridos incluyendo el día de inicio)
 */
export function getWeeklyFeaturedStatus(featuredOfWeekDate?: string): WeeklyFeaturedStatus {
  if (!featuredOfWeekDate) {
    const today = new Date();
    const expiry = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      isExpired: false,
      daysElapsed: 1,
      daysRemaining: 7,
      startDateStr: today.toISOString().split('T')[0],
      expiryDateStr: expiry.toISOString().split('T')[0],
    };
  }

  const start = new Date(featuredOfWeekDate);
  const now = new Date();

  // Si la fecha guardada es inválida
  if (isNaN(start.getTime())) {
    return {
      isExpired: false,
      daysElapsed: 1,
      daysRemaining: 7,
      startDateStr: new Date().toISOString().split('T')[0],
      expiryDateStr: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    };
  }

  const diffMs = now.getTime() - start.getTime();
  const diffDaysFloat = diffMs / (1000 * 60 * 60 * 24);

  // 7 días completos desde que se marcó (incluyendo el día de inicio)
  const isExpired = diffDaysFloat >= 7;
  const daysElapsed = Math.min(7, Math.max(1, Math.floor(diffDaysFloat) + 1));
  const daysRemaining = isExpired ? 0 : Math.max(0, 7 - Math.floor(diffDaysFloat));

  const expiry = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    isExpired,
    daysElapsed,
    daysRemaining,
    startDateStr: start.toISOString().split('T')[0],
    expiryDateStr: expiry.toISOString().split('T')[0],
  };
}

/**
 * Revisa todos los artistas con featuredOfWeek = true en PocketBase.
 * Desmarca automáticamente a aquellos cuyo período de 7 días haya expirado.
 * ⚠️ Los destacados principales (featured = true / consagrados) JAMÁS se tocan.
 */
export async function checkAndRotateWeeklyFeatured() {
  const pb = await getServerAdminPb();

  try {
    const weeklyArtists = await pb.collection('artists').getFullList<any>({
      filter: 'featuredOfWeek = true',
      requestKey: null,
    });

    if (!weeklyArtists || weeklyArtists.length === 0) {
      return { rotatedCount: 0, expiredArtists: [], activeArtists: [] };
    }

    const expiredArtists: { id: string; stageName: string; startDate: string }[] = [];
    const activeArtists: { id: string; stageName: string; daysRemaining: number }[] = [];

    for (const artist of weeklyArtists) {
      // Si fue marcado como de la semana pero no tenía fecha asignada, inicializarla hoy
      if (!artist.featuredOfWeekDate) {
        const todayIso = new Date().toISOString().split('T')[0];
        try {
          await pb.collection('artists').update(artist.id, {
            featuredOfWeekDate: todayIso,
          });
        } catch {}
        activeArtists.push({
          id: artist.id,
          stageName: artist.stageName,
          daysRemaining: 7,
        });
        continue;
      }

      const status = getWeeklyFeaturedStatus(artist.featuredOfWeekDate);

      if (status.isExpired) {
        // Expiró: desmarcar solo featuredOfWeek sin tocar featured principal
        try {
          await pb.collection('artists').update(artist.id, {
            featuredOfWeek: false,
            featuredOfWeekDate: '',
          });
          expiredArtists.push({
            id: artist.id,
            stageName: artist.stageName,
            startDate: artist.featuredOfWeekDate,
          });
        } catch (updateErr) {
          console.error(`❌ Error al desmarcar artista semanal expirado (${artist.stageName}):`, updateErr);
        }
      } else {
        activeArtists.push({
          id: artist.id,
          stageName: artist.stageName,
          daysRemaining: status.daysRemaining,
        });
      }
    }

    return {
      rotatedCount: expiredArtists.length,
      expiredArtists,
      activeArtists,
    };
  } catch (err: any) {
    console.error('❌ Error en checkAndRotateWeeklyFeatured:', err);
    return { rotatedCount: 0, expiredArtists: [], activeArtists: [], error: err.message };
  }
}
