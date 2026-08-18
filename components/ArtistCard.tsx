import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Artist } from '../lib/types';
import { MapPin, ArrowRight, Video } from 'lucide-react';

interface ArtistCardProps {
  artist: Artist;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  return (
    <article className="group relative rounded-xl overflow-hidden natural-card transition-colors flex flex-col justify-between">
      {/* Thumbnail Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1a1b1f]">
        <Image
          src={artist.photoUrl}
          alt={artist.stageName}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center group-hover:scale-102 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e1f24] via-transparent to-transparent opacity-90" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#1e1f24]/90 text-[#e6cca0] border border-[#3c3f4c]">
            {artist.genres[0]}
          </span>
          {artist.videos.length > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#1e1f24]/90 text-[#93a887] border border-[#3c3f4c] flex items-center gap-1">
              <Video className="w-3 h-3" />
              {artist.videos.length} {artist.videos.length === 1 ? 'Video' : 'Videos'}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#aba79e]">
            <MapPin className="w-3 h-3 text-[#d97d64] flex-shrink-0" />
            <span className="truncate">{artist.city}, {artist.province}</span>
          </div>

          {/* Artist Stage Name */}
          <h3 className="text-lg font-bold text-[#f3f1ec] group-hover:text-[#e6cca0] transition-colors leading-snug">
            {artist.stageName}
          </h3>

          {/* Short Bio */}
          <p className="text-xs text-[#aba79e] line-clamp-2 leading-relaxed">
            {artist.shortBio}
          </p>
        </div>

        {/* Footer & CTA */}
        <div className="pt-2.5 border-t border-[#2a2c35] flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-[#8c887f]">
            {artist.genres.slice(1, 2).map((g) => (
              <span key={g}>+{g}</span>
            ))}
          </div>

          <Link
            href={`/artistas/${artist.slug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#e6cca0] hover:text-[#f3f1ec] transition-colors"
          >
            <span>Ver perfil</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  );
};
