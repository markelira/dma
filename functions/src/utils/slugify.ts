/**
 * Hungarian character transliteration map.
 * Applied BEFORE NFD normalization since ő/ű (double-acute) don't decompose cleanly via NFD.
 */
const HUNGARIAN_CHAR_MAP: Record<string, string> = {
  'á': 'a', 'Á': 'A', 'é': 'e', 'É': 'E', 'í': 'i', 'Í': 'I',
  'ó': 'o', 'Ó': 'O', 'ö': 'o', 'Ö': 'O', 'ő': 'o', 'Ő': 'O',
  'ú': 'u', 'Ú': 'U', 'ü': 'u', 'Ü': 'U', 'ű': 'u', 'Ű': 'U',
};

/**
 * Generate URL-friendly slugs from text with proper Hungarian character support.
 * Shared across all Cloud Functions that need slug generation.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .trim()
    // Transliterate Hungarian characters first (before NFD which fails on ő/ű)
    .replace(/[áÁéÉíÍóÓöÖőŐúÚüÜűŰ]/g, (ch) => HUNGARIAN_CHAR_MAP[ch] || ch)
    .toLowerCase()
    // Remove remaining accents/diacritics via NFD
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove all non-word chars except hyphens
    .replace(/[^\w-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/--+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
