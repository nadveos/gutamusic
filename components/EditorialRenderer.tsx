'use client';

/**
 * EditorialRenderer.tsx
 *
 * Renders the editorial text of an interview with:
 *   - Full Markdown support (headings, bold, italic, blockquotes, lists, etc.)
 *   - <mark> highlights from ==text== syntax (applied by processEditorialText)
 *   - Auto-linked GUTA artist names rendered as styled internal links
 *   - HTML passthrough enabled so <mark> tags render correctly
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { processEditorialText } from '../lib/editorialUtils';
import type { ArtistRef } from '../lib/editorialUtils';

interface EditorialRendererProps {
  text: string;
  artists: ArtistRef[];
}

export function EditorialRenderer({ text, artists }: EditorialRendererProps) {
  const processed = processEditorialText(text, artists);

  return (
    <div className="editorial-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Paragraphs
          p({ children }) {
            return (
              <p className="text-[#aba79e] leading-relaxed text-xs sm:text-sm mb-4">
                {children}
              </p>
            );
          },

          // Headings
          h2({ children }) {
            return (
              <h2 className="text-lg sm:text-xl font-bold text-[#f3f1ec] mt-6 mb-2 leading-snug">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-base font-semibold text-[#e6cca0] mt-5 mb-2">
                {children}
              </h3>
            );
          },

          // Bold & Italic
          strong({ children }) {
            return (
              <strong className="font-bold text-[#f3f1ec]">{children}</strong>
            );
          },
          em({ children }) {
            return <em className="italic text-[#c5c0b6]">{children}</em>;
          },

          // Blockquote — estilo pull-quote editorial
          blockquote({ children }) {
            return (
              <blockquote className="border-l-2 border-[#d97d64] pl-4 my-4 italic text-[#c5c0b6] text-sm bg-[#24252c] py-3 pr-3 rounded-r-lg">
                {children}
              </blockquote>
            );
          },

          // Lists
          ul({ children }) {
            return (
              <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-[#aba79e] mb-4 ml-2">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm text-[#aba79e] mb-4 ml-2">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },

          // Horizontal rule — separador editorial
          hr() {
            return (
              <hr className="my-6 border-none h-px bg-gradient-to-r from-transparent via-[#3c3f4c] to-transparent" />
            );
          },

          // Links: internal GUTA artists get a special terracotta style
          a({ href, children }) {
            const isInternal = href?.startsWith('/');
            if (isInternal) {
              return (
                <a
                  href={href}
                  className="font-semibold text-[#d97d64] underline underline-offset-2 decoration-[#d97d64]/40 hover:text-[#e6cca0] hover:decoration-[#e6cca0]/60 transition-colors"
                >
                  {children}
                </a>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#93a887] underline underline-offset-2 hover:text-[#a8c4a0] transition-colors"
              >
                {children}
              </a>
            );
          },

          // Inline code
          code({ children }) {
            return (
              <code className="bg-[#24252c] text-[#e6cca0] rounded px-1 py-0.5 text-xs font-mono">
                {children}
              </code>
            );
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}
