'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  actionText,
  actionHref,
  onActionClick,
}) => {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2a2c35] mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#f3f1ec]">{title}</h1>
        {subtitle && <p className="text-xs text-[#aba79e] mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actionText && actionHref && (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{actionText}</span>
          </Link>
        )}

        {actionText && onActionClick && !actionHref && (
          <button
            type="button"
            onClick={onActionClick}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{actionText}</span>
          </button>
        )}
      </div>
    </header>
  );
};
