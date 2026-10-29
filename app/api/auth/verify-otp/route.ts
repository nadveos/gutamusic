import { NextRequest, NextResponse } from 'next/server';
import { pb, ensureServerSuperUserAuth, POCKETBASE_URL } from '@/lib/pocketbase';
import { verifyOtpCode } from '@/lib/services/otpService';
import PocketBase from 'pocketbase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code, token, password, name, stageName, referralSource = '' } = body;

    if (!email || !code || !token || !password) {
      return NextResponse.json(
        { success: false, error: 'Faltan parámetros requeridos para la verificación.' },
        { status: 400 }
      );
    }

    // 1. Validar el código OTP
    const verification = verifyOtpCode({ email, code, token });
    if (!verification.valid) {
      return NextResponse.json(
        { success: false, error: verification.error || 'Código inválido o expirado.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const finalName = name || verification.payload?.name || 'Artista';
    const finalStageName = stageName || verification.payload?.stageName || '';

    // 2. Crear el usuario en PocketBase usando credenciales de superuser para garantizar permisos
    await ensureServerSuperUserAuth();

    let createdUser: any = null;

    try {
      // Intentar crear con campos extendidos
      createdUser = await pb.collection('users').create({
        email: cleanEmail,
        password: password,
        passwordConfirm: password,
        name: finalName,
        role: 'artist',
        stageName: finalStageName,
        referralSource: referralSource.trim(),
        verified: true,
      });
    } catch (createErr: any) {
      // Si falla por campos que no existen en el schema de users, reintentar con campos estándar
      try {
        createdUser = await pb.collection('users').create({
          email: cleanEmail,
          password: password,
          passwordConfirm: password,
          name: finalName,
          verified: true,
        });
      } catch (retryErr: any) {
        console.error('Error creando usuario en PocketBase:', retryErr);
        return NextResponse.json(
          {
            success: false,
            error: retryErr?.message || 'No se pudo crear la cuenta de usuario.',
          },
          { status: 500 }
        );
      }
    }

    // 3. Autenticar para generar sesión
    // Usamos una instancia limpia para no sobreescribir la sesión de superuser del servidor
    const clientPb = new PocketBase(POCKETBASE_URL);
    const authData = await clientPb.collection('users').authWithPassword(cleanEmail, password);

    return NextResponse.json({
      success: true,
      message: '¡Cuenta creada y verificada exitosamente!',
      token: authData.token,
      user: {
        id: authData.record.id,
        email: authData.record.email,
        name: authData.record.name,
        stageName: finalStageName,
      },
    });
  } catch (error: any) {
    console.error('Error en /api/auth/verify-otp:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error en la verificación de código.' },
      { status: 500 }
    );
  }
}
