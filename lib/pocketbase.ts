import PocketBase, { RecordModel } from 'pocketbase';

export const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://gutamusic.meapp.com.ar';

export const pb = new PocketBase(POCKETBASE_URL);

// Desactivar auto-cancelación global para soportar múltiples workers en build y peticiones paralelas en SSR
pb.autoCancellation(false);

// Sincronizar automáticamente authStore con cookies en el navegador
if (typeof document !== 'undefined') {
  pb.authStore.loadFromCookie(document.cookie);
  pb.authStore.onChange(() => {
    document.cookie = pb.authStore.exportToCookie({
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    });
  });
}

// Helper for superuser authentication
export async function loginAsSuperUser(email: string, pass: string) {
  try {
    // In PocketBase 0.23+, superuser collection is '_superusers'
    const authData = await pb.collection('_superusers').authWithPassword(email, pass);
    if (typeof document !== 'undefined') {
      document.cookie = pb.authStore.exportToCookie({
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      });
    }
    return { success: true, user: authData.record, token: pb.authStore.token };
  } catch (err: any) {
    try {
      // Fallback for older PocketBase versions
      const authData = await (pb as any).admins.authWithPassword(email, pass);
      if (typeof document !== 'undefined') {
        document.cookie = pb.authStore.exportToCookie({
          httpOnly: false,
          secure: false,
          sameSite: 'Lax',
        });
      }
      return { success: true, user: authData.record || authData.admin, token: pb.authStore.token };
    } catch (adminErr: any) {
      console.error('Superuser login failed:', err?.message || adminErr?.message);
      return { success: false, error: err?.message || 'Error de credenciales en PocketBase' };
    }
  }
}

export function isSuperUserAuthenticated(): boolean {
  if (typeof document !== 'undefined' && !pb.authStore.isValid) {
    pb.authStore.loadFromCookie(document.cookie);
  }
  return (
    pb.authStore.isValid &&
    (pb.authStore.isSuperuser ||
      pb.authStore.isAdmin ||
      pb.authStore.record?.collectionName === '_superusers')
  );
}

export function logoutSuperUser() {
  pb.authStore.clear();
  if (typeof document !== 'undefined') {
    document.cookie = pb.authStore.exportToCookie({
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    });
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
  }
  return (
    pb.authStore.isValid &&
    (pb.authStore.isSuperuser ||
      pb.authStore.isAdmin ||
      pb.authStore.record?.collectionName === '_superusers')
  );
}

