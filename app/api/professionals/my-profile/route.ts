import { NextRequest, NextResponse } from 'next/server';
import {
  getProfessionalBySlugOrId,
  getProfessionalByUserOrEmail,
  updateProfessionalInDb,
  deleteProfessionalFromDb,
  getProfessionalFeaturedStatus,
} from '@/lib/services/professionalsService';
import { PROFESSIONAL_PAID_DAYS } from '@/lib/constants/professionalCategories';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id') || '';
    const email = searchParams.get('email') || '';

    let prof = null;
    if (id) {
      prof = await getProfessionalBySlugOrId(id);
    } else if (email) {
      prof = await getProfessionalByUserOrEmail(undefined, email);
    }

    if (!prof) {
      return NextResponse.json(
        { success: false, error: 'Perfil profesional no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      professional: {
        ...prof,
        featuredStatus: getProfessionalFeaturedStatus(prof),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al obtener perfil profesional' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, grantPaidFeaturedDays, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Falta el ID del profesional' },
        { status: 400 }
      );
    }

    // Si desde Admin se activa manualmente el Destacado Semanal (7 días)
    if (grantPaidFeaturedDays) {
      const now = new Date();
      updates.paidFeatured = true;
      updates.paidFeaturedStart = now.toISOString();
      updates.paidFeaturedUntil = new Date(
        now.getTime() + PROFESSIONAL_PAID_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();
    }

    const updated = await updateProfessionalInDb(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'No se encontró el profesional para actualizar' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      professional: {
        ...updated,
        featuredStatus: getProfessionalFeaturedStatus(updated),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al actualizar perfil profesional' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });
    }

    await deleteProfessionalFromDb(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al eliminar profesional' },
      { status: 500 }
    );
  }
}
