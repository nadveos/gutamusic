import { revalidatePath } from 'next/cache';
import { getServerAdminPb } from '../pocketbase';
import { sendArtistStatusEmail } from './emailService';
import { notifyNewApplication } from './telegramService';

export interface UpdateApplicationParams {
  id: string;
  status: 'approved' | 'rejected' | 'needs_revision';
  reason?: string;
  adminName?: string;
}

/**
 * Actualiza el estado de una postulación de forma centralizada:
 * 1. Actualiza la colección 'applications' en PocketBase.
 * 2. Si se aprueba, crea o actualiza la ficha del artista en la colección 'artists'.
 * 3. Envía el email transaccional al artista notificándole el cambio.
 */
export async function updateApplicationStatus({
  id,
  status,
  reason = '',
  adminName = 'Equipo de Guta',
}: UpdateApplicationParams) {
  const pb = await getServerAdminPb();

  // 1. Obtener y actualizar la postulación
  let appRecord: any;
  try {
    appRecord = await pb.collection('applications').update(id, {
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy: adminName,
      adminNotes: reason || (status === 'approved' ? `Aprobado por ${adminName}` : `Rechazado por ${adminName}`),
    });
  } catch (err: any) {
    // Si falla por campos que no existen en el schema, intentar actualizar solo status
    try {
      appRecord = await pb.collection('applications').update(id, { status });
    } catch (innerErr: any) {
      console.error('❌ Error al actualizar postulación en PocketBase:', innerErr);
      throw new Error(innerErr?.message || 'No se pudo actualizar la postulación en la base de datos');
    }
  }

  // 2. Sincronizar con la colección artists
  let artistRecord: any = null;
  if (appRecord.email || appRecord.stageName) {
    try {
      const query = [
        appRecord.email ? `contactEmail = "${appRecord.email}"` : null,
        appRecord.stageName ? `stageName = "${appRecord.stageName}"` : null,
      ]
        .filter(Boolean)
        .join(' || ');

      artistRecord = await pb.collection('artists').getFirstListItem(query);
      if (artistRecord) {
        try {
          await pb.collection('artists').update(artistRecord.id, {
            status,
            adminNotes: reason || (status === 'approved' ? `Aprobado por ${adminName}` : ''),
          });
        } catch {
          await pb.collection('artists').update(artistRecord.id, { status });
        }
      }
    } catch {
      // Si no existe perfil en artists y fue aprobado, crearlo automáticamente
      if (status === 'approved') {
        const slug = (appRecord.stageName || 'artista')
          .toLowerCase()
          .trim()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        try {
          artistRecord = await pb.collection('artists').create({
            stageName: appRecord.stageName,
            slug,
            realName: appRecord.contactName || appRecord.stageName,
            contactEmail: appRecord.email,
            genres: appRecord.genres || ['Folklore'],
            city: appRecord.city || '',
            province: appRecord.province || '',
            country: appRecord.country || 'Argentina',
            shortBio: (appRecord.bio || '').substring(0, 140) + '...',
            bio: appRecord.bio || '',
            photoUrl: appRecord.photoUrl || '',
            bannerUrl: '',
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
    }
  }

  // 3. Enviar correo de notificación al artista mediante Resend
  if (appRecord.email) {
    try {
      await sendArtistStatusEmail({
        to: appRecord.email,
        stageName: appRecord.stageName,
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
      referralSource: payload.referralSource || record.referralSource || record.socials?.referralSource,
      submittedAt: record.submittedAt,
    });
  } catch (telErr) {
    console.warn('⚠️ No se pudo enviar notificación a Telegram:', telErr);
  }

  return record;
}
