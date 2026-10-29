import { NextRequest, NextResponse } from 'next/server';
import { createApplicationAndNotify } from '@/lib/services/applicationService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/applications
 * Endpoint público para recibir postulaciones de artistas y bandas.
 * Guarda en PocketBase y notifica inmediatamente por Telegram a los administradores.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.stageName || !body.email) {
      return NextResponse.json(
        { success: false, error: 'El nombre artístico y el email son requeridos.' },
        { status: 400 }
      );
    }

    const referralSource = (body.referralSource || body.socials?.referralSource || '').trim();
    const socials = {
      ...(body.socials || {}),
      ...(referralSource ? { referralSource } : {}),
    };

    const payload = {
      stageName: (body.stageName || '').trim(),
      contactName: (body.contactName || body.stageName || '').trim(),
      email: (body.email || '').trim().toLowerCase(),
      phone: (body.phone || '').trim(),
      genres: Array.isArray(body.genres) ? body.genres : [body.genres || 'Folklore'],
      city: (body.city || '').trim(),
      province: (body.province || '').trim(),
      country: (body.country || 'Argentina').trim(),
      bio: (body.bio || '').trim(),
      socials,
      referralSource,
      photoUrl: body.photoUrl || '',
      message: (body.message || (referralSource ? `Nos conoció por: ${referralSource}` : '')).trim(),
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    const record = await createApplicationAndNotify(payload);

    return NextResponse.json({
      success: true,
      message: 'Postulación recibida y notificada con éxito.',
      data: record,
    });
  } catch (err: any) {
    console.error('❌ Error al procesar postulación en /api/applications:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Error al procesar la postulación.' },
      { status: 500 }
    );
  }
}
