import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { POCKETBASE_URL, getServerAdminPb } from '../../../../lib/pocketbase';

export const dynamic = 'force-dynamic';

/**
 * Obtiene una instancia autenticada con permisos de superusuario.
 * Primero intenta validar el token del admin que viene en la cookie de la petición.
 * Si no es válido o no está, recurre a las credenciales superuser del servidor (PB_EMAIL / PB_PASSWORD).
 */
async function getAuthenticatedAdminPb(): Promise<PocketBase | null> {
  // 1. Intentar validar la cookie del cliente en una instancia aislada
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      const clientPb = new PocketBase(POCKETBASE_URL);
      clientPb.autoCancellation(false);
      clientPb.authStore.loadFromCookie(cookieHeader);

      if (
        clientPb.authStore.isValid &&
        (clientPb.authStore.isSuperuser ||
          clientPb.authStore.isAdmin ||
          clientPb.authStore.record?.collectionName === '_superusers')
      ) {
        return clientPb;
      }
    }
  } catch {}

  // 2. Si no hay cookie de superuser en la request, usar la instancia autenticada del servidor
  try {
    const serverPb = await getServerAdminPb();
    if (
      serverPb.authStore.isValid &&
      (serverPb.authStore.isSuperuser ||
        serverPb.authStore.isAdmin ||
        serverPb.authStore.record?.collectionName === '_superusers')
    ) {
      return serverPb;
    }
  } catch (err) {
    console.warn('⚠️ Error al obtener server admin pb:', err);
  }

  return null;
}

/**
 * Extrae mensaje legible de error de PocketBase (incluyendo validaciones por campo)
 */
function formatPocketBaseError(err: any): string {
  let message = err?.message || 'Error procesando solicitud';
  if (err?.data?.data && typeof err.data.data === 'object') {
    const details = Object.entries(err.data.data)
      .map(([k, v]: [string, any]) => `${k}: ${v?.message || v?.code || v}`)
      .join(', ');
    if (details) message = `${message} (${details})`;
  } else if (err?.data?.message) {
    message = err.data.message;
  }
  return message;
}

/**
 * GET /api/admin/users
 * Lista todos los usuarios registrados en PocketBase con su artista asociado
 */
export async function GET() {
  try {
    const adminPb = await getAuthenticatedAdminPb();
    if (!adminPb) {
      return NextResponse.json(
        { success: false, error: 'No autorizado como superusuario' },
        { status: 401 }
      );
    }

    // 1. Obtener lista de usuarios
    let usersList: any[] = [];
    try {
      usersList = await adminPb.collection('users').getFullList({
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
      artistList = await adminPb.collection('artists').getFullList({
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
      { success: false, error: formatPocketBaseError(err) },
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
    const adminPb = await getAuthenticatedAdminPb();
    if (!adminPb) {
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

      const updated = await adminPb.collection('users').update(userId, {
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
        await adminPb.collection('users').requestPasswordReset(email.trim().toLowerCase());
        return NextResponse.json({
          success: true,
          message: `Correo de restablecimiento enviado exitosamente a ${email}.`,
        });
      } catch (resetErr: any) {
        return NextResponse.json({
          success: false,
          error: formatPocketBaseError(resetErr),
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

      await adminPb.collection('artists').update(artistId, {
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

      await adminPb.collection('artists').update(artistId, {
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

      if (password.length < 8) {
        return NextResponse.json(
          { success: false, error: 'La contraseña debe tener al menos 8 caracteres' },
          { status: 400 }
        );
      }

      // Verificar de antemano si el email ya está en uso
      try {
        const existing = await adminPb
          .collection('users')
          .getFirstListItem(`email = "${cleanEmail}"`);
        if (existing) {
          return NextResponse.json(
            { success: false, error: `Ya existe una cuenta con el correo ${cleanEmail}.` },
            { status: 400 }
          );
        }
      } catch (checkErr: any) {
        // 404 es lo esperado si no existe
        if (checkErr?.status && checkErr.status !== 404) {
          console.warn('Error al verificar duplicidad de email:', checkErr?.message);
        }
      }

      const newUser = await adminPb.collection('users').create({
        email: cleanEmail,
        password,
        passwordConfirm: password,
        name: name || cleanEmail.split('@')[0],
        verified: Boolean(verified),
      });

      if (artistId) {
        try {
          await adminPb.collection('artists').update(artistId, {
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
        const owned = await adminPb.collection('artists').getFullList({
          filter: `owner = "${userId}"`,
          requestKey: null,
        });
        for (const art of owned) {
          await adminPb.collection('artists').update(art.id, { owner: '' });
        }
      } catch {}

      await adminPb.collection('users').delete(userId);

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
      { success: false, error: formatPocketBaseError(err) },
      { status: err?.status || 500 }
    );
  }
}
