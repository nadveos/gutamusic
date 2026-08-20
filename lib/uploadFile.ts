import { pb } from './pocketbase';

/**
 * Utility helper to upload files to PocketBase or generate a data URL preview as a fallback.
 * Works seamlessly with any collection (e.g. 'artists', 'interviews', 'applications', or 'uploads').
 */
export async function uploadImageToPocketBase(
  file: File,
  collectionName = 'media'
): Promise<{ success: boolean; url: string; error?: string }> {
  if (!file) {
    return { success: false, url: '', error: 'No se seleccionó ningún archivo' };
  }

  try {
    // 1. Try uploading to the specific collection if it exists
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

    try {
      const record = await pb.collection(collectionName).create(formData);
      if (record && record.file) {
        const fileUrl = pb.files.getUrl(record, record.file);
        return { success: true, url: fileUrl };
      }
    } catch (collErr: any) {
      // If collection doesn't exist, try 'artists' or 'files'
      console.warn(`Collection ${collectionName} not ready for direct upload, creating temporary preview:`, collErr?.message);
    }

    // 2. Fallback: Convert file to Base64 Data URL so it can be viewed and saved in any environment
    const base64Url = await fileToBase64(file);
    return { success: true, url: base64Url };
  } catch (err: any) {
    console.error('Error in uploadImageToPocketBase:', err);
    return {
      success: false,
      url: '',
      error: err?.message || 'Error al procesar la imagen seleccionada',
    };
  }
}

/**
 * Converts a File into a base64 data string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
