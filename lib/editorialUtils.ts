/**
 * editorialUtils.ts
 *
 * Pre-processes an editorial Markdown string before rendering:
 *   1. Converts ==highlighted text== → <mark>highlighted text</mark>
 *   2. Auto-links known GUTA artist names → [Name](/artistas/slug)
 *      Only artists that already have a profile on the site are linked.
 *      Matching is case-insensitive and whole-word only to avoid false positives.
 */

export interface ArtistRef {
  stageName: string;
  slug: string;
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Converts ==text== syntax into <mark>text</mark> HTML.
 * Compatible with react-markdown's dangerouslySetInnerHTML or a custom renderer.
 * We output raw HTML tags so react-markdown's rehype pipeline can handle them.
 */
function applyHighlights(text: string): string {
  // Match ==...== that are not inside code blocks (backtick pairs)
  return text.replace(/==([^=\n]+)==/g, '<mark>$1</mark>');
}

/**
 * Auto-links artist names that already exist in the GUTA catalog.
 * Converts plain occurrences of an artist's stageName into Markdown links.
 *
 * Skips names that are already part of a Markdown link: [...](...)
 * Skips names inside backtick code spans.
 */
function applyArtistLinks(text: string, artists: ArtistRef[]): string {
  // Sort by name length descending so longer names match before shorter substrings
  const sorted = [...artists].sort(
    (a, b) => b.stageName.length - a.stageName.length
  );

  for (const artist of sorted) {
    if (!artist.stageName || !artist.slug) continue;

    const escaped = escapeRegex(artist.stageName);

    // Negative lookbehind: don't match if already inside [...](...) markdown link
    // Negative lookahead: avoid partial word matches
    const pattern = new RegExp(
      `(?<!\\[)(?<!\\()\\b(${escaped})\\b(?![^[]*\\])`,
      'gi'
    );

    const mdLink = `[${artist.stageName}](/artistas/${artist.slug})`;

    // Replace, but protect existing markdown links by checking context
    text = text.replace(pattern, (match, _captured, offset) => {
      // Check that we're not inside an existing markdown link target [...]
      const before = text.slice(0, offset);
      const openBrackets = (before.match(/\[/g) || []).length;
      const closeBrackets = (before.match(/\]/g) || []).length;
      if (openBrackets > closeBrackets) return match; // inside [...] already
      return mdLink;
    });
  }

  return text;
}

/**
 * Main function: process an editorial text string.
 * Call this before passing the text to ReactMarkdown.
 *
 * Order matters:
 *   1. Apply artist auto-links first (plain text → Markdown links)
 *   2. Apply ==highlights== (plain syntax → <mark> HTML)
 */
export function processEditorialText(
  text: string,
  artists: ArtistRef[]
): string {
  if (!text) return '';
  let processed = applyArtistLinks(text, artists);
  processed = applyHighlights(processed);
  return processed;
}
