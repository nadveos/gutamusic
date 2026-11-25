import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Remitentes según el tipo de comunicación
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'GUTA MÚSICA <no-reply@guta.musica.ar>';
const REGISTRO_EMAIL =
  process.env.RESEND_REGISTER_EMAIL || 'GUTA MÚSICA <registro@guta.musica.ar>';
const CONTACTO_EMAIL =
  process.env.RESEND_CONTACT_EMAIL || 'GUTA MÚSICA <contacto@guta.musica.ar>';
const SOPORTE_EMAIL =
  process.env.RESEND_SUPPORT_EMAIL || 'GUTA MÚSICA <soporte@guta.musica.ar>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.musica.ar';

/**
 * Plantilla base con estética dark mode de GUTA MÚSICA
 */
function wrapEmailTemplate(contentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GUTA MÚSICA</title>
</head>
<body style="margin: 0; padding: 0; background-color: #121316; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f3f1ec;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #121316; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #1a1b20; border: 1px solid #2d2f38; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; background: linear-gradient(135deg, #24252c 0%, #1a1b20 100%); border-bottom: 1px solid #2d2f38;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 900; letter-spacing: 2px; color: #f3f1ec; text-transform: uppercase;">
                      GUTA <span style="color: #d97d64;">MÚSICA</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; font-weight: 700; color: #e6cca0; background-color: rgba(230, 204, 160, 0.1); border: 1px solid rgba(230, 204, 160, 0.25); padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px;">
                      Portal Artistas
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenido dinámico -->
          <tr>
            <td style="padding: 32px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #151619; border-top: 1px solid #262830; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #8c887f;">
                GUTA MÚSICA — Plataforma del Movimiento Musical Argentino
              </p>
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #aba79e;">
                Consultas generales: <a href="mailto:contacto@guta.musica.ar" style="color: #e6cca0; text-decoration: none;">contacto@guta.musica.ar</a> &bull; Asistencia al artista: <a href="mailto:soporte@guta.musica.ar" style="color: #d97d64; text-decoration: none;">soporte@guta.musica.ar</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #5a5751;">
                Si no solicitaste este correo, podés ignorarlo de forma segura.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Enviar código OTP de 6 dígitos para verificación de cuenta o inicio de sesión
 */
export async function sendOtpEmail({
  to,
  code,
  userName = 'Artista',
}: {
  to: string;
  code: string;
  userName?: string;
}) {
  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY no configurada. Código OTP en consola:', code);
    return { success: false, error: 'Resend API Key no configurada' };
  }

  const html = wrapEmailTemplate(`
    <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #f3f1ec;">
      Tu código de verificación
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #aba79e;">
      Hola <strong style="color: #f3f1ec;">${userName}</strong>, utilizá el siguiente código de 6 dígitos para verificar tu cuenta en Guta Música:
    </p>

    <!-- Caja OTP -->
    <div style="background-color: #24252c; border: 1px solid #3c3f4c; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #d97d64; display: inline-block; padding-left: 10px;">
        ${code}
      </span>
      <p style="margin: 12px 0 0 0; font-size: 12px; color: #8c887f;">
        Válido por los próximos 10 minutos. No compartas este código con nadie.
      </p>
    </div>

    <p style="margin: 24px 0 0 0; font-size: 13px; color: #aba79e; line-height: 1.5;">
      Una vez verificado tu correo podrás completar la ficha de tu proyecto musical y gestionar tu perfil en Guta Música.
    </p>
  `);

  try {
    console.log(`📬 [GUTA EMAIL] Enviando OTP a: ${to} (código: ${code}) desde: ${REGISTRO_EMAIL}`);
    const { data, error } = await resend.emails.send({
      from: REGISTRO_EMAIL,
      to,
      subject: `${code} es tu código de verificación | GUTA MÚSICA`,
      replyTo: 'soporte@guta.musica.ar',
      html,
    });

    if (error) {
      console.error('❌ Resend API Error al enviar OTP:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('❌ Error enviando email con Resend:', err);
    return { success: false, error: err?.message || 'Error al enviar email' };
  }
}

/**
 * Notificar al artista sobre el estado de su ficha (Aprobada / Necesita revisión)
 */
export async function sendArtistStatusEmail({
  to,
  stageName,
  status,
  reason,
  artistSlug,
}: {
  to: string;
  stageName: string;
  status: 'approved' | 'needs_revision' | 'rejected';
  reason?: string;
  artistSlug?: string;
}) {
  if (!resend) return { success: false, error: 'Resend no configurado' };

  let title = '';
  let badgeColor = '';
  let bodyContent = '';

  if (status === 'approved') {
    title = '¡Tu perfil ha sido APROBADO en GUTA MÚSICA! 🎉';
    badgeColor = '#93a887';
    bodyContent = `
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #aba79e;">
        El equipo de moderación ha revisado y publicado la ficha de <strong style="color: #f3f1ec;">${stageName}</strong>. Ya está visible en el directorio oficial de artistas.
      </p>
      ${
        artistSlug
          ? `
        <div style="margin: 24px 0; text-align: center;">
          <a href="${SITE_URL}/artistas/${artistSlug}" style="display: inline-block; background-color: #d97d64; color: #121316; font-weight: 800; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
            Ver Mi Perfil Público
          </a>
        </div>
      `
          : ''
      }
    `;
  } else if (status === 'needs_revision') {
    title = 'Tu perfil requiere una pequeña revisión ✍️';
    badgeColor = '#e6cca0';
    bodyContent = `
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #aba79e;">
        Hemos revisado tu postulación para <strong style="color: #f3f1ec;">${stageName}</strong> y tenemos las siguientes observaciones:
      </p>
      <div style="background-color: #24252c; border-left: 4px solid #e6cca0; padding: 16px; border-radius: 8px; margin: 16px 0; color: #f3f1ec; font-size: 13px;">
        ${reason || 'Por favor revisá los datos cargados y actualizá la información solicitada.'}
      </div>
      <div style="margin: 24px 0; text-align: center;">
        <a href="${SITE_URL}/panel-artista" style="display: inline-block; background-color: #e6cca0; color: #121316; font-weight: 800; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
          Ingresar al Panel y Editar
        </a>
      </div>
    `;
  } else {
    title = 'Actualización sobre tu postulación en GUTA MÚSICA';
    badgeColor = '#8c887f';
    bodyContent = `
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #aba79e;">
        ${reason || 'Gracias por postular tu proyecto en Guta Música. En esta oportunidad tu solicitud no pudo ser aprobada.'}
      </p>
    `;
  }

  const html = wrapEmailTemplate(`
    <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: ${badgeColor};">
      ${title}
    </h1>
    ${bodyContent}
  `);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${title} | GUTA MÚSICA`,
      replyTo: 'contacto@guta.musica.ar',
      html,
    });

    if (error) {
      console.error('❌ Resend API Error al enviar status email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

/**
 * Envía una consulta o solicitud de asistencia desde el formulario de contacto (/contacto)
 * a contacto@guta.musica.ar o soporte@guta.musica.ar según corresponda, y acuse de recibo al remitente.
 */
export async function sendContactInquiryEmail({
  name,
  email,
  phone,
  projectOrCompany,
  category,
  categoryLabel,
  message,
  ticketId,
}: {
  name: string;
  email: string;
  phone?: string;
  projectOrCompany?: string;
  category: 'comercial' | 'prensa' | 'soporte' | 'general';
  categoryLabel: string;
  message: string;
  ticketId: string;
}) {
  const isSupport = category === 'soporte';
  const targetInbox = isSupport ? 'soporte@guta.musica.ar' : 'contacto@guta.musica.ar';
  const senderAddress = isSupport ? SOPORTE_EMAIL : CONTACTO_EMAIL;

  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY no configurada. Consulta registrada en consola:', {
      ticketId,
      targetInbox,
      name,
      email,
      categoryLabel,
    });
    return { success: false, error: 'Resend no configurado' };
  }

  const safeMsg = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

  // 1. Correo interno hacia la casilla humana (contacto@ o soporte@) con replyTo al usuario
  const adminHtml = wrapEmailTemplate(`
    <div style="margin-bottom: 16px;">
      <span style="display: inline-block; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #121316; background-color: ${isSupport ? '#d97d64' : '#e6cca0'}; padding: 4px 10px; border-radius: 6px;">
        ${categoryLabel} • ${ticketId}
      </span>
    </div>
    <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #f3f1ec;">
      Nueva consulta de ${name}
    </h1>
    <div style="background-color: #24252c; border: 1px solid #353844; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px; color: #aba79e; line-height: 1.7;">
      <div><strong style="color: #f3f1ec;">Remitente:</strong> ${name}</div>
      <div><strong style="color: #f3f1ec;">Email (Responder a):</strong> <a href="mailto:${email}" style="color: #e6cca0;">${email}</a></div>
      ${phone ? `<div><strong style="color: #f3f1ec;">WhatsApp / Teléfono:</strong> ${phone}</div>` : ''}
      ${projectOrCompany ? `<div><strong style="color: #f3f1ec;">Banda / Marca / Medio:</strong> ${projectOrCompany}</div>` : ''}
      <div><strong style="color: #f3f1ec;">Canal destino:</strong> ${targetInbox}</div>
    </div>
    <div style="background-color: #151619; border-left: 4px solid #d97d64; padding: 16px; border-radius: 8px; margin-top: 16px; font-size: 14px; line-height: 1.6; color: #f3f1ec;">
      ${safeMsg}
    </div>
    <p style="margin: 20px 0 0 0; font-size: 12px; color: #8c887f;">
      💡 Podés responder directamente a este correo desde tu Gmail para contestarle a <strong>${name} (${email})</strong>.
    </p>
  `);

  // 2. Acuse de recibo para la persona que escribió
  const userHtml = wrapEmailTemplate(`
    <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #f3f1ec;">
      Recibimos tu mensaje en GUTA MÚSICA
    </h1>
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #aba79e;">
      Hola <strong style="color: #f3f1ec;">${name}</strong>, tu consulta fue derivada a nuestro canal humano <strong style="color: #e6cca0;">${targetInbox}</strong> (${categoryLabel}).
    </p>
    <div style="background-color: #24252c; border: 1px solid #353844; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px; color: #aba79e;">
      <div style="margin-bottom: 6px;"><strong style="color: #f3f1ec;">Referencia:</strong> <code>${ticketId}</code></div>
      <div style="margin-bottom: 6px;"><strong style="color: #f3f1ec;">Área de atención:</strong> ${categoryLabel}</div>
      <div><strong style="color: #f3f1ec;">Canal directo:</strong> <a href="mailto:${targetInbox}" style="color: #d97d64;">${targetInbox}</a></div>
    </div>
    <p style="margin: 16px 0 0 0; font-size: 13px; color: #aba79e; line-height: 1.6;">
      Nuestro equipo te responderá a la brevedad desde <strong style="color: #f3f1ec;">${targetInbox}</strong>. Si necesitás agregar información, podés responder directamente a este correo.
    </p>
  `);

  try {
    const [adminRes] = await Promise.all([
      resend.emails.send({
        from: senderAddress,
        to: [targetInbox],
        replyTo: email,
        subject: `[${ticketId}] ${categoryLabel} — ${name}`,
        html: adminHtml,
      }),
      resend.emails.send({
        from: senderAddress,
        to: [email],
        replyTo: targetInbox,
        subject: `Recibimos tu consulta [${ticketId}] | GUTA MÚSICA`,
        html: userHtml,
      }).catch((e) => {
        console.warn('No se pudo enviar copia de confirmación al usuario:', e);
        return null;
      }),
    ]);

    if (adminRes.error) {
      console.error('❌ Error Resend al enviar consulta de contacto:', adminRes.error);
      return { success: false, error: adminRes.error.message };
    }

    return { success: true, data: adminRes.data };
  } catch (err: any) {
    console.error('❌ Error en sendContactInquiryEmail:', err);
    return { success: false, error: err?.message || 'Error enviando consulta' };
  }
}

/**
 * Envía un correo cercano y humano desde soporte@guta.musica.ar a usuarios registrados
 * que aún no completaron la ficha de su banda/proyecto musical, ofreciéndoles ayuda
 * o carga manual respondiendo directamente al correo.
 */
export async function sendIncompleteProfileReminderEmail({
  to,
  userName = 'Artista',
}: {
  to: string;
  userName?: string;
}) {
  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY no configurada. Recordatorio omitido para:', to);
    return { success: false, error: 'Resend API Key no configurada' };
  }

  const cleanName = userName?.trim() || to.split('@')[0];

  const html = wrapEmailTemplate(`
    <h1 style="margin: 0 0 14px 0; font-size: 21px; font-weight: 800; color: #f3f1ec;">
      Hola ${cleanName}, ¿necesitás una mano para subir tu proyecto musical? 🎸
    </h1>
    <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.65; color: #aba79e;">
      Vimos que te registraste en <strong style="color: #f3f1ec;">GUTA MÚSICA</strong>, ¡gracias por sumarte a nuestra comunidad federal! Notamos que tu cuenta ya está creada, pero <strong style="color: #e6cca0;">todavía no quedó publicada la ficha de tu banda o proyecto solista</strong> en el catálogo.
    </p>
    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.65; color: #aba79e;">
      Te escribimos desde soporte para saber si tuviste algún inconveniente técnico al completar el formulario o al sincronizar tu perfil de Spotify.
    </p>

    <!-- Opción 1: Completar desde el panel -->
    <div style="background-color: #24252c; border: 1px solid #353844; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #e6cca0;">
        Opción 1 • Completarlo desde tu panel (2 minutos)
      </p>
      <p style="margin: 0 0 16px 0; font-size: 13px; line-height: 1.55; color: #aba79e;">
        Podés ingresar con tu correo y contraseña y pegar tu link de Spotify para que el sistema importe tu foto y discografía automáticamente:
      </p>
      <div style="text-align: center;">
        <a href="${SITE_URL}/panel-artista" style="display: inline-block; background-color: #d97d64; color: #121316; font-weight: 800; font-size: 13px; padding: 12px 24px; border-radius: 10px; text-decoration: none;">
          Completar Mi Ficha de Artista →
        </a>
      </div>
    </div>

    <!-- Opción 2: Nosotros lo cargamos por vos -->
    <div style="background-color: #18221c; border: 1px solid #2f4d39; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #93a887;">
        Opción 2 • ¡Nosotros lo cargamos por vos! 🤝
      </p>
      <p style="margin: 0 0 10px 0; font-size: 13px; line-height: 1.6; color: #f3f1ec;">
        Si te resultó engorroso el formulario o estás desde el celu sin tiempo, <strong>respondé directamente a este correo</strong> enviándonos estos datos básicos y nuestro equipo arma y vincula tu ficha manualmente:
      </p>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.7; color: #aba79e;">
        <li><strong style="color: #f3f1ec;">Nombre de la banda o proyecto artístico</strong></li>
        <li><strong style="color: #f3f1ec;">Ciudad y Provincia</strong></li>
        <li><strong style="color: #f3f1ec;">Género musical y breve reseña (bio)</strong></li>
        <li><strong style="color: #f3f1ec;">Link de Spotify, YouTube e Instagram</strong> (y una foto adjunta si no tenés Spotify)</li>
      </ul>
    </div>

    <p style="margin: 20px 0 0 0; font-size: 13px; color: #aba79e; line-height: 1.6;">
      Estamos a disposición para lo que necesites. ¡Esperamos escuchar tu música pronto en la plataforma!<br/>
      <strong style="color: #f3f1ec;">Equipo de Soporte — GUTA MÚSICA</strong><br/>
      <a href="mailto:soporte@guta.musica.ar" style="color: #d97d64; text-decoration: none;">soporte@guta.musica.ar</a>
    </p>
  `);

  try {
    const { data, error } = await resend.emails.send({
      from: SOPORTE_EMAIL,
      to: [to],
      replyTo: 'soporte@guta.musica.ar',
      subject: `¿Te damos una mano para publicar tu proyecto en GUTA MÚSICA? 🎸`,
      html,
    });

    if (error) {
      console.error('❌ Error Resend en sendIncompleteProfileReminderEmail:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('❌ Error enviando recordatorio de perfil incompleto:', err);
    return { success: false, error: err?.message || 'Error al enviar recordatorio' };
  }
}

/**
 * Construye el HTML del Comunicado Oficial de Transparencia y Sostenibilidad de GUTA MÚSICA
 * mantendo la estética dark mode, terracota (#d97d64), arena (#e6cca0) y salvia (#93a887).
 */
export function buildCommunityTransparencyEmailHtml(recipientName = 'Comunidad'): string {
  const cleanName = recipientName?.trim() || 'Artista / Profesional';
  const playlistUrl = 'https://open.spotify.com/playlist/5eprX7q6HoedI2nnnHEE2H';

  return wrapEmailTemplate(`
    <div style="margin-bottom: 14px;">
      <span style="display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #93a887; background-color: rgba(147, 168, 135, 0.14); border: 1px solid rgba(147, 168, 135, 0.35); padding: 4px 12px; border-radius: 9999px;">
        Comunicado Oficial a la Comunidad
      </span>
    </div>

    <h1 style="margin: 0 0 14px 0; font-size: 21px; font-weight: 900; line-height: 1.3; color: #f3f1ec;">
      Hola ${cleanName}, recordatorio importante de GUTA MÚSICA 🎶
    </h1>

    <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.65; color: #aba79e;">
      Te escribimos a vos y a todos los artistas, profesionales, sellos y miembros registrados en <strong style="color: #f3f1ec;">GUTA MÚSICA</strong> para compartirte tres puntos clave sobre cómo funciona y se sostiene nuestra plataforma:
    </p>

    <!-- 1° Gratuidad, Transparencia y Playlist Oficial -->
    <div style="background-color: #202229; border: 1px solid #323542; border-left: 4px solid #d97d64; border-radius: 12px; padding: 18px 20px; margin-bottom: 16px;">
      <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #d97d64;">
        1° • Registro 100% Gratuito y Rotación en Playlist Oficial
      </p>
      <p style="margin: 0; font-size: 13.5px; line-height: 1.65; color: #f3f1ec;">
        <strong>GUTA MÚSICA nunca solicitará por ningún medio dinero a cambio de rotación en nuestra Playlist Oficial de Spotify o por la inclusión en la web.</strong> El registro de artistas y profesionales es <strong>100% gratuito</strong>. Asimismo, ofrecemos opciones de destaques semanales o mensuales únicamente como un medio opcional para sostener el servicio online, pero <strong>no es obligatorio</strong> bajo ningún concepto.
      </p>
    </div>

    <!-- 2° Cómo se sostiene la plataforma -->
    <div style="background-color: #202229; border: 1px solid #323542; border-left: 4px solid #e6cca0; border-radius: 12px; padding: 18px 20px; margin-bottom: 16px;">
      <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #e6cca0;">
        2° • Cómo se Mantiene GUTA MÚSICA Online
      </p>
      <p style="margin: 0; font-size: 13.5px; line-height: 1.65; color: #aba79e;">
        La plataforma se mantiene activa, sin publicidad invasiva y con servidores propios gracias a tres pilares transparentes: <strong style="color: #f3f1ec;">spots para anunciantes</strong>, <strong style="color: #f3f1ec;">destaques semanales/mensuales</strong> opcionales y los <strong style="color: #f3f1ec;">aportes voluntarios</strong> de la comunidad y de los visitantes de la web.
      </p>
    </div>

    <!-- 3° Maneras de Colaborar (A, B, C) -->
    <div style="background-color: #18211b; border: 1px solid #2d4534; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #93a887;">
        3° • Tres Maneras de Colaborar con el Movimiento
      </p>

      <!-- A -->
      <div style="background-color: #141916; border: 1px solid #243629; border-radius: 10px; padding: 14px; margin-bottom: 10px;">
        <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: #f3f1ec;">
          <span style="display: inline-block; background-color: #1DB954; color: #0b110d; font-weight: 900; font-size: 11px; padding: 2px 7px; border-radius: 6px; margin-right: 6px;">A</span>
          Seguir y compartir la Playlist Oficial en Spotify
        </p>
        <p style="margin: 0 0 10px 0; font-size: 12.5px; line-height: 1.55; color: #aba79e;">
          Guardá la playlist oficial con el corazón/seguir en Spotify, escuchala y compartila en tus historias para impulsar la rotación de todos los artistas registrados:
        </p>
        <a href="${playlistUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #1DB954; color: #0c130e; font-weight: 800; font-size: 12px; padding: 8px 16px; border-radius: 8px; text-decoration: none;">
          🎧 Abrir Playlist Oficial en Spotify →
        </a>
      </div>

      <!-- B -->
      <div style="background-color: #141916; border: 1px solid #243629; border-radius: 10px; padding: 14px; margin-bottom: 10px;">
        <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: #f3f1ec;">
          <span style="display: inline-block; background-color: #e6cca0; color: #121316; font-weight: 900; font-size: 11px; padding: 2px 7px; border-radius: 6px; margin-right: 6px;">B</span>
          Compartir el sitio con colegas y amigos
        </p>
        <p style="margin: 0; font-size: 12.5px; line-height: 1.55; color: #aba79e;">
          Recomendá <a href="${SITE_URL}" style="color: #e6cca0; font-weight: 700; text-decoration: none;">guta.musica.ar</a> a conocidos, amigos, bandas, solistas, productores, DJs y profesionales para que sumen su proyecto gratis.
        </p>
      </div>

      <!-- C -->
      <div style="background-color: #141916; border: 1px solid #243629; border-radius: 10px; padding: 14px;">
        <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: #f3f1ec;">
          <span style="display: inline-block; background-color: #d97d64; color: #121316; font-weight: 900; font-size: 11px; padding: 2px 7px; border-radius: 6px; margin-right: 6px;">C</span>
          Aportes voluntarios desde la web (Argentina e Internacional)
        </p>
        <p style="margin: 0 0 10px 0; font-size: 12.5px; line-height: 1.55; color: #aba79e;">
          Podés realizar un aporte voluntario desde la misma web de manera anónima y con pago 100% seguro mediante <strong style="color: #f3f1ec;">Mercado Pago / QR Interoperable</strong> (para Argentina) y <strong style="color: #f3f1ec;">PayPal</strong> (para aportes internacionales).
        </p>
        <a href="${SITE_URL}/#colaborar" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #d97d64; color: #121316; font-weight: 800; font-size: 12px; padding: 8px 16px; border-radius: 8px; text-decoration: none;">
          💛 Colaborar o Visitar GUTA MÚSICA →
        </a>
      </div>
    </div>

    <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #aba79e;">
      Ante cualquier duda o consulta, nuestro equipo humano te atiende siempre en <a href="mailto:soporte@guta.musica.ar" style="color: #d97d64; text-decoration: none; font-weight: 700;">soporte@guta.musica.ar</a> y <a href="mailto:contacto@guta.musica.ar" style="color: #e6cca0; text-decoration: none; font-weight: 700;">contacto@guta.musica.ar</a>.<br/><br/>
      ¡Gracias por ser parte de la escena musical independiente!<br/>
      <strong style="color: #f3f1ec;">Equipo Editorial — GUTA MÚSICA</strong>
    </p>
  `);
}

/**
 * Envía el Comunicado Oficial de Transparencia y Sostenibilidad a un destinatario
 * o a una lista masiva de destinatarios registrados (usando resend.batch.send en lotes de 100).
 */
export async function sendCommunityTransparencyBroadcast(
  recipients: Array<{ email: string; name?: string }>
): Promise<{
  success: boolean;
  sentCount: number;
  failedCount: number;
  error?: string;
}> {
  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY no configurada. Envío masivo cancelado.');
    return {
      success: false,
      sentCount: 0,
      failedCount: recipients.length,
      error: 'RESEND_API_KEY no está configurada en el servidor.',
    };
  }

  // Deduplicar por email válido
  const uniqueMap = new Map<string, string>();
  for (const r of recipients) {
    const cleanEmail = (r.email || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) continue;
    if (!uniqueMap.has(cleanEmail)) {
      uniqueMap.set(cleanEmail, (r.name || '').trim() || cleanEmail.split('@')[0]);
    }
  }

  const deduped = Array.from(uniqueMap.entries()).map(([email, name]) => ({
    email,
    name,
  }));

  if (deduped.length === 0) {
    return {
      success: false,
      sentCount: 0,
      failedCount: 0,
      error: 'No se encontraron correos electrónicos válidos para enviar.',
    };
  }

  const subject =
    'Comunicado Oficial: Transparencia, Playlist de Spotify y cómo colaborar | GUTA MÚSICA';

  let sentCount = 0;
  let failedCount = 0;
  const BATCH_SIZE = 90;

  for (let i = 0; i < deduped.length; i += BATCH_SIZE) {
    const chunk = deduped.slice(i, i + BATCH_SIZE);
    const messages = chunk.map((recipient) => ({
      from: CONTACTO_EMAIL,
      to: [recipient.email],
      replyTo: 'contacto@guta.musica.ar',
      subject,
      html: buildCommunityTransparencyEmailHtml(recipient.name),
    }));

    try {
      const { error } = await resend.batch.send(messages);
      if (error) {
        console.warn('⚠️ Falló resend.batch.send, reintentando envío individual:', error);
        for (const msg of messages) {
          try {
            const single = await resend.emails.send(msg);
            if (single.error) {
              failedCount++;
            } else {
              sentCount++;
            }
          } catch {
            failedCount++;
          }
        }
      } else {
        sentCount += chunk.length;
      }
    } catch (batchErr) {
      console.warn('⚠️ Excepción en batch.send, reintentando individual:', batchErr);
      for (const msg of messages) {
        try {
          const single = await resend.emails.send(msg);
          if (single.error) {
            failedCount++;
          } else {
            sentCount++;
          }
        } catch {
          failedCount++;
        }
      }
    }
  }

  return {
    success: sentCount > 0,
    sentCount,
    failedCount,
    error: sentCount === 0 ? 'No se pudo entregar ningún correo a través de Resend.' : undefined,
  };
}
