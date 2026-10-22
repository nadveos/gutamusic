'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Music2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { pb } from '@/lib/pocketbase';

export function ArtistLoginClient() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Ingresá tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const authData = await pb.collection('users').authWithPassword(cleanEmail, password);

      if (typeof document !== 'undefined') {
        document.cookie = pb.authStore.exportToCookie({
          httpOnly: false,
          secure: false,
          sameSite: 'Lax',
        });
      }

      setSuccessMessage('¡Inicio de sesión exitoso! Ingresando...');
      setTimeout(() => {
        router.push('/panel-artista');
      }, 800);
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Credenciales incorrectas o usuario no encontrado.'
      );
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
            Acceso para Artistas
          </h1>
          <p className="text-xs sm:text-sm text-[#aba79e]">
            Ingresá a tu panel para gestionar tu música, fechas y videos.
          </p>
        </div>

        {/* Alertas */}
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

        {/* Tarjeta de Login */}
        <div className="natural-card p-6 sm:p-8 rounded-2xl border border-[#2e3039] shadow-2xl relative overflow-hidden">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#aba79e] block">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8c887f] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs placeholder:text-[#5a5751] focus:outline-none focus:border-[#d97d64] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#aba79e] block">
                Contraseña
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 rounded-xl bg-[#d97d64] hover:bg-[#c86d55] text-[#151618] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#d97d64]/20 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Ingresando al panel...</span>
                </>
              ) : (
                <>
                  <span>Ingresar a Mi Panel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Links inferiores */}
          <div className="mt-6 pt-5 border-t border-[#2a2c35] text-center text-xs text-[#8c887f] space-y-2">
            <div>
              <span>¿No tenés una cuenta de artista? </span>
              <Link
                href="/registro"
                className="text-[#d97d64] hover:underline font-semibold transition-colors"
              >
                Registrá tu banda gratis
              </Link>
            </div>
            <div>
              <Link
                href="/"
                className="text-[#aba79e] hover:text-[#f3f1ec] transition-colors"
              >
                ← Volver al sitio principal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
