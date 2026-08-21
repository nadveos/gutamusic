'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { loginAsSuperUser } from '../../lib/pocketbase';
import {
  is2FAEnabled,
  hasRegisteredPasskey,
  authenticateWithPasskey,
  verifyTotpCode,
  isWebAuthnSupported,
} from '../../lib/securityAuth';
import {
  Music2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Shield,
  Fingerprint,
  Smartphone,
  KeyRound,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';

interface AdminLoginFormProps {
  onLoginSuccess: () => void;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Super Admin' | 'Editor' | 'Colaborador'>('Super Admin');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 2FA Challenge state
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [totpCode, setTotpCode] = useState('');
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [backupCode, setBackupCode] = useState('');

  // Hardware capability state
  const [passkeysAvailable, setPasskeysAvailable] = useState(false);
  const [twoFactorActive, setTwoFactorActive] = useState(false);

  useEffect(() => {
    setPasskeysAvailable(isWebAuthnSupported() && hasRegisteredPasskey());
    setTwoFactorActive(is2FAEnabled());
  }, []);

  // 1-Click Biometric / Windows Hello Login
  const handlePasskeyLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await authenticateWithPasskey();
      if (res.success) {
        setSuccessMsg('¡Identidad verificada con Windows Hello / Biométrica!');
        setTimeout(() => {
          onLoginSuccess();
        }, 600);
      } else {
        setErrorMsg(res.error || 'Verificación de llave cancelada.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error en la verificación biométrica.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Handle Email & Password
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await loginAsSuperUser(email, password);
      if (res.success) {
        if (is2FAEnabled()) {
          // Proceed to 2FA Challenge
          setSuccessMsg('Credenciales validadas. Verificando segundo factor...');
          setTimeout(() => {
            setStep('2fa');
            setSuccessMsg('');
          }, 500);
        } else {
          // No 2FA required
          setSuccessMsg('¡Autenticado exitosamente en PocketBase!');
          setTimeout(() => {
            onLoginSuccess();
          }, 600);
        }
      } else {
        setErrorMsg(res.error || 'Credenciales de _superusers incorrectas en PocketBase (https://gutamusic.meapp.com.ar).');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err?.message || 'Error al conectar con el servidor de autenticación de PocketBase.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle 2FA Verification (TOTP or Backup Code)
  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const codeToVerify = isBackupMode ? backupCode : totpCode;
    const isValid = await verifyTotpCode(codeToVerify);

    if (isValid) {
      setSuccessMsg('¡Segundo factor verificado con éxito!');
      setTimeout(() => {
        onLoginSuccess();
      }, 500);
    } else {
      setErrorMsg(
        isBackupMode
          ? 'Código de respaldo inválido o ya utilizado.'
          : 'Código de 6 dígitos incorrecto o expirado. Verificá tu Oracle Authenticator.'
      );
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#151618] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md natural-card p-6 sm:p-8 rounded-3xl border border-[#2d2f38] shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#d97d64] flex items-center justify-center mx-auto shadow-lg shadow-[#d97d64]/20 text-[#151618]">
            <Music2 className="w-6 h-6 font-black" />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-2xl font-black text-[#f3f1ec] tracking-tight">GUTA</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-[#24252c] text-[#e6cca0] font-semibold border border-[#353844]">
              CMS
            </span>
          </div>
          <p className="text-xs text-[#aba79e]">Panel Central de Gestión Editorial & Artistas</p>
          <div className="pt-1 flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] text-[#93a887] font-mono bg-[#93a887]/10 px-2 py-0.5 rounded-full border border-[#93a887]/20">
              <Shield className="w-2.5 h-2.5" />
              PocketBase
            </span>
            {twoFactorActive && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#e6cca0] font-mono bg-[#e6cca0]/10 px-2 py-0.5 rounded-full border border-[#e6cca0]/20">
                <ShieldCheck className="w-2.5 h-2.5" />
                2FA Protegido
              </span>
            )}
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#c0909b]/15 border border-[#c0909b]/30 text-[#e6a8b4] text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-[#93a887]/15 border border-[#93a887]/30 text-[#93a887] text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: CREDENTIALS + OPTIONAL DIRECT PASSKEY */}
        {step === 'credentials' && (
          <div className="space-y-4">
            {/* Quick 1-Click Passkey Login if registered */}
            {passkeysAvailable && (
              <div className="space-y-2 pb-2 border-b border-[#2d2f38]">
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-[#202228] hover:bg-[#282a32] border border-[#3b3e4c] text-[#f3f1ec] font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 group active:scale-[0.99]"
                >
                  <Fingerprint className="w-4 h-4 text-[#d97d64] group-hover:scale-110 transition-transform" />
                  <span>Ingresar con Windows Hello / PIN / Huella</span>
                </button>
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[#2d2f38]"></div>
                  <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-[#78746c]">
                    O con usuario y contraseña
                  </span>
                  <div className="flex-grow border-t border-[#2d2f38]"></div>
                </div>
              </div>
            )}

            {/* Role Selector Pills */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-[#8c887f] block">
                Nivel de Acceso:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Super Admin', 'Editor', 'Colaborador'] as const).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border transition-all ${
                      role === r
                        ? 'bg-[#d97d64] text-[#151618] border-[#d97d64] shadow-md shadow-[#d97d64]/20'
                        : 'bg-[#202228] text-[#aba79e] border-[#2d2f38] hover:bg-[#272932] hover:text-[#f3f1ec]'
                    }`}
                  >
                    {r === 'Super Admin' ? '_superusers' : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs text-[#aba79e] font-semibold block mb-1">Correo de Acceso</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#78746c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#202228] border border-[#2d2f38] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64] transition-colors"
                    placeholder="usuario@gutamusic.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#aba79e] font-semibold block mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#78746c] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#202228] border border-[#2d2f38] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64] font-mono transition-colors"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#d97d64] hover:bg-[#c97058] text-[#151618] font-bold text-xs shadow-lg shadow-[#d97d64]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                <span>{isLoading ? 'Verificando...' : 'Continuar al Panel'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: 2FA CHALLENGE (WINDOWS HELLO / TOTP / BACKUP) */}
        {step === '2fa' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-[#2d2f38]">
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setErrorMsg('');
                }}
                className="inline-flex items-center gap-1 text-xs text-[#aba79e] hover:text-[#e6cca0] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>

              <span className="text-[11px] font-bold text-[#e6cca0] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Paso 2 de 2: Verificación 2FA
              </span>
            </div>

            {/* Quick Windows Hello option in 2FA step if available */}
            {passkeysAvailable && !isBackupMode && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#202228] hover:bg-[#282a32] border border-[#3b3e4c] text-[#f3f1ec] font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Fingerprint className="w-4 h-4 text-[#d97d64]" />
                  <span>Validar con Windows Hello / PIN</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[#2d2f38]"></div>
                  <span className="flex-shrink mx-2 text-[10px] uppercase font-bold text-[#78746c]">O ingresar código</span>
                  <div className="flex-grow border-t border-[#2d2f38]"></div>
                </div>
              </div>
            )}

            {/* TOTP or Backup Code form */}
            <form onSubmit={handle2FAVerify} className="space-y-3.5">
              {!isBackupMode ? (
                <div>
                  <label className="text-xs text-[#aba79e] font-semibold block mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-[#e6cca0]" />
                      Código de Oracle / Google Authenticator
                    </span>
                    <span className="text-[10px] text-[#78746c]">6 dígitos</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    autoFocus
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 rounded-xl bg-[#202228] border border-[#2d2f38] text-[#f3f1ec] text-lg font-mono text-center tracking-widest focus:outline-none focus:border-[#d97d64] transition-colors"
                    placeholder="000000"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs text-[#aba79e] font-semibold block mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#e6cca0]" />
                    Código de Respaldo de Emergencia
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value.toUpperCase().trim())}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#202228] border border-[#2d2f38] text-[#f3f1ec] text-sm font-mono text-center tracking-widest focus:outline-none focus:border-[#d97d64] transition-colors"
                    placeholder="XXXX-XXXX"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-[#d97d64] hover:bg-[#c97058] text-[#151618] font-bold text-xs shadow-lg shadow-[#d97d64]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
              >
                <span>{isLoading ? 'Verificando...' : 'Confirmar & Acceder'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsBackupMode(!isBackupMode);
                  setErrorMsg('');
                }}
                className="text-xs text-[#8c887f] hover:text-[#e6cca0] underline transition-colors cursor-pointer"
              >
                {isBackupMode
                  ? '← Volver a usar Oracle Authenticator'
                  : '¿No tenés acceso a tu celular? Usar código de respaldo'}
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 text-center">
          <Link href="/" className="text-xs text-[#8c887f] hover:text-[#e6cca0] transition-colors">
            ← Volver al portal público de GUTA
          </Link>
        </div>
      </div>
    </div>
  );
};

