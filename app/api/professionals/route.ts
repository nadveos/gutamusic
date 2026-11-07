import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { getServerAdminPb, POCKETBASE_URL } from '@/lib/pocketbase';
import {
  createProfessionalInDb,
  getProfessionalsFromDb,
  getProfessionalFeaturedStatus,
} from '@/lib/services/professionalsService';
import { getProfessionalCategoryInfo } from '@/lib/constants/professionalCategories';
import { sendTelegramMessage } from '@/lib/services/telegramService';
import { ProfessionalCategoryKey, ProfessionalModality } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('all') === 'true';
    const category = searchParams.get('category') || 'all';

    const list = await getProfessionalsFromDb({
      onlyActive: !includeInactive,
      category,
    });

    const enriched = list.map((item) => ({
      ...item,
      featuredStatus: getProfessionalFeaturedStatus(item),
    }));

    return NextResponse.json({
      success: true,
      professionals: enriched,
    });
  } catch (err: any) {
    console.error('❌ Error en GET /api/professionals:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al obtener profesionales' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      roleCategory,
      secondaryCategories = [],
      specialty = '',
      modality = 'Presencial y Online',
      city = '',
      province = '',
      country = 'Argentina',
      bio = '',
      shortBio = '',
      servicesList = [],
      photoUrl = '',
      bannerUrl = '',
      whatsapp = '',
      phone = '',
      email,
      password,
      socials = {},
      portfolioUrl = '',
    } = body;

    if (!name || !roleCategory || !email) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nombre profesional/sello, categoría y email son obligatorios.',
        },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const adminPb = await getServerAdminPb();

    let userId = '';
    let clientAuthToken: string | null = null;

    // 1. Crear o vincular cuenta de usuario en PocketBase
    try {
      const existingUser = await adminPb
        .collection('users')
        .getFirstListItem(`email = "${cleanEmail}"`);
      userId = existingUser.id;

      if (password) {
        try {
          const clientPb = new PocketBase(POCKETBASE_URL);
          const authData = await clientPb
            .collection('users')
            .authWithPassword(cleanEmail, password);
          clientAuthToken = authData.token;
        } catch {}
      }
    } catch {
      if (password && password.length >= 8) {
        try {
          const newUser = await adminPb.collection('users').create({
            email: cleanEmail,
            password,
            passwordConfirm: password,
            name: String(name).trim(),
            role: 'professional',
            verified: true,
          });
          userId = newUser.id;

          const clientPb = new PocketBase(POCKETBASE_URL);
          const authData = await clientPb
            .collection('users')
            .authWithPassword(cleanEmail, password);
          clientAuthToken = authData.token;
        } catch (createErr: any) {
          console.warn('⚠️ Aviso al crear usuario profesional en PB:', createErr?.message);
        }
      }
    }

    // 2. Crear la ficha en music_professionals con los 3 días de Destacado de Cortesía activos
    const createdProf = await createProfessionalInDb({
      name: String(name).trim(),
      roleCategory: roleCategory as ProfessionalCategoryKey,
      secondaryCategories: Array.isArray(secondaryCategories) ? secondaryCategories : [],
      specialty: String(specialty).trim(),
      modality: modality as ProfessionalModality,
      city: String(city).trim(),
      province: String(province).trim(),
      country: String(country).trim() || 'Argentina',
      bio: String(bio).trim(),
      shortBio: String(shortBio || bio).trim().slice(0, 150),
      servicesList: Array.isArray(servicesList)
        ? servicesList.map((s) => String(s).trim()).filter(Boolean)
        : [],
      photoUrl: String(photoUrl).trim(),
      bannerUrl: String(bannerUrl || photoUrl).trim(),
      whatsapp: String(whatsapp).trim(),
      phone: String(phone).trim(),
      email: cleanEmail,
      socials: socials || {},
      portfolioUrl: String(portfolioUrl).trim(),
      active: true,
      userId,
    });

    const catInfo = getProfessionalCategoryInfo(createdProf.roleCategory);
    const courtesyEndStr = createdProf.courtesyFeaturedUntil.split('T')[0];

    // 3. Notificar por Telegram
    await sendTelegramMessage({
      text: [
        `🎧 <b>¡NUEVO PROFESIONAL / SERVICIO MUSICAL REGISTRADO!</b>`,
        ``,
        `👤 <b>Nombre / Proyecto:</b> <code>${createdProf.name}</code>`,
        `🏷️ <b>Rubro:</b> ${catInfo.label}`,
        createdProf.specialty ? `🎸 <b>Especialidad:</b> ${createdProf.specialty}` : null,
        `📍 <b>Ubicación:</b> ${[createdProf.city, createdProf.province, createdProf.country].filter(Boolean).join(', ')} (${createdProf.modality})`,
        `📧 <b>Email:</b> ${createdProf.email}`,
        createdProf.whatsapp ? `📱 <b>WhatsApp:</b> ${createdProf.whatsapp}` : null,
        ``,
        `✨ <b>Destacado de Cortesía (3 días):</b> Activo hasta el ${courtesyEndStr}`,
      ]
        .filter(Boolean)
        .join('\n'),
      parseMode: 'HTML',
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      professional: {
        ...createdProf,
        featuredStatus: getProfessionalFeaturedStatus(createdProf),
      },
      token: clientAuthToken,
    });
  } catch (err: any) {
    console.error('❌ Error en POST /api/professionals:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al registrar profesional' },
      { status: 500 }
    );
  }
}
