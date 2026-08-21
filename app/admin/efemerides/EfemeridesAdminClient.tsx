'use client';

import React, { useState, useMemo } from 'react';
import { EphemerisCategory, EphemerisItem } from '../../../lib/types';
import { pb } from '../../../lib/pocketbase';
import { AdminHeader } from '../../../components/admin/AdminHeader';
import { ConfirmModal } from '../../../components/admin/ConfirmModal';
import { AITokenBadge } from '../../../components/admin/AITokenBadge';
import {
  Plus,
  Sparkles,
  Check,
  ArrowRight,
  Save,
  Trash2,
  Layers,
  Loader2,
  BookOpen,
  Columns,
  List,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Filter,
  Eye
} from 'lucide-react';

interface EfemeridesAdminClientProps {
  initialItems: EphemerisItem[];
}

export const EfemeridesAdminClient: React.FC<EfemeridesAdminClientProps> = ({
  initialItems,
}) => {
  const [itemsList, setItemsList] = useState<EphemerisItem[]>(initialItems);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: 1985,
    category: 'lanzamientos' as EphemerisCategory,
    categoryLabel: 'Lanzamientos Históricos',
    description: '',
    source: '',
    impactBadge: '',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
    mbid: undefined as string | undefined,
    country: undefined as string | undefined,
    originCity: undefined as string | undefined,
    ipi: undefined as string | undefined,
  });

  const resetForm = () => {
    setFormData({
      title: '',
      day: new Date().getDate(),
      month: new Date().getMonth() + 1,
      year: 1985,
      category: 'lanzamientos' as EphemerisCategory,
      categoryLabel: 'Lanzamientos Históricos',
      description: '',
      source: '',
      impactBadge: '',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
      mbid: undefined,
      country: undefined,
      originCity: undefined,
      ipi: undefined,
    });
  };

  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiDebugInfo, setAiDebugInfo] = useState<any>(null);
  const [aiRegionName, setAiRegionName] = useState<string>('Argentina');
  const [aiGroundedSources, setAiGroundedSources] = useState<number>(0);
  const [aiModelName, setAiModelName] = useState<string>('gemini-3.6-flash');
  const [savingBulk, setSavingBulk] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('argentina');  // Control de fuentes, visualización y resaltado de duplicados
  const [selectedQuerySources, setSelectedQuerySources] = useState<string[]>([
    'musicbrainz',
    'crock',
    'efe_eme',
    'folklore',
    'mia_fm'
  ]);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'musicbrainz' | 'crock' | 'efe_eme' | 'folklore' | 'mia_fm' | 'duplicates'>('all');
  const [viewMode, setViewMode] = useState<'columns' | 'list'>('columns');
  const [highlightDuplicateId, setHighlightDuplicateId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (deleteTarget) {
      const id = deleteTarget.id;
      setItemsList(itemsList.filter((i) => i.id !== id));
      try {
        await pb.collection('ephemerides').delete(id);
      } catch (e) {}
      setDeleteTarget(null);
    }
  };

  const categories = [
    { id: 'lanzamientos', label: 'Lanzamientos Históricos' },
    { id: 'billboard', label: 'Billboard & Récords' },
    { id: 'sadaic', label: 'Registros SADAIC' },
    { id: 'cosquin', label: 'Cosquín & Festivales' },
    { id: 'jesus_maria', label: 'Festival de Jesús María' },
    { id: 'gardel', label: 'Premios Gardel' },
    { id: 'nacimientos', label: 'Nacimientos' },
    { id: 'fallecimientos', label: 'Fallecimientos' },
    { id: 'homenajes', label: 'Homenajes' },
    { id: 'curiosidades', label: 'Curiosidades & Archivo' },
    { id: 'latam_festivales', label: 'Festivales LATAM' },
    { id: 'latam_premios', label: 'Premios LATAM' },
    { id: 'internacional', label: 'Internacional' },
  ];

  const latamRegions = [
    { id: 'argentina', label: '🇦🇷 Argentina', emoji: '🇦🇷' },
    { id: 'mexico', label: '🇲🇽 México', emoji: '🇲🇽' },
    { id: 'colombia', label: '🇨🇴 Colombia', emoji: '🇨🇴' },
    { id: 'chile', label: '🇨🇱 Chile', emoji: '🇨🇱' },
    { id: 'brasil', label: '🇧🇷 Brasil', emoji: '🇧🇷' },
    { id: 'peru', label: '🇵🇪 Perú', emoji: '🇵🇪' },
    { id: 'venezuela', label: '🇻🇪 Venezuela', emoji: '🇻🇪' },
    { id: 'uruguay', label: '🇺🇾 Uruguay', emoji: '🇺🇾' },
    { id: 'bolivia', label: '🇧🇴 Bolivia', emoji: '🇧🇴' },
    { id: 'ecuador', label: '🇪🇨 Ecuador', emoji: '🇪🇨' },
    { id: 'paraguay', label: '🇵🇾 Paraguay', emoji: '🇵🇾' },
    { id: 'cuba', label: '🇨🇺 Cuba', emoji: '🇨🇺' },
    { id: 'puerto_rico', label: '🇵🇷 Puerto Rico', emoji: '🇵🇷' },
    { id: 'republica_dominicana', label: '🇩🇴 R. Dominicana', emoji: '🇩🇴' },
    { id: 'centroamerica', label: '🌎 Centroamérica', emoji: '🌎' },
    { id: 'latam_general', label: '🌎 LATAM General', emoji: '🌎' },
  ];

  const sourceOptions = [
    { id: 'musicbrainz', label: 'MusicBrainz / Wikidata', emoji: '🟢', desc: 'MBID & Wikidata LATAM' },
    { id: 'crock', label: 'CRock.com.ar', emoji: '🎸', desc: 'Archivo de Rock' },
    { id: 'efe_eme', label: 'Efe Eme', emoji: '📰', desc: 'Música Popular' },
    { id: 'folklore', label: 'Folklore Tradiciones', emoji: '🪗', desc: 'Folklore y Tango' },
    { id: 'mia_fm', label: 'Mía FM (Cienradios)', emoji: '📻', desc: 'Crónicas & Radio' },
  ];

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handleGenerateAI = async () => {
    setLoadingAI(true);
    setAiSuggestions([]);
    setAiDebugInfo(null);

    const activeSources = selectedQuerySources.length > 0 ? selectedQuerySources : sourceOptions.map(s => s.id);

    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_daily_ephemerides',
          payload: {
            day: formData.day,
            month: formData.month,
            category: formData.category,
            region: selectedRegion,
            sources: activeSources,
          },
        }),
      });

      const rawText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(rawText);
      } catch {
        if (rawText.includes('<html') || res.status === 504 || res.status === 502) {
          setNotification({
            type: 'error',
            text: `Aviso del Servidor (${res.status}): La consulta tardó más de lo esperado.`,
          });
          return;
        }
        setNotification({
          type: 'error',
          text: `Error de respuesta inesperada (${res.status}): ${rawText.substring(0, 120)}`,
        });
        return;
      }

      if (!res.ok || !data.success) {
        setNotification({ type: 'error', text: `Aviso: ${data.error || 'Error al consultar archivos'}` });
        return;
      }

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setAiSuggestions(data.data);
        if (data.model) {
          setAiModelName(data.model);
        }
        if (data.tokenUsage) {
          setAiDebugInfo(data.tokenUsage);
        }
        if (data.region) {
          setAiRegionName(data.region);
        }
        setAiGroundedSources(data.groundedSources ?? 0);

        // Autofill form with first suggestion
        const first = data.data[0];
        setFormData((prev) => ({
          ...prev,
          title: first.title,
          year: first.year,
          category: first.category || prev.category,
          categoryLabel: first.categoryLabel || prev.categoryLabel,
          description: first.description,
          source: first.source,
          impactBadge: first.impactBadge,
          imageUrl: first.imageUrl || prev.imageUrl,
          mbid: first.mbid,
          country: first.country,
          originCity: first.originCity,
          ipi: first.ipi,
        }));
        const regionLabel = latamRegions.find(r => r.id === selectedRegion)?.label || selectedRegion;
        setNotification({ type: 'success', text: `¡${data.data.length} efemérides 100% verificadas de ${regionLabel} para el ${formData.day}/${formData.month} desde archivos documentales!` });
      } else if (data.success && Array.isArray(data.data) && data.data.length === 0) {
        const regionLabel = latamRegions.find(r => r.id === selectedRegion)?.label || selectedRegion;
        setNotification({
          type: 'error',
          text: `No se encontraron registros para ${regionLabel} el ${formData.day}/${formData.month} en las fuentes consultadas.`
        });
      }
    } catch (e: any) {
      console.error(e);
      setNotification({ type: 'error', text: `Error de conexión: ${e?.message}` });
    } finally {
      setLoadingAI(false);
    }
  };

  const handleSelectAiOption = (item: any) => {
    setFormData((prev) => ({
      ...prev,
      title: item.title,
      year: item.year,
      category: item.category || prev.category,
      categoryLabel: item.categoryLabel || prev.categoryLabel,
      description: item.description,
      source: item.source,
      impactBadge: item.impactBadge,
      imageUrl: item.imageUrl || prev.imageUrl,
      mbid: item.mbid,
      country: item.country,
      originCity: item.originCity,
      ipi: item.ipi,
    }));

    // Descartar automáticamente de aiSuggestions este item y todas las versiones alternativas que coincidan con su duplicateId
    if (item.duplicateId) {
      setAiSuggestions((prev) => prev.filter((s) => s.duplicateId !== item.duplicateId && s.title !== item.title));
      if (highlightDuplicateId === item.duplicateId) {
        setHighlightDuplicateId(null);
      }
      setNotification({
        type: 'success',
        text: `Cargada versión de "${item.source}" en el formulario. Se descartaron las coincidencias de las demás fuentes para evitar guardados redundantes.`,
      });
    } else {
      setAiSuggestions((prev) => prev.filter((s) => s.title !== item.title));
      setNotification({ type: 'success', text: `Cargada versión de "${item.source}" en el formulario editorial.` });
    }
  };

  const mbItems = useMemo(
    () => aiSuggestions.filter((s) => s.sourceKey === 'musicbrainz' || s.source?.toLowerCase().includes('musicbrainz') || s.source?.toLowerCase().includes('wikidata')),
    [aiSuggestions]
  );
  const crockItems = useMemo(
    () => aiSuggestions.filter((s) => s.sourceKey === 'crock' || s.source?.toLowerCase().includes('crock')),
    [aiSuggestions]
  );
  const efeEmeItems = useMemo(
    () => aiSuggestions.filter((s) => s.sourceKey === 'efe_eme' || s.source?.toLowerCase().includes('efe eme')),
    [aiSuggestions]
  );
  const folkloreItems = useMemo(
    () => aiSuggestions.filter((s) => s.sourceKey === 'folklore' || s.source?.toLowerCase().includes('folklore')),
    [aiSuggestions]
  );
  const miaFmItems = useMemo(
    () => aiSuggestions.filter((s) => s.sourceKey === 'mia_fm' || s.source?.toLowerCase().includes('mía fm') || s.source?.toLowerCase().includes('cienradios')),
    [aiSuggestions]
  );
  const duplicateItems = useMemo(
    () => aiSuggestions.filter((s) => s.matchedSources && s.matchedSources.length > 0),
    [aiSuggestions]
  );

  // Items por columna considerando el filtro de duplicados y filtros de fuente
  const isDuplicateFilter = sourceFilter === 'duplicates';

  const displayMbItems = useMemo(() => {
    if (isDuplicateFilter) return mbItems.filter((s) => s.matchedSources && s.matchedSources.length > 0);
    return mbItems;
  }, [mbItems, isDuplicateFilter]);

  const displayCrockItems = useMemo(() => {
    if (isDuplicateFilter) return crockItems.filter((s) => s.matchedSources && s.matchedSources.length > 0);
    return crockItems;
  }, [crockItems, isDuplicateFilter]);

  const displayEfeEmeItems = useMemo(() => {
    if (isDuplicateFilter) return efeEmeItems.filter((s) => s.matchedSources && s.matchedSources.length > 0);
    return efeEmeItems;
  }, [efeEmeItems, isDuplicateFilter]);

  const displayFolkloreItems = useMemo(() => {
    if (isDuplicateFilter) return folkloreItems.filter((s) => s.matchedSources && s.matchedSources.length > 0);
    return folkloreItems;
  }, [folkloreItems, isDuplicateFilter]);

  const displayMiaFmItems = useMemo(() => {
    if (isDuplicateFilter) return miaFmItems.filter((s) => s.matchedSources && s.matchedSources.length > 0);
    return miaFmItems;
  }, [miaFmItems, isDuplicateFilter]);

  // Lista dinámica de columnas activas (solo las que tienen efemérides > 0)
  const activeColumns = useMemo(() => {
    const cols = [
      {
        id: 'musicbrainz',
        title: 'MusicBrainz / LATAM',
        emoji: '🟢',
        badgeColor: 'bg-[#93a887]/15 text-[#93a887] border-[#93a887]/30',
        dotColor: 'bg-[#93a887]',
        items: displayMbItems,
        matchesFilter: sourceFilter === 'all' || sourceFilter === 'duplicates' || sourceFilter === 'musicbrainz',
      },
      {
        id: 'crock',
        title: 'CRock.com.ar',
        emoji: '🎸',
        badgeColor: 'bg-[#d97d64]/15 text-[#d97d64] border-[#d97d64]/30',
        dotColor: 'bg-[#d97d64]',
        items: displayCrockItems,
        matchesFilter: sourceFilter === 'all' || sourceFilter === 'duplicates' || sourceFilter === 'crock',
      },
      {
        id: 'efe_eme',
        title: 'Efe Eme',
        emoji: '📰',
        badgeColor: 'bg-[#7ba0b8]/15 text-[#9bbbd0] border-[#7ba0b8]/30',
        dotColor: 'bg-[#7ba0b8]',
        items: displayEfeEmeItems,
        matchesFilter: sourceFilter === 'all' || sourceFilter === 'duplicates' || sourceFilter === 'efe_eme',
      },
      {
        id: 'folklore',
        title: 'Folklore Tradiciones',
        emoji: '🪗',
        badgeColor: 'bg-[#c2a265]/15 text-[#d4b984] border-[#c2a265]/30',
        dotColor: 'bg-[#c2a265]',
        items: displayFolkloreItems,
        matchesFilter: sourceFilter === 'all' || sourceFilter === 'duplicates' || sourceFilter === 'folklore',
      },
      {
        id: 'mia_fm',
        title: 'Mía FM (Cienradios)',
        emoji: '📻',
        badgeColor: 'bg-[#e07a5f]/15 text-[#f08a6f] border-[#e07a5f]/30',
        dotColor: 'bg-[#e07a5f]',
        items: displayMiaFmItems,
        matchesFilter: sourceFilter === 'all' || sourceFilter === 'duplicates' || sourceFilter === 'mia_fm',
      },
    ];

    return cols.filter((c) => c.matchesFilter && c.items.length > 0);
  }, [
    sourceFilter,
    displayMbItems,
    displayCrockItems,
    displayEfeEmeItems,
    displayFolkloreItems,
    displayMiaFmItems,
  ]);

  const filteredSuggestions = useMemo(() => {
    if (sourceFilter === 'musicbrainz') return mbItems;
    if (sourceFilter === 'crock') return crockItems;
    if (sourceFilter === 'efe_eme') return efeEmeItems;
    if (sourceFilter === 'folklore') return folkloreItems;
    if (sourceFilter === 'mia_fm') return miaFmItems;
    if (sourceFilter === 'duplicates') return duplicateItems;
    return aiSuggestions;
  }, [sourceFilter, aiSuggestions, mbItems, crockItems, efeEmeItems, folkloreItems, miaFmItems, duplicateItems]);

  // Renderizador unificado de cada Card con detector de duplicados y resalte
  const renderSuggestionCard = (sug: any, idx: number) => {
    const isHighlighted = Boolean(highlightDuplicateId && sug.duplicateId === highlightDuplicateId);
    const isDuplicate = Boolean(sug.matchedSources && sug.matchedSources.length > 0);

    return (
      <div
        key={`${sug.sourceKey || 'src'}-${idx}-${sug.year}`}
        className={`p-3.5 rounded-xl border space-y-2.5 text-xs transition-all relative ${
          isHighlighted
            ? 'border-[#d97d64] bg-[#d97d64]/10 ring-2 ring-[#d97d64] shadow-lg shadow-[#d97d64]/20'
            : isDuplicate
            ? 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/70'
            : 'border-[#2e3039] bg-[#18191e] hover:border-[#3d404d]'
        }`}
      >
        {/* Banner de Coincidencia / Duplicado entre fuentes */}
        {isDuplicate && (
          <div className="flex items-center justify-between gap-1.5 px-2 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
            <span className="flex items-center gap-1 truncate">
              <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
              <span>Coincide con: <strong>{sug.matchedSources?.join(', ')}</strong></span>
            </span>
            {sug.duplicateId && (
              <button
                type="button"
                onClick={() => setHighlightDuplicateId(highlightDuplicateId === sug.duplicateId ? null : sug.duplicateId)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer flex-shrink-0 ${
                  isHighlighted ? 'bg-[#d97d64] text-[#151618]' : 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/40'
                }`}
                title="Resaltar todas las versiones de esta efeméride en las demás columnas"
              >
                {isHighlighted ? 'Desmarcar' : '🔍 Comparar'}
              </button>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sand-soft text-[#e6cca0]">
                Año {sug.year}
              </span>
              <span className="text-[10px] text-[#8c887f] uppercase font-semibold">
                {sug.categoryLabel || sug.category}
              </span>
              {sug.impactBadge && (
                <span className="text-[10px] font-medium text-[#d97d64] bg-terracotta-soft px-1.5 py-0.2 rounded">
                  {sug.impactBadge}
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold text-[#f3f1ec] pt-0.5">{sug.title}</h4>
            <p className="text-xs text-[#aba79e] leading-relaxed">{sug.description}</p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] text-[#78746c] font-medium">
                Fuente: <strong className="text-[#aba79e]">{sug.source}</strong>
              </span>
              {sug.mbid && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#93a887]/15 text-[#93a887] border border-[#93a887]/30">
                  ✓ MBID Verificado
                </span>
              )}
              {sug.originCity && sug.country && (
                <span className="text-[9px] text-[#8c887f] bg-[#141518] px-1.5 py-0.2 rounded border border-[#2d2f38]">
                  📍 {sug.originCity}, {sug.country}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[#2d2f38] flex items-center justify-between text-xs gap-2">
          <button
            type="button"
            onClick={() => handleSelectAiOption(sug)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#24252c] text-[#e6cca0] hover:bg-[#2d2f38] font-semibold transition-colors cursor-pointer"
          >
            <span>Cargar al formulario</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={() => handleSaveSingleSuggestion(sug)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#1e2420] text-[#93a887] border border-[#2f3f33] hover:bg-[#28332b] font-bold transition-colors cursor-pointer"
          >
            <Save className="w-3 h-3" />
            <span>Guardar directo</span>
          </button>
        </div>
      </div>
    );
  };

  // Save a single suggestion from the card directly
  const handleSaveSingleSuggestion = async (item: any) => {
    const newItem: EphemerisItem = {
      id: `eph-${Date.now()}`,
      day: item.day || formData.day,
      month: item.month || formData.month,
      year: item.year,
      title: item.title,
      description: item.description,
      category: item.category || 'lanzamientos',
      categoryLabel: item.categoryLabel || 'Lanzamientos Históricos',
      source: item.source || 'Archivo Histórico',
      impactBadge: item.impactBadge || 'Hito Histórico',
      imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
      mbid: item.mbid,
      country: item.country,
      originCity: item.originCity,
      ipi: item.ipi,
    };

    try {
      const { id: _, ...payload } = newItem;
      const created = await pb.collection('ephemerides').create(payload);
      newItem.id = created.id;
    } catch (e: any) {
      console.error('Error guardando en PocketBase:', e);
    }

    setItemsList((prev) => [newItem, ...prev]);

    // Eliminar de las sugerencias este ítem y todas las coincidencias asociadas de otras fuentes
    if (item.duplicateId) {
      setAiSuggestions((prev) => prev.filter((s) => s.duplicateId !== item.duplicateId && s.title !== item.title));
      if (highlightDuplicateId === item.duplicateId) {
        setHighlightDuplicateId(null);
      }
      setNotification({
        type: 'success',
        text: `¡Efeméride "${newItem.title}" guardada en PocketBase! Se descartaron las coincidencias redundantes de las demás fuentes.`,
      });
    } else {
      setAiSuggestions((prev) => prev.filter((s) => s.title !== item.title));
      setNotification({ type: 'success', text: `¡Efeméride "${newItem.title}" guardada en PocketBase!` });
    }
  };

  // Save all suggestions in 1-click bulk
  const handleSaveAllSuggestions = async () => {
    if (aiSuggestions.length === 0) return;
    setSavingBulk(true);

    const newItemsToAdd: EphemerisItem[] = [];

    for (const sug of aiSuggestions) {
      const newItem: EphemerisItem = {
        id: `eph-${Date.now()}`,
        day: sug.day || formData.day,
        month: sug.month || formData.month,
        year: sug.year,
        title: sug.title,
        description: sug.description,
        category: sug.category || 'lanzamientos',
        categoryLabel: sug.categoryLabel || 'Lanzamientos Históricos',
        source: sug.source || 'Archivo Histórico',
        impactBadge: sug.impactBadge || 'Hito Histórico',
        imageUrl: sug.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
        mbid: sug.mbid,
        country: sug.country,
        originCity: sug.originCity,
        ipi: sug.ipi,
      };

      try {
        const { id: _, ...payload } = newItem;
        const created = await pb.collection('ephemerides').create(payload);
        newItem.id = created.id;
      } catch (e: any) {
        console.error('Error guardando en PocketBase:', e);
      }

      newItemsToAdd.push(newItem);
    }

    setItemsList((prev) => [...newItemsToAdd, ...prev]);
    setAiSuggestions([]);
    setSavingBulk(false);
    setNotification({ type: 'success', text: `¡Se guardaron los ${newItemsToAdd.length} hitos en PocketBase exitosamente!` });
  };

  const handleCategoryChange = (catId: EphemerisCategory) => {
    const found = categories.find((c) => c.id === catId);
    setFormData({
      ...formData,
      category: catId,
      categoryLabel: found?.label || 'Efeméride',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newItem: EphemerisItem = {
      id: `eph-${Date.now()}`,
      day: formData.day,
      month: formData.month,
      year: formData.year,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      categoryLabel: formData.categoryLabel,
      source: formData.source,
      impactBadge: formData.impactBadge,
      imageUrl: formData.imageUrl,
    };

    try {
      const { id: _, ...payload } = newItem;
      const created = await pb.collection('ephemerides').create(payload);
      newItem.id = created.id;
      setNotification({ type: 'success', text: `¡Efeméride "${newItem.title}" agregada al calendario histórico!` });
    } catch (e: any) {
      console.error('Error guardando en PocketBase:', e);
      setNotification({ type: 'error', text: `Error al guardar en PocketBase: ${e?.message || 'Revisá permisos'}` });
    }

    setItemsList([newItem, ...itemsList]);
    // Descartar de las sugerencias por si quedó alguna versión pendiente
    setAiSuggestions((prev) => prev.filter((s) => s.title !== formData.title));

    setFormData({
      title: '',
      day: formData.day,
      month: formData.month,
      year: 1985,
      category: 'lanzamientos',
      categoryLabel: 'Lanzamientos Históricos',
      description: '',
      source: '',
      impactBadge: '',
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=800&auto=format&fit=crop',
      mbid: undefined,
      country: undefined,
      originCity: undefined,
      ipi: undefined,
    });
  };

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Gestión de Efemérides Musicales"
        subtitle="Carga y consulta de hitos históricos: SADAIC, Billboard, Cosquín, lanzamientos y natalicios"
      />

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 border animate-in fade-in duration-150 ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{notification.text}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-[11px] opacity-70 hover:opacity-100 underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main Studio Top Grid: Left = Search Controls | Right = Editorial Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================================= */}
        {/* COLUMNA 1: ASISTENTE DE INVESTIGACIÓN IA & ARCHIVOS DOCUMENTALES          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="natural-card p-5 sm:p-6 rounded-2xl border border-[#2e3039] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2d2f38]">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#e6cca0] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#d97d64]" />
                  Archivos & Fuentes Documentales
                </h2>
                <p className="text-[11px] text-[#8c887f]">
                  MusicBrainz · CRock · Efe Eme · Folklore Tradiciones
                </p>
              </div>
            </div>

            {/* 1. Selector de País / Región */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-[#aba79e] font-semibold block">
                1. País o Región a Consultar:
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {latamRegions.map((region) => (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => setSelectedRegion(region.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      selectedRegion === region.id
                        ? 'bg-[#d97d64] text-[#151618] border-[#d97d64] shadow-sm shadow-[#d97d64]/20'
                        : 'bg-[#18191e] text-[#aba79e] border-[#2e3039] hover:border-[#424554] hover:text-[#f3f1ec]'
                    }`}
                  >
                    {region.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Selector de Fecha */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">2. Día</label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Mes</label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                >
                  {monthNames.map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Selector de Fuentes a Consultar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] text-[#aba79e] font-semibold">
                  3. Fuentes Documentales a Consultar:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedQuerySources(sourceOptions.map(s => s.id))}
                    className="text-[10px] text-[#e6cca0] hover:underline cursor-pointer font-medium"
                  >
                    Todas ({sourceOptions.length})
                  </button>
                  <span className="text-[#3d404d] text-[10px]">|</span>
                  <button
                    type="button"
                    onClick={() => setSelectedQuerySources([])}
                    className="text-[10px] text-[#aba79e] hover:underline cursor-pointer"
                  >
                    Ninguna
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {sourceOptions.map((src) => {
                  const isChecked = selectedQuerySources.includes(src.id);
                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setSelectedQuerySources(selectedQuerySources.filter(id => id !== src.id));
                        } else {
                          setSelectedQuerySources([...selectedQuerySources, src.id]);
                        }
                      }}
                      className={`flex items-center gap-2.5 p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#1e2027] border-[#d97d64]/60 text-[#f3f1ec] shadow-xs'
                          : 'bg-[#141518] border-[#282a33] text-[#78746c] hover:border-[#383a45]'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] border transition-colors flex-shrink-0 ${
                        isChecked ? 'bg-[#d97d64] border-[#d97d64] text-[#151618] font-bold' : 'border-[#383a45] bg-[#1a1b20]'
                      }`}>
                        {isChecked && '✓'}
                      </span>
                      <span className="text-sm">{src.emoji}</span>
                      <div className="truncate flex-1">
                        <span className="font-semibold block truncate text-xs">{src.label}</span>
                        <span className="text-[10px] text-[#8c887f] block truncate">{src.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={loadingAI}
              className="w-full py-2.5 rounded-xl bg-sand-soft hover:bg-[#e6cca0]/25 text-[#f3f1ec] font-bold text-xs border border-[#3c3e4b] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loadingAI ? <Loader2 className="w-4 h-4 animate-spin text-[#e6cca0]" /> : <BookOpen className="w-4 h-4 text-[#e6cca0]" />}
              <span>
                {loadingAI
                  ? `Consultando fuentes documentales de ${latamRegions.find((r) => r.id === selectedRegion)?.label || selectedRegion}...`
                  : `Buscar Efemérides Reales (${selectedQuerySources.length} fuentes activas)`}
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMNA 2: FORMULARIO EDITORIAL LIMPIO (CARGA MANUAL O EDITADA)            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleSubmit} className="natural-card p-5 sm:p-6 rounded-2xl border border-[#2e3039] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#2d2f38]">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-[#f3f1ec] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#e6cca0]" />
                  Formulario Editorial de Efeméride
                </h2>
                <p className="text-[11px] text-[#8c887f]">
                  Completá manualmente o editá los datos autocompletados desde los archivos
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="text-[11px] text-[#aba79e] hover:text-[#f3f1ec] underline cursor-pointer"
              >
                Limpiar campos
              </button>
            </div>

            {/* Fecha: Día, Mes, Año */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Día *</label>
                <select
                  value={formData.day}
                  onChange={(e) => setFormData({ ...formData, day: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Mes *</label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                >
                  {monthNames.map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Año del Hito *</label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 1982"
                  value={formData.year || ''}
                  onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Categoría / Tipo de Registro *</label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value as EphemerisCategory)}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Título */}
            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Título del Hito Histórico *</label>
              <input
                type="text"
                required
                placeholder="Ej: Soda Stereo debuta en las listas de Billboard Latino"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Descripción Completa del Hecho *</label>
              <textarea
                rows={3}
                required
                placeholder="Detalle histórico de lo ocurrido en esta fecha..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
              />
            </div>

            {/* Fuente y Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Fuente de Verificación</label>
                <input
                  type="text"
                  placeholder="Ej: MusicBrainz / SADAIC / Efe Eme"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#aba79e] font-semibold block mb-1">Badge de Impacto</label>
                <input
                  type="text"
                  placeholder="Ej: Hito Histórico"
                  value={formData.impactBadge}
                  onChange={(e) => setFormData({ ...formData, impactBadge: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#18191e] border border-[#2e3039] text-[#f3f1ec] text-xs focus:outline-none focus:border-[#d97d64]"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] font-bold text-xs shadow-md shadow-[#d97d64]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Efeméride en PocketBase</span>
            </button>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PANEL COMPARADOR DE FUENTES Y DETECCIÓN DE DUPLICADOS (FULL WIDTH)       */}
      {/* ========================================================================= */}
      {aiSuggestions.length > 0 && (
        <div className="natural-card p-5 sm:p-6 rounded-2xl border border-[#2e3039] space-y-4 animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#2d2f38]">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-[#e6cca0] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#d97d64]" />
                  Resultados Verificados ({aiSuggestions.length})
                </span>
                <span className="text-xs text-[#aba79e] bg-[#24252c] px-2 py-0.5 rounded border border-[#31333d]">
                  Región: {latamRegions.find((r) => r.id === selectedRegion)?.label || selectedRegion}
                </span>
                {duplicateItems.length > 0 && (
                  <span className="text-xs font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    {duplicateItems.length} coincidencias entre fuentes
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8c887f] pt-0.5">
                Compará las versiones de cada archivo documental y seleccioná la mejor redacción para guardar o editar.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* View Mode Toggle: Columns vs Unified List */}
              <div className="flex items-center rounded-xl bg-[#141518] p-1 border border-[#2e3039]">
                <button
                  type="button"
                  onClick={() => setViewMode('columns')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'columns'
                      ? 'bg-[#d97d64] text-[#151618] shadow-xs'
                      : 'text-[#aba79e] hover:text-[#f3f1ec]'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Columnas por Fuente</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[#d97d64] text-[#151618] shadow-xs'
                      : 'text-[#aba79e] hover:text-[#f3f1ec]'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Lista Unificada</span>
                </button>
              </div>

              {aiSuggestions.length > 1 && (
                <button
                  type="button"
                  onClick={handleSaveAllSuggestions}
                  disabled={savingBulk}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-[#d97d64] hover:bg-[#cb7159] text-[#151618] shadow-sm transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{savingBulk ? 'Guardando...' : `Guardar los ${aiSuggestions.length} juntos`}</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Chips Bar (Solo muestra fuentes que tienen efemérides > 0) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-1">
            <span className="text-[11px] text-[#78746c] flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" />
              Filtrar por:
            </span>

            <button
              type="button"
              onClick={() => setSourceFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                sourceFilter === 'all'
                  ? 'bg-sand-soft text-[#e6cca0] border-[#e6cca0]/40'
                  : 'bg-[#18191e] text-[#aba79e] border-[#2e3039] hover:text-[#f3f1ec]'
              }`}
            >
              Todas ({aiSuggestions.length})
            </button>

            {mbItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSourceFilter('musicbrainz')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  sourceFilter === 'musicbrainz'
                    ? 'bg-[#93a887]/20 text-[#93a887] border-[#93a887]/50'
                    : 'bg-[#18191e] text-[#aba79e] border-[#2e3039] hover:text-[#f3f1ec]'
                }`}
              >
                🟢 MusicBrainz ({mbItems.length})
              </button>
            )}

            {crockItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSourceFilter('crock')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  sourceFilter === 'crock'
                    ? 'bg-[#d97d64]/20 text-[#d97d64] border-[#d97d64]/50'
                    : 'bg-[#18191e] text-[#aba79e] border-[#2e3039] hover:text-[#f3f1ec]'
                }`}
              >
                🎸 CRock ({crockItems.length})
              </button>
            )}

            {efeEmeItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSourceFilter('efe_eme')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  sourceFilter === 'efe_eme'
                    ? 'bg-[#7ba0b8]/20 text-[#9bbbd0] border-[#7ba0b8]/50'
                    : 'bg-[#18191e] text-[#aba79e] border-[#2e3039] hover:text-[#f3f1ec]'
                }`}
              >
                📰 Efe Eme ({efeEmeItems.length})
              </button>
            )}

            {folkloreItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSourceFilter('folklore')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  sourceFilter === 'folklore'
                    ? 'bg-[#c2a265]/20 text-[#d4b984] border-[#c2a265]/50'
                    : 'bg-[#18191e] text-[#aba79e] border-[#2e3039] hover:text-[#f3f1ec]'
                }`}
              >
                🪗 Folklore ({folkloreItems.length})
              </button>
            )}

            {miaFmItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSourceFilter('mia_fm')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  sourceFilter === 'mia_fm'
                    ? 'bg-[#e07a5f]/20 text-[#f08a6f] border-[#e07a5f]/50'
                    : 'bg-[#18191e] text-[#aba79e] border-[#2e3039] hover:text-[#f3f1ec]'
                }`}
              >
                📻 Mía FM ({miaFmItems.length})
              </button>
            )}

            {duplicateItems.length > 0 && (
              <button
                type="button"
                onClick={() => setSourceFilter('duplicates')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  sourceFilter === 'duplicates'
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 shadow-xs'
                    : 'bg-amber-500/10 text-amber-300/80 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                <span>Solo Coincidencias ({duplicateItems.length})</span>
              </button>
            )}

            {highlightDuplicateId && (
              <button
                type="button"
                onClick={() => setHighlightDuplicateId(null)}
                className="ml-auto text-[10px] text-[#aba79e] hover:text-[#f3f1ec] underline cursor-pointer"
              >
                Limpiar resaltado comparativo
              </button>
            )}
          </div>

          {/* VISTA 1: COLUMNAS PARALELAS POR FUENTE (Solo renderiza las columnas con resultados) */}
          {viewMode === 'columns' ? (
            activeColumns.length > 0 ? (
              <div className={`grid gap-4 items-start pt-2 ${
                activeColumns.length === 1
                  ? 'grid-cols-1 max-w-2xl mx-auto'
                  : activeColumns.length === 2
                  ? 'grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto'
                  : activeColumns.length === 3
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
              }`}>
                {activeColumns.map((col) => (
                  <div key={col.id} className="p-4 rounded-xl bg-[#141518] border border-[#2e3039] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#282a33]">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                        <h3 className="text-xs font-bold text-[#f3f1ec] uppercase tracking-wider">
                          {col.emoji} {col.title}
                        </h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                        {col.items.length}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                      {col.items.map((sug, idx) => renderSuggestionCard(sug, idx))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#78746c] italic">
                No hay efemérides para mostrar con los filtros activos.
              </div>
            )
          ) : (
            /* VISTA 2: LISTA UNIFICADA FILTRABLE */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2 max-h-[750px] overflow-y-auto pr-1">
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((sug, idx) => renderSuggestionCard(sug, idx))
              ) : (
                <div className="col-span-full py-12 text-center text-xs text-[#78746c] italic">
                  No hay efemérides para el filtro seleccionado.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECCIÓN INFERIOR: ARCHIVO HISTÓRICO CARGADO EN POCKETBASE                 */}
      {/* ========================================================================= */}
      <div className="natural-card p-6 rounded-2xl border border-[#2e3039] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#2d2f38]">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#e6cca0] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#d97d64]" />
              Archivo Histórico en Base de Datos ({itemsList.length} registros)
            </h2>
            <p className="text-xs text-[#aba79e]">
              Efemérides persistidas en PocketBase visibles en la web pública de GUTA MÚSICA
            </p>
          </div>
          <span className="text-[11px] text-[#93a887] font-mono bg-[#93a887]/10 px-2.5 py-1 rounded-full border border-[#93a887]/20">
            ✓ Sincronizado en tiempo real
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[600px] overflow-y-auto pr-1">
          {itemsList.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-[#18191e] border border-[#2e3039] space-y-2 relative group hover:border-[#3d404d] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-sand-soft text-xs font-bold text-[#e6cca0]">
                    {item.day} de {monthNames[item.month - 1]} ({item.year})
                  </span>
                  <span className="text-[10px] text-[#8c887f] uppercase font-semibold">
                    {item.categoryLabel}
                  </span>
                </div>
                <button
                  onClick={() => setDeleteTarget({ id: item.id, title: item.title })}
                  className="text-[#78746c] hover:text-[#c0909b] p-1 transition-colors cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <h4 className="text-xs sm:text-sm font-bold text-[#f3f1ec]">{item.title}</h4>
              <p className="text-xs text-[#aba79e] line-clamp-3 leading-relaxed">{item.description}</p>
              {item.source && (
                <p className="text-[10px] text-[#78746c] italic">Fuente: {item.source}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Eliminar Efeméride"
        message={`¿Deseás eliminar la efeméride "${deleteTarget?.title}" del calendario histórico?`}
        confirmText="Eliminar Efeméride"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

