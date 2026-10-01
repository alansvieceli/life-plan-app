import { addHouse, deleteBlockReason, deleteHouse, renameHouse } from './houses';
import { createSampleState } from './stateFixtures';

describe('addHouse', () => {
  it('appends a trimmed house', () => {
    const state = addHouse(createSampleState(), 'house-c', '  Praia ');
    expect(state.houses.map((house) => house.name)).toEqual([
      'Casa 1',
      'Sítio',
      'Praia',
    ]);
  });

  it('ignores a blank name', () => {
    const sample = createSampleState();
    expect(addHouse(sample, 'house-c', '   ')).toBe(sample);
  });
});

describe('renameHouse', () => {
  it('renames only the target house', () => {
    const state = renameHouse(createSampleState(), 'house-b', ' Fazenda ');
    expect(state.houses.map((house) => house.name)).toEqual(['Casa 1', 'Fazenda']);
  });

  it('keeps the old name when the new one is blank', () => {
    const sample = createSampleState();
    expect(renameHouse(sample, 'house-b', '  ')).toBe(sample);
  });
});

describe('deleteBlockReason', () => {
  it('blocks a house that still has items', () => {
    expect(deleteBlockReason(createSampleState(), 'house-a')).toBe('has-items');
  });

  it('allows an empty house when another house remains', () => {
    expect(deleteBlockReason(createSampleState(), 'house-b')).toBeNull();
  });

  it('blocks deleting the last house', () => {
    const sample = createSampleState();
    sample.houses = [sample.houses[1]];
    expect(deleteBlockReason(sample, 'house-b')).toBe('last-house');
  });
});

describe('deleteHouse', () => {
  it('removes an empty house', () => {
    const state = deleteHouse(createSampleState(), 'house-b');
    expect(state.houses.map((house) => house.id)).toEqual(['house-a']);
  });

  it('leaves the state unchanged when blocked', () => {
    const sample = createSampleState();
    expect(deleteHouse(sample, 'house-a')).toBe(sample);
  });
});
