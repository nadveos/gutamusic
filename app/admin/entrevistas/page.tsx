import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MusicDataService } from '../../../lib/api';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { Radio, Plus, Calendar, User, Eye, Edit, Trash2 } from 'lucide-react';

export const metadata = {
  title: 'Gestión de Entrevistas | GUTA CMS',
};

export default async function AdminEntrevistasPage() {
  const interviews = await MusicDataService.getInterviews();

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Gestión de Entrevistas & Lives"
        subtitle="Publicación de charlas exclusivas, acústicos y crónicas periodísticas"
        actionText="Nueva Entrevista"
        actionHref="/admin/entrevistas/nueva"
      />

      <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3.5 px-5">Entrevista / Invitado</th>
                <th className="py-3.5 px-4">Conducción</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Categoría</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {interviews.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-5 flex items-center gap-3">
                    <div className="relative w-12 h-8 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-black">
                      <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover" />
                    </div>
                    <div>
                      <strong className="text-white text-sm block">{item.title}</strong>
                      <span className="text-[11px] text-amber-400 font-semibold">{item.artistName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-gray-300">{item.host}</td>
                  <td className="py-4 px-4 text-gray-400">{item.date}</td>
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right space-x-2">
                    <Link
                      href={`/entrevistas/${item.slug}`}
                      target="_blank"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white inline-block transition-colors"
                      title="Ver en portal"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 inline-block transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
