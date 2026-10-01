import type { AppState } from './appState';

export type DeleteBlock = 'has-items' | 'last-house';

export function addHouse(state: AppState, id: string, name: string): AppState {
  const trimmed = name.trim();
  if (trimmed === '') return state;
  return { ...state, houses: [...state.houses, { id, name: trimmed }] };
}

export function renameHouse(state: AppState, id: string, name: string): AppState {
  const trimmed = name.trim();
  if (trimmed === '') return state;
  return {
    ...state,
    houses: state.houses.map((house) =>
      house.id === id ? { ...house, name: trimmed } : house,
    ),
  };
}

export function deleteBlockReason(state: AppState, id: string): DeleteBlock | null {
  if (state.houses.length <= 1) return 'last-house';
  if (state.shoppingItems.some((item) => item.houseId === id)) return 'has-items';
  return null;
}

export function deleteHouse(state: AppState, id: string): AppState {
  if (deleteBlockReason(state, id) !== null) return state;
  return { ...state, houses: state.houses.filter((house) => house.id !== id) };
}
