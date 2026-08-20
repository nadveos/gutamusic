'use client';

import React, { useState, useEffect } from 'react';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  QrCode,
  Fingerprint,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Lock,
  Smartphone,
  Download,
  AlertTriangle,
  Laptop,
} from 'lucide-react';
import {
  generateTotpSecret,
  getTotpUri,
  verifyTotpCode,
  getStoredTotpSecret,
  setStoredTotpSecret,
  is2FAEnabled,
  set2FAEnabled,
  registerWebAuthnPasskey,
  getRegisteredPasskeys,
  RegisteredPasskey,
  isWebAuthnSupported,
  generateBackupCodes,
  getStoredBackupCodes,
} from '../../../lib/securityAuth';

export const SecurityClient: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'passkeys' | 'totp' | 'backup'>('passkeys');

  // TOTP State
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [isTotpConfigured, setIsTotpConfigured] = useState<boolean>(false);
  const [testCode, setTestCode] = useState<string>('');
  const [totpVerificationMsg, setTotpVerificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Passkeys State
  const [passkeys, setPasskeys] = useState<RegisteredPasskey[]>([]);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [passkeyMsg, setPasskeyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [webAuthnSupported, setWebAuthnSupported] = useState(true);

  // Backup Codes State
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Global 2FA Status
  const [twoFactorActive, setTwoFactorActive] = useState(false);

  useEffect(() => {
    setWebAuthnSupported(isWebAuthnSupported());
    refreshState();
  }, []);

  const refreshState = () => {
    const existingSecret = getStoredTotpSecret();
    if (existingSecret) {
      setTotpSecret(existingSecret);
      setIsTotpConfigured(true);
    } else {
      setTotpSecret(generateTotpSecret());
      setIsTotpConfigured(false);
    }

    setPasskeys(getRegisteredPasskeys());
    setBackupCodes(getStoredBackupCodes());
    setTwoFactorActive(is2FAEnabled());
  };

  // Handlers for TOTP
  const handleCopySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleGenerateNewSecret = () => {
    const newSec = generateTotpSecret();
    setTotpSecret(newSec);
    setIsTotpConfigured(false);
    setTotpVerificationMsg(null);
  };

  const handleVerifyAndActivateTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    setTotpVerificationMsg(null);

    const isValid = await verifyTotpCode(testCode, totpSecret);
    if (isValid) {
      setStoredTotpSecret(totpSecret);
      set2FAEnabled(true);
      setIsTotpConfigured(true);
      setTwoFactorActive(true);
      setTotpVerificationMsg({
        type: 'success',
        text: '¡Código 2FA validado y activado exitosamente! Oracle Authenticator está vinculado.',
      });
      setTestCode('');

      // Generate backup codes if none exist
      if (getStoredBackupCodes().length === 0) {
        setBackupCodes(generateBackupCodes());
      }
    } else {
      setTotpVerificationMsg({
        type: 'error',
        text: 'Código incorrecto o expirado. Verificá que la hora de tu dispositivo esté sincronizada.',
      });
    }
  };

  const handleDeactivateTotp = () => {
    if (confirm('¿Estás seguro de desactivar Oracle / Google Authenticator?')) {
      localStorage.removeItem('guta_admin_totp_secret');
      setIsTotpConfigured(false);
      setTotpSecret(generateTotpSecret());
      setTotpVerificationMsg(null);
      refreshState();
    }
  };

  // Handlers for Passkeys
  const handleRegisterPasskey = async () => {
    setIsRegisteringPasskey(true);
    setPasskeyMsg(null);

    const res = await registerWebAuthnPasskey('guta-superadmin', 'Super Admin GUTA MÚSICA');
    setIsRegisteringPasskey(false);

    if (res.success) {
      setPasskeyMsg({
        type: 'success',
        text: '¡Llave Windows Hello / Biométrica vinculada con éxito a este navegador!',
      });
      refreshState();
      if (getStoredBackupCodes().length === 0) {
        setBackupCodes(generateBackupCodes());
      }
    } else {
      setPasskeyMsg({
        type: 'error',
        text: res.error || 'No se pudo registrar la llave.',
      });
    }
  };

  const handleDeletePasskey = (id: string) => {
    if (confirm('¿Deseás eliminar esta llave de acceso?')) {
      const filtered = passkeys.filter((p) => p.id !== id);
      localStorage.setItem('guta_admin_webauthn_creds', JSON.stringify(filtered));
      setPasskeys(filtered);
      refreshState();
    }
  };

  // Handlers for Backup Codes
  const handleGenerateNewBackupCodes = () => {
    if (confirm('Generar nuevos códigos invalidará los anteriores. ¿Continuar?')) {
      const newCodes = generateBackupCodes();
      setBackupCodes(newCodes);
    }
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleDownloadBackupCodes = () => {
    const text = `GUTA MÚSICA - CÓDIGOS DE RESPALDO DE EMERGENCIA (2FA)\nGenerados el: ${new Date().toLocaleString()}\n\n${backupCodes.join('\n')}\n\nGuardá estos códigos en un lugar seguro. Cada uno es de un solo uso.`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guta-backup-codes-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totpUri = getTotpUri(totpSecret, 'guflo32@gmail.com', 'Guta Musica CMS');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(totpUri)}&color=f3f1ec&bgcolor=151618`;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Seguridad & Acceso Reforzado (2FA)"
        subtitle="Configuración de llaves de hardware (Windows Hello / PIN) y autenticación TOTP con Oracle Authenticator"
      />

      {/* Global Status Card */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
          twoFactorActive
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              twoFactorActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {twoFactorActive ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#f3f1ec]">
              {twoFactorActive ? 'Autenticación en 2 Pasos (2FA) ACTIVA' : '2FA No Configurado'}
            </h3>
            <p className="text-xs text-[#aba79e]">
              {twoFactorActive
                ? `Protección reforzada activa con ${passkeys.length > 0 ? 'Windows Hello / Passkeys' : ''}${
                    passkeys.length > 0 && isTotpConfigured ? ' y ' : ''
                  }${isTotpConfigured ? 'Oracle Authenticator (TOTP)' : ''}.`
                : 'Se recomienda activar al menos un método (Windows Hello o TOTP) para proteger el panel.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {twoFactorActive && (
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
              ✓ PROTEGIDO
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#2d2f38] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('passkeys')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'passkeys'
              ? 'bg-[#d97d64] text-[#151618] shadow-md shadow-[#d97d64]/20'
              : 'bg-[#202228] text-[#aba79e] hover:bg-[#282a32] hover:text-[#f3f1ec]'
          }`}
        >
          <Fingerprint className="w-4 h-4" />
          <span>Windows Hello / Passkeys ({passkeys.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('totp')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'totp'
              ? 'bg-[#d97d64] text-[#151618] shadow-md shadow-[#d97d64]/20'
              : 'bg-[#202228] text-[#aba79e] hover:bg-[#282a32] hover:text-[#f3f1ec]'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Oracle / Google Authenticator {isTotpConfigured ? '✓' : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-[#d97d64] text-[#151618] shadow-md shadow-[#d97d64]/20'
              : 'bg-[#202228] text-[#aba79e] hover:bg-[#282a32] hover:text-[#f3f1ec]'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Códigos de Respaldo ({backupCodes.length})</span>
        </button>
      </div>

      {/* Tab Content 1: Passkeys / Windows Hello */}
      {activeTab === 'passkeys' && (
        <div className="space-y-6">
          <div className="natural-card p-6 rounded-2xl border border-[#2d2f38] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2d2f38]">
              <div>
                <h3 className="text-sm font-bold text-[#f3f1ec] flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-[#e6cca0]" />
                  Llaves de Hardware (Windows Hello, PIN de Windows, Touch ID)
                </h3>
                <p className="text-xs text-[#aba79e] mt-0.5">
                  Permite iniciar sesión en 1 solo clic usando la biometría o el PIN de tu dispositivo, sin necesidad de escribir contraseñas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRegisterPasskey}
                disabled={isRegisteringPasskey || !webAuthnSupported}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs shadow-md shadow-[#d97d64]/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Fingerprint className="w-4 h-4" />
                <span>{isRegisteringPasskey ? 'Esperando Windows Hello...' : 'Vincular esta PC (Windows Hello)'}</span>
              </button>
            </div>

            {passkeyMsg && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                  passkeyMsg.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                <span>{passkeyMsg.text}</span>
              </div>
            )}

            {/* List of registered passkeys */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8c887f]">
                Llaves Registradas en este Navegador ({passkeys.length})
              </h4>

              {passkeys.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#18191e] border border-[#2e3039] text-center space-y-1">
                  <p className="text-xs text-[#aba79e]">No hay ninguna llave Windows Hello registrada todavía.</p>
                  <p className="text-[11px] text-[#78746c]">
                    Hacé clic en <strong>"Vincular esta PC (Windows Hello)"</strong> para registrar tu huella, PIN o reconocimiento facial.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {passkeys.map((pk) => (
                    <div
                      key={pk.id}
                      className="p-3.5 rounded-xl bg-[#18191e] border border-[#2e3039] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#24252c] text-[#e6cca0] flex items-center justify-center">
                          <Fingerprint className="w-4 h-4" />
                        </div>
                        <div>
                          <strong className="text-xs text-[#f3f1ec] block">{pk.name}</strong>
                          <span className="text-[10px] text-[#78746c]">
                            ID: {pk.id.substring(0, 16)}... · Creada: {new Date(pk.createdAt).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeletePasskey(pk.id)}
                        className="p-1.5 text-[#78746c] hover:text-[#c0909b] rounded-lg transition-colors cursor-pointer"
                        title="Eliminar llave"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Oracle / Google Authenticator TOTP */}
      {activeTab === 'totp' && (
        <div className="space-y-6">
          <div className="natural-card p-6 rounded-2xl border border-[#2d2f38] space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#f3f1ec] flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#e6cca0]" />
                Autenticación con Oracle Authenticator / Google Authenticator (TOTP)
              </h3>
              <p className="text-xs text-[#aba79e] mt-0.5">
                Genera un código dinámico de 6 dígitos que cambia cada 30 segundos en la app de tu celular.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* QR Code Section */}
              <div className="md:col-span-5 p-5 rounded-2xl bg-[#18191e] border border-[#2e3039] flex flex-col items-center text-center space-y-3">
                <span className="text-xs font-bold text-[#e6cca0] flex items-center gap-1.5">
                  <QrCode className="w-4 h-4" />
                  1. Escaneá este código QR
                </span>

                <div className="p-3 bg-[#151618] rounded-xl border border-[#2e3039] shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="Código QR 2FA para Oracle Authenticator"
                    width={200}
                    height={200}
                    className="rounded-lg"
                  />
                </div>

                <p className="text-[11px] text-[#78746c] max-w-xs leading-relaxed">
                  Abrí <strong>Oracle Authenticator</strong> (o Google Auth), tocá <strong>"+"</strong> y seleccioná <strong>"Escanear código QR"</strong>.
                </p>
              </div>

              {/* Secret Key & Verification Section */}
              <div className="md:col-span-7 space-y-4">
                {/* Manual Secret Key */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#f3f1ec] block">
                    2. O ingresá la clave secreta manualmente:
                  </span>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#18191e] border border-[#2e3039]">
                    <code className="text-xs font-mono font-bold text-[#e6cca0] flex-1 tracking-widest px-2 select-all">
                      {totpSecret}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="p-2 rounded-lg bg-[#24252c] text-[#aba79e] hover:text-[#f3f1ec] hover:bg-[#2d2f38] transition-colors flex items-center gap-1 text-[11px] font-semibold"
                    >
                      {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSecret ? 'Copiada' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Test & Activate Form */}
                <form onSubmit={handleVerifyAndActivateTotp} className="p-4 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-3">
                  <span className="text-xs font-bold text-[#f3f1ec] block">
                    3. Ingresá el código de 6 dígitos que muestra tu app para confirmar:
                  </span>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      required
                      placeholder="Ej: 489210"
                      value={testCode}
                      onChange={(e) => setTestCode(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#151618] border border-[#2d2f38] text-[#f3f1ec] text-base font-mono text-center tracking-widest focus:outline-none focus:border-[#d97d64]"
                    />

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors cursor-pointer shadow-sm"
                    >
                      {isTotpConfigured ? 'Revalidar Código' : 'Activar 2FA'}
                    </button>
                  </div>

                  {totpVerificationMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                        totpVerificationMsg.type === 'success'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      <span>{totpVerificationMsg.text}</span>
                    </div>
                  )}
                </form>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateNewSecret}
                    className="inline-flex items-center gap-1.5 text-xs text-[#aba79e] hover:text-[#e6cca0] transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Generar nueva clave secreta</span>
                  </button>

                  {isTotpConfigured && (
                    <button
                      type="button"
                      onClick={handleDeactivateTotp}
                      className="text-xs text-[#c0909b] hover:text-[#e6a8b4] hover:underline"
                    >
                      Desactivar Oracle Authenticator
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Emergency Backup Codes */}
      {activeTab === 'backup' && (
        <div className="space-y-6">
          <div className="natural-card p-6 rounded-2xl border border-[#2d2f38] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2d2f38]">
              <div>
                <h3 className="text-sm font-bold text-[#f3f1ec] flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#e6cca0]" />
                  Códigos de Respaldo de Emergencia ({backupCodes.length} disponibles)
                </h3>
                <p className="text-xs text-[#aba79e] mt-0.5">
                  Si perdés el celular o cambiás de computadora, podés usar estos códigos para ingresar al panel. Cada código sirve 1 sola vez.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyBackupCodes}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#24252c] text-xs font-semibold text-[#aba79e] hover:text-[#f3f1ec] hover:bg-[#2d2f38] transition-colors"
                >
                  {copiedBackup ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBackup ? 'Copiados' : 'Copiar'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBackupCodes}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar TXT</span>
                </button>
              </div>
            </div>

            {/* Grid of codes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {backupCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#18191e] border border-[#2e3039] text-center font-mono font-bold text-xs tracking-widest text-[#e6cca0]"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-[#78746c]">
                Guardalos en un administrador de contraseñas o en una nota segura.
              </span>

              <button
                type="button"
                onClick={handleGenerateNewBackupCodes}
                className="inline-flex items-center gap-1 text-xs text-[#aba79e] hover:text-[#e6cca0] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerar Códigos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
