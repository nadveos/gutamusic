'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Heart } from 'lucide-react';

interface LikeButtonProps {
  artistId: string;
  artistSlug?: string;
  initialLikesCount?: number;
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  artistId,
  artistSlug,
  initialLikesCount = 0,
  className = '',
}) => {
  const [likesCount, setLikesCount] = useState<number>(initialLikesCount);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const storageKey = `guta_liked_${artistId}`;
  const slugStorageKey = artistSlug ? `guta_liked_${artistSlug}` : null;

  // Read local state and synchronize with server on mount
  useEffect(() => {
    // 1. Instant local storage check
    try {
      const localLiked = localStorage.getItem(storageKey) === 'true' ||
        (slugStorageKey ? localStorage.getItem(slugStorageKey) === 'true' : false);
      if (localLiked) {
        setIsLiked(true);
      }
    } catch {}

    // 2. Fetch server state for this IP
    const syncStatus = async () => {
      try {
        const res = await fetch(`/api/artistas/${encodeURIComponent(artistId)}/like`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.likesCount === 'number') {
            setLikesCount(data.likesCount);
          }
          if (typeof data.isLiked === 'boolean') {
            setIsLiked(data.isLiked);
            try {
              localStorage.setItem(storageKey, String(data.isLiked));
              if (slugStorageKey) localStorage.setItem(slugStorageKey, String(data.isLiked));
            } catch {}
          }
        }
      } catch (err) {
        // Fallback gracefully without throwing
      }
    };

    syncStatus();
  }, [artistId, slugStorageKey, storageKey]);

  const handleToggleLike = () => {
    if (isPending) return;

    const nextIsLiked = !isLiked;
    const nextCount = Math.max(0, likesCount + (nextIsLiked ? 1 : -1));

    // Optimistic UI update
    setIsLiked(nextIsLiked);
    setLikesCount(nextCount);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 350);

    try {
      localStorage.setItem(storageKey, String(nextIsLiked));
      if (slugStorageKey) localStorage.setItem(slugStorageKey, String(nextIsLiked));
    } catch {}

    // Network request
    startTransition(async () => {
      try {
        const res = await fetch(`/api/artistas/${encodeURIComponent(artistId)}/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          if (typeof data.likesCount === 'number') {
            setLikesCount(data.likesCount);
          }
          if (typeof data.isLiked === 'boolean') {
            setIsLiked(data.isLiked);
            try {
              localStorage.setItem(storageKey, String(data.isLiked));
              if (slugStorageKey) localStorage.setItem(slugStorageKey, String(data.isLiked));
            } catch {}
          }
        } else {
          // Revert optimistic state on error
          setIsLiked(!nextIsLiked);
          setLikesCount(likesCount);
        }
      } catch (err) {
        console.error('Error toggling like:', err);
        setIsLiked(!nextIsLiked);
        setLikesCount(likesCount);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggleLike}
      disabled={isPending}
      title={isLiked ? 'Quitar Me Gusta' : 'Dar Me Gusta a este artista'}
      aria-label={isLiked ? 'Quitar Me Gusta' : 'Dar Me Gusta a este artista'}
      className={`group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border font-semibold text-xs transition-all duration-200 select-none cursor-pointer ${
        isLiked
          ? 'bg-[#d97d64]/15 border-[#d97d64] text-[#d97d64] shadow-sm shadow-[#d97d64]/10'
          : 'bg-[#24252c] border-[#31333d] text-[#aba79e] hover:text-[#f3f1ec] hover:border-[#464956] hover:bg-[#2c2e37]'
      } ${className}`}
    >
      <Heart
        className={`w-4 h-4 transition-transform duration-200 ${
          isLiked
            ? 'fill-[#d97d64] text-[#d97d64]'
            : 'text-[#aba79e] group-hover:text-[#d97d64]'
        } ${isAnimating ? 'scale-125' : 'scale-100'}`}
      />
      <span className="font-bold text-xs tracking-tight">
        {likesCount > 0 ? likesCount : 'Me gusta'}
      </span>
      {likesCount > 0 && (
        <span className="text-[10px] text-[#8c887f] font-normal hidden sm:inline">
          {likesCount === 1 ? 'like' : 'likes'}
        </span>
      )}
    </button>
  );
};
