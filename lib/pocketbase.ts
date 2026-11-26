import PocketBase from 'pocketbase';

export const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://gutamusic.meapp.com.ar';

export const pb = new PocketBase(POCKETBASE_URL);

// Desactivar auto-cancelación global para soportar múltiples workers en build y peticiones paralelas en SSR
pb.autoCancellation(false);

const ADMIN_SESSION_KEY = 'guta_admin_session_until';
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;
const THIRTY_DAYS_MS = THIRTY_DAYS_SECONDS * 1000;

function writeAuthCookie() {
  if (typeof document === 'undefined') return;
  const exported = pb.authStore.exportToCookie({
    httpOnly: false,
    secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
    sameSite: 'Lax',
    path: '/',
    maxAge: THIRTY_DAYS_SECONDS,
  });
  document.cookie = exported;
}

export function markAdminSessionActive() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_SESSION_KEY, String(Date.now() + THIRTY_DAYS_MS));
  } catch {}
}

export function hasActiveAdminSessionFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (Number.isFinite(until) && until > Date.now()) {
      return true;
    }
    localStorage.removeItem(ADMIN_SESSION_KEY);
    return false;
  } catch {
    return false;
  }
}

// Sincronizar automáticamente authStore con cookies en el navegador sin pisar localStorage válido
if (typeof document !== 'undefined') {
  if (!pb.authStore.isValid && document.cookie.includes('pb_auth=')) {
    pb.authStore.loadFromCookie(document.cookie);
  }
  if (pb.authStore.isValid) {
    writeAuthCookie();
  }
  pb.authStore.onChange(() => {
    writeAuthCookie();
  });
}

// Helper for superuser authentication
export async function loginAsSuperUser(email: string, pass: string) {
  try {
    // In PocketBase 0.23+, superuser collection is '_superusers'
    const authData = await pb.collection('_superusers').authWithPassword(email, pass);
    markAdminSessionActive();
    writeAuthCookie();
    return { success: true, user: authData.record, token: pb.authStore.token };
  } catch (err: any) {
    try {
      // Fallback for older PocketBase versions
      const authData = await (pb as any).admins.authWithPassword(email, pass);
      markAdminSessionActive();
      writeAuthCookie();
      return { success: true, user: authData.record || authData.admin, token: pb.authStore.token };
    } catch (adminErr: any) {
      console.error('Superuser login failed:', err?.message || adminErr?.message);
      return { success: false, error: err?.message || 'Error de credenciales en PocketBase' };
    }
  }
}

/**
 * Obtiene o renueva el token de _superusers desde /api/admin/session
 * (usado tras login con Windows Hello / Passkey o para mantener viva la sesión admin).
 */
export async function refreshSuperUserSessionFromServer(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data?.success && data.token) {
      pb.authStore.save(data.token, data.record || null);
      markAdminSessionActive();
      writeAuthCookie();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function isSuperUserAuthenticated(): boolean {
  if (typeof document !== 'undefined' && !pb.authStore.isValid && document.cookie.includes('pb_auth=')) {
    pb.authStore.loadFromCookie(document.cookie);
  }
  const hasValidSuperToken =
    pb.authStore.isValid &&
    (pb.authStore.isSuperuser ||
      pb.authStore.isAdmin ||
      pb.authStore.record?.collectionName === '_superusers');

  if (hasValidSuperToken) {
    markAdminSessionActive();
    return true;
  }

  return hasActiveAdminSessionFlag();
}

export function logoutSuperUser() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {}
  }
  pb.authStore.clear();
  if (typeof document !== 'undefined') {
    document.cookie = 'pb_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'pb_auth=; path=/admin; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
}

/**
 * Crea y autentica una instancia dedicada y limpia de PocketBase como SuperUser en el servidor.
 * Esto previene la contaminación del singleton global pb cuando se procesan cookies de usuarios normales.
 */
export async function getServerAdminPb(): Promise<PocketBase> {
  const adminPb = new PocketBase(POCKETBASE_URL);
  adminPb.autoCancellation(false);

  const email = process.env.PB_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || 'guflo32@gmail.com';
  const password = process.env.PB_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || '1982Gut@**';

  if (email && password) {
    try {
      await adminPb.collection('_superusers').authWithPassword(email, password);
    } catch {
      try {
        await (adminPb as any).admins.authWithPassword(email, password);
      } catch (e: any) {
        console.warn('⚠️ Falló autenticación en servidor con credenciales superuser:', e?.message);
      }
    }
  }

  return adminPb;
}

let pendingServerAuthPromise: Promise<boolean> | null = null;

/**
 * Autentica automáticamente en el servidor (Node.js / Next.js SSR)
 * utilizando las variables de entorno PB_EMAIL y PB_PASSWORD de CapRover/.env.local
 */
export async function ensureServerSuperUserAuth(): Promise<boolean> {
  if (typeof window === 'undefined') {
    const isSuper =
      pb.authStore.isValid &&
      (pb.authStore.isSuperuser ||
        pb.authStore.isAdmin ||
        pb.authStore.record?.collectionName === '_superusers');

    if (isSuper) return true;

    if (pendingServerAuthPromise) {
      return pendingServerAuthPromise;
    }

    pendingServerAuthPromise = (async () => {
      try {
        // Si tiene un token que no es de superusuario, limpiamos la instancia compartida
        if (pb.authStore.isValid) {
          pb.authStore.clear();
        }

        const email = process.env.PB_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || 'guflo32@gmail.com';
        const password = process.env.PB_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || '1982Gut@**';

        if (email && password) {
          try {
            await pb.collection('_superusers').authWithPassword(email, password);
            return true;
          } catch {
            try {
              await (pb as any).admins.authWithPassword(email, password);
              return true;
            } catch (e: any) {
              console.warn('⚠️ Auto-autenticación en servidor con PB_EMAIL falló:', e?.message);
            }
          }
        }
        return false;
      } finally {
        pendingServerAuthPromise = null;
      }
    })();

    return pendingServerAuthPromise;
  }
  return (
    pb.authStore.isValid &&
    (pb.authStore.isSuperuser ||
      pb.authStore.isAdmin ||
      pb.authStore.record?.collectionName === '_superusers')
  );
}
