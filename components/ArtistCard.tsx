import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Artist } from '../lib/types';
import { MapPin, ArrowRight, Play, Video } from 'lucide-react';

interface ArtistCardProps {
  artist: Artist;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist }) => {
  return (
    <article className="group relative rounded-2xl overflow-hidden glass-card border border-white/10 hover:border-amber-500/40 transition-all duration-300 flex flex-col hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1">
      {/* Thumbnail Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-900">
        <Image
          src={artist.photoUrl}
          alt={artist.stageName}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0f] via-transparent to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-amber-400 border border-amber-400/30">
            {artist.genres[0]}
          </span>
          {artist.videos.length > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/80 backdrop-blur-md text-white flex items-center gap-1">
              <Video className="w-3 h-3" />
              {artist.videos.length} {artist.videos.length === 1 ? 'Video' : 'Videos'}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <MapPin className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            <span className="truncate">{artist.city}, {artist.province}</span>
          </div>

          {/* Artist Stage Name */}
          <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors leading-tight">
            {artist.stageName}
          </h3>

          {/* Short Bio */}
          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
            {artist.shortBio}
          </p>
        </div>

        {/* Footer & CTA */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-gray-400">
            {artist.genres.slice(1, 2).map((g) => (
              <span key={g} className="text-gray-400">+{g}</span>
            ))}
          </div>

          <Link
            href={`/artistas/${artist.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors group/link"
          >
            <span>Ver perfil</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
};
