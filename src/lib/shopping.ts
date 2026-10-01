import type { AppState, House, ShoppingItem } from './appState';

export type HouseGroup = { house: House; items: ShoppingItem[] };

export function addItem(
  state: AppState,
  id: string,
  name: string,
  houseId: string,
): AppState {
  const trimmed = name.trim();
  if (trimmed === '' || !state.houses.some((house) => house.id === houseId)) {
    return state;
  }
  return {
    ...state,
    shoppingItems: [
      ...state.shoppingItems,
      { id, name: trimmed, houseId, bought: false },
    ],
  };
}

export function toggleBought(state: AppState, id: string): AppState {
  return {
    ...state,
    shoppingItems: state.shoppingItems.map((item) =>
      item.id === id ? { ...item, bought: !item.bought } : item,
    ),
  };
}

export function deleteItem(state: AppState, id: string): AppState {
  return {
    ...state,
    shoppingItems: state.shoppingItems.filter((item) => item.id !== id),
  };
}

export function clearBought(state: AppState): AppState {
  return {
    ...state,
    shoppingItems: state.shoppingItems.filter((item) => !item.bought),
  };
}

export function groupByHouse(state: AppState, filter: string): HouseGroup[] {
  const isHouseFilter = state.houses.some((house) => house.id === filter);
  const houses = isHouseFilter
    ? state.houses.filter((house) => house.id === filter)
    : state.houses;
  const groups = houses.map((house) => {
    const items = state.shoppingItems.filter((item) => item.houseId === house.id);
    return {
      house,
      items: [
        ...items.filter((item) => !item.bought),
        ...items.filter((item) => item.bought),
      ],
    };
  });
  return isHouseFilter ? groups : groups.filter((group) => group.items.length > 0);
}
