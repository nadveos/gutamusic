import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Remitente: usa el configurado en .env.local o el dominio verificado en Resend (guta.meapp.com.ar)
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'GUTA MÚSICA <no-reply@guta.meapp.com.ar>';

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
    console.log(`📬 [GUTA EMAIL] Enviando OTP a: ${to} (código: ${code}) desde: ${FROM_EMAIL}`);
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${code} es tu código de verificación | GUTA MÚSICA`,
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
          <a href="https://guta.meapp.com.ar/artistas/${artistSlug}" style="display: inline-block; background-color: #d97d64; color: #121316; font-weight: 800; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
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
        <a href="https://guta.meapp.com.ar/panel-artista" style="display: inline-block; background-color: #e6cca0; color: #121316; font-weight: 800; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none;">
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
