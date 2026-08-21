import PocketBase, { RecordModel } from 'pocketbase';

export const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://gutamusic.meapp.com.ar';

export const pb = new PocketBase(POCKETBASE_URL);

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
  return pb.authStore.isValid;
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
