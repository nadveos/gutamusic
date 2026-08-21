import { pb } from './pocketbase';

/**
 * Utility helper to upload files to PocketBase storage.
 * It uploads the file to the PocketBase 'media' collection and returns the public HTTP URL.
 */
export async function uploadImageToPocketBase(
  file: File,
  collectionName = 'media'
): Promise<{ success: boolean; url: string; error?: string }> {
  if (!file) {
    return { success: false, url: '', error: 'No se seleccionó ningún archivo' };
  }

  // 1. Try Next.js server-side /api/upload endpoint first
  try {
    const apiFormData = new FormData();
    apiFormData.append('file', file);
    apiFormData.append('collection', collectionName);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: apiFormData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.url) {
        return { success: true, url: data.url };
      }
    }
  } catch (apiErr: any) {
    console.warn('API /api/upload endpoint not reachable or failed, attempting client PocketBase SDK upload:', apiErr?.message);
  }

  // 2. Direct client-side PocketBase SDK fallback
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

    let record: any = null;
    try {
      record = await pb.collection(collectionName).create(formData);
    } catch (collErr: any) {
      if (collectionName !== 'media') {
        record = await pb.collection('media').create(formData);
      } else {
        throw collErr;
      }
    }

    if (record && record.file) {
      const fileUrl = pb.files.getURL(record, record.file);
      return { success: true, url: fileUrl };
    }

    return {
      success: false,
      url: '',
      error: 'PocketBase no devolvió el archivo guardado.',
    };
  } catch (err: any) {
    console.error('Error in uploadImageToPocketBase:', err);
    let errMsg = 'Error al subir la imagen al almacenamiento';
    if (err?.data && typeof err.data === 'object') {
      const fieldErrors = Object.entries(err.data)
        .map(([k, v]: [string, any]) => `${k}: ${v?.message || JSON.stringify(v)}`)
        .join(', ');
      if (fieldErrors) errMsg += `: ${fieldErrors}`;
    } else if (err?.message) {
      errMsg += `: ${err.message}`;
    }
    return {
      success: false,
      url: '',
      error: errMsg,
    };
  }
}
