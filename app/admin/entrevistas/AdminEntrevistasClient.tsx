'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Interview } from '../../../lib/types';
import { pb } from '../../../lib/pocketbase';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { ConfirmModal } from '../../../components/admin/ConfirmModal';
import { Edit, Trash2, Eye, Radio, Plus, Calendar, User, CheckCircle2 } from 'lucide-react';

interface AdminEntrevistasClientProps {
  initialInterviews: Interview[];
}

export const AdminEntrevistasClient: React.FC<AdminEntrevistasClientProps> = ({
  initialInterviews,
}) => {
  const [interviews, setInterviews] = useState<Interview[]>(initialInterviews);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === interviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(interviews.map((i) => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      const id = deleteTarget.id;
      const title = deleteTarget.title;
      try {
        await pb.collection('interviews').delete(id);
        setInterviews((prev) => prev.filter((i) => i.id !== id));
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        setNotification({
          type: 'success',
          text: `Entrevista "${title}" eliminada de PocketBase exitosamente.`,
        });
      } catch (e: any) {
        console.error('Error al eliminar entrevista de PocketBase:', e);
        if (e?.status === 403 || e?.message?.includes('superusers')) {
          setNotification({
            type: 'error',
            text: `Error de permisos (403): Solo superusuarios pueden eliminar en PocketBase. Verificá las API Rules de la colección 'interviews'.`,
          });
        } else {
          setNotification({
            type: 'error',
            text: `Error al eliminar de PocketBase: ${e?.message || 'Error desconocido'}`,
          });
        }
      }
      setDeleteTarget(null);
    }
  };

  const confirmBulkDelete = async () => {
    const idsToDelete = [...selectedIds];
    setIsBulkDeleteOpen(false);

    let deletedCount = 0;
    let hasPermissionError = false;

    for (const id of idsToDelete) {
      try {
        await pb.collection('interviews').delete(id);
        deletedCount++;
      } catch (e: any) {
        console.error('Error al eliminar entrevista masivamente:', id, e);
        if (e?.status === 403 || e?.message?.includes('superusers')) {
          hasPermissionError = true;
        }
      }
    }

    if (deletedCount > 0) {
      setInterviews((prev) => prev.filter((i) => !idsToDelete.slice(0, deletedCount).includes(i.id)));
      setSelectedIds([]);
      setNotification({
        type: 'success',
        text: `Se eliminaron ${deletedCount} entrevistas de PocketBase.`,
      });
    }

    if (hasPermissionError) {
      setNotification({
        type: 'error',
        text: `Error de permisos (403): Algunas entrevistas no pudieron eliminarse por reglas de PocketBase.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Gestión de Entrevistas & Lives"
        subtitle="Publicación de charlas exclusivas, acústicos y crónicas periodísticas"
        actionText="Nueva Entrevista"
        actionHref="/admin/entrevistas/nuevo"
      />

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-[#c0909b]/15 border-[#c0909b]/30 text-[#e6a8b4]'
          }`}
        >
          <span>{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-[10px] uppercase font-bold underline opacity-80 hover:opacity-100 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#24262f] border border-[#3c3f4e] rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-[#f3f1ec]">
            <span className="w-2 h-2 rounded-full bg-[#d97d64] animate-pulse" />
            <span>
              {selectedIds.length}{' '}
              {selectedIds.length === 1 ? 'entrevista seleccionada' : 'entrevistas seleccionadas'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#aba79e] hover:text-[#f3f1ec] bg-[#1a1b22] hover:bg-[#252730] border border-[#31333e] transition-colors cursor-pointer"
            >
              Deseleccionar
            </button>
            <button
              type="button"
              onClick={() => setIsBulkDeleteOpen(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#151618] bg-[#d97d64] hover:bg-[#cb7159] transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar seleccionadas ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Interviews Table / Empty state */}
      {interviews.length === 0 ? (
        <div className="natural-card rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#24252c] text-[#d97d64] flex items-center justify-center mx-auto">
            <Radio className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#f3f1ec]">No hay entrevistas registradas</h3>
            <p className="text-xs text-[#8c887f] max-w-sm mx-auto">
              Comenzá creando tu primera entrevista exclusiva, acústico o crónica en vivo en PocketBase.
            </p>
          </div>
          <Link
            href="/admin/entrevistas/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d97d64] hover:bg-[#c97058] text-[#151618] font-bold text-xs transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primera Entrevista</span>
          </Link>
        </div>
      ) : (
        <div className="natural-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#aba79e]">
              <thead className="bg-[#24252c] border-b border-[#2a2c35] text-[#8c887f] uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={interviews.length > 0 && selectedIds.length === interviews.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded bg-[#18191e] border-[#353844] accent-[#d97d64] cursor-pointer align-middle"
                      aria-label="Seleccionar todas las entrevistas"
                    />
                  </th>
                  <th className="py-3 px-4">Entrevista / Portada</th>
                  <th className="py-3 px-3">Artista Invitado</th>
                  <th className="py-3 px-3">Conducción</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Categoría</th>
                  <th className="py-3 px-3">Destacada</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap min-w-[130px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#24252c]">
                {interviews.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-[#d97d64]/10' : 'hover:bg-[#24252c]/50'
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="w-4 h-4 rounded bg-[#18191e] border-[#353844] accent-[#d97d64] cursor-pointer align-middle"
                          aria-label={`Seleccionar ${item.title}`}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-9 rounded-lg overflow-hidden border border-[#31333d] flex-shrink-0 bg-black">
                            {item.thumbnailUrl ? (
                              <Image
                                src={item.thumbnailUrl}
                                alt={item.title}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#555]">
                                <Radio className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="max-w-md">
                            <strong className="text-[#f3f1ec] text-xs block leading-tight line-clamp-1">
                              {item.title}
                            </strong>
                            <span className="text-[10px] text-[#78746c] font-mono block truncate">
                              /entrevistas/{item.slug}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[#e6cca0] font-semibold block text-xs">
                          {item.artistName}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#aba79e]">{item.host || 'Guta Flores'}</td>
                      <td className="py-3 px-3 text-[#8c887f] whitespace-nowrap">{item.date}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-terracotta-soft whitespace-nowrap">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {item.featured ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sand-soft whitespace-nowrap">
                            Destacada
                          </span>
                        ) : (
                          <span className="text-[#78746c]">Estándar</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/entrevistas/${item.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#aba79e] hover:text-[#f3f1ec] transition-colors"
                            title="Ver en portal"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/admin/entrevistas/nuevo?edit=${item.id}`}
                            className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#e6cca0] transition-colors"
                            title="Editar entrevista"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#c0909b] hover:text-[#e07a8b] transition-colors cursor-pointer"
                            title="Eliminar entrevista"
                            onClick={() => setDeleteTarget({ id: item.id, title: item.title })}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal para eliminar individual */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Eliminar Entrevista"
        message={`¿Estás seguro de que deseás eliminar la entrevista "${deleteTarget?.title}"? Esta acción removerá el registro de PocketBase y no se puede deshacer.`}
        confirmText="Eliminar Entrevista"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Modal para eliminación masiva */}
      <ConfirmModal
        isOpen={isBulkDeleteOpen}
        title="Eliminación Masiva de Entrevistas"
        message={`¿Estás seguro de que deseás eliminar ${selectedIds.length} ${
          selectedIds.length === 1 ? 'entrevista seleccionada' : 'entrevistas seleccionadas'
        }? Esta acción no se puede deshacer.`}
        confirmText={`Eliminar ${selectedIds.length} ${
          selectedIds.length === 1 ? 'Entrevista' : 'Entrevistas'
        }`}
        onConfirm={confirmBulkDelete}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />
    </div>
  );
};
