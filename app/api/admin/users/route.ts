import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { POCKETBASE_URL, getServerAdminPb } from '../../../../lib/pocketbase';
import {
  getProfessionalsFromDb,
  updateProfessionalInDb,
} from '../../../../lib/services/professionalsService';
import { getProfessionalCategoryInfo } from '../../../../lib/constants/professionalCategories';
import { sendIncompleteProfileReminderEmail } from '../../../../lib/services/emailService';
import { ensureTelegramWebhookRegistered } from '../../../../lib/services/telegramService';

interface ReminderLogEntry {
  sentAt: string;
  count: number;
}

type ReminderLogMap = Record<string, ReminderLogEntry>;

async function getReminderLog(adminPb: PocketBase): Promise<{
  recordId: string | null;
  log: ReminderLogMap;
}> {
  try {
    const rec = await adminPb
      .collection('site_settings')
      .getFirstListItem('key="onboarding_reminders_log"', { requestKey: null });
    const parsed =
      typeof rec.data === 'string' ? JSON.parse(rec.data) : rec.data || {};
    return {
      recordId: rec.id,
      log: parsed && typeof parsed === 'object' ? parsed : {},
    };
  } catch {
    return { recordId: null, log: {} };
  }
}

async function saveReminderLog(
  adminPb: PocketBase,
  recordId: string | null,
  log: ReminderLogMap
) {
  const payload = {
    key: 'onboarding_reminders_log',
    data: JSON.stringify(log),
  };
  try {
    if (recordId) {
      await adminPb
        .collection('site_settings')
        .update(recordId, payload, { requestKey: null });
    } else {
      await adminPb
        .collection('site_settings')
        .create(payload, { requestKey: null });
    }
  } catch (e) {
    console.warn('No se pudo guardar onboarding_reminders_log:', e);
  }
}

export const dynamic = 'force-dynamic';

/**
 * Obtiene una instancia autenticada con permisos de superusuario.
 * Primero intenta validar el token del admin que viene en la cookie de la petición.
 * Si no es válido o no está, recurre a las credenciales superuser del servidor (PB_EMAIL / PB_PASSWORD).
 */
async function getAuthenticatedAdminPb(): Promise<PocketBase | null> {
  // 1. Intentar validar la cookie del cliente en una instancia aislada
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) {
      const clientPb = new PocketBase(POCKETBASE_URL);
      clientPb.autoCancellation(false);
      clientPb.authStore.loadFromCookie(cookieHeader);

      if (
        clientPb.authStore.isValid &&
        (clientPb.authStore.isSuperuser ||
          clientPb.authStore.isAdmin ||
          clientPb.authStore.record?.collectionName === '_superusers')
      ) {
        return clientPb;
      }
    }
  } catch {}

  // 2. Si no hay cookie de superuser en la request, usar la instancia autenticada del servidor
  try {
    const serverPb = await getServerAdminPb();
    if (
      serverPb.authStore.isValid &&
      (serverPb.authStore.isSuperuser ||
        serverPb.authStore.isAdmin ||
        serverPb.authStore.record?.collectionName === '_superusers')
    ) {
      return serverPb;
    }
  } catch (err) {
    console.warn('⚠️ Error al obtener server admin pb:', err);
  }

  return null;
}

/**
 * Extrae mensaje legible de error de PocketBase (incluyendo validaciones por campo)
 */
function formatPocketBaseError(err: any): string {
  let message = err?.message || 'Error procesando solicitud';
  if (err?.data?.data && typeof err.data.data === 'object') {
    const details = Object.entries(err.data.data)
      .map(([k, v]: [string, any]) => `${k}: ${v?.message || v?.code || v}`)
      .join(', ');
    if (details) message = `${message} (${details})`;
  } else if (err?.data?.message) {
    message = err.data.message;
  }
  return message;
}

/**
 * GET /api/admin/users
 * Lista todos los usuarios registrados en PocketBase con su artista asociado
 */
export async function GET() {
  try {
    ensureTelegramWebhookRegistered().catch(() => {});
    const adminPb = await getAuthenticatedAdminPb();
    if (!adminPb) {
      return NextResponse.json(
        { success: false, error: 'No autorizado como superusuario' },
        { status: 401 }
      );
    }

    // 1. Obtener lista de usuarios
    let usersList: any[] = [];
    try {
      usersList = await adminPb.collection('users').getFullList({
        sort: '-created',
        requestKey: null,
      });
    } catch (uErr: any) {
      console.warn('⚠️ No se pudieron obtener usuarios:', uErr?.message);
      return NextResponse.json({ success: true, users: [], artists: [] });
    }

    // 2. Obtener lista de artistas para cruzar relación
    let artistList: any[] = [];
    try {
      artistList = await adminPb.collection('artists').getFullList({
        requestKey: null,
      });
    } catch (aErr: any) {
      console.warn('⚠️ No se pudieron obtener artistas:', aErr?.message);
    }

    // 3. Obtener lista de profesionales para cruzar relación
    let profList: any[] = [];
    try {
      profList = await getProfessionalsFromDb();
    } catch (pErr: any) {
      console.warn('⚠️ No se pudieron obtener profesionales:', pErr?.message);
    }

    // 3b. Obtener registro de recordatorios de soporte enviados
    const { recordId: reminderRecordId, log: reminderLog } =
      await getReminderLog(adminPb);
    let logModified = false;
    let autoSentCount = 0;
    const nowMs = Date.now();
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

    // 4. Cruzar usuario con artista o profesional asociado
    const users = [];
    for (const u of usersList) {
      const cleanUserEmail = (u.email || '').trim().toLowerCase();
      const cleanUserName = (u.name || '').trim().toLowerCase();

      const linkedArtist = artistList.find(
        (a: any) =>
          a.owner === u.id ||
          (a.contactEmail && a.contactEmail.trim().toLowerCase() === cleanUserEmail)
      );

      const linkedProf = profList.find(
        (p: any) =>
          p.userId === u.id ||
          (p.email && p.email.trim().toLowerCase() === cleanUserEmail) ||
          (cleanUserName &&
            p.name &&
            (p.name.trim().toLowerCase() === cleanUserName ||
              cleanUserName.includes(p.name.trim().toLowerCase()) ||
              p.name.trim().toLowerCase().includes(cleanUserName)))
      );

      const accountRole: 'artist' | 'professional' | 'sponsor' =
        linkedProf || u.role === 'professional'
          ? 'professional'
          : u.role === 'sponsor'
          ? 'sponsor'
          : 'artist';

      const catInfo = linkedProf ? getProfessionalCategoryInfo(linkedProf.roleCategory) : null;

      let remEntry = reminderLog[u.id] || reminderLog[cleanUserEmail] || null;

      // Automatización: si es cuenta de artista, no tiene ficha vinculada, lleva >2 horas registrada y nunca se le envió el correo de soporte
      const createdMs = u.created ? new Date(u.created).getTime() : nowMs;
      const isOlderThanTwoHours =
        !isNaN(createdMs) && nowMs - createdMs >= TWO_HOURS_MS;

      if (
        accountRole === 'artist' &&
        !linkedArtist &&
        !linkedProf &&
        cleanUserEmail &&
        !remEntry &&
        isOlderThanTwoHours
      ) {
        const sendRes = await sendIncompleteProfileReminderEmail({
          to: cleanUserEmail,
          userName: u.name || cleanUserEmail.split('@')[0],
        });
        if (sendRes.success) {
          remEntry = {
            sentAt: new Date().toISOString(),
            count: 1,
          };
          reminderLog[u.id] = remEntry;
          reminderLog[cleanUserEmail] = remEntry;
          logModified = true;
          autoSentCount++;
        }
      }

      users.push({
        id: u.id,
        email: u.email || '',
        name: u.name || '',
        role: accountRole,
        verified: Boolean(u.verified),
        created: u.created ? u.created.split(' ')[0] : '',
        updated: u.updated ? u.updated.split(' ')[0] : '',
        avatar: u.avatar || '',
        reminderSentAt: remEntry?.sentAt || null,
        reminderCount: remEntry?.count || 0,
        artist: linkedArtist
          ? {
              id: linkedArtist.id,
              stageName: linkedArtist.stageName || 'Artista',
              slug: linkedArtist.slug || '',
              photoUrl: linkedArtist.photoUrl || '',
              status: linkedArtist.status || 'published',
              isExplicitOwner: linkedArtist.owner === u.id,
            }
          : null,
        professional: linkedProf
          ? {
              id: linkedProf.id,
              name: linkedProf.name || 'Profesional',
              slug: linkedProf.slug || linkedProf.id,
              roleCategory: linkedProf.roleCategory,
              categoryLabel: catInfo?.label || 'Profesional',
              specialty: linkedProf.specialty || '',
              photoUrl: linkedProf.photoUrl || '',
              active: Boolean(linkedProf.active),
              isExplicitOwner: linkedProf.userId === u.id,
            }
          : null,
      });
    }

    if (logModified) {
      await saveReminderLog(adminPb, reminderRecordId, reminderLog);
    }

    const artists = artistList.map((a: any) => ({
      id: a.id,
      stageName: a.stageName || 'Sin Nombre',
      slug: a.slug || '',
      owner: a.owner || '',
      contactEmail: a.contactEmail || '',
      photoUrl: a.photoUrl || '',
    }));

    const professionals = profList.map((p: any) => ({
      id: p.id,
      name: p.name || 'Sin Nombre',
      slug: p.slug || p.id,
      roleCategory: p.roleCategory || 'productor_musical',
      categoryLabel: getProfessionalCategoryInfo(p.roleCategory).label,
      userId: p.userId || '',
      email: p.email || '',
      photoUrl: p.photoUrl || '',
    }));

    return NextResponse.json({
      success: true,
      users,
      artists,
      professionals,
      autoSentCount,
    });
  } catch (err: any) {
    console.error('❌ Error en GET /api/admin/users:', err);
    return NextResponse.json(
      { success: false, error: formatPocketBaseError(err) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/users
 * Maneja acciones operativas: toggle_verified, request_password_reset, link_artist, unlink_artist, delete_user, create_user
 */
export async function POST(req: NextRequest) {
  try {
    const adminPb = await getAuthenticatedAdminPb();
    if (!adminPb) {
      return NextResponse.json(
        { success: false, error: 'No autorizado como superusuario' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Falta parámetro action' },
        { status: 400 }
      );
    }

    // 1. Activar / Desactivar verificación de email
    if (action === 'toggle_verified') {
      const { userId, verified } = body;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Falta userId' }, { status: 400 });
      }

      const updated = await adminPb.collection('users').update(userId, {
        verified: Boolean(verified),
      });

      return NextResponse.json({
        success: true,
        message: `Estado de verificación actualizado a ${Boolean(verified) ? 'Verificado' : 'No verificado'}.`,
        user: updated,
      });
    }

    // 2. Solicitar reseteo de contraseña
    if (action === 'request_password_reset') {
      const { email } = body;
      if (!email) {
        return NextResponse.json({ success: false, error: 'Falta email' }, { status: 400 });
      }

      try {
        await adminPb.collection('users').requestPasswordReset(email.trim().toLowerCase());
        return NextResponse.json({
          success: true,
          message: `Correo de restablecimiento enviado exitosamente a ${email}.`,
        });
      } catch (resetErr: any) {
        return NextResponse.json({
          success: false,
          error: formatPocketBaseError(resetErr),
        });
      }
    }

    // 3. Vincular usuario a artista
    if (action === 'link_artist') {
      const { userId, artistId } = body;
      if (!userId || !artistId) {
        return NextResponse.json(
          { success: false, error: 'Falta userId o artistId' },
          { status: 400 }
        );
      }

      await adminPb.collection('artists').update(artistId, {
        owner: userId,
      });

      return NextResponse.json({
        success: true,
        message: 'Artista vinculado exitosamente a este usuario.',
      });
    }

    // 4. Desvincular artista
    if (action === 'unlink_artist') {
      const { artistId } = body;
      if (!artistId) {
        return NextResponse.json({ success: false, error: 'Falta artistId' }, { status: 400 });
      }

      await adminPb.collection('artists').update(artistId, {
        owner: '',
      });

      return NextResponse.json({
        success: true,
        message: 'Artista desvinculado.',
      });
    }

    // 4b. Vincular usuario a profesional
    if (action === 'link_professional') {
      const { userId, professionalId } = body;
      if (!userId || !professionalId) {
        return NextResponse.json(
          { success: false, error: 'Falta userId o professionalId' },
          { status: 400 }
        );
      }

      await updateProfessionalInDb(professionalId, { userId });
      try {
        await adminPb.collection('users').update(userId, { role: 'professional' });
      } catch {}

      return NextResponse.json({
        success: true,
        message: 'Ficha de profesional vinculada exitosamente a este usuario.',
      });
    }

    // 4c. Desvincular profesional
    if (action === 'unlink_professional') {
      const { professionalId } = body;
      if (!professionalId) {
        return NextResponse.json(
          { success: false, error: 'Falta professionalId' },
          { status: 400 }
        );
      }

      await updateProfessionalInDb(professionalId, { userId: '' });

      return NextResponse.json({
        success: true,
        message: 'Ficha de profesional desvinculada.',
      });
    }

    // 4d. Enviar correo de asistencia / recordatorio de ficha incompleta desde soporte@guta.musica.ar
    if (action === 'send_profile_reminder') {
      const { userId, email, name } = body;
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Falta email del usuario' },
          { status: 400 }
        );
      }

      const cleanEmail = email.trim().toLowerCase();
      const sendRes = await sendIncompleteProfileReminderEmail({
        to: cleanEmail,
        userName: name || cleanEmail.split('@')[0],
      });

      if (!sendRes.success) {
        return NextResponse.json(
          {
            success: false,
            error: sendRes.error || 'No se pudo enviar el correo de recordatorio.',
          },
          { status: 500 }
        );
      }

      const { recordId, log } = await getReminderLog(adminPb);
      const prev = (userId && log[userId]) || log[cleanEmail] || { sentAt: '', count: 0 };
      const entry: ReminderLogEntry = {
        sentAt: new Date().toISOString(),
        count: (prev.count || 0) + 1,
      };
      if (userId) log[userId] = entry;
      log[cleanEmail] = entry;
      await saveReminderLog(adminPb, recordId, log);

      return NextResponse.json({
        success: true,
        sentAt: entry.sentAt,
        count: entry.count,
        message: `Correo de asistencia enviado desde soporte@guta.musica.ar a ${cleanEmail}.`,
      });
    }

    // 5. Crear usuario desde Admin
    if (action === 'create_user') {
      const { email, password, name, verified = true, artistId } = body;
      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'Email y contraseña requeridos' },
          { status: 400 }
        );
      }

      const cleanEmail = email.trim().toLowerCase();

      if (password.length < 8) {
        return NextResponse.json(
          { success: false, error: 'La contraseña debe tener al menos 8 caracteres' },
          { status: 400 }
        );
      }

      // Verificar de antemano si el email ya está en uso
      try {
        const existing = await adminPb
          .collection('users')
          .getFirstListItem(`email = "${cleanEmail}"`);
        if (existing) {
          return NextResponse.json(
            { success: false, error: `Ya existe una cuenta con el correo ${cleanEmail}.` },
            { status: 400 }
          );
        }
      } catch (checkErr: any) {
        // 404 es lo esperado si no existe
        if (checkErr?.status && checkErr.status !== 404) {
          console.warn('Error al verificar duplicidad de email:', checkErr?.message);
        }
      }

      const newUser = await adminPb.collection('users').create({
        email: cleanEmail,
        password,
        passwordConfirm: password,
        name: name || cleanEmail.split('@')[0],
        verified: Boolean(verified),
      });

      if (artistId) {
        try {
          await adminPb.collection('artists').update(artistId, {
            owner: newUser.id,
          });
        } catch (linkErr) {
          console.warn('Could not auto-link artist:', linkErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Usuario creado exitosamente.',
        user: newUser,
      });
    }

    // 6. Eliminar usuario
    if (action === 'delete_user') {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Falta userId' }, { status: 400 });
      }

      // Desvincular cualquier artista que tuviese a este usuario como owner
      try {
        const owned = await adminPb.collection('artists').getFullList({
          filter: `owner = "${userId}"`,
          requestKey: null,
        });
        for (const art of owned) {
          await adminPb.collection('artists').update(art.id, { owner: '' });
        }
      } catch {}

      await adminPb.collection('users').delete(userId);

      return NextResponse.json({
        success: true,
        message: 'Usuario eliminado correctamente.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Acción no reconocida' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('❌ Error en POST /api/admin/users:', err);
    return NextResponse.json(
      { success: false, error: formatPocketBaseError(err) },
      { status: err?.status || 500 }
    );
  }
}
