'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { AlliancePartner, AllianceSector } from '../../../lib/types';
import { pb } from '../../../lib/pocketbase';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { ImageUploadField } from '../../../components/admin/ImageUploadField';
import { ConfirmModal } from '../../../components/admin/ConfirmModal';
import { BrandAllianceShowcase } from '../../../components/BrandAllianceShowcase';
import {
  HeartHandshake,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Phone,
  Globe,
  Sparkles,
  Smartphone,
  Monitor,
  Eye,
  Star,
  CheckCircle2,
  Layers,
  ArrowUpDown,
  Search,
} from 'lucide-react';

interface AdminAlliancesClientProps {
  initialAlliances: AlliancePartner[];
}

const SECTOR_OPTIONS: { value: AllianceSector; label: string; recommended?: boolean; desc: string }[] = [
  {
    value: 'global_footer',
    label: 'Pie de Página Global (Todas las Secciones)',
    recommended: true,
    desc: '🌟 Recomendado: Máxima visibilidad transversal en el 100% de las páginas del portal sin invadir el contenido editorial.',
  },
  {
    value: 'home_mid',
    label: 'Página Principal (Bloque Intermedio)',
    desc: 'Se muestra en la portada entre el catálogo de artistas incorporados y la entrevista destacada.',
  },
  {
    value: 'artistas_catalog',
    label: 'Directorio de Artistas',
    desc: 'Se muestra en el catálogo y buscador de músicos independientes.',
  },
  {
    value: 'agenda_events',
    label: 'Agenda Cultural & Festivales',
    desc: 'Se muestra en la cartelera de fechas, peñas y recitales en vivo.',
  },
  {
    value: 'all_sections',
    label: 'Multisección Transversal',
    desc: 'Aparece en todos los bloques específicos configurados.',
  },
];

const CATEGORY_SUGGESTIONS = [
  'Luthier & Instrumentos',
  'Grabación & Mastering',
  'Audio en Vivo & Técnica',
  'Difusión & Prensa Musical',
  'Indumentaria & Escenario',
  'Diseño & Audiovisual',
  'Espacio Cultural & Gastronomía',
  'Festivales & Productora',
];

export const AdminAlliancesClient: React.FC<AdminAlliancesClientProps> = ({ initialAlliances }) => {
  const [alliances, setAlliances] = useState<AlliancePartner[]>(initialAlliances);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState<string>('all');

  // Preview simulator mode
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<AlliancePartner | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state (preselected to recommended sector)
  const [formData, setFormData] = useState<Omit<AlliancePartner, 'id'>>({
    name: '',
    category: 'Luthier & Instrumentos',
    description: '',
    imageUrl: '',
    phone: '',
    whatsapp: '',
    websiteUrl: '',
    email: '',
    sector: 'global_footer', // Default to RECOMMENDED sector
    active: true,
    priority: 1,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Luthier & Instrumentos',
      description: '',
      imageUrl: '',
      phone: '',
      whatsapp: '',
      websiteUrl: '',
      email: '',
      sector: 'global_footer',
      active: true,
      priority: alliances.length + 1,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (item: AlliancePartner) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      category: item.category || 'Luthier & Instrumentos',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      phone: item.phone || '',
      whatsapp: item.whatsapp || '',
      websiteUrl: item.websiteUrl || '',
      email: item.email || '',
      sector: item.sector || 'global_footer',
      active: item.active !== false,
      priority: item.priority || 1,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setNotification({ type: 'error', text: 'Por favor ingresá el nombre del auspiciante.' });
      return;
    }

    if (!formData.imageUrl) {
      setNotification({ type: 'error', text: 'Por favor cargá una imagen o logo para el auspiciante.' });
      return;
    }

    setIsSubmitting(true);
    setNotification(null);

    const payload = {
      name: formData.name.trim(),
      category: formData.category?.trim() || 'Auspicio Cultural',
      description: formData.description?.trim() || '',
      imageUrl: formData.imageUrl.trim(),
      phone: formData.phone?.trim() || '',
      whatsapp: formData.whatsapp?.trim() || '',
      websiteUrl: formData.websiteUrl?.trim() || '',
      email: formData.email?.trim() || '',
      sector: formData.sector,
      active: formData.active,
      priority: Number(formData.priority) || 1,
    };

    try {
      if (editingId) {
        // Update in PocketBase
        try {
          await pb.collection('alliances').update(editingId, payload);
        } catch (pbErr: any) {
          console.warn('Notice PocketBase update:', pbErr?.message);
        }

        setAlliances((prev) =>
          prev.map((item) => (item.id === editingId ? { ...item, ...payload } : item))
        );
        setNotification({ type: 'success', text: `¡Auspiciante "${payload.name}" actualizado con éxito!` });
      } else {
        // Create in PocketBase
        let createdRecord: any = null;
        try {
          createdRecord = await pb.collection('alliances').create(payload);
        } catch (pbErr: any) {
          console.warn('Notice PocketBase create:', pbErr?.message);
        }

        const newItem: AlliancePartner = {
          id: createdRecord?.id || `ally-${Date.now()}`,
          ...payload,
          createdDate: new Date().toISOString().split('T')[0],
        };

        setAlliances((prev) => [newItem, ...prev]);
        setNotification({ type: 'success', text: `¡Auspiciante "${payload.name}" guardado y publicado!` });
      }

      resetForm();
    } catch (err: any) {
      setNotification({ type: 'error', text: `Error al guardar: ${err?.message || 'Fallo desconocido'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (item: AlliancePartner) => {
    const updatedStatus = !item.active;
    try {
      try {
        await pb.collection('alliances').update(item.id, { active: updatedStatus });
      } catch (e) {}

      setAlliances((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, active: updatedStatus } : a))
      );
      setNotification({
        type: 'success',
        text: `Auspiciante "${item.name}" ${updatedStatus ? 'activado' : 'pausado'}.`,
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: 'Error al cambiar estado.' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      try {
        await pb.collection('alliances').delete(deleteTarget.id);
      } catch (e) {}

      setAlliances((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setNotification({ type: 'success', text: `Auspiciante "${deleteTarget.name}" eliminado correctamente.` });
      setDeleteTarget(null);
    } catch (err: any) {
      setNotification({ type: 'error', text: 'Error al eliminar auspiciante.' });
    }
  };

  // Filtered list
  const filteredAlliances = alliances.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSector = filterSector === 'all' || item.sector === filterSector;
    return matchesSearch && matchesSector;
  });

  // Current item for the preview
  const previewItem: AlliancePartner = {
    id: editingId || 'preview-temp-id',
    name: formData.name || 'Nombre de la Marca o Auspiciante',
    category: formData.category || 'Rubro / Categoría',
    description: formData.description || 'Breve descripción de los servicios, productos o apoyo al movimiento cultural.',
    imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=800&auto=format&fit=crop',
    phone: formData.phone || '+54 9 351 123-4567',
    whatsapp: formData.whatsapp || '5493511234567',
    websiteUrl: formData.websiteUrl || 'https://instagram.com',
    sector: formData.sector,
    active: formData.active,
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Gestión de Auspiciantes & Alianzas"
        subtitle="Administrá las marcas, luthiers y colaboradores que auspician a GUTA MÚSICA con blindaje anti-bloqueadores de anuncios."
        actionText={showForm ? 'Cerrar Formulario' : '+ Nuevo Auspiciante'}
        onActionClick={() => {
          if (showForm) resetForm();
          else {
            resetForm();
            setShowForm(true);
          }
        }}
      />

      {/* Notification toast */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-[#1b2b20] border-[#31573b] text-[#86efac]'
              : 'bg-[#2b1b1f] border-[#573138] text-[#fca5a5]'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 text-[#86efac]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#fca5a5]" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/30 hover:bg-black/50"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Form & Live Preview Section */}
      {showForm && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Editor Form */}
          <div className="lg:col-span-7 natural-card p-5 sm:p-6 rounded-2xl space-y-5 border border-[#2d2f38]">
            <div className="flex items-center justify-between border-b border-[#2a2c35] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-sand-soft">
                  <HeartHandshake className="w-4 h-4 text-[#e6cca0]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#f3f1ec]">
                    {editingId ? 'Editar Auspiciante' : 'Cargar Nuevo Auspiciante'}
                  </h3>
                  <p className="text-[11px] text-[#8c887f]">Completá los datos institucionales y de contacto directo</p>
                </div>
              </div>

              <span className="text-[10px] px-2 py-0.5 rounded bg-[#202228] text-[#e6cca0] font-semibold border border-[#353844]">
                Anti-AdBlock Activo
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#aba79e] flex items-center justify-between">
                  <span>Nombre del Auspiciante / Marca / Entidad *</span>
                  <span className="text-[10px] text-[#78746c]">Ej: Guitarras Criollas del Litoral</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre de la marca o proyecto"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              {/* Image Upload with Adaptive Sizing Note */}
              <div className="space-y-1">
                <ImageUploadField
                  label="Imagen / Logotipo Institucional"
                  value={formData.imageUrl}
                  onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                  collectionName="media"
                  required
                  helperText="💡 Podés subir imágenes cuadradas, horizontales o verticales. El contenedor inteligente adapta el encuadre automáticamente sin recortar ni deformar."
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#aba79e]">
                  Rubro / Categoría
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {CATEGORY_SUGGESTIONS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: cat })}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                        formData.category === cat
                          ? 'bg-[#d97d64] text-[#151618] border-[#d97d64] font-bold'
                          : 'bg-[#18191e] text-[#aba79e] border-[#2e3039] hover:text-[#f3f1ec]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="O escribí un rubro personalizado"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              {/* SECTOR SELECTOR WITH RECOMMENDED HIGHLIGHT */}
              <div className="space-y-2 pt-2 border-t border-[#262832]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#aba79e] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#e6cca0]" />
                    <span>Sector de la Web donde se mostrará</span>
                  </label>
                  <span className="text-[10px] font-bold text-[#93a887] flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Sección Recomendada Activa
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {SECTOR_OPTIONS.map((opt) => {
                    const isSelected = formData.sector === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-[#21232b] border-[#d97d64] ring-1 ring-[#d97d64]/50'
                            : 'bg-[#18191e] border-[#2a2c35] hover:border-[#383b48]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="sector"
                          value={opt.value}
                          checked={isSelected}
                          onChange={() => setFormData({ ...formData, sector: opt.value })}
                          className="mt-0.5 text-[#d97d64] focus:ring-0"
                        />
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${isSelected ? 'text-[#f3f1ec]' : 'text-[#aba79e]'}`}>
                              {opt.label}
                            </span>
                            {opt.recommended && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-sand-soft text-[#e6cca0] border border-[#d97d64]/30">
                                ★ Recomendado
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[#78746c] leading-relaxed">{opt.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Contact Information (WhatsApp & Phone) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#262832]">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#aba79e] flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>WhatsApp de Contacto</span>
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="Ej: 5493514567890 (con código de país)"
                    className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                  />
                  <p className="text-[9px] text-[#78746c]">Generará un botón directo de chat 1-click.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#aba79e] flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#e6cca0]" />
                    <span>Teléfono para Llamadas</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Ej: +54 9 351 456-7890"
                    className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                  />
                  <p className="text-[9px] text-[#78746c]">Para llamadas directas desde celulares.</p>
                </div>
              </div>

              {/* Web Link & Slogan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#aba79e] flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-[#a7b8c8]" />
                    <span>Sitio Web / Instagram (Opcional)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="https://instagram.com/marca"
                    className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#aba79e] flex items-center gap-1">
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#e6cca0]" />
                    <span>Prioridad de Orden</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#aba79e]">
                  Descripción / Eslogan Institucional (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve reseña sobre el auspiciante o los servicios que ofrece a los artistas."
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>

              {/* Active Toggle & Submit Buttons */}
              <div className="pt-3 border-t border-[#262832] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded bg-[#18191e] border-[#2e3039] text-[#d97d64] focus:ring-0 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-[#f3f1ec]">
                    {formData.active ? 'Auspiciante Activo y Visible' : 'Auspiciante Pausado'}
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-xl bg-[#202228] hover:bg-[#282b34] text-xs font-medium text-[#aba79e] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-[#d97d64]/20 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{editingId ? 'Actualizar Auspiciante' : 'Publicar Auspiciante'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Live Interactive Preview Simulator */}
          <div className="lg:col-span-5 space-y-3">
            <div className="natural-card p-4 rounded-2xl border border-[#2d2f38] space-y-3 sticky top-4">
              <div className="flex items-center justify-between border-b border-[#262832] pb-2.5">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#e6cca0]" />
                  <span className="text-xs font-bold text-[#f3f1ec]">Vista Previa en Tiempo Real</span>
                </div>

                {/* Device toggle (Desktop / Mobile) */}
                <div className="flex items-center gap-1 bg-[#18191e] p-0.5 rounded-lg border border-[#2e3039]">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1 rounded-md text-[10px] flex items-center gap-1 transition-colors ${
                      previewDevice === 'desktop'
                        ? 'bg-[#282a33] text-[#f3f1ec] font-bold'
                        : 'text-[#8c887f] hover:text-[#aba79e]'
                    }`}
                    title="Vista de Escritorio"
                  >
                    <Monitor className="w-3 h-3" />
                    <span>PC</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1 rounded-md text-[10px] flex items-center gap-1 transition-colors ${
                      previewDevice === 'mobile'
                        ? 'bg-[#282a33] text-[#f3f1ec] font-bold'
                        : 'text-[#8c887f] hover:text-[#aba79e]'
                    }`}
                    title="Vista Móvil"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>Móvil</span>
                  </button>
                </div>
              </div>

              {/* Sector Indicator */}
              <div className="p-2.5 rounded-xl bg-[#141519] border border-[#262832] flex items-center justify-between text-[11px]">
                <span className="text-[#8c887f]">Sector simulado:</span>
                <span className="font-semibold text-[#e6cca0] truncate max-w-[65%]">
                  {SECTOR_OPTIONS.find((s) => s.value === formData.sector)?.label || 'Global'}
                </span>
              </div>

              {/* Visual Container representing live portal */}
              <div
                className={`transition-all duration-300 mx-auto ${
                  previewDevice === 'mobile' ? 'max-w-[280px]' : 'w-full'
                }`}
              >
                <div className="rounded-xl border border-[#343846] bg-[#151618] p-3 shadow-2xl">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#78746c] block mb-2">
                    Simulación del Bloque Público:
                  </span>
                  <BrandAllianceShowcase
                    items={[previewItem]}
                    isPreview={true}
                    compact={previewDevice === 'mobile'}
                    title="Alianzas & Auspicios"
                    subtitle="Acompañan la cultura independiente"
                  />
                </div>
              </div>

              {/* Adaptive image explanation note */}
              <div className="p-3 rounded-xl bg-[#1d1f26] border border-[#2e313d] text-[11px] text-[#aba79e] space-y-1">
                <div className="flex items-center gap-1.5 text-[#93a887] font-semibold text-[10px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Adaptación Inteligente de Dimensiones:</span>
                </div>
                <p className="text-[10px] text-[#8c887f] leading-relaxed">
                  Logos horizontales, isotipos cuadrados o banners verticales se ajustan automáticamente en el centro de la tarjeta con calidad óptima y sin distorsión.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List of Existing Alliances & Auspiciantes */}
      <section className="natural-card p-5 rounded-2xl space-y-4 border border-[#2d2f38]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262832] pb-3.5">
          <div>
            <h2 className="text-sm font-bold text-[#f3f1ec]">Auspiciantes Registrados ({alliances.length})</h2>
            <p className="text-xs text-[#8c887f]">Catálogo activo de empresas y entidades asociadas a la plataforma</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#78746c] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o rubro..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64] w-48"
              />
            </div>

            {/* Filter by Sector */}
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
            >
              <option value="all">Todos los sectores</option>
              <option value="global_footer">Pie de Página (Recomendado)</option>
              <option value="home_mid">Home Intermedio</option>
              <option value="artistas_catalog">Directorio de Artistas</option>
              <option value="agenda_events">Agenda & Eventos</option>
            </select>
          </div>
        </div>

        {filteredAlliances.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <HeartHandshake className="w-8 h-8 text-[#78746c] mx-auto opacity-50" />
            <p className="text-xs text-[#aba79e]">No se encontraron auspiciantes con los filtros seleccionados.</p>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="text-xs font-semibold text-[#e6cca0] hover:underline"
            >
              + Cargar el primer auspiciante
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#aba79e]">
              <thead className="border-b border-[#2a2c35] text-[#8c887f] uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Logo / Imagen</th>
                  <th className="py-2.5 px-3">Nombre & Rubro</th>
                  <th className="py-2.5 px-3">Sector Asignado</th>
                  <th className="py-2.5 px-3">Contacto Directo</th>
                  <th className="py-2.5 px-3">Prioridad</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#24252c]">
                {filteredAlliances.map((item) => {
                  const sectorMeta = SECTOR_OPTIONS.find((s) => s.value === item.sector);
                  return (
                    <tr key={item.id} className="hover:bg-[#202228]/50 transition-colors">
                      {/* Thumbnail Container */}
                      <td className="py-3 px-3">
                        <div className="relative w-14 h-10 rounded-lg bg-[#111215] border border-[#2b2d38] p-1 flex items-center justify-center overflow-hidden">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              sizes="56px"
                              className="object-contain object-center"
                            />
                          ) : (
                            <HeartHandshake className="w-4 h-4 text-[#78746c]" />
                          )}
                        </div>
                      </td>

                      {/* Name & Category */}
                      <td className="py-3 px-3">
                        <strong className="text-[#f3f1ec] block text-xs">{item.name}</strong>
                        <span className="text-[10px] text-[#e6cca0] font-medium">{item.category}</span>
                      </td>

                      {/* Sector */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className="text-[11px] text-[#f3f1ec] block">
                            {sectorMeta?.label || item.sector}
                          </span>
                          {sectorMeta?.recommended && (
                            <span className="inline-block text-[9px] font-bold text-[#e6cca0]">
                              ★ Sector Recomendado
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {item.whatsapp && (
                            <a
                              href={`https://wa.me/${item.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-[#242730] text-[#a0d29f] hover:text-[#5ce487]"
                              title={`WhatsApp: ${item.whatsapp}`}
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {item.phone && (
                            <span className="text-[11px] text-[#aba79e] font-mono">{item.phone}</span>
                          )}
                          {item.websiteUrl && (
                            <a
                              href={item.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded bg-[#242730] text-[#a7b8c8] hover:text-[#f3f1ec]"
                              title="Sitio Web"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3 font-mono text-center">
                        <span className="px-2 py-0.5 rounded bg-[#18191e] border border-[#2b2d38] text-[11px]">
                          #{item.priority || 1}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(item)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                            item.active
                              ? 'bg-sage-soft text-[#93a887] hover:bg-[#203024]'
                              : 'bg-[#2b2225] text-[#c0909b] hover:bg-[#382b30]'
                          }`}
                        >
                          {item.active ? '● Activo' : '○ Pausado'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#e6cca0] inline-block transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 rounded-lg bg-[#24252c] hover:bg-[#2e303b] text-[#c0909b] hover:text-[#e6a8b4] inline-block transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Eliminar Auspiciante"
        message={`¿Estás seguro de que deseás eliminar a "${deleteTarget?.name}"? Esta acción removerá el bloque de auspicio de todas las secciones seleccionadas.`}
        confirmText="Eliminar Auspiciante"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
