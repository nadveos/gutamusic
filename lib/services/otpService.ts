import crypto from 'crypto';
import { sendOtpEmail } from './emailService';

const OTP_SECRET = process.env.OTP_SECRET || 'guta-musica-otp-secret-key-2026-argentina';
const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutos

interface OtpPayload {
  email: string;
  name: string;
  stageName: string;
  hash: string;
  expiresAt: number;
}

/**
 * Genera el hash HMAC para contrastar el código sin almacenarlo en plano
 */
function createOtpHash(email: string, code: string, expiresAt: number): string {
  return crypto
    .createHmac('sha256', OTP_SECRET)
    .update(`${email.toLowerCase().trim()}:${code}:${expiresAt}`)
    .digest('hex');
}

/**
 * Genera un código OTP de 6 dígitos, firma el payload y envía el correo con Resend
 */
export async function generateAndSendOtp({
  email,
  name,
  stageName,
}: {
  email: string;
  name: string;
  stageName: string;
}): Promise<{ success: boolean; token?: string; expiresAt?: number; error?: string }> {
  const cleanEmail = email.toLowerCase().trim();
  // Código aleatorio de 6 dígitos numéricos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_EXPIRATION_MS;
  const hash = createOtpHash(cleanEmail, code, expiresAt);

  // Payload firmado codificado en base64
  const payload: OtpPayload = {
    email: cleanEmail,
    name,
    stageName,
    hash,
    expiresAt,
  };
  const token = Buffer.from(JSON.stringify(payload)).toString('base64');

  // Enviar el correo usando Resend
  const emailResult = await sendOtpEmail({
    to: cleanEmail,
    code,
    userName: name || stageName || 'Artista',
  });

  if (!emailResult.success) {
    return {
      success: false,
      error: emailResult.error || 'No se pudo enviar el correo de verificación.',
    };
  }

  return {
    success: true,
    token,
    expiresAt,
  };
}

/**
 * Verifica si el código numérico ingresado por el usuario es válido y no expiró
 */
export function verifyOtpCode({
  email,
  code,
  token,
}: {
  email: string;
  code: string;
  token: string;
}): { valid: boolean; error?: string; payload?: OtpPayload } {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const payload: OtpPayload = JSON.parse(raw);

    const cleanEmail = email.toLowerCase().trim();
    if (payload.email !== cleanEmail) {
      return { valid: false, error: 'El email no coincide con la solicitud original.' };
    }

    if (Date.now() > payload.expiresAt) {
      return { valid: false, error: 'El código de verificación ha expirado. Solicitá uno nuevo.' };
    }

    const cleanCode = code.trim();
    const expectedHash = createOtpHash(cleanEmail, cleanCode, payload.expiresAt);

    if (payload.hash !== expectedHash) {
      return { valid: false, error: 'Código de verificación incorrecto. Revisalo e intentá nuevamente.' };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: 'Token de verificación inválido o dañado.' };
  }
}
