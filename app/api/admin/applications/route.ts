import { NextRequest, NextResponse } from 'next/server';
import { pb, ensureServerSuperUserAuth } from '../../../../lib/pocketbase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/applications
 * Lista todas las postulaciones usando auth de superuser para garantizar acceso.
 */
export async function GET() {
  try {
    await ensureServerSuperUserAuth();

    const records = await pb.collection('applications').getFullList<any>({
      sort: '-created',
      requestKey: null,
    });

    const list = (records || []).map((r: any) => ({
      id: r.id,
      stageName: r.stageName,
      contactName: r.contactName || '',
      email: r.email || '',
      phone: r.phone || '',
      genres: Array.isArray(r.genres) ? r.genres : [r.genres || 'Folklore'],
      city: r.city || '',
      province: r.province || '',
      country: r.country || 'Argentina',
      bio: r.bio || '',
      socials: r.socials || {},
      photoUrl: r.photoUrl || (r.photo ? pb.files.getUrl(r, r.photo) : ''),
      message: r.message || '',
      status: r.status || 'pending',
      submittedAt: r.submittedAt || r.created?.split(' ')[0] || '',
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
 * Actualiza el estado de una postulación (approved | rejected).
 */
export async function PATCH(req: NextRequest) {
  try {
    await ensureServerSuperUserAuth();

    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Faltan parámetros id o status' }, { status: 400 });
    }

    await pb.collection('applications').update(id, { status });

    return NextResponse.json({ success: true });
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
