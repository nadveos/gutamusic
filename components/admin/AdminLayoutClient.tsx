'use client';

import React, { useState, useEffect } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminLoginForm } from './AdminLoginForm';
import { pb, isSuperUserAuthenticated } from '../../lib/pocketbase';
import { Menu, Music2 } from 'lucide-react';
import Link from 'next/link';

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    if (typeof window !== 'undefined') {
      const valid = isSuperUserAuthenticated();
      const localSession = localStorage.getItem('guta_admin_logged') === 'true';
      return valid || localSession;
    }
    return null;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check and confirm auth state on mount
    const valid = isSuperUserAuthenticated();
    const localSession = typeof window !== 'undefined' && localStorage.getItem('guta_admin_logged') === 'true';
    setIsAuthenticated(valid || localSession);

    // Subscribe to PocketBase auth changes
    const unsub = pb.authStore.onChange((token, model) => {
      const isAuth = Boolean(token && model);
      if (isAuth) {
        localStorage.setItem('guta_admin_logged', 'true');
      }
      setIsAuthenticated(isAuth || (typeof window !== 'undefined' && localStorage.getItem('guta_admin_logged') === 'true'));
    });

    return () => {
      unsub();
    };
  }, []);

  const handleLoginSuccess = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('guta_admin_logged', 'true');
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('guta_admin_logged');
    }
    pb.authStore.clear();
    setIsAuthenticated(false);
  };

  // Loading state while checking local auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#151618] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#d97d64] flex items-center justify-center animate-pulse text-[#151618]">
            <Music2 className="w-5 h-5 font-bold" />
          </div>
          <span className="text-xs text-[#aba79e] font-medium">Cargando panel GUTA CMS...</span>
        </div>
      </div>
    );
  }

  // Not authenticated: render standalone login form
  if (!isAuthenticated) {
    return <AdminLoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  // Authenticated: render responsive dashboard with mobile bar & drawer
  return (
    <div className="min-h-screen bg-[#151618] flex flex-col md:flex-row text-[#aba79e]">
      {/* Mobile Top Navigation Bar */}
      <header className="md:hidden sticky top-0 z-40 bg-[#18191e] border-b border-[#2a2c35] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-[#202228] text-[#aba79e] hover:text-[#f3f1ec] border border-[#2d2f38]"
            aria-label="Abrir menú de administración"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#d97d64] flex items-center justify-center text-[#151618]">
              <Music2 className="w-4 h-4 font-bold" />
            </div>
            <span className="font-black text-sm text-[#f3f1ec]">GUTA CMS</span>
          </Link>
        </div>

        <div className="text-[10px] px-2 py-0.5 rounded bg-[#202228] border border-[#2d2f38] text-[#e6cca0] font-medium">
          _superusers
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 ease-in-out md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminSidebar
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onLogout={handleLogout}
        />
      </div>

      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:block flex-shrink-0">
        <AdminSidebar onLogout={handleLogout} />
      </div>

      {/* Main Content Area with responsive padding */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
