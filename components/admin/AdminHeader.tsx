'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Bell, Search, Sparkles } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  actionHref?: string;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  actionText,
  actionHref,
}) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actionText && actionHref && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{actionText}</span>
          </Link>
        )}
      </div>
    </header>
  );
};
