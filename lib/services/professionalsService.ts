import { getServerAdminPb } from '../pocketbase';
import {
  MusicProfessional,
  ProfessionalCategoryKey,
  ProfessionalModality,
  SocialLinks,
} from '../types';
import {
  PROFESSIONAL_COURTESY_DAYS,
  PROFESSIONAL_PAID_DAYS,
} from '../constants/professionalCategories';

const globalForProf = globalThis as unknown as {
  __professionalsCollectionChecked?: boolean;
};

export interface ProfessionalFeaturedStatus {
  isFeaturedNow: boolean;
  featuredType: 'paid' | 'courtesy' | 'none';
  daysRemaining: number;
  isExpiringSoon: boolean;
  expiryDateStr: string;
  statusBadgeLabel: string;
  countdownMessage: string;
}

export function generateProfessionalSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base || 'profesional'}-${suffix}`;
}

/**
 * Calcula en tiempo real el estado de Destacado (Pago 7 días o Cortesía 3 días) de un profesional
 */
export function getProfessionalFeaturedStatus(
  prof: Pick<
    MusicProfessional,
    'submittedAt' | 'courtesyFeaturedUntil' | 'paidFeatured' | 'paidFeaturedStart' | 'paidFeaturedUntil'
  >
): ProfessionalFeaturedStatus {
  const now = new Date();

  // 1. Verificar Destacado Semanal de Pago (7 días)
  if (prof.paidFeatured && prof.paidFeaturedUntil) {
    const untilDate = new Date(prof.paidFeaturedUntil);
    if (!isNaN(untilDate.getTime())) {
      // Si viene como YYYY-MM-DD, considerar hasta el final de ese día
      const endMs =
        prof.paidFeaturedUntil.length <= 10
          ? new Date(`${prof.paidFeaturedUntil}T23:59:59.999Z`).getTime()
          : untilDate.getTime();
      const diffMs = endMs - now.getTime();
      if (diffMs > 0) {
        const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        const expiryDateStr = new Date(endMs).toISOString().split('T')[0];
        return {
          isFeaturedNow: true,
          featuredType: 'paid',
          daysRemaining,
          isExpiringSoon: daysRemaining <= 2,
          expiryDateStr,
          statusBadgeLabel: '⭐ Destacado Semanal',
          countdownMessage:
            daysRemaining === 1
              ? '¡Aviso de vencimiento! Te queda 1 día de Profesional Destacado Semanal.'
              : `Te quedan ${daysRemaining} días de Profesional Destacado Semanal (vence el ${expiryDateStr}).`,
        };
      }
    }
  }

  // 2. Verificar Destacado de Cortesía (3 días desde el envío de la postulación)
  const courtesyEndRaw =
    prof.courtesyFeaturedUntil ||
    (prof.submittedAt
      ? new Date(
          new Date(prof.submittedAt).getTime() +
            PROFESSIONAL_COURTESY_DAYS * 24 * 60 * 60 * 1000
        ).toISOString()
      : '');

  if (courtesyEndRaw) {
    const courtesyEnd = new Date(courtesyEndRaw);
    if (!isNaN(courtesyEnd.getTime())) {
      const endMs =
        courtesyEndRaw.length <= 10
          ? new Date(`${courtesyEndRaw}T23:59:59.999Z`).getTime()
          : courtesyEnd.getTime();
      const diffMs = endMs - now.getTime();
      if (diffMs > 0) {
        const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        const expiryDateStr = new Date(endMs).toISOString().split('T')[0];
        return {
          isFeaturedNow: true,
          featuredType: 'courtesy',
          daysRemaining,
          isExpiringSoon: daysRemaining <= 1,
          expiryDateStr,
          statusBadgeLabel: '⭐ Destacado',
          countdownMessage:
            daysRemaining === 1
              ? '¡Último día! Te queda 1 día de Profesional Destacado.'
              : `Te quedan ${daysRemaining} días de Profesional Destacado (vence el ${expiryDateStr}).`,
        };
      }
    }
  }

  return {
    isFeaturedNow: false,
    featuredType: 'none',
    daysRemaining: 0,
    isExpiringSoon: false,
    expiryDateStr: '',
    statusBadgeLabel: '',
    countdownMessage:
      'Tu período de destacado ha finalizado. Tu perfil sigue publicado en el directorio general y podés activar 7 días de Destacado Semanal cuando quieras.',
  };
}

/**
 * Asegura que la colección 'music_professionals' exista en PocketBase
 */
export async function ensureProfessionalsCollection(adminPb?: any): Promise<boolean> {
  if (globalForProf.__professionalsCollectionChecked) return true;
  try {
    const pb = adminPb || (await getServerAdminPb());
    try {
      const existing = await pb.collections.getOne('music_professionals');
      if (existing) {
        globalForProf.__professionalsCollectionChecked = true;
        return true;
      }
    } catch {
      // No existe, la creamos
    }

    const fields = [
      { name: 'slug', type: 'text', required: true },
      { name: 'name', type: 'text', required: true },
      { name: 'roleCategory', type: 'text', required: true },
      { name: 'secondaryCategories', type: 'json', required: false },
      { name: 'specialty', type: 'text', required: false },
      { name: 'modality', type: 'text', required: false },
      { name: 'city', type: 'text', required: false },
      { name: 'province', type: 'text', required: false },
      { name: 'country', type: 'text', required: false },
      { name: 'bio', type: 'text', required: false },
      { name: 'shortBio', type: 'text', required: false },
      { name: 'servicesList', type: 'json', required: false },
      { name: 'photoUrl', type: 'text', required: false },
      { name: 'bannerUrl', type: 'text', required: false },
      { name: 'whatsapp', type: 'text', required: false },
      { name: 'phone', type: 'text', required: false },
      { name: 'email', type: 'text', required: false },
      { name: 'socials', type: 'json', required: false },
      { name: 'portfolioUrl', type: 'text', required: false },
      { name: 'active', type: 'bool', required: false },
      { name: 'userId', type: 'text', required: false },
      { name: 'submittedAt', type: 'text', required: false },
      { name: 'courtesyFeaturedUntil', type: 'text', required: false },
      { name: 'paidFeatured', type: 'bool', required: false },
      { name: 'paidFeaturedStart', type: 'text', required: false },
      { name: 'paidFeaturedUntil', type: 'text', required: false },
      { name: 'paymentId', type: 'text', required: false },
      { name: 'pricePaid', type: 'number', required: false },
    ];

    try {
      await pb.collections.create({
        name: 'music_professionals',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '@request.auth.id != ""',
        updateRule: '@request.auth.id != ""',
        deleteRule: '@request.auth.id != ""',
        fields,
      });
      globalForProf.__professionalsCollectionChecked = true;
      return true;
    } catch {
      await pb.collections.create({
        name: 'music_professionals',
        type: 'base',
        listRule: '',
        viewRule: '',
        schema: fields,
      });
      globalForProf.__professionalsCollectionChecked = true;
      return true;
    }
  } catch (err: any) {
    console.warn(
      '⚠️ No se pudo crear colección music_professionals, usando respaldo site_settings:',
      err?.message
    );
    return false;
  }
}

function mapRecordToProfessional(r: any): MusicProfessional {
  const parseJsonArray = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim()) {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  };

  const parseSocials = (val: any): SocialLinks => {
    if (val && typeof val === 'object' && !Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim()) {
      try {
        return JSON.parse(val);
      } catch {}
    }
    return {};
  };

  const submittedAt = r.submittedAt || r.created || new Date().toISOString();
  const courtesyFeaturedUntil =
    r.courtesyFeaturedUntil ||
    new Date(
      new Date(submittedAt).getTime() + PROFESSIONAL_COURTESY_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

  return {
    id: r.id,
    slug: r.slug || r.id,
    name: r.name || 'Profesional GUTA',
    roleCategory: (r.roleCategory || 'productor_musical') as ProfessionalCategoryKey,
    secondaryCategories: parseJsonArray(r.secondaryCategories) as ProfessionalCategoryKey[],
    specialty: r.specialty || '',
    modality: (r.modality || 'Presencial y Online') as ProfessionalModality,
    city: r.city || '',
    province: r.province || '',
    country: r.country || 'Argentina',
    bio: r.bio || '',
    shortBio: r.shortBio || (r.bio ? String(r.bio).slice(0, 150) : ''),
    servicesList: parseJsonArray(r.servicesList),
    photoUrl:
      r.photoUrl ||
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800',
    bannerUrl: r.bannerUrl || r.photoUrl || '',
    whatsapp: r.whatsapp || '',
    phone: r.phone || '',
    email: r.email || '',
    socials: parseSocials(r.socials),
    portfolioUrl: r.portfolioUrl || '',
    active: r.active !== undefined ? Boolean(r.active) : true,
    userId: r.userId || '',
    submittedAt,
    courtesyFeaturedUntil,
    paidFeatured: Boolean(r.paidFeatured),
    paidFeaturedStart: r.paidFeaturedStart || '',
    paidFeaturedUntil: r.paidFeaturedUntil || '',
    paymentId: r.paymentId || '',
    pricePaid: Number(r.pricePaid) || 0,
  };
}

/**
 * Ordena los profesionales priorizando:
 * 1) Destacados Semanales de Pago vigentes
 * 2) Destacados de Cortesía vigentes (3 días desde postulación)
 * 3) Resto por fecha de envío más reciente
 */
export function sortProfessionalsList(list: MusicProfessional[]): MusicProfessional[] {
  return [...list].sort((a, b) => {
    const statusA = getProfessionalFeaturedStatus(a);
    const statusB = getProfessionalFeaturedStatus(b);

    const rank = (s: ProfessionalFeaturedStatus) => {
      if (s.featuredType === 'paid') return 3;
      if (s.featuredType === 'courtesy') return 2;
      return 1;
    };

    const rankDiff = rank(statusB) - rank(statusA);
    if (rankDiff !== 0) return rankDiff;

    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  });
}

/**
 * Obtiene todos los profesionales registrados en PocketBase (colección + respaldo site_settings)
 */
export async function getProfessionalsFromDb(options?: {
  onlyActive?: boolean;
  category?: string;
}): Promise<MusicProfessional[]> {
  const pb = await getServerAdminPb();
  await ensureProfessionalsCollection(pb);

  const byId = new Map<string, MusicProfessional>();

  try {
    const records: any[] = await pb.collection('music_professionals').getFullList({
      requestKey: null,
    });
    for (const r of records) {
      const mapped = mapRecordToProfessional(r);
      byId.set(mapped.id, mapped);
    }
  } catch {}

  try {
    const settingsRec = await pb
      .collection('site_settings')
      .getFirstListItem('key="music_professionals_registry"', { requestKey: null });
    if (settingsRec?.data) {
      const parsed: MusicProfessional[] =
        typeof settingsRec.data === 'string'
          ? JSON.parse(settingsRec.data)
          : settingsRec.data;
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (!byId.has(item.id)) {
            byId.set(item.id, mapRecordToProfessional(item));
          }
        }
      }
    }
  } catch {}

  let list = Array.from(byId.values());

  if (options?.onlyActive) {
    list = list.filter((p) => p.active);
  }

  if (options?.category && options.category !== 'all') {
    list = list.filter(
      (p) =>
        p.roleCategory === options.category ||
        (Array.isArray(p.secondaryCategories) &&
          p.secondaryCategories.includes(options.category as ProfessionalCategoryKey))
    );
  }

  return sortProfessionalsList(list);
}

export async function getProfessionalBySlugOrId(
  slugOrId: string
): Promise<MusicProfessional | null> {
  const all = await getProfessionalsFromDb();
  return all.find((p) => p.slug === slugOrId || p.id === slugOrId) || null;
}

export async function getProfessionalByUserOrEmail(
  userId?: string,
  email?: string
): Promise<MusicProfessional | null> {
  const all = await getProfessionalsFromDb();
  const cleanEmail = email?.trim().toLowerCase();
  return (
    all.find(
      (p) =>
        (userId && p.userId === userId) ||
        (cleanEmail && p.email.toLowerCase() === cleanEmail)
    ) || null
  );
}

async function saveBackupToSiteSettings(pb: any, updatedItem: MusicProfessional, removeId?: string) {
  let existingRec: any = null;
  let currentList: MusicProfessional[] = [];

  try {
    existingRec = await pb
      .collection('site_settings')
      .getFirstListItem('key="music_professionals_registry"', { requestKey: null });
    if (existingRec?.data) {
      const parsed =
        typeof existingRec.data === 'string'
          ? JSON.parse(existingRec.data)
          : existingRec.data;
      if (Array.isArray(parsed)) currentList = parsed;
    }
  } catch {}

  if (removeId) {
    currentList = currentList.filter((i) => i.id !== removeId);
  } else {
    const idx = currentList.findIndex((i) => i.id === updatedItem.id);
    if (idx >= 0) {
      currentList[idx] = updatedItem;
    } else {
      currentList.unshift(updatedItem);
    }
  }

  const payload = {
    key: 'music_professionals_registry',
    data: JSON.stringify(currentList),
  };

  if (existingRec?.id) {
    await pb.collection('site_settings').update(existingRec.id, payload, { requestKey: null });
  } else {
    await pb.collection('site_settings').create(payload, { requestKey: null });
  }
}

/**
 * Crea un nuevo profesional con sus 3 días de Destacado de Cortesía activos desde el momento del envío
 */
export async function createProfessionalInDb(
  input: Omit<
    MusicProfessional,
    'id' | 'slug' | 'submittedAt' | 'courtesyFeaturedUntil' | 'paidFeatured'
  > & { slug?: string }
): Promise<MusicProfessional> {
  const pb = await getServerAdminPb();
  await ensureProfessionalsCollection(pb);

  const now = new Date();
  const submittedAt = now.toISOString();
  const courtesyFeaturedUntil = new Date(
    now.getTime() + PROFESSIONAL_COURTESY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const slug = input.slug || generateProfessionalSlug(input.name);

  const payload = {
    slug,
    name: input.name.trim(),
    roleCategory: input.roleCategory,
    secondaryCategories: input.secondaryCategories || [],
    specialty: input.specialty?.trim() || '',
    modality: input.modality || 'Presencial y Online',
    city: input.city?.trim() || '',
    province: input.province?.trim() || '',
    country: input.country?.trim() || 'Argentina',
    bio: input.bio?.trim() || '',
    shortBio:
      input.shortBio?.trim() || (input.bio ? input.bio.trim().slice(0, 150) : ''),
    servicesList: input.servicesList || [],
    photoUrl:
      input.photoUrl?.trim() ||
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800',
    bannerUrl: input.bannerUrl?.trim() || input.photoUrl?.trim() || '',
    whatsapp: input.whatsapp?.trim() || '',
    phone: input.phone?.trim() || '',
    email: input.email.trim().toLowerCase(),
    socials: input.socials || {},
    portfolioUrl: input.portfolioUrl?.trim() || '',
    active: input.active !== undefined ? input.active : true,
    userId: input.userId || '',
    submittedAt,
    courtesyFeaturedUntil,
    paidFeatured: false,
    paidFeaturedStart: '',
    paidFeaturedUntil: '',
    paymentId: '',
    pricePaid: 0,
  };

  try {
    const created = await pb
      .collection('music_professionals')
      .create(payload, { requestKey: null });
    const mapped = mapRecordToProfessional(created);
    await saveBackupToSiteSettings(pb, mapped).catch(() => {});
    return mapped;
  } catch (err) {
    const fallbackItem: MusicProfessional = {
      id: `prof_${Date.now()}`,
      ...payload,
    };
    await saveBackupToSiteSettings(pb, fallbackItem);
    return fallbackItem;
  }
}

/**
 * Actualiza los datos de un profesional existente
 */
export async function updateProfessionalInDb(
  id: string,
  updates: Partial<MusicProfessional>
): Promise<MusicProfessional | null> {
  const pb = await getServerAdminPb();
  await ensureProfessionalsCollection(pb);

  const existing = await getProfessionalBySlugOrId(id);
  if (!existing) return null;

  const merged: MusicProfessional = {
    ...existing,
    ...updates,
    id: existing.id,
  };

  try {
    const updatedRec = await pb
      .collection('music_professionals')
      .update(existing.id, merged, { requestKey: null });
    const mapped = mapRecordToProfessional(updatedRec);
    await saveBackupToSiteSettings(pb, mapped).catch(() => {});
    return mapped;
  } catch {
    await saveBackupToSiteSettings(pb, merged);
    return merged;
  }
}

/**
 * Elimina un profesional de PocketBase
 */
export async function deleteProfessionalFromDb(id: string): Promise<boolean> {
  const pb = await getServerAdminPb();
  try {
    await pb.collection('music_professionals').delete(id, { requestKey: null });
  } catch {}
  try {
    const dummy = {} as MusicProfessional;
    await saveBackupToSiteSettings(pb, dummy, id);
  } catch {}
  return true;
}

/**
 * Activa o extiende por 7 días corridos el Destacado Semanal de Pago para un profesional
 */
export async function activateProfessionalPaidFeatured(
  professionalId: string,
  paymentId: string,
  amountArs: number
): Promise<MusicProfessional | null> {
  const existing = await getProfessionalBySlugOrId(professionalId);
  if (!existing) return null;

  const now = new Date();
  let baseStart = now;

  // Si ya tenía un destacado pago vigente, sumamos los 7 días al vencimiento actual
  if (existing.paidFeatured && existing.paidFeaturedUntil) {
    const currentUntil = new Date(existing.paidFeaturedUntil);
    if (!isNaN(currentUntil.getTime()) && currentUntil.getTime() > now.getTime()) {
      baseStart = currentUntil;
    }
  }

  const paidFeaturedStart = now.toISOString();
  const paidFeaturedUntil = new Date(
    baseStart.getTime() + PROFESSIONAL_PAID_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  return updateProfessionalInDb(existing.id, {
    active: true,
    paidFeatured: true,
    paidFeaturedStart,
    paidFeaturedUntil,
    paymentId,
    pricePaid: amountArs,
  });
}
