'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Music2,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { pb } from '@/lib/pocketbase';

export function ArtistRegisterClient() {
  const router = useRouter();

  // Estados del formulario paso 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de control de flujo
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Estados de OTP paso 2
  const [otpToken, setOtpToken] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Temporizador para reenvío de código OTP
  useEffect(() => {
    let timer: any;
    if (step === 'otp' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Manejo de envío del paso 1: Solicitar registro y enviar OTP
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Por favor completá todos los campos.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register-artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Ocurrió un error al iniciar el registro.');
        setLoading(false);
        return;
      }

      setOtpToken(data.token);
      setStep('otp');
      setResendCooldown(60);
      setCanResend(false);
      setSuccessMessage('¡Código de 6 dígitos enviado a tu correo!');

      // Focus automático en el primer input del código
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMessage('Error de conexión con el servidor. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Manejo de entrada de cada dígito OTP
  const handleDigitChange = (index: number, value: string) => {
    // Si escribe varios caracteres (ej. por autocompletar)
    if (value.length > 1) {
      handlePaste(value);
      return;
    }

    const cleanChar = value.replace(/[^0-9]/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);

    // Si tipeó un número, pasar al siguiente input automáticamente
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Soporte de Pegar (Paste) del código completo
  const handlePaste = (pastedText: string) => {
    const numbersOnly = pastedText.replace(/[^0-9]/g, '').slice(0, 6);
    if (!numbersOnly) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = numbersOnly[i] || '';
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(numbersOnly.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  // Enviar código OTP para verificación final y login
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const fullCode = otpDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Ingresá los 6 dígitos del código de verificación.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: fullCode,
          token: otpToken,
          password,
          name: name.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Código incorrecto o expirado.');
        setLoading(false);
        return;
      }

      // Guardar sesión en PocketBase del cliente
      if (data.token && data.user) {
        pb.authStore.save(data.token, data.user as any);
        if (typeof document !== 'undefined') {
          document.cookie = pb.authStore.exportToCookie({
            httpOnly: false,
            secure: false,
            sameSite: 'Lax',
          });
        }
      }

      setSuccessMessage('¡Cuenta verificada con éxito! Redirigiendo a tu panel...');
      setTimeout(() => {
        router.push('/panel-artista');
      }, 1000);
    } catch (err) {
      setErrorMessage('Error al verificar el código. Por favor intentá nuevamente.');
      setLoading(false);
    }
  };

  // Reenviar código OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'No se pudo reenviar el código.');
        setLoading(false);
        return;
      }

      setOtpToken(data.token);
      setOtpDigits(['', '', '', '', '', '']);
      setResendCooldown(60);
      setCanResend(false);
      setSuccessMessage('¡Nuevo código enviado a tu casilla!');
      inputRefs.current[0]?.focus();
    } catch (err) {
      setErrorMessage('Error al reenviar el código.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Cabecera / Identidad */}
        <div className="text-center space-y-2.5 mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#24252c] border border-[#31333d] text-[#e6cca0] text-xs font-semibold hover:border-[#d97d64] transition-colors"
          >
            <Music2 className="w-3.5 h-3.5 text-[#d97d64]" />
            <span>GUTA MÚSICA</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[#f3f1ec] tracking-tight">
            {step === 'form' ? 'Registro de Artistas' : 'Verificación de Seguridad'}
          </h1>
          <p className="text-xs sm:text-sm text-[#aba79e]">
            {step === 'form'
              ? 'Sumá tu banda, grupo o solista a la plataforma federal.'
              : `Enviamos un código de 6 dígitos a ${email}. (Revisá también tu carpeta de Spam).`}
          </p>
        </div>

        {/* Mensajes de Alerta */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#93a887]/15 border border-[#93a887]/30 text-[#93a887] text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#93a887] shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tarjeta Principal */}
        <div className="natural-card p-6 sm:p-8 rounded-2xl border border-[#2e3039] shadow-2xl relative overflow-hidden">
          {/* Luz decorativa de fondo */}
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-[#d97d64]/10 rounded-full blur-2xl pointer-events-none" />

          {/* PASO 1: Formulario de Registro */}
          {step === 'form' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Nombre de Contacto */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#aba79e] block">
                  Tu Nombre y Apellido (Contacto / Representante) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#8c887f] absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Martín Rodríguez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs placeholder:text-[#5a5751] focus:outline-none focus:border-[#d97d64] transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#aba79e] block">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8c887f] absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    placeholder="contacto@tubanda.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs placeholder:text-[#5a5751] focus:outline-none focus:border-[#d97d64] transition-colors"
                  />
                </div>
                <p className="text-[10px] text-[#8c887f]">
                  Te enviaremos un código de seguridad para verificar tu casilla.
                </p>
              </div>

              {/* Contraseña */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#aba79e] block">
                  Contraseña (mínimo 8 caracteres) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8c887f] absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs placeholder:text-[#5a5751] focus:outline-none focus:border-[#d97d64] transition-colors font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#8c887f] hover:text-[#f3f1ec]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#aba79e] block">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8c887f] absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs placeholder:text-[#5a5751] focus:outline-none focus:border-[#d97d64] transition-colors font-mono"
                  />
                </div>
              </div>

              {/* Botón de Registro */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 px-4 rounded-xl bg-[#d97d64] hover:bg-[#c86d55] text-[#151618] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#d97d64]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enviando código de seguridad...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar y Recibir Código</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* PASO 2: Verificación OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#d97d64]/10 border border-[#d97d64]/30 text-[#d97d64] flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#f3f1ec]">Ingresá el Código OTP</h3>
                <p className="text-xs text-[#aba79e]">
                  Enviamos el código de 6 dígitos a{' '}
                  <span className="font-semibold text-[#f3f1ec]">{email}</span>
                </p>

                {/* Aviso Destacado de Correo No Deseado / Spam */}
                <div className="p-3 rounded-xl bg-[#e6cca0]/10 border border-[#e6cca0]/30 text-left text-xs flex items-start gap-2.5 mt-2">
                  <AlertCircle className="w-4 h-4 text-[#e6cca0] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#e6cca0] block">
                      ¿No lo encontrás en tu bandeja de entrada?
                    </span>
                    <p className="text-[11px] text-[#aba79e] leading-relaxed">
                      Por favor revisá tu carpeta de <strong>Spam</strong> o <strong>Correo no deseado</strong>. Algunos proveedores de correo pueden derivarlo allí inicialmente.
                    </p>
                  </div>
                </div>
              </div>

              {/* 6 Casilleros para OTP */}
              <div
                className="flex items-center justify-center gap-2 sm:gap-2.5"
                onPaste={(e) => {
                  e.preventDefault();
                  handlePaste(e.clipboardData.getData('text'));
                }}
              >
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono rounded-xl bg-[#18191e] border-2 border-[#2e3039] text-[#d97d64] focus:outline-none focus:border-[#d97d64] focus:bg-[#20222a] transition-all"
                  />
                ))}
              </div>

              {/* Botón de Verificación */}
              <button
                type="submit"
                disabled={loading || otpDigits.join('').length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-[#d97d64] hover:bg-[#c86d55] text-[#151618] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#d97d64]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verificando código...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Verificar y Crear Cuenta</span>
                  </>
                )}
              </button>

              {/* Reenvío de código y volver */}
              <div className="pt-2 border-t border-[#2e3039] flex flex-col items-center gap-3 text-xs">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-[#e6cca0] hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reenviar código de verificación</span>
                  </button>
                ) : (
                  <span className="text-[#8c887f]">
                    Podrás reenviar el código en{' '}
                    <strong className="text-[#e6cca0] font-mono">{resendCooldown}s</strong>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setStep('form');
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="text-[#aba79e] hover:text-[#f3f1ec] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Modificar datos o email</span>
                </button>
              </div>
            </form>
          )}

          {/* Footer de Enlaces */}
          <div className="mt-6 pt-5 border-t border-[#2a2c35] text-center text-xs text-[#8c887f]">
            <span>¿Ya tenés una cuenta de artista? </span>
            <Link
              href="/login"
              className="text-[#d97d64] hover:underline font-semibold transition-colors"
            >
              Iniciá sesión aquí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
