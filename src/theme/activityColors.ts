import { colors } from './colors';

const palette = [colors.accent, colors.warning, colors.info, colors.mauve];

// Same id always gets the same stripe color.
export function activityColorFor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palette[hash % palette.length];
}
