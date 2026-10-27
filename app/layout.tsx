import type { Metadata } from 'next';
import React, { Suspense } from 'react';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BrandAllianceShowcase } from '../components/BrandAllianceShowcase';
import { VoluntaryContributionBanner } from '../components/VoluntaryContributionBanner';
import { ChunkErrorListener } from '../components/ChunkErrorListener';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.meapp.com.ar';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'GUTA MÚSICA | Plataforma de Difusión de Artistas Emergentes & Cultura Popular',
    template: '%s | GUTA MÚSICA',
  },
  description: 'Descubrí la nueva generación de artistas independientes, bandas emergentes, folklore, rock, tango y música urbana de Argentina y Latinoamérica.',
  keywords: [
    'Artistas emergentes Argentina',
    'Música independiente',
    'Folklore contemporáneo',
    'Rock argentino',
    'Tango nuevo',
    'Trap y música urbana',
    'Efemérides musicales SADAIC',
    'Cosquín',
    'Guta Flores',
    'Entrevistas de música'
  ],
  authors: [{ name: 'Guta Flores' }],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/brand/guta-musica-favicon.svg', type: 'image/svg+xml' },
      { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/brand/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/brand/guta-musica-favicon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'GUTA MÚSICA | Plataforma de Artistas Emergentes',
    description: 'Medio musical federal: entrevistas exclusivas, videoteca multiformato, efemérides históricas y agenda cultural.',
    url: SITE_URL,
    siteName: 'GUTA MÚSICA',
    locale: 'es_AR',
    type: 'website',
    images: [
      {
        url: '/brand/guta-musica-logo.png',
        width: 1400,
        height: 420,
        alt: 'GUTA MÚSICA — Medio Digital de Artistas Emergentes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GUTA MÚSICA | Artistas Emergentes',
    description: 'Difusión de bandas y solistas independientes de Argentina y Latinoamérica.',
    images: ['/brand/guta-musica-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicOrganization',
    name: 'GUTA MÚSICA',
    url: SITE_URL,
    description: 'Medio de comunicación musical y plataforma de difusión de artistas emergentes.',
    founder: {
      '@type': 'Person',
      name: 'Guta Flores',
    },
  };

  return (
    <html lang="es" className="dark scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#151618] text-[#f3f1ec] antialiased selection:bg-[#d97d64] selection:text-[#151618]">
        <ChunkErrorListener />
        <Navbar />
        <main id="main-content" tabIndex={-1} className="min-h-[calc(100vh-140px)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 outline-none space-y-6">
          <Suspense fallback={null}>
            <VoluntaryContributionBanner />
          </Suspense>
          {children}
          <BrandAllianceShowcase sector="global_footer" />
        </main>
        <Footer />
      </body>
    </html>
  );
}
