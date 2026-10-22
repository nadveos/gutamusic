import { NextRequest, NextResponse } from 'next/server';
import { pb, ensureServerSuperUserAuth } from '@/lib/pocketbase';
import { generateAndSendOtp } from '@/lib/services/otpService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, stageName, email, password } = body;

    if (!email || !password || !name || !stageName) {
      return NextResponse.json(
        { success: false, error: 'Completá todos los campos obligatorios.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' },
        { status: 400 }
      );
    }

    // 1. Verificar si el usuario ya existe en PocketBase
    await ensureServerSuperUserAuth();
    try {
      const existing = await pb.collection('users').getFirstListItem(`email = "${cleanEmail}"`);
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: 'Este email ya está registrado. Podés iniciar sesión directamente.',
          },
          { status: 409 }
        );
      }
    } catch (err: any) {
      // Si da 404 significa que no existe, lo cual es el caso deseado
      if (err?.status !== 404) {
        console.warn('Advertencia al consultar existencia de usuario:', err?.message);
      }
    }

    // 2. Generar OTP y enviar correo mediante Resend
    const otpResult = await generateAndSendOtp({
      email: cleanEmail,
      name: name.trim(),
      stageName: stageName.trim(),
    });

    if (!otpResult.success) {
      return NextResponse.json(
        { success: false, error: otpResult.error || 'Error al enviar código de verificación.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Código de verificación enviado con éxito.',
      token: otpResult.token,
      expiresAt: otpResult.expiresAt,
    });
  } catch (error: any) {
    console.error('Error en /api/auth/register-artist:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
