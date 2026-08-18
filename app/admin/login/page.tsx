'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Music2, Lock, Mail, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@guta.com.ar');
  const [password, setPassword] = useState('••••••••');
  const [role, setRole] = useState<'Super Admin' | 'Editor' | 'Colaborador'>('Super Admin');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push('/admin');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#07080d] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/25">
            <Music2 className="w-6 h-6 text-black font-black" />
          </div>
          <h1 className="text-2xl font-black text-white">GUTA CMS</h1>
          <p className="text-xs text-gray-400">Acceso al Panel Editorial y Administración</p>
        </div>

        {/* Role Selector Pills */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-gray-400 block">Rol de Acceso:</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Super Admin', 'Editor', 'Colaborador'] as const).map((r) => (
              <button
                type="button"
                key={r}
                onClick={() => setRole(r)}
                className={`py-2 px-1 rounded-xl text-[11px] font-bold border transition-all ${
                  role === r
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">Correo Electrónico</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-300 font-semibold block mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Ingresando...' : `Ingresar como ${role}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-amber-400 transition-colors">
            ← Volver al portal público
          </Link>
        </div>
      </div>
    </div>
  );
}
