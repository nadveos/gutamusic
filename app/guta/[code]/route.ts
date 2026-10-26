import { NextRequest, NextResponse } from 'next/server';
import { resolveShortLink } from '@/lib/services/shortUrlService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const targetPath = await resolveShortLink(code);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.meapp.com.ar';
    const redirectUrl = targetPath.startsWith('http')
      ? targetPath
      : `${siteUrl}${targetPath.startsWith('/') ? '' : '/'}${targetPath}`;

    return NextResponse.redirect(redirectUrl, { status: 307 });
  } catch (error) {
    console.error('Error en redirección de short link /guta:', error);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://guta.meapp.com.ar';
    return NextResponse.redirect(siteUrl, { status: 307 });
  }
}
