import { VideoPlatform } from './types';

/**
 * Extracts YouTube Video ID from any YouTube URL format:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://music.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function parseYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  const regex =
    /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/|music\.youtube\.com\/watch\?v=)([^"&?\/\s]{11})/;
  const match = cleanUrl.match(regex);
  if (match && match[1]) {
    return match[1];
  }

  // If already an 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  return null;
}

/**
 * Detects video platform from URL string
 */
export function detectVideoPlatform(url: string): VideoPlatform {
  if (!url) return 'youtube';
  const lower = url.toLowerCase();
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
  return 'youtube';
}

/**
 * Generates high quality thumbnail URL from video URL or ID
 */
export function getVideoThumbnailUrl(url: string, platform?: VideoPlatform): string {
  const plat = platform || detectVideoPlatform(url);
  if (plat === 'youtube') {
    const videoId = parseYouTubeVideoId(url);
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
  }
  return '';
}

/**
 * Generates an iframe-compatible embed URL for YouTube, Shorts, Music, etc.
 */
export function getVideoEmbedUrl(url: string, platform?: VideoPlatform): string {
  if (!url) return '';
  const plat = platform || detectVideoPlatform(url);

  if (plat === 'youtube') {
    const videoId = parseYouTubeVideoId(url);
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    }
  }

  if (url.includes('/embed/')) {
    return url;
  }

  return url;
}
