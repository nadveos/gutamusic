import React from 'react';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { AIAssistantStudio } from '../../../components/admin/AIAssistantStudio';

export const metadata = {
  title: 'Asistente de IA Editorial | GUTA CMS',
};

export default function AdminIAPage() {
  return (
    <div className="space-y-6">
      <AdminHeader
        title="Estudio de Redacción con IA Editorial"
        subtitle="Generación automática de biografías, crónicas periodísticas y meta tags SEO"
      />

      <AIAssistantStudio />
    </div>
  );
}
