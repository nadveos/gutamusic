import { NextRequest, NextResponse } from 'next/server';
import { pb, ensureServerSuperUserAuth } from '../../../../lib/pocketbase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/applications
 * Lista todas las postulaciones usando auth de superuser para garantizar acceso.
 */
export async function GET() {
  try {
    // 1. Sync cookie session if available
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const cookieHeader = cookieStore.toString();
      if (cookieHeader) {
        pb.authStore.loadFromCookie(cookieHeader);
      }
    } catch {}

    // 2. Ensure superuser auth
    await ensureServerSuperUserAuth();

    let records: any[] = [];
    try {
      records = await pb.collection('applications').getFullList<any>({
        requestKey: null,
      });
      // Sort newest first by submittedAt
      records.sort((a: any, b: any) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    } catch (collErr: any) {
      console.warn('⚠️ Could not fetch from PocketBase applications collection:', collErr?.message);
      return NextResponse.json({ success: true, data: [] });
    }

    const list = (records || []).map((r: any) => ({
      id: r.id,
      stageName: r.stageName || 'Artista Sin Nombre',
      contactName: r.contactName || '',
      email: r.email || '',
      phone: r.phone || '',
      genres: Array.isArray(r.genres) ? r.genres : (r.genres ? [r.genres] : ['Folklore']),
      city: r.city || '',
      province: r.province || '',
      country: r.country || 'Argentina',
      bio: r.bio || '',
      socials: r.socials || {},
      photoUrl: r.photoUrl || (r.photo ? `${pb.baseUrl}/api/files/${r.collectionId || r.collectionName}/${r.id}/${r.photo}` : ''),
      message: r.message || '',
      status: r.status || 'pending',
      submittedAt: r.submittedAt ? r.submittedAt.split('T')[0] : (r.created?.split(' ')[0] || ''),
    }));

    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    console.error('❌ Error fetching applications:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error al cargar postulaciones' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/applications
 * Actualiza el estado de una postulación (approved | rejected | needs_revision),
 * sincroniza la colección artists y envía correo de notificación mediante Resend.
 */
export async function PATCH(req: NextRequest) {
  try {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const cookieHeader = cookieStore.toString();
      if (cookieHeader) {
        pb.authStore.loadFromCookie(cookieHeader);
      }
    } catch {}

    await ensureServerSuperUserAuth();

    const { id, status, reason = '' } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Faltan parámetros id o status' }, { status: 400 });
    }

    const appRecord = await pb.collection('applications').update(id, { status });

    // Sincronizar con el perfil del artista en artists si existe
    let artistRecord: any = null;
    if (appRecord.email || appRecord.stageName) {
      try {
        const query = [
          appRecord.email ? `contactEmail = "${appRecord.email}"` : null,
          appRecord.stageName ? `stageName = "${appRecord.stageName}"` : null,
        ].filter(Boolean).join(' || ');

        artistRecord = await pb.collection('artists').getFirstListItem(query);
        if (artistRecord) {
          await pb.collection('artists').update(artistRecord.id, {
            status,
            adminNotes: reason || '',
          });
        }
      } catch (findErr) {
        // Si no existe perfil en artists, se crea si es approved
      }
    }

    // Enviar correo de notificación al artista mediante Resend
    if (appRecord.email) {
      try {
        const { sendArtistStatusEmail } = await import('@/lib/services/emailService');
        await sendArtistStatusEmail({
          to: appRecord.email,
          stageName: appRecord.stageName,
          status,
          reason,
          artistSlug: artistRecord?.slug,
        });
      } catch (emailErr) {
        console.warn('⚠️ No se pudo enviar el correo de notificación al artista:', emailErr);
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    console.error('❌ Error updating application:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error al actualizar postulación' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/applications
 * Elimina una postulación permanentemente.
 */
export async function DELETE(req: NextRequest) {
  try {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      const cookieHeader = cookieStore.toString();
      if (cookieHeader) {
        pb.authStore.loadFromCookie(cookieHeader);
      }
    } catch {}

    await ensureServerSuperUserAuth();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Falta parámetro id' }, { status: 400 });
    }

    await pb.collection('applications').delete(id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ Error deleting application:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error al eliminar postulación' },
      { status: 500 }
    );
  }
}
