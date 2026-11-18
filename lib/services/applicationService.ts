import { revalidatePath } from 'next/cache';
import { getServerAdminPb } from '../pocketbase';
import { sendArtistStatusEmail } from './emailService';
import { notifyNewApplication, ensureTelegramWebhookRegistered } from './telegramService';

export interface UpdateApplicationParams {
  id: string;
  status: 'approved' | 'rejected' | 'needs_revision';
  reason?: string;
  adminName?: string;
}

/**
 * Actualiza el estado de una postulación de forma centralizada:
 * 1. Actualiza la colección 'applications' en PocketBase (o localiza directamente en 'artists' si el ID corresponde a un artista).
 * 2. Sincroniza o crea la ficha del artista en la colección 'artists' cruzando por ID, owner (users), contactEmail y stageName.
 * 3. Envía el email transaccional al artista notificándole el cambio.
 */
export async function updateApplicationStatus({
  id,
  status,
  reason = '',
  adminName = 'Equipo de Guta',
}: UpdateApplicationParams) {
  const pb = await getServerAdminPb();

  // Asegurar que el webhook de Telegram esté apuntando al dominio oficial
  ensureTelegramWebhookRegistered().catch(() => {});

  // 1. Intentar obtener y actualizar la postulación en 'applications'
  let appRecord: any = null;
  try {
    appRecord = await pb.collection('applications').update(id, {
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminName,
      adminNotes:
        reason ||
        (status === 'approved' ? `Aprobado por ${adminName}` : `Rechazado por ${adminName}`),
    });
  } catch {
    try {
      appRecord = await pb.collection('applications').update(id, { status });
    } catch {
      // Si el ID no está en 'applications', puede ser directamente el ID de un registro en 'artists'
      appRecord = null;
    }
  }

  // 2. Obtener listas de 'artists' y 'users' para cruzar de forma 100% segura en memoria (sin depender de filtros de schema en PB)
  let allArtists: any[] = [];
  let allUsers: any[] = [];
  try {
    allArtists = await pb.collection('artists').getFullList({ requestKey: null });
  } catch (e) {
    console.warn('⚠️ No se pudo listar artists en updateApplicationStatus:', e);
  }
  try {
    allUsers = await pb.collection('users').getFullList({ requestKey: null });
  } catch {}

  const cleanEmail = (appRecord?.email || '').trim().toLowerCase();
  const cleanStageName = (appRecord?.stageName || '').trim().toLowerCase();

  const matchingUser = cleanEmail
    ? allUsers.find((u: any) => (u.email || '').trim().toLowerCase() === cleanEmail)
    : null;

  let artistRecord: any =
    allArtists.find((a: any) => a.id === id) ||
    (cleanEmail
      ? allArtists.find(
          (a: any) => (a.contactEmail || '').trim().toLowerCase() === cleanEmail
        )
      : null) ||
    (matchingUser
      ? allArtists.find((a: any) => a.owner && a.owner === matchingUser.id)
      : null) ||
    (cleanStageName
      ? allArtists.find(
          (a: any) => (a.stageName || '').trim().toLowerCase() === cleanStageName
        )
      : null) ||
    null;

  // Si tampoco encontramos appRecord ni artistRecord, lanzar error claro
  if (!appRecord && !artistRecord) {
    throw new Error(`No se encontró la postulación ni el artista con ID "${id}".`);
  }

  // Si encontramos artistRecord pero no teníamos appRecord, también buscamos si hay una postulación pendiente del mismo artista para marcarla
  if (!appRecord && artistRecord) {
    try {
      const allApps = await pb.collection('applications').getFullList({ requestKey: null });
      const artistNameLower = (artistRecord.stageName || '').trim().toLowerCase();
      const artistEmailLower = (artistRecord.contactEmail || '').trim().toLowerCase();
      const matchedApp = allApps.find(
        (ap: any) =>
          (artistEmailLower && (ap.email || '').trim().toLowerCase() === artistEmailLower) ||
          (artistNameLower && (ap.stageName || '').trim().toLowerCase() === artistNameLower)
      );
      if (matchedApp) {
        appRecord = await pb
          .collection('applications')
          .update(matchedApp.id, { status })
          .catch(() => matchedApp);
      }
    } catch {}
  }

  // Actualizar o crear el registro en 'artists'
  if (artistRecord) {
    try {
      artistRecord = await pb.collection('artists').update(artistRecord.id, {
        status,
        ...(matchingUser && !artistRecord.owner ? { owner: matchingUser.id } : {}),
        adminNotes:
          reason || (status === 'approved' ? `Aprobado por ${adminName}` : ''),
      });
    } catch {
      artistRecord = await pb.collection('artists').update(artistRecord.id, {
        status,
      });
    }
  } else if (status === 'approved' && appRecord) {
    const baseSlug = (appRecord.stageName || 'artista')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const slugExists = allArtists.some((a: any) => a.slug === baseSlug);
    const slug = slugExists
      ? `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`
      : baseSlug;

    try {
      artistRecord = await pb.collection('artists').create({
        stageName: appRecord.stageName,
        slug,
        owner: matchingUser?.id || '',
        realName: appRecord.contactName || appRecord.stageName,
        contactEmail: appRecord.email || '',
        genres: Array.isArray(appRecord.genres)
          ? appRecord.genres
          : [appRecord.genres || 'Folklore'],
        city: appRecord.city || '',
        province: appRecord.province || '',
        country: appRecord.country || 'Argentina',
        shortBio: (appRecord.bio || '').substring(0, 140),
        bio: appRecord.bio || '',
        photoUrl:
          appRecord.photoUrl ||
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800',
        bannerUrl: appRecord.photoUrl || '',
        quotes: '',
        featured: false,
        featuredOfWeek: false,
        socials: appRecord.socials || {},
        videos: [],
        discography: [],
        agenda: [],
        press: [],
        gallery: appRecord.photoUrl ? [appRecord.photoUrl] : [],
        status: 'approved',
        createdDate: new Date().toISOString().split('T')[0],
      });
    } catch (createErr) {
      console.error('Error al crear artista desde postulación aprobada:', createErr);
    }
  }

  // 3. Determinar email y nombre del artista para enviar correo de notificación
  const recipientEmail =
    appRecord?.email ||
    artistRecord?.contactEmail ||
    (artistRecord?.owner
      ? allUsers.find((u: any) => u.id === artistRecord.owner)?.email
      : '') ||
    '';
  const stageNameForEmail =
    appRecord?.stageName || artistRecord?.stageName || 'Tu proyecto musical';

  if (recipientEmail) {
    try {
      await sendArtistStatusEmail({
        to: recipientEmail,
        stageName: stageNameForEmail,
        status,
        reason,
        artistSlug: artistRecord?.slug,
      });
    } catch (emailErr) {
      console.warn('⚠️ No se pudo enviar el correo de notificación al artista:', emailErr);
    }
  }

  // 4. Invalidar caché de páginas públicas y del panel de administración
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/artistas');
    revalidatePath('/admin');
    revalidatePath('/admin/artistas');
    revalidatePath('/admin/postulaciones');
    if (artistRecord?.slug) {
      revalidatePath(`/artistas/${artistRecord.slug}`);
    }
  } catch (revalErr) {
    console.warn('⚠️ No se pudo revalidar rutas tras actualizar postulación:', revalErr);
  }

  return { success: true, appRecord, artistRecord };
}

/**
 * Crea una nueva postulación y dispara la notificación de Telegram
 */
export async function createApplicationAndNotify(payload: any) {
  const pb = await getServerAdminPb();

  const record = await pb.collection('applications').create({
    ...payload,
    status: payload.status || 'pending',
    submittedAt: payload.submittedAt || new Date().toISOString(),
  });

  // Notificar por Telegram de forma asíncrona (sin bloquear respuesta)
  try {
    await notifyNewApplication({
      id: record.id,
      stageName: record.stageName,
      contactName: record.contactName,
      email: record.email,
      phone: record.phone,
      genres: record.genres,
      city: record.city,
      province: record.province,
      country: record.country,
      bio: record.bio,
      socials: record.socials,
      photoUrl: record.photoUrl,
      message: record.message,
      referralSource:
        payload.referralSource || record.referralSource || record.socials?.referralSource,
      submittedAt: record.submittedAt,
    });
  } catch (telErr) {
    console.warn('⚠️ No se pudo enviar notificación a Telegram:', telErr);
  }

  return record;
}
