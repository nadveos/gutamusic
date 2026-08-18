import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MusicDataService } from '../../../lib/api';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { Eye, Edit } from 'lucide-react';

export const metadata = {
  title: 'Gestión de Entrevistas | GUTA CMS',
};

export default async function AdminEntrevistasPage() {
  const interviews = await MusicDataService.getInterviews();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Gestión de Entrevistas & Lives"
        subtitle="Publicación de charlas exclusivas, acústicos y crónicas periodísticas"
        actionText="Nueva Entrevista"
        actionHref="/entrevistas"
      />

      <div className="natural-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#aba79e]">
            <thead className="bg-[#24252c] border-b border-[#2a2c35] text-[#8c887f] uppercase text-[10px] font-semibold">
              <tr>
                <th className="py-3 px-4">Entrevista / Invitado</th>
                <th className="py-3 px-3">Conducción</th>
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#24252c]">
              {interviews.map((item) => (
                <tr key={item.id} className="hover:bg-[#24252c]/50 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-2.5">
                    <div className="relative w-10 h-7 rounded-md overflow-hidden border border-[#31333d] flex-shrink-0 bg-black">
                      <Image src={item.thumbnailUrl} alt={item.title} fill className="object-cover" />
                    </div>
                    <div>
                      <strong className="text-[#f3f1ec] text-xs block">{item.title}</strong>
                      <span className="text-[10px] text-[#e6cca0] font-medium">{item.artistName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[#aba79e]">{item.host}</td>
                  <td className="py-3 px-3 text-[#8c887f]">{item.date}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-terracotta-soft">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    <Link
                      href={`/entrevistas/${item.slug}`}
                      target="_blank"
                      className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#aba79e] hover:text-[#f3f1ec] inline-block transition-colors"
                      title="Ver en portal"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
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
