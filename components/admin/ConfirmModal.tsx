'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Eliminar',
  cancelText = 'Cancelar',
  isDanger = true,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative w-full max-w-md bg-[#1c1d22] border border-[#333642] rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 z-10"
      >
        {/* Header */}
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDanger
                ? 'bg-[#d97d64]/15 border border-[#d97d64]/30 text-[#d97d64]'
                : 'bg-[#e6cca0]/15 border border-[#e6cca0]/30 text-[#e6cca0]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="flex-1 space-y-1 pr-6">
            <h3 id="confirm-modal-title" className="text-base font-bold text-[#f3f1ec]">
              {title}
            </h3>
            <p className="text-xs text-[#aba79e] leading-relaxed">
              {message}
            </p>
          </div>

          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8c887f] hover:text-[#f3f1ec] hover:bg-[#25272f] transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#2a2c35]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#aba79e] hover:text-[#f3f1ec] bg-[#24252c] hover:bg-[#2e303b] border border-[#353844] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6cca0]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 active:scale-95 ${
              isDanger
                ? 'bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] focus-visible:ring-[#d97d64]'
                : 'bg-[#e6cca0] hover:bg-[#d6bc90] text-[#151618] focus-visible:ring-[#e6cca0]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
