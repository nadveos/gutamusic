'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UploadCloud, Image as ImageIcon, Link as LinkIcon, Check, Loader2, X } from 'lucide-react';
import { uploadImageToPocketBase } from '../../lib/uploadFile';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  collectionName?: string;
  required?: boolean;
  helperText?: string;
  aspectRatio?: 'square' | 'video' | 'banner' | 'contain';
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  collectionName = 'media',
  required = false,
  helperText,
  aspectRatio = 'square',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setErrorMsg('');
    setUploadSuccess(false);

    try {
      const res = await uploadImageToPocketBase(file, collectionName);
      if (res.success && res.url) {
        onChange(res.url);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setErrorMsg(res.error || 'Error al procesar la imagen.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Fallo inesperado al subir la imagen.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    onChange('');
    setUploadSuccess(false);
    setErrorMsg('');
  };

  const isContain = aspectRatio === 'contain';
  const aspectClass =
    aspectRatio === 'banner'
      ? 'aspect-[21/9] sm:aspect-[3/1]'
      : aspectRatio === 'video'
      ? 'aspect-video'
      : isContain
      ? 'h-28 sm:h-32 w-full'
      : 'aspect-square';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] text-[#aba79e] font-semibold flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#e6cca0]" />
          <span>{label}</span>
          {required && <span className="text-[#d97d64]">*</span>}
        </label>

        {/* Toggle between Direct Upload and URL */}
        <div className="flex items-center gap-1 bg-[#18191e] p-0.5 rounded-lg border border-[#2e3039]">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
              mode === 'upload'
                ? 'bg-[#282a33] text-[#f3f1ec] font-semibold'
                : 'text-[#8c887f] hover:text-[#aba79e]'
            }`}
          >
            Subir Archivo
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
              mode === 'url'
                ? 'bg-[#282a33] text-[#f3f1ec] font-semibold'
                : 'text-[#8c887f] hover:text-[#aba79e]'
            }`}
          >
            Por URL
          </button>
        </div>
      </div>

      {mode === 'upload' ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id={`upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
            />
            <label
              htmlFor={`upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed cursor-pointer transition-colors text-xs font-semibold ${
                isUploading
                  ? 'bg-[#22232a] border-[#d97d64] text-[#d97d64]'
                  : 'bg-[#18191e] hover:bg-[#202228] border-[#383b47] hover:border-[#e6cca0] text-[#f3f1ec]'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Subiendo imagen a Storage...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-[#e6cca0]" />
                  <span>Seleccionar archivo desde el dispositivo</span>
                </>
              )}
            </label>

            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2.5 rounded-xl bg-[#202228] hover:bg-[#272932] text-[#aba79e] hover:text-[#c0909b] border border-[#2e3039] transition-colors"
                title="Quitar imagen"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {uploadSuccess && (
            <div className="text-[11px] text-[#93a887] flex items-center gap-1.5 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>¡Imagen cargada correctamente!</span>
            </div>
          )}

          {errorMsg && (
            <div className="text-[11px] text-[#c0909b] font-medium">
              {errorMsg}
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <LinkIcon className="w-3.5 h-3.5 text-[#78746c] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required={required}
            placeholder="https://images.unsplash.com/... o URL directa"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs font-mono focus:outline-none focus:border-[#d97d64]"
          />
        </div>
      )}

      {/* Live Preview Thumbnail */}
      {value && (
        <div className="relative rounded-xl overflow-hidden border border-[#2e3039] bg-[#101114] mt-2">
          <div className={`relative w-full ${aspectClass} ${isContain ? 'p-3 flex items-center justify-center' : 'max-h-48'}`}>
            <Image
              src={value}
              alt={label}
              fill
              className={isContain ? 'object-contain object-center' : 'object-cover'}
              sizes="(max-width: 768px) 100vw, 400px"
              onError={() => setErrorMsg('No se pudo cargar la vista previa de la imagen.')}
            />
          </div>
          <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-xs px-2.5 py-1 flex items-center justify-between text-[10px] text-[#aba79e]">
            <span className="truncate max-w-[80%] font-mono">{value}</span>
            <span className="text-[#93a887] font-semibold">Vista Previa</span>
          </div>
        </div>
      )}

      {helperText && (
        <p className="text-[10px] text-[#78746c]">{helperText}</p>
      )}
    </div>
  );
};
