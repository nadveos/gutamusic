'use client';

import React from 'react';
import { Cpu, Zap, Globe } from 'lucide-react';

export interface TokenUsageData {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

interface AITokenBadgeProps {
  usage: TokenUsageData | null;
  model?: string;
  grounded?: boolean;
  groundedSources?: number;
  action?: string;
  className?: string;
}

// Gemini 2.5 Flash pricing (as of 2025)
const COST_PER_1M_INPUT_USD = 0.30;
const COST_PER_1M_OUTPUT_USD = 2.50;

function estimateCost(usage: TokenUsageData): string {
  const input = usage.promptTokenCount ?? 0;
  const output = usage.candidatesTokenCount ?? 0;
  if (!input && !output) return '—';
  const cost = (input / 1_000_000) * COST_PER_1M_INPUT_USD
             + (output / 1_000_000) * COST_PER_1M_OUTPUT_USD;
  if (cost < 0.00001) return '< $0.00001';
  return `~$${cost.toFixed(5)}`;
}

export const AITokenBadge: React.FC<AITokenBadgeProps> = ({
  usage,
  model = 'gemini-2.5-flash',
  grounded = false,
  groundedSources = 0,
  action,
  className = '',
}) => {
  if (!usage) return null;

  const promptT = usage.promptTokenCount ?? 0;
  const outputT = usage.candidatesTokenCount ?? 0;
  const totalT  = usage.totalTokenCount ?? (promptT + outputT);
  const costStr = estimateCost(usage);

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 rounded-xl
        bg-[#13141a] border border-[#24262f] text-[10px] text-[#78746c]
        animate-in fade-in duration-200 ${className}`}
    >
      {/* Model + Grounding badge */}
      <span className="flex items-center gap-1 text-[#93a887] font-bold">
        <Cpu className="w-3 h-3" />
        {model}
        {grounded && (
          <span
            className="flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded bg-sky-900/40 border border-sky-700/30 text-sky-400"
            title="Google Search Grounding activo — fechas verificadas en tiempo real"
          >
            <Globe className="w-2.5 h-2.5" />
            {groundedSources > 0 ? `${groundedSources} fuentes` : 'Grounding ON'}
          </span>
        )}
      </span>

      <span className="opacity-30">|</span>

      {/* Token count */}
      <span className="flex items-center gap-1">
        <Zap className="w-2.5 h-2.5 text-[#e6cca0]" />
        <span className="text-[#aba79e] font-semibold">{totalT.toLocaleString()}</span>
        <span>tokens</span>
      </span>

      {promptT > 0 && (
        <span className="opacity-60 hidden sm:inline">
          entrada <span className="text-[#aba79e]">{promptT.toLocaleString()}</span>
          {' · '}
          salida <span className="text-[#aba79e]">{outputT.toLocaleString()}</span>
        </span>
      )}

      <span className="opacity-30">|</span>

      {/* Cost estimate */}
      <span
        className="text-[#93a887]"
        title="Estimación: $0.30/1M tokens de entrada + $2.50/1M de salida (Gemini 2.5 Flash)"
      >
        {action && <span className="mr-1 opacity-60">{action} ·</span>}
        costo ≈ <span className="font-bold">{costStr}</span> USD
      </span>
    </div>
  );
};
