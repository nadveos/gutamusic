import { NextRequest, NextResponse } from 'next/server';
import { checkDonationQrPayment } from '@/lib/services/mercadopagoService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get('ref') || '';

  if (!ref) {
    return NextResponse.json({ paid: false });
  }

  const result = await checkDonationQrPayment(ref);
  return NextResponse.json(result);
}
