import type { AppState, PrintItem } from './appState';

// A regex instead of `URL`: React Native's URL polyfill is incomplete.
const URL_PATTERN = /^https?:\/\/[^\s/?#]+([/?#]\S*)?$/i;

export function isValidUrl(value: string): boolean {
  return URL_PATTERN.test(value.trim());
}

export function urlHost(url: string): string {
  const authority = url
    .trim()
    .replace(/^https?:\/\//i, '')
    .split(/[/?#]/)[0];
  return authority.slice(authority.lastIndexOf('@') + 1).replace(/^www\./i, '');
}

export function addPrintItem(
  state: AppState,
  id: string,
  title: string,
  url: string,
): AppState {
  const trimmed = title.trim();
  if (trimmed === '' || !isValidUrl(url)) return state;
  return {
    ...state,
    printItems: [
      ...state.printItems,
      { id, title: trimmed, url: url.trim(), printed: false },
    ],
  };
}

export function togglePrinted(state: AppState, id: string): AppState {
  return {
    ...state,
    printItems: state.printItems.map((item) =>
      item.id === id ? { ...item, printed: !item.printed } : item,
    ),
  };
}

export function deletePrintItem(state: AppState, id: string): AppState {
  return { ...state, printItems: state.printItems.filter((item) => item.id !== id) };
}

export function clearPrinted(state: AppState): AppState {
  return { ...state, printItems: state.printItems.filter((item) => !item.printed) };
}

export function sortPrintItems(items: PrintItem[]): PrintItem[] {
  return [...items.filter((item) => !item.printed), ...items.filter((i) => i.printed)];
}
