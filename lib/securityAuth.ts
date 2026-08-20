/**
 * GUTA MÚSICA - Security & 2FA Module
 * Supports:
 * 1. WebAuthn Passkeys (Windows Hello, Touch ID, PIN, FIDO2 Physical Keys)
 * 2. RFC 6238 TOTP 6-digit verification (Oracle Authenticator, Google Authenticator, etc.)
 * 3. Backup emergency codes
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

const STORAGE_KEYS = {
  WEBAUTHN_CREDENTIALS: 'guta_admin_webauthn_creds',
  TOTP_SECRET: 'guta_admin_totp_secret',
  TWO_FACTOR_ENABLED: 'guta_admin_2fa_enabled',
  BACKUP_CODES: 'guta_admin_backup_codes',
  SUPERUSER_EMAIL: 'guta_admin_superuser_email',
};

// ==========================================
// Base32 & HMAC-SHA1 Utilities (RFC 6238)
// ==========================================

function base32ToUint8Array(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean.charAt(i));
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}

export function generateTotpSecret(length = 16): string {
  const randomBytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(randomBytes);
  } else {
    for (let i = 0; i < length; i++) randomBytes[i] = Math.floor(Math.random() * 256);
  }
  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE32_ALPHABET[randomBytes[i] % BASE32_ALPHABET.length];
  }
  return result;
}

export function getTotpUri(secret: string, email = 'admin@gutamusic.com', issuer = 'Guta Musica'): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export async function computeTotpCode(secret: string, timeStepOffset = 0): Promise<string> {
  const keyBytes = base32ToUint8Array(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / 30) + timeStepOffset;

  // 8-byte big-endian counter buffer
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(0, 0, false);
  view.setUint32(4, timeStep, false);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, buffer);
  const hashBytes = new Uint8Array(signature);

  // Dynamic truncation (RFC 4226)
  const offset = hashBytes[hashBytes.length - 1] & 0x0f;
  const binary =
    ((hashBytes[offset] & 0x7f) << 24) |
    ((hashBytes[offset + 1] & 0xff) << 16) |
    ((hashBytes[offset + 2] & 0xff) << 8) |
    (hashBytes[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

export async function verifyTotpCode(inputCode: string, customSecret?: string): Promise<boolean> {
  const cleanInput = inputCode.replace(/\s+/g, '').trim();
  if (cleanInput.length !== 6 || !/^\d{6}$/.test(cleanInput)) {
    // Check if it matches a backup emergency code (format: 8-char hex or alphanumeric)
    if (verifyAndConsumeBackupCode(cleanInput)) {
      return true;
    }
    return false;
  }

  const secret = customSecret || getStoredTotpSecret();
  if (!secret) return false;

  // Window: -1 (previous 30s), 0 (current), +1 (next 30s) to tolerate clock skew
  for (const offset of [0, -1, 1]) {
    const validCode = await computeTotpCode(secret, offset);
    if (cleanInput === validCode) {
      return true;
    }
  }
  return false;
}

// ==========================================
// Backup Codes Management
// ==========================================

export function generateBackupCodes(count = 6): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.BACKUP_CODES, JSON.stringify(codes));
  }
  return codes;
}

export function getStoredBackupCodes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BACKUP_CODES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function verifyAndConsumeBackupCode(inputCode: string): boolean {
  const codes = getStoredBackupCodes();
  const normalized = inputCode.toUpperCase().trim();
  const index = codes.findIndex((c) => c === normalized);
  if (index !== -1) {
    codes.splice(index, 1);
    localStorage.setItem(STORAGE_KEYS.BACKUP_CODES, JSON.stringify(codes));
    return true;
  }
  return false;
}

// ==========================================
// Storage Helpers
// ==========================================

export function getStoredTotpSecret(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.TOTP_SECRET);
}

export function setStoredTotpSecret(secret: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TOTP_SECRET, secret);
}

export function is2FAEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  // If a TOTP secret or WebAuthn credential exists, 2FA is active
  const hasTotp = Boolean(localStorage.getItem(STORAGE_KEYS.TOTP_SECRET));
  const hasPasskey = hasRegisteredPasskey();
  const explicitlyEnabled = localStorage.getItem(STORAGE_KEYS.TWO_FACTOR_ENABLED) === 'true';
  return explicitlyEnabled || hasTotp || hasPasskey;
}

export function set2FAEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TWO_FACTOR_ENABLED, enabled ? 'true' : 'false');
}

// ==========================================
// WebAuthn / Passkeys (Windows Hello, PIN, FIDO2)
// ==========================================

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === 'function'
  );
}

export interface RegisteredPasskey {
  id: string; // Base64URL credential ID
  name: string;
  createdAt: string;
  transports?: string[];
}

export function getRegisteredPasskeys(): RegisteredPasskey[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEBAUTHN_CREDENTIALS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function hasRegisteredPasskey(): boolean {
  return getRegisteredPasskeys().length > 0;
}

export async function registerWebAuthnPasskey(
  userName = 'guta-superadmin',
  displayName = 'Superusuario Guta Música'
): Promise<{ success: boolean; passkey?: RegisteredPasskey; error?: string }> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'Tu navegador o dispositivo no soporta WebAuthn / Windows Hello.' };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'GUTA MÚSICA Editorial CMS',
        id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      },
      user: {
        id: userId,
        name: userName,
        displayName: displayName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Windows Hello, TouchID, FaceID, On-device PIN
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: 'No se pudo crear la credencial.' };
    }

    const credId = bufferToBase64Url(credential.rawId);
    const newPasskey: RegisteredPasskey = {
      id: credId,
      name: `Llave ${navigator.userAgent.includes('Windows') ? 'Windows Hello / PIN' : 'Biométrica'} (${new Date().toLocaleDateString('es-AR')})`,
      createdAt: new Date().toISOString(),
    };

    const existing = getRegisteredPasskeys();
    existing.push(newPasskey);
    localStorage.setItem(STORAGE_KEYS.WEBAUTHN_CREDENTIALS, JSON.stringify(existing));
    set2FAEnabled(true);

    return { success: true, passkey: newPasskey };
  } catch (err: any) {
    console.error('Error registrando Passkey:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Operación cancelada o rechazada por el usuario.' };
    }
    return { success: false, error: err.message || 'Error registrando llave biométrica.' };
  }
}

export async function authenticateWithPasskey(): Promise<{ success: boolean; error?: string }> {
  if (!isWebAuthnSupported()) {
    return { success: false, error: 'WebAuthn no está disponible en este dispositivo.' };
  }

  const passkeys = getRegisteredPasskeys();
  if (passkeys.length === 0) {
    return { success: false, error: 'No tenés ninguna llave Windows Hello / Passkey registrada aún.' };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const allowCredentials: PublicKeyCredentialDescriptor[] = passkeys.map((pk) => ({
      id: base64UrlToBuffer(pk.id),
      type: 'public-key',
    }));

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials,
      userVerification: 'required',
      timeout: 60000,
      rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
    };

    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential | null;

    if (!assertion) {
      return { success: false, error: 'No se pudo verificar la llave.' };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error en autenticación WebAuthn:', err);
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Verificación biométrica cancelada.' };
    }
    return { success: false, error: err.message || 'Error en la verificación de llave.' };
  }
}
