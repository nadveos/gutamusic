import { NextRequest, NextResponse } from 'next/server';
import { pb, ensureServerSuperUserAuth } from '../../../../lib/pocketbase';

export const dynamic = 'force-dynamic';

/**
 * Helper para validar sesión de SuperUser
 */
async function authenticateSuperUser() {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      pb.authStore.loadFromCookie(cookieHeader);
    }
  } catch {}

  return await ensureServerSuperUserAuth();
}

/**
 * GET /api/admin/users
 * Lista todos los usuarios registrados en PocketBase con su artista asociado
 */
export async function GET() {
  try {
    const isAuthed = await authenticateSuperUser();
    if (!isAuthed) {
      return NextResponse.json(
        { success: false, error: 'No autorizado como superusuario' },
        { status: 401 }
      );
    }

    // 1. Obtener lista de usuarios
    let usersList: any[] = [];
    try {
      usersList = await pb.collection('users').getFullList({
        sort: '-created',
        requestKey: null,
      });
    } catch (uErr: any) {
      console.warn('⚠️ No se pudieron obtener usuarios:', uErr?.message);
      return NextResponse.json({ success: true, users: [], artists: [] });
    }

    // 2. Obtener lista de artistas para cruzar relación
    let artistList: any[] = [];
    try {
      artistList = await pb.collection('artists').getFullList({
        requestKey: null,
      });
    } catch (aErr: any) {
      console.warn('⚠️ No se pudieron obtener artistas:', aErr?.message);
    }

    // 3. Cruzar usuario con artista asociado (por owner id o contactEmail)
    const users = usersList.map((u: any) => {
      const linkedArtist = artistList.find(
        (a: any) =>
          a.owner === u.id ||
          (a.contactEmail && a.contactEmail.toLowerCase() === (u.email || '').toLowerCase())
      );

      return {
        id: u.id,
        email: u.email || '',
        name: u.name || '',
        verified: Boolean(u.verified),
        created: u.created ? u.created.split(' ')[0] : '',
        updated: u.updated ? u.updated.split(' ')[0] : '',
        avatar: u.avatar || '',
        artist: linkedArtist
          ? {
              id: linkedArtist.id,
              stageName: linkedArtist.stageName || 'Artista',
              slug: linkedArtist.slug || '',
              photoUrl: linkedArtist.photoUrl || '',
              status: linkedArtist.status || 'published',
              isExplicitOwner: linkedArtist.owner === u.id,
            }
          : null,
      };
    });

    const artists = artistList.map((a: any) => ({
      id: a.id,
      stageName: a.stageName || 'Sin Nombre',
      slug: a.slug || '',
      owner: a.owner || '',
      contactEmail: a.contactEmail || '',
      photoUrl: a.photoUrl || '',
    }));

    return NextResponse.json({
      success: true,
      users,
      artists,
    });
  } catch (err: any) {
    console.error('❌ Error en GET /api/admin/users:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Maneja acciones operativas: toggle_verified, request_password_reset, link_artist, unlink_artist, delete_user, create_user
 */
export async function POST(req: NextRequest) {
  try {
    const isAuthed = await authenticateSuperUser();
    if (!isAuthed) {
      return NextResponse.json(
        { success: false, error: 'No autorizado como superusuario' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Falta parámetro action' },
        { status: 400 }
      );
    }

    // 1. Activar / Desactivar verificación de email
    if (action === 'toggle_verified') {
      const { userId, verified } = body;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Falta userId' }, { status: 400 });
      }

      const updated = await pb.collection('users').update(userId, {
        verified: Boolean(verified),
      });

      return NextResponse.json({
        success: true,
        message: `Estado de verificación actualizado a ${Boolean(verified) ? 'Verificado' : 'No verificado'}.`,
        user: updated,
      });
    }

    // 2. Solicitar reseteo de contraseña
    if (action === 'request_password_reset') {
      const { email } = body;
      if (!email) {
        return NextResponse.json({ success: false, error: 'Falta email' }, { status: 400 });
      }

      try {
        await pb.collection('users').requestPasswordReset(email.trim().toLowerCase());
        return NextResponse.json({
          success: true,
          message: `Correo de restablecimiento enviado exitosamente a ${email}.`,
        });
      } catch (resetErr: any) {
        return NextResponse.json({
          success: false,
          error: resetErr?.message || 'No se pudo enviar el correo de restablecimiento.',
        });
      }
    }

    // 3. Vincular usuario a artista
    if (action === 'link_artist') {
      const { userId, artistId } = body;
      if (!userId || !artistId) {
        return NextResponse.json(
          { success: false, error: 'Falta userId o artistId' },
          { status: 400 }
        );
      }

      await pb.collection('artists').update(artistId, {
        owner: userId,
      });

      return NextResponse.json({
        success: true,
        message: 'Artista vinculado exitosamente a este usuario.',
      });
    }

    // 4. Desvincular artista
    if (action === 'unlink_artist') {
      const { artistId } = body;
      if (!artistId) {
        return NextResponse.json({ success: false, error: 'Falta artistId' }, { status: 400 });
      }

      await pb.collection('artists').update(artistId, {
        owner: '',
      });

      return NextResponse.json({
        success: true,
        message: 'Artista desvinculado.',
      });
    }

    // 5. Crear usuario desde Admin
    if (action === 'create_user') {
      const { email, password, name, verified = true, artistId } = body;
      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'Email y contraseña requeridos' },
          { status: 400 }
        );
      }

      const cleanEmail = email.trim().toLowerCase();
      const newUser = await pb.collection('users').create({
        email: cleanEmail,
        password,
        passwordConfirm: password,
        name: name || cleanEmail.split('@')[0],
        verified: Boolean(verified),
      });

      if (artistId) {
        try {
          await pb.collection('artists').update(artistId, {
            owner: newUser.id,
          });
        } catch (linkErr) {
          console.warn('Could not auto-link artist:', linkErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Usuario creado exitosamente.',
        user: newUser,
      });
    }

    // 6. Eliminar usuario
    if (action === 'delete_user') {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Falta userId' }, { status: 400 });
      }

      // Desvincular cualquier artista que tuviese a este usuario como owner
      try {
        const owned = await pb.collection('artists').getFullList({
          filter: `owner = "${userId}"`,
          requestKey: null,
        });
        for (const art of owned) {
          await pb.collection('artists').update(art.id, { owner: '' });
        }
      } catch {}

      await pb.collection('users').delete(userId);

      return NextResponse.json({
        success: true,
        message: 'Usuario eliminado correctamente.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Acción no reconocida' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('❌ Error en POST /api/admin/users:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error procesando solicitud' },
      { status: 500 }
    );
  }
}
