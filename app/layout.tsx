import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'GUTA MÚSICA | Plataforma de Difusión de Artistas Emergentes & Cultura Popular',
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
  openGraph: {
    title: 'GUTA MÚSICA | Plataforma de Artistas Emergentes',
    description: 'Medio musical federal: entrevistas exclusivas, videoteca multiformato, efemérides históricas y agenda cultural.',
    url: 'https://guta.com.ar',
    siteName: 'GUTA MÚSICA',
    locale: 'es_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GUTA MÚSICA | Artistas Emergentes',
    description: 'Difusión de bandas y solistas independientes de Argentina y Latinoamérica.',
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
    url: 'https://guta.com.ar',
    description: 'Medio de comunicación musical y plataforma de difusión de artistas emergentes.',
    founder: {
      '@type': 'Person',
      name: 'Guta Flores',
    },
  };

  return (
    <html lang="es" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-[#151618] text-[#f3f1ec] antialiased selection:bg-[#d97d64] selection:text-[#151618]">
        <Navbar />
        <main className="min-h-[calc(100vh-140px)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
