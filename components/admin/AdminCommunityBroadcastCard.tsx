'use client';

import React, { useState } from 'react';
import {
  Send,
  ShieldCheck,
  Music,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  RefreshCw,
} from 'lucide-react';

interface AdminCommunityBroadcastCardProps {
  totalEstimatedRecipients?: number;
}

export const AdminCommunityBroadcastCard: React.FC<
  AdminCommunityBroadcastCardProps
> = ({ totalEstimatedRecipients }) => {
  const [isSending, setIsSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [resultBanner, setResultBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleBroadcastClick = async () => {
    setIsSending(true);
    setResultBanner(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_bulk_community_reminder',
        }),
      });
      const data = await res.json();

      if (data.success) {
        setResultBanner({
          type: 'success',
          text:
            data.message ||
            `¡Comunicado enviado con éxito a ${data.sentCount} registrados!`,
        });
      } else {
        setResultBanner({
          type: 'error',
          text: data.error || 'No se pudo completar el envío masivo.',
        });
      }
    } catch (err: any) {
      setResultBanner({
        type: 'error',
        text: err?.message || 'Error de conexión al servidor.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="natural-card p-5 rounded-2xl border border-[#d97d64]/35 bg-gradient-to-br from-[#1d191a] via-[#17181d] to-[#141519] space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#d97d64]/15 border border-[#d97d64]/35 text-[#d97d64] flex items-center justify-center flex-shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-[#f3f1ec]">
                Comunicado Masivo a Todos los Registrados (Todas las Categorías)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#93a887]/15 text-[#93a887] border border-[#93a887]/35">
                Artistas • Profesionales • Usuarios • Auspiciantes
              </span>
            </div>
            <p className="text-xs text-[#aba79e] leading-relaxed">
              Envía con <strong>1 clic</strong> la plantilla oficial de GUTA MÚSICA recordando la{' '}
              <strong className="text-[#f3f1ec]">1° Gratuidad de registro y Playlist Oficial</strong>,{' '}
              <strong className="text-[#e6cca0]">2° Cómo se sostiene el sitio</strong> y{' '}
              <strong className="text-[#93a887]">3° Las 3 formas de colaborar (Spotify, Compartir y Mercado Pago / PayPal)</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="px-3.5 py-2.5 rounded-xl bg-[#20222a] hover:bg-[#2a2d37] text-[#e6cca0] border border-[#343746] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showPreview ? 'Ocultar Plantilla' : 'Ver Plantilla'}</span>
          </button>

          <button
            type="button"
            onClick={handleBroadcastClick}
            disabled={isSending}
            className="px-5 py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#121316] font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-[#d97d64]/20 disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Enviando a toda la base...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>
                  Enviar Email Masivo a Todos los Registrados
                  {typeof totalEstimatedRecipients === 'number' &&
                  totalEstimatedRecipients > 0
                    ? ` (${totalEstimatedRecipients}+)`
                    : ''}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resumen de los 3 puntos incluidos en el correo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
        <div className="p-3 rounded-xl bg-[#141519]/90 border border-[#2a2c35] flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#d97d64] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#d97d64] block">
              1° • Registro y Playlist 100% Gratis
            </span>
            <span className="text-[11px] text-[#aba79e]">
              Jamás pedimos dinero por rotación en la Playlist Oficial ni por inclusión en la web. Destaques semanales/mensuales son 100% opcionales.
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#141519]/90 border border-[#2a2c35] flex items-start gap-2.5">
          <HeartHandshake className="w-4 h-4 text-[#e6cca0] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#e6cca0] block">
              2° • Sostenibilidad Transparente
            </span>
            <span className="text-[11px] text-[#aba79e]">
              La web se mantiene online gracias a spots de anunciantes, destaques opcionales y aportes voluntarios de la comunidad.
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#141519]/90 border border-[#2a2c35] flex items-start gap-2.5">
          <Music className="w-4 h-4 text-[#1DB954] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#93a887] block">
              3° • Formas de Colaborar (A, B y C)
            </span>
            <span className="text-[11px] text-[#aba79e]">
              <strong>A)</strong> Seguir y compartir la Playlist Oficial en Spotify • <strong>B)</strong> Compartir la web • <strong>C)</strong> Aportes anónimos por Mercado Pago (AR) y PayPal (Internacional).
            </span>
          </div>
        </div>
      </div>

      {/* Resultado del envío */}
      {resultBanner && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            resultBanner.type === 'success'
              ? 'bg-[#18231c] border-[#3a5840] text-[#86efac]'
              : 'bg-[#291819] border-[#632f34] text-[#fca5a5]'
          }`}
        >
          <div className="flex items-center gap-2">
            {resultBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{resultBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setResultBanner(null)}
            className="text-[#aba79e] hover:text-[#f3f1ec]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Vista previa de la plantilla */}
      {showPreview && (
        <div className="p-5 rounded-2xl bg-[#121316] border border-[#2d2f38] space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-[#262830] pb-2.5">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#e6cca0] block">
                Vista Previa de Plantilla HTML Oficial (Dark Mode GUTA MÚSICA)
              </span>
              <span className="text-[11px] text-[#aba79e]">
                <strong>Asunto:</strong> Comunicado Oficial: Transparencia, Playlist de Spotify y cómo colaborar | GUTA MÚSICA
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="text-[#8c887f] hover:text-[#f3f1ec]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-w-xl mx-auto bg-[#1a1b20] border border-[#2d2f38] rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 bg-gradient-to-r from-[#24252c] to-[#1a1b20] border-b border-[#2d2f38] flex items-center justify-between">
              <span className="text-sm font-black tracking-widest text-[#f3f1ec]">
                GUTA <span className="text-[#d97d64]">MÚSICA</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#e6cca0]/10 text-[#e6cca0] border border-[#e6cca0]/25">
                Portal Artistas
              </span>
            </div>

            <div className="p-6 space-y-4 text-[#aba79e] leading-relaxed">
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-[#93a887] bg-[#93a887]/15 border border-[#93a887]/35 px-3 py-0.5 rounded-full">
                Comunicado Oficial a la Comunidad
              </span>

              <h4 className="text-base font-black text-[#f3f1ec]">
                Hola [Nombre del Artista / Profesional], recordatorio importante de GUTA MÚSICA 🎶
              </h4>

              <div className="p-3.5 rounded-xl bg-[#202229] border border-[#323542] border-l-4 border-l-[#d97d64] space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#d97d64] block">
                  1° • Registro 100% Gratuito y Rotación en Playlist Oficial
                </span>
                <p className="text-xs text-[#f3f1ec]">
                  <strong>GUTA MÚSICA nunca solicitará por ningún medio dinero a cambio de rotación en nuestra Playlist Oficial de Spotify o por la inclusión en la web.</strong> El registro es <strong>100% gratuito</strong>. Asimismo, ofrecemos destaques mensuales o semanales a modo de un medio opcional para sostener el servicio online, pero no es obligatorio.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#202229] border border-[#323542] border-l-4 border-l-[#e6cca0] space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#e6cca0] block">
                  2° • Cómo se Mantiene GUTA MÚSICA Online
                </span>
                <p className="text-xs text-[#aba79e]">
                  La web se mantiene gracias a <strong className="text-[#f3f1ec]">spots para anunciantes</strong>, <strong className="text-[#f3f1ec]">destaques semanales/mensuales</strong> y <strong className="text-[#f3f1ec]">aportes voluntarios</strong> de la comunidad y de visitantes de la web.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#18211b] border border-[#2d4534] space-y-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#93a887] block">
                  3° • Tres Maneras de Colaborar con el Movimiento
                </span>
                <div className="p-2.5 rounded-lg bg-[#141916] border border-[#243629] text-xs">
                  <strong className="text-[#f3f1ec]">A • Seguir y compartir la Playlist Oficial:</strong>{' '}
                  <a
                    href="https://open.spotify.com/playlist/5eprX7q6HoedI2nnnHEE2H"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1DB954] underline font-bold"
                  >
                    open.spotify.com/playlist/5eprX7q6HoedI2nnnHEE2H
                  </a>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141916] border border-[#243629] text-xs">
                  <strong className="text-[#f3f1ec]">B • Compartiendo el sitio:</strong> con conocidos, amigos, otros artistas, productores y colegas.
                </div>
                <div className="p-2.5 rounded-lg bg-[#141916] border border-[#243629] text-xs">
                  <strong className="text-[#f3f1ec]">C • Aportes voluntarios desde la web:</strong> de manera anónima y con pago seguro vía <strong>Mercado Pago</strong> (Argentina) y <strong>PayPal</strong> (Internacionales).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
