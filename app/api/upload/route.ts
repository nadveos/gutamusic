import { NextRequest, NextResponse } from 'next/server';
import { pb, loginAsSuperUser } from '@/lib/pocketbase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const collectionName = (formData.get('collection') as string) || 'media';

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'No se recibió ningún archivo válido.' },
        { status: 400 }
      );
    }

    // Check size limit (max 15MB)
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'El archivo excede el tamaño máximo permitido (15MB).' },
        { status: 400 }
      );
    }

    const pbFormData = new FormData();
    pbFormData.append('file', file);
    pbFormData.append('title', file.name.replace(/\.[^/.]+$/, ''));

    // Authenticate if needed for admin operations
    const email = process.env.PB_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL || 'guflo32@gmail.com';
    const password = process.env.PB_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD || '1982Gut@**';
    if (!pb.authStore.isValid && email && password) {
      try {
        await loginAsSuperUser(email, password);
      } catch (authErr) {
        console.warn('Superuser auth optional, continuing as public client:', authErr);
      }
    }

    let record: any = null;
    try {
      record = await pb.collection(collectionName).create(pbFormData);
    } catch (collErr: any) {
      // If requested collection fails or doesn't have file field, fallback to 'media'
      if (collectionName !== 'media') {
        record = await pb.collection('media').create(pbFormData);
      } else {
        throw collErr;
      }
    }

    if (record && record.file) {
      const fileUrl = pb.files.getURL(record, record.file);
      return NextResponse.json({
        success: true,
        url: fileUrl,
        filename: record.file,
        recordId: record.id,
      });
    }

    return NextResponse.json(
      { success: false, error: 'No se pudo obtener la URL del archivo guardado.' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error en /api/upload:', error);
    const detail = error?.data ? JSON.stringify(error.data) : error?.message || 'Error desconocido';
    return NextResponse.json(
      { success: false, error: `Error al subir el archivo: ${detail}` },
      { status: 500 }
    );
  }
}
