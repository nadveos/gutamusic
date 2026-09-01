'use client';

import React, { useState } from 'react';
import { OfficialSocialsSettings, OfficialPlatformKey } from '../../../lib/types';
import { PLATFORMS_META, PLATFORM_KEYS, SocialIcon, buildSocialUrl } from '../../../lib/socialUtils';
import { MusicDataService } from '../../../lib/api';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { OfficialSocialsBar } from '../../../components/OfficialSocialsBar';
import {
  Share2,
  Check,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Eye,
  Monitor,
  Smartphone,
  CheckCircle2,
  Radio,
  Zap,
  RotateCcw,
  Layers,
} from 'lucide-react';

interface AdminSocialsClientProps {
  initialSettings: OfficialSocialsSettings;
}

export const AdminSocialsClient: React.FC<AdminSocialsClientProps> = ({ initialSettings }) => {
  const [settings, setSettings] = useState<OfficialSocialsSettings>(initialSettings);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewLocation, setPreviewLocation] = useState<'header' | 'drawer' | 'footer'>('header');

  const handleToggle = (platform: OfficialPlatformKey) => {
    setSettings((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        active: !prev[platform]?.active,
      },
    }));
  };

  const handleHandleChange = (platform: OfficialPlatformKey, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        handle: value,
        url: buildSocialUrl(platform, value),
      },
    }));
  };

  const handleApplyGlobalHandle = () => {
    const rawHandle = settings.brandName.trim().replace(/^@+/, '') || 'sesionesrg';
    setSettings((prev) => {
      const updated = { ...prev };
      PLATFORM_KEYS.forEach((key) => {
        updated[key] = {
          ...updated[key],
          handle: rawHandle,
          url: buildSocialUrl(key, rawHandle),
          active: true,
        };
      });
      return updated;
    });

    setNotification({
      type: 'success',
      text: `¡Handle "${settings.brandName}" aplicado y activado en las 5 redes sociales!`,
    });
  };

  const handleResetToDefaults = () => {
    setSettings({
      id: settings.id,
      brandName: '@sesionesrg',
      badgeText: 'Sesiones RG Oficial',
      tiktok: { handle: 'sesionesrg', url: 'https://www.tiktok.com/@sesionesrg', active: true },
      instagram: { handle: 'sesionesrg', url: 'https://www.instagram.com/sesionesrg', active: true },
      facebook: { handle: 'sesionesrg', url: 'https://www.facebook.com/sesionesrg', active: true },
      kick: { handle: 'sesionesrg', url: 'https://kick.com/sesionesrg', active: true },
      twitch: { handle: 'sesionesrg', url: 'https://www.twitch.tv/sesionesrg', active: true },
    });
    setNotification({ type: 'success', text: 'Configuración restaurada con los valores oficiales de @sesionesrg.' });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setNotification(null);

    try {
      const updated = await MusicDataService.updateOfficialSocials(settings);
      setSettings(updated);
      setNotification({
        type: 'success',
        text: '¡Configuración de Redes Oficiales (@sesionesrg) guardada y publicada en toda la web!',
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: `Error al guardar configuración: ${err?.message || 'Error desconocido'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Count active channels with valid handle
  const activeCount = PLATFORM_KEYS.filter(
    (key) => settings[key]?.active && settings[key]?.handle && settings[key].handle.trim().length > 0
  ).length;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Redes Sociales Oficiales (@sesionesrg)"
        subtitle="Administrá la visibilidad de tus canales oficiales de TikTok, Facebook, Instagram, Kick y Twitch en el Header y todas las secciones de la web."
      />

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-[#1b2b20] border-[#31573b] text-[#86efac]'
              : 'bg-[#2b1b1f] border-[#573138] text-[#fca5a5]'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 text-[#86efac]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#fca5a5]" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/30 hover:bg-black/50"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="natural-card p-4 rounded-xl flex items-center justify-between border border-[#2e3039]">
          <div className="space-y-0.5">
            <span className="text-xs text-[#8c887f] font-medium">Marca / Handle Global</span>
            <p className="text-lg font-black text-[#f3f1ec]">{settings.brandName || '@sesionesrg'}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-terracotta-soft text-[#d97d64] flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
        </div>

        <div className="natural-card p-4 rounded-xl flex items-center justify-between border border-[#2e3039]">
          <div className="space-y-0.5">
            <span className="text-xs text-[#8c887f] font-medium">Canales Activos en Web</span>
            <p className="text-lg font-black text-[#93a887]">
              {activeCount} de {PLATFORM_KEYS.length} redes
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-sage-soft text-[#93a887] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="natural-card p-4 rounded-xl flex items-center justify-between border border-[#2e3039]">
          <div className="space-y-0.5">
            <span className="text-xs text-[#8c887f] font-medium">Streaming & Lives</span>
            <p className="text-lg font-black text-[#e6cca0]">Kick & Twitch</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-sand-soft text-[#e6cca0] flex items-center justify-center">
            <Radio className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Platform Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Global Branding Card */}
          <div className="natural-card p-5 rounded-2xl border border-[#2d2f38] space-y-4">
            <div className="flex items-center justify-between border-b border-[#2a2c35] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-terracotta-soft text-[#d97d64]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#f3f1ec]">Identidad de Marca (@sesionesrg)</h3>
                  <p className="text-[11px] text-[#8c887f]">Configurá el nombre global y atajo para todas las redes</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetToDefaults}
                className="text-[11px] text-[#8c887f] hover:text-[#e6cca0] flex items-center gap-1 transition-colors"
                title="Restaurar valores sugeridos"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#aba79e]">Nombre de la Marca / Handle *</label>
                <input
                  type="text"
                  value={settings.brandName}
                  onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
                  placeholder="@sesionesrg"
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs font-semibold focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#aba79e]">Texto del Badge (Opcional)</label>
                <input
                  type="text"
                  value={settings.badgeText || ''}
                  onChange={(e) => setSettings({ ...settings, badgeText: e.target.value })}
                  placeholder="Sesiones RG Oficial"
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>
            </div>

            {/* Quick Autofill Action Button */}
            <div className="pt-2 flex items-center justify-between bg-[#141519] p-3 rounded-xl border border-[#24252c]">
              <div className="text-[11px] text-[#aba79e]">
                <span className="font-semibold text-[#f3f1ec] block">¿Mismo usuario en todas las redes?</span>
                <span className="text-[#78746c]">Completá y activá automáticamente TikTok, Instagram, Facebook, Kick y Twitch.</span>
              </div>
              <button
                type="button"
                onClick={handleApplyGlobalHandle}
                className="px-3 py-1.5 rounded-lg bg-[#252833] hover:bg-[#303444] text-[#e6cca0] border border-[#3c4155] text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-[#e6cca0]" />
                <span>Aplicar a todas</span>
              </button>
            </div>
          </div>

          {/* Social Networks Granular Config Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8c887f]">
                Configuración por Plataforma ({PLATFORM_KEYS.length})
              </h3>
              <span className="text-[11px] text-[#78746c]">
                Solo se mostrarán si están <strong>activas</strong> y con <strong>handle</strong>
              </span>
            </div>

            {PLATFORM_KEYS.map((key) => {
              const meta = PLATFORMS_META[key];
              const channel = settings[key] || { handle: '', active: false };
              const currentUrl = channel.url || buildSocialUrl(key, channel.handle);
              const isLiveStream = key === 'kick' || key === 'twitch';

              return (
                <div
                  key={key}
                  className={`natural-card p-4 rounded-2xl border transition-all duration-200 ${
                    channel.active && channel.handle
                      ? 'border-[#2f3240] bg-[#18191e]'
                      : 'border-[#24252c] bg-[#141519]/70 opacity-75'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#24262f]">
                    {/* Brand header */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform"
                        style={{ backgroundColor: `${meta.brandColor}18`, color: meta.brandColor }}
                      >
                        <SocialIcon platform={key} className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#f3f1ec]">{meta.name}</h4>
                          {isLiveStream && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase tracking-wider bg-sand-soft text-[#e6cca0]">
                              Live Stream
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#78746c]">{meta.badgeLabel}</p>
                      </div>
                    </div>

                    {/* Active Toggle Switch */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className={`text-[11px] font-semibold ${channel.active ? 'text-[#93a887]' : 'text-[#78746c]'}`}>
                        {channel.active ? 'Activo' : 'Pausado'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggle(key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          channel.active ? 'bg-[#93a887]' : 'bg-[#2a2c35]'
                        }`}
                        role="switch"
                        aria-checked={channel.active}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            channel.active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Input field & computed URL preview */}
                  <div className="pt-3 space-y-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[#aba79e] flex items-center justify-between">
                        <span>Usuario / Handle o Enlace Directo</span>
                        <span className="text-[10px] text-[#78746c] font-mono">{meta.prefixDisplay}</span>
                      </label>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={channel.handle}
                          onChange={(e) => handleHandleChange(key, e.target.value)}
                          placeholder={meta.placeholder}
                          className="flex-1 px-3 py-2 rounded-xl bg-[#121316] border border-[#2c2f3a] text-[#f3f1ec] text-xs font-mono focus:outline-none focus:border-[#d97d64]"
                        />

                        {currentUrl && (
                          <a
                            href={currentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-[#20222a] hover:bg-[#2a2c36] text-[#aba79e] hover:text-[#f3f1ec] border border-[#2f3240] text-xs flex items-center gap-1 transition-colors flex-shrink-0"
                            title="Probar enlace en pestaña nueva"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#e6cca0]" />
                            <span className="hidden sm:inline">Probar</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Computed link indicator */}
                    {channel.handle ? (
                      <div className="flex items-center gap-1.5 text-[10px] text-[#78746c] truncate">
                        <span className="text-[#93a887]">URL generada:</span>
                        <span className="text-[#a09c93] font-mono truncate">{currentUrl}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#e6cca0]/70 italic">
                        ⚠️ Sin handle configurado: este icono permanecerá oculto en la web.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Footer Bar */}
          <div className="sticky bottom-4 z-20 natural-card p-4 rounded-2xl border border-[#2d2f38] flex items-center justify-between shadow-2xl bg-[#18191e]/95 backdrop-blur-md">
            <div className="text-xs text-[#aba79e]">
              <span className="font-semibold text-[#f3f1ec]">{activeCount} redes activas</span>
              <span className="hidden sm:inline text-[#78746c]"> que se verán en el Header y Footer.</span>
            </div>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-[#d97d64]/20 disabled:opacity-50 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar y Publicar RRSS'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Real-Time Visual Simulator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="natural-card p-5 rounded-2xl border border-[#2d2f38] space-y-4 sticky top-4">
            <div className="flex items-center justify-between border-b border-[#262832] pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#e6cca0]" />
                <h3 className="text-xs font-bold text-[#f3f1ec] uppercase tracking-wider">
                  Simulador en Tiempo Real
                </h3>
              </div>

              {/* Device Selector */}
              <div className="flex items-center gap-1 bg-[#141519] p-0.5 rounded-lg border border-[#2e3039]">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1 rounded text-[10px] flex items-center gap-1 transition-colors ${
                    previewDevice === 'desktop'
                      ? 'bg-[#282a33] text-[#f3f1ec] font-bold'
                      : 'text-[#8c887f] hover:text-[#aba79e]'
                  }`}
                  title="Vista de Escritorio"
                >
                  <Monitor className="w-3 h-3" />
                  <span>PC</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1 rounded text-[10px] flex items-center gap-1 transition-colors ${
                    previewDevice === 'mobile'
                      ? 'bg-[#282a33] text-[#f3f1ec] font-bold'
                      : 'text-[#8c887f] hover:text-[#aba79e]'
                  }`}
                  title="Vista Móvil"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Móvil</span>
                </button>
              </div>
            </div>

            {/* Location selector tabs (Header / Drawer / Footer) */}
            <div className="flex items-center gap-1 p-1 bg-[#141519] rounded-xl border border-[#24252c] text-xs">
              <button
                type="button"
                onClick={() => setPreviewLocation('header')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-colors ${
                  previewLocation === 'header'
                    ? 'bg-[#262833] text-[#e6cca0] shadow-sm'
                    : 'text-[#8c887f] hover:text-[#f3f1ec]'
                }`}
              >
                Header Topbar
              </button>
              <button
                type="button"
                onClick={() => setPreviewLocation('drawer')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-colors ${
                  previewLocation === 'drawer'
                    ? 'bg-[#262833] text-[#e6cca0] shadow-sm'
                    : 'text-[#8c887f] hover:text-[#f3f1ec]'
                }`}
              >
                Menú Drawer Móvil
              </button>
              <button
                type="button"
                onClick={() => setPreviewLocation('footer')}
                className={`flex-1 py-1.5 px-2 rounded-lg font-semibold text-[11px] transition-colors ${
                  previewLocation === 'footer'
                    ? 'bg-[#262833] text-[#e6cca0] shadow-sm'
                    : 'text-[#8c887f] hover:text-[#f3f1ec]'
                }`}
              >
                Footer Global
              </button>
            </div>

            {/* Simulated browser viewport */}
            <div className="rounded-xl border border-[#343846] bg-[#0e0f12] overflow-hidden shadow-2xl">
              {/* Fake browser bar */}
              <div className="bg-[#1c1d24] px-3 py-1.5 border-b border-[#2d2f38] flex items-center justify-between text-[10px] text-[#78746c]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#ef4444]/70" />
                  <span className="w-2 h-2 rounded-full bg-[#eab308]/70" />
                  <span className="w-2 h-2 rounded-full bg-[#22c55e]/70" />
                </div>
                <span className="font-mono text-[9px] text-[#aba79e]">gutamusic.meapp.com.ar</span>
                <span className="text-[9px]">GUTA CMS</span>
              </div>

              {/* Viewport content */}
              <div className="p-4 bg-[#151618]">
                {previewLocation === 'header' && (
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#78746c]">
                      Header Ticker (Superior):
                    </div>
                    <div className="bg-[#18191e] p-2.5 rounded-xl border border-[#2a2c34] flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-[#e6cca0] font-bold truncate max-w-[40%]">
                        <span>GUTA MÚSICA</span>
                      </div>
                      <OfficialSocialsBar settings={settings} variant="header" />
                    </div>
                  </div>
                )}

                {previewLocation === 'drawer' && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#78746c]">
                      Menú Desplegable en Móviles:
                    </div>
                    <div className="bg-[#1c1d22] p-3 rounded-xl border border-[#2d2f38]">
                      <OfficialSocialsBar settings={settings} variant="drawer" />
                    </div>
                  </div>
                )}

                {previewLocation === 'footer' && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#78746c]">
                      Bloque Institucional de Pie de Página:
                    </div>
                    <div className="bg-[#111214] p-3 rounded-xl border border-[#24262f]">
                      <OfficialSocialsBar settings={settings} variant="footer" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Information notes */}
            <div className="p-3.5 rounded-xl bg-[#191a20] border border-[#2a2c35] text-[11px] text-[#aba79e] space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#93a887] font-semibold text-[10px]">
                <Layers className="w-3.5 h-3.5" />
                <span>Comportamiento en Producción:</span>
              </div>
              <ul className="space-y-1 text-[10px] text-[#8c887f] list-disc list-inside leading-relaxed">
                <li>Los cambios se reflejan inmediatamente en todas las secciones.</li>
                <li>Si pausás un canal o dejás el campo vacío, su logo no ocupará espacio.</li>
                <li>Los iconos incluyen enlaces seguros con <code>rel="noopener noreferrer"</code>.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
