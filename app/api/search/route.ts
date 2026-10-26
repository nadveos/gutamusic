import { NextRequest, NextResponse } from 'next/server';
import { MusicDataService } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get('q') || '').toLowerCase().trim();

    const [allArtists, allInterviews] = await Promise.all([
      MusicDataService.getArtists().catch(() => []),
      MusicDataService.getInterviews().catch(() => []),
    ]);

    if (!query) {
      // Si no hay query, devolver los artistas destacados y últimas entrevistas
      const featuredArtists = allArtists
        .filter((a) => a.featured || a.featuredOfWeek)
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          slug: a.slug,
          stageName: a.stageName,
          genres: a.genres || [],
          city: a.city,
          province: a.province,
          photoUrl: a.photoUrl,
        }));

      const recentInterviews = allInterviews.slice(0, 3).map((i) => ({
        id: i.id,
        slug: i.slug,
        title: i.title,
        artistName: i.artistName,
        thumbnailUrl: i.thumbnailUrl || i.artistPhoto,
      }));

      return NextResponse.json({
        artists: featuredArtists,
        interviews: recentInterviews,
      });
    }

    // Filtrar artistas que coincidan por nombre, género, provincia o ciudad
    const filteredArtists = allArtists
      .filter((a) => {
        const stage = (a.stageName || '').toLowerCase();
        const city = (a.city || '').toLowerCase();
        const province = (a.province || '').toLowerCase();
        const genres = (a.genres || []).map((g) => g.toLowerCase()).join(' ');
        const bio = (a.shortBio || '').toLowerCase();

        return (
          stage.includes(query) ||
          city.includes(query) ||
          province.includes(query) ||
          genres.includes(query) ||
          bio.includes(query)
        );
      })
      .slice(0, 8)
      .map((a) => ({
        id: a.id,
        slug: a.slug,
        stageName: a.stageName,
        genres: a.genres || [],
        city: a.city,
        province: a.province,
        photoUrl: a.photoUrl,
      }));

    // Filtrar entrevistas
    const filteredInterviews = allInterviews
      .filter((i) => {
        const title = (i.title || '').toLowerCase();
        const artist = (i.artistName || '').toLowerCase();
        return title.includes(query) || artist.includes(query);
      })
      .slice(0, 4)
      .map((i) => ({
        id: i.id,
        slug: i.slug,
        title: i.title,
        artistName: i.artistName,
        thumbnailUrl: i.thumbnailUrl || i.artistPhoto,
      }));

    return NextResponse.json({
      artists: filteredArtists,
      interviews: filteredInterviews,
    });
  } catch (error: any) {
    console.error('❌ Error en /api/search:', error);
    return NextResponse.json(
      { error: error?.message || 'Error en la búsqueda' },
      { status: 500 }
    );
  }
}
