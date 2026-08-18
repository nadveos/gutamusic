import React from 'react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';

export const metadata = {
  title: 'Panel de Control CMS | GUTA MÚSICA',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#07080d] flex">
      {/* Sidebar navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 max-w-7xl overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
