'use client';

import React, { useState } from 'react';
import { pb, loginAsSuperUser } from '../../lib/pocketbase';
import { MOCK_ARTISTS, MOCK_VIDEOS, MOCK_EPHEMERIDES, MOCK_INTERVIEWS, MOCK_AGENDA, MOCK_ALLIANCES } from '../../lib/mockData';
import { ConfirmModal } from './ConfirmModal';
import { Database, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export const SeedPocketBaseButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const executeSeed = async () => {
    setIsConfirmOpen(false);
    setLoading(true);
    setStatus('Autenticando con PocketBase...');
    setIsSuccess(null);

    try {
      // 1. Authenticate as Superuser
      const auth = await loginAsSuperUser('guflo32@gmail.com', '1982Gut@**');
      if (!auth.success) {
        setStatus(`Error de autenticación: ${auth.error}`);
        setIsSuccess(false);
        setLoading(false);
        return;
      }

      setStatus('Insertando Artistas en PocketBase...');
      let createdCount = 0;

      // 2. Insert Artists
      for (const artist of MOCK_ARTISTS) {
        try {
          await pb.collection('artists').create(artist);
          createdCount++;
        } catch (e: any) {
          // May already exist
        }
      }

      // 3. Insert Videos
      setStatus('Insertando Videos...');
      for (const video of MOCK_VIDEOS) {
        try {
          await pb.collection('videos').create(video);
          createdCount++;
        } catch (e: any) {}
      }

      // 4. Insert Ephemerides
      setStatus('Insertando Efemérides Históricas...');
      for (const eph of MOCK_EPHEMERIDES) {
        try {
          await pb.collection('ephemerides').create(eph);
          createdCount++;
        } catch (e: any) {}
      }

      // 5. Insert Interviews
      setStatus('Insertando Entrevistas...');
      for (const item of MOCK_INTERVIEWS) {
        try {
          await pb.collection('interviews').create(item);
          createdCount++;
        } catch (e: any) {}
      }

      // 6. Insert Events
      setStatus('Insertando Agenda de Recitales...');
      for (const ev of MOCK_AGENDA) {
        try {
          await pb.collection('events').create(ev);
          createdCount++;
        } catch (e: any) {}
      }

      // 7. Insert Alliances / Auspiciantes
      setStatus('Insertando Auspiciantes & Alianzas...');
      for (const ally of MOCK_ALLIANCES) {
        try {
          await pb.collection('alliances').create(ally);
          createdCount++;
        } catch (e: any) {}
      }

      setStatus(`¡Sincronización completada! Se procesaron los registros en PocketBase.`);
      setIsSuccess(true);
    } catch (err: any) {
      setStatus(`Error durante la sincronización: ${err?.message}`);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl natural-card space-y-2 border border-[#31333d]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sand-soft">
            <Database className="w-4 h-4 text-[#e6cca0]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#f3f1ec]">Sincronización PocketBase</h4>
            <p className="text-[11px] text-[#8c887f]">Poblar base de datos con el catálogo inicial en un click</p>
          </div>
        </div>

        <button
          onClick={() => setIsConfirmOpen(true)}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#e6cca0] hover:text-[#f3f1ec] text-xs font-semibold border border-[#393c4a] transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          <span>{loading ? 'Poblando...' : 'Poblar PocketBase'}</span>
        </button>
      </div>

      {status && (
        <div
          className={`text-[11px] p-2 rounded-lg flex items-center gap-2 ${
            isSuccess === true
              ? 'bg-[#1e2420] text-[#93a887] border border-[#2f3f33]'
              : isSuccess === false
              ? 'bg-[#261f22] text-[#c0909b] border border-[#442e34]'
              : 'bg-[#24252c] text-[#aba79e]'
          }`}
        >
          {isSuccess === true && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
          {isSuccess === false && <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
          {isSuccess === null && <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />}
          <span>{status}</span>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Sincronización de Base de Datos"
        message="¿Deseás poblar PocketBase con el catálogo inicial de artistas, videos, efemérides y fechas de cartelera?"
        confirmText="Iniciar Sincronización"
        isDanger={false}
        onConfirm={executeSeed}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};
