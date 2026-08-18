import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MusicDataService } from '../../../lib/api';
import { ArtistProfileClient } from './ArtistProfileClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artist = await MusicDataService.getArtistBySlug(slug);

  if (!artist) {
    return {
      title: 'Artista No Encontrado | GUTA MÚSICA',
    };
  }

  return {
    title: `${artist.stageName} | Perfil, Videos & Discografía | GUTA MÚSICA`,
    description: `${artist.shortBio} Descubrí la música, discografía, videos en vivo y próximas fechas de ${artist.stageName} (${artist.city}, ${artist.province}).`,
    openGraph: {
      title: `${artist.stageName} en GUTA MÚSICA`,
      description: artist.shortBio,
      images: [artist.photoUrl],
    },
  };
}

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artist = await MusicDataService.getArtistBySlug(slug);

  if (!artist) {
    notFound();
  }

  // Schema.org MusicGroup / Person JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: artist.stageName,
    description: artist.bio,
    image: artist.photoUrl,
    genre: artist.genres,
    locationCreated: {
      '@type': 'Place',
      name: `${artist.city}, ${artist.province}, Argentina`,
    },
    sameAs: Object.values(artist.socials).filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArtistProfileClient artist={artist} />
    </>
  );
}
