import { NextRequest, NextResponse } from 'next/server';
import { generateAndSendOtp } from '@/lib/services/otpService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, stageName } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requerido para reenviar código.' },
        { status: 400 }
      );
    }

    const otpResult = await generateAndSendOtp({
      email: email.toLowerCase().trim(),
      name: name || 'Artista',
      stageName: stageName || '',
    });

    if (!otpResult.success) {
      return NextResponse.json(
        { success: false, error: otpResult.error || 'No se pudo reenviar el código.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Nuevo código enviado exitosamente.',
      token: otpResult.token,
      expiresAt: otpResult.expiresAt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error reenviando código.' },
      { status: 500 }
    );
  }
}
