import {
  addItem,
  clearBought,
  deleteItem,
  groupByHouse,
  toggleBought,
} from './shopping';
import { createSampleState } from './stateFixtures';

function stateWithItems() {
  const state = createSampleState();
  state.shoppingItems = [
    { id: 'i1', name: 'Café', houseId: 'house-a', bought: true },
    { id: 'i2', name: 'Pão', houseId: 'house-a', bought: false },
    { id: 'i3', name: 'Leite', houseId: 'house-a', bought: false },
    { id: 'i4', name: 'Lâmpada', houseId: 'house-b', bought: false },
  ];
  return state;
}

describe('addItem', () => {
  it('appends a trimmed, unbought item', () => {
    const state = addItem(createSampleState(), 'i9', '  Arroz ', 'house-b');
    expect(state.shoppingItems.at(-1)).toEqual({
      id: 'i9',
      name: 'Arroz',
      houseId: 'house-b',
      bought: false,
    });
  });

  it('ignores a blank name', () => {
    const sample = createSampleState();
    expect(addItem(sample, 'i9', '   ', 'house-a')).toBe(sample);
  });

  it('ignores a house that does not exist', () => {
    const sample = createSampleState();
    expect(addItem(sample, 'i9', 'Arroz', 'house-zzz')).toBe(sample);
  });
});

describe('toggleBought', () => {
  it('flips only the target item', () => {
    const state = toggleBought(stateWithItems(), 'i2');
    expect(state.shoppingItems.map((item) => item.bought)).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });
});

describe('deleteItem', () => {
  it('removes only the target item', () => {
    const state = deleteItem(stateWithItems(), 'i2');
    expect(state.shoppingItems.map((item) => item.id)).toEqual(['i1', 'i3', 'i4']);
  });
});

describe('clearBought', () => {
  it('removes bought items and keeps the order of the rest', () => {
    const state = clearBought(stateWithItems());
    expect(state.shoppingItems.map((item) => item.id)).toEqual(['i2', 'i3', 'i4']);
  });
});

describe('groupByHouse', () => {
  it('groups by house, unbought first, omitting empty houses for "all"', () => {
    const state = stateWithItems();
    state.houses.push({ id: 'house-c', name: 'Praia' });
    const groups = groupByHouse(state, 'all');
    expect(groups.map((group) => group.house.id)).toEqual(['house-a', 'house-b']);
    expect(groups[0].items.map((item) => item.id)).toEqual(['i2', 'i3', 'i1']);
  });

  it('returns only the filtered house, even when it is empty', () => {
    const state = stateWithItems();
    state.shoppingItems = state.shoppingItems.filter(
      (item) => item.houseId === 'house-a',
    );
    const groups = groupByHouse(state, 'house-b');
    expect(groups).toEqual([{ house: state.houses[1], items: [] }]);
  });

  it('treats an unknown filter as "all"', () => {
    const groups = groupByHouse(stateWithItems(), 'house-zzz');
    expect(groups.map((group) => group.house.id)).toEqual(['house-a', 'house-b']);
  });
});
