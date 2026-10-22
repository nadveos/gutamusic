import { NextRequest, NextResponse } from 'next/server';
import { pb, ensureServerSuperUserAuth } from '@/lib/pocketbase';
import PocketBase from 'pocketbase';
import { POCKETBASE_URL } from '@/lib/pocketbase';

export const dynamic = 'force-dynamic';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Obtener usuario autenticado desde cookie
 */
async function getAuthenticatedUser(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || '';
  if (!cookieHeader) return null;

  const userPb = new PocketBase(POCKETBASE_URL);
  userPb.authStore.loadFromCookie(cookieHeader);

  if (!userPb.authStore.isValid || !userPb.authStore.model) {
    return null;
  }
  return userPb.authStore.model;
}

/**
 * GET /api/artist-portal/profile
 * Devuelve el perfil del artista asociado al usuario actual
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    await ensureServerSuperUserAuth();

    let artistRecord: any = null;
    try {
      // Buscar por campo owner o email
      artistRecord = await pb.collection('artists').getFirstListItem(
        `owner = "${user.id}" || contactEmail = "${user.email}" || email = "${user.email}"`
      );
    } catch (e: any) {
      // No existe todavía perfil de artista
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      artist: artistRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al obtener perfil' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/artist-portal/profile
 * Crea la ficha inicial de la banda con status: 'pending'
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const {
      stageName,
      realName = '',
      genres = ['Folklore'],
      city = '',
      province = '',
      country = 'Argentina',
      bio = '',
      shortBio = '',
      quotes = '',
      photoUrl = '',
      bannerUrl = '',
      socials = {},
      videos = [],
      discography = [],
      agenda = [],
      press = [],
      gallery = [],
      hasDiscrepancies = false,
      discrepanciesNotes = '',
    } = body;

    if (!stageName || !stageName.trim()) {
      return NextResponse.json(
        { success: false, error: 'El nombre de la banda o solista es obligatorio.' },
        { status: 400 }
      );
    }

    await ensureServerSuperUserAuth();

    // Comprobar que no exista ya un perfil creado por este usuario
    try {
      const existing = await pb.collection('artists').getFirstListItem(`owner = "${user.id}"`);
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Ya tenés un perfil creado. Podés editarlo directamente.' },
          { status: 400 }
        );
      }
    } catch {}

    const slug = generateSlug(stageName) + '-' + Math.random().toString(36).substring(2, 6);

    const artistData: any = {
      owner: user.id,
      contactEmail: user.email,
      slug,
      stageName: stageName.trim(),
      realName: realName.trim(),
      genres: Array.isArray(genres) ? genres : [genres],
      city: city.trim(),
      province: province.trim(),
      country: country.trim() || 'Argentina',
      bio: bio.trim(),
      shortBio: shortBio.trim() || bio.trim().slice(0, 160),
      quotes: quotes.trim(),
      photoUrl: photoUrl.trim() || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800',
      bannerUrl: bannerUrl.trim() || photoUrl.trim(),
      featured: false,
      socials,
      videos,
      discography,
      agenda,
      press,
      gallery,
      status: 'pending', // En espera de aprobación por el admin
      hasDiscrepancies: Boolean(hasDiscrepancies),
      adminNotes: discrepanciesNotes || '',
      createdDate: new Date().toISOString().split('T')[0],
    };

    let createdRecord: any = null;
    try {
      createdRecord = await pb.collection('artists').create(artistData);
    } catch (createErr: any) {
      console.error('Error al guardar en artists:', createErr);
      return NextResponse.json(
        { success: false, error: createErr?.message || 'Error al crear artista en la base de datos.' },
        { status: 500 }
      );
    }

    // Registrar también en applications para que aparezca en el panel de postulaciones
    try {
      await pb.collection('applications').create({
        stageName: stageName.trim(),
        contactName: user.name || stageName.trim(),
        email: user.email,
        phone: '',
        genres: Array.isArray(genres) ? genres : [genres],
        city,
        province,
        country,
        bio,
        socials,
        photoUrl: artistData.photoUrl,
        message: 'Postulación creada desde el nuevo Portal de Artistas.',
        status: 'pending',
        submittedAt: new Date().toISOString(),
      });
    } catch (appErr) {
      console.warn('Nota: application sync opcional:', appErr);
    }

    return NextResponse.json({
      success: true,
      message: '¡Perfil creado con éxito! Se encuentra en espera de aprobación.',
      artist: createdRecord,
    });
  } catch (error: any) {
    console.error('Error en POST /api/artist-portal/profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/artist-portal/profile
 * Edita la ficha existente del artista
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...fieldsToUpdate } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID de artista requerido.' }, { status: 400 });
    }

    await ensureServerSuperUserAuth();

    // Verificar que el usuario sea el dueño del artista
    const current = await pb.collection('artists').getOne(id);
    if (current.owner && current.owner !== user.id) {
      return NextResponse.json({ success: false, error: 'Permisos insuficientes para editar este artista.' }, { status: 403 });
    }

    // Si tiene discrepancias de Spotify, mantener o actualizar flag
    const updated = await pb.collection('artists').update(id, fieldsToUpdate);

    return NextResponse.json({
      success: true,
      message: '¡Cambios guardados con éxito!',
      artist: updated,
    });
  } catch (error: any) {
    console.error('Error en PUT /api/artist-portal/profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al actualizar artista.' },
      { status: 500 }
    );
  }
}
