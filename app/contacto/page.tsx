import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Sumá tu Banda / Registro de Artistas | GUTA MÚSICA',
  description:
    'Convocatoria permanente para artistas, solistas y bandas emergentes. Registrate en GUTA para autogestionar tu ficha y difusión oficial.',
};

/**
 * /contacto redirige automáticamente a /registro para centralizar
 * la postulación desde el panel del artista registrado.
 */
export default function ContactoPage() {
  redirect('/registro');
}
