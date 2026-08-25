'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Share2, Check, Copy, MessageCircle, Send, Globe } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  variant?: 'button' | 'icon' | 'compact';
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text = '',
  url,
  variant = 'button',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Determine actual URL (prop or current window location)
  const getFullUrl = (): string => {
    if (url) {
      if (url.startsWith('http://') || url.startsWith('https://')) return url;
      if (typeof window !== 'undefined') return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
      return url;
    }
    if (typeof window !== 'undefined') return window.location.href;
    return 'https://gutamusic.meapp.com.ar';
  };

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, []);

  // Handle outside click to close dropdown menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleShareClick = async () => {
    const fullUrl = getFullUrl();
    const shareData = {
      title,
      text: text || title,
      url: fullUrl,
    };

    if (canNativeShare && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setIsOpen(true);
        }
      }
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleCopyLink = async () => {
    const fullUrl = getFullUrl();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = fullUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e: unknown) {
      console.error('Failed to copy URL:', e);
    }
  };

  const fullUrl = getFullUrl();
  const shareText = text || title;

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-[#25D366] hover:bg-[#25D366]/10',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} - ${fullUrl}`)}`,
    },
    {
      name: 'X (Twitter)',
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: 'text-[#f3f1ec] hover:bg-white/10',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`,
    },
    {
      name: 'Facebook',
      icon: Globe,
      color: 'text-[#1877F2] hover:bg-[#1877F2]/10',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'text-[#229ED9] hover:bg-[#229ED9]/10',
      href: `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(shareText)}`,
    },
  ];

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={handleShareClick}
          aria-label="Compartir"
          title="Compartir"
          className="p-2 rounded-xl bg-[#24252c] border border-[#31333d] text-[#aba79e] hover:text-[#f3f1ec] hover:border-[#464956] hover:bg-[#2c2e37] transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
        </button>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={handleShareClick}
          aria-label="Compartir"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#24252c] hover:bg-[#2c2e37] text-[#aba79e] hover:text-[#f3f1ec] border border-[#31333d] text-xs font-medium transition-colors cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5 text-[#e6cca0]" />
          <span>Compartir</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleShareClick}
          aria-label="Compartir"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#24252c] hover:bg-[#2c2e37] text-[#aba79e] hover:text-[#f3f1ec] border border-[#31333d] hover:border-[#464956] text-xs font-semibold transition-all cursor-pointer shadow-xs"
        >
          <Share2 className="w-4 h-4 text-[#e6cca0]" />
          <span>Compartir</span>
        </button>
      )}

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mb-2 sm:mb-0 sm:mt-2 w-64 rounded-2xl bg-[#1e1f24] border border-[#363842] shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
          <div className="px-2.5 py-1.5 border-b border-[#2d2f38] mb-1.5 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#e6cca0]">
              Compartir
            </span>
            <span className="text-[10px] text-[#8c887f]">GUTA MÚSICA</span>
          </div>

          {/* Social Links */}
          <div className="space-y-1">
            {shareLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-[#f3f1ec] transition-colors ${item.color}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </div>

          {/* Copy to Clipboard */}
          <div className="pt-2 border-t border-[#2d2f38] mt-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-[#151618] hover:bg-[#25262c] text-xs font-medium text-[#f3f1ec] border border-[#2d2f38] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {copied ? (
                  <Check className="w-4 h-4 text-[#93a887]" />
                ) : (
                  <Copy className="w-4 h-4 text-[#aba79e]" />
                )}
                <span>{copied ? '¡Enlace copiado!' : 'Copiar enlace'}</span>
              </div>
              {copied && (
                <span className="text-[10px] text-[#93a887] font-bold">✓ Listo</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
