import { NextResponse } from 'next/server';
import { getServerAdminPb } from '@/lib/pocketbase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/session
 * Emite o renueva el token de _superusers de PocketBase para mantener viva
 * la sesión del panel de administración (y para login biométrico con Windows Hello / Passkey).
 */
export async function POST() {
  try {
    const adminPb = await getServerAdminPb();

    if (!adminPb.authStore.isValid || !adminPb.authStore.token) {
      return NextResponse.json(
        { success: false, error: 'No se pudo obtener sesión de superusuario en PocketBase.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      token: adminPb.authStore.token,
      record: adminPb.authStore.record,
    });
  } catch (err: any) {
    console.error('❌ Error en /api/admin/session:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error renovando sesión admin.' },
      { status: 500 }
    );
  }
}
