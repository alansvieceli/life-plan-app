import type { AppState, PrintItem } from './appState';
import {
  addPrintItem,
  clearPrinted,
  deletePrintItem,
  isValidUrl,
  sortPrintItems,
  togglePrinted,
  urlHost,
} from './printItems';
import { createSampleState } from './stateFixtures';

const item = (id: string, printed = false): PrintItem => ({
  id,
  title: id,
  url: 'https://a.co',
  printed,
});
const stateWith = (printItems: PrintItem[]): AppState => ({
  ...createSampleState(),
  printItems,
});

describe('addPrintItem', () => {
  it('trims title and url and appends a pending item', () => {
    const next = addPrintItem(stateWith([]), 'p1', '  Suporte ', ' https://a.co/m ');
    expect(next.printItems).toEqual([
      { id: 'p1', title: 'Suporte', url: 'https://a.co/m', printed: false },
    ]);
  });

  it('ignores an empty title or an invalid url', () => {
    const state = stateWith([]);
    expect(addPrintItem(state, 'p1', '  ', 'https://a.co')).toBe(state);
    expect(addPrintItem(state, 'p1', 'x', 'javascript:alert(1)')).toBe(state);
  });
});

describe('print item changes', () => {
  it('toggles printed', () => {
    expect(togglePrinted(stateWith([item('a')]), 'a').printItems[0].printed).toBe(true);
  });

  it('deletes only the given id', () => {
    const state = stateWith([item('a'), item('b')]);
    expect(deletePrintItem(state, 'a').printItems.map((i) => i.id)).toEqual(['b']);
  });

  it('clears only printed items', () => {
    const state = stateWith([item('a', true), item('b')]);
    expect(clearPrinted(state).printItems.map((i) => i.id)).toEqual(['b']);
  });
});

describe('sortPrintItems', () => {
  it('puts pending first, keeps creation order and does not mutate', () => {
    const items = [item('a', true), item('b'), item('c')];
    expect(sortPrintItems(items).map((i) => i.id)).toEqual(['b', 'c', 'a']);
    expect(items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('isValidUrl', () => {
  it.each([
    'https://www.printables.com/model/1',
    'http://a.co',
    '  https://a.co  ',
    'HTTPS://A.CO/x?y=1#z',
  ])('accepts %p', (value) => {
    expect(isValidUrl(value)).toBe(true);
  });

  it.each([
    'printables.com',
    'javascript:alert(1)',
    'ftp://a.co',
    'https://',
    'https:///path',
    'https://a b.co',
    'https://a.co/a b',
    '',
  ])('rejects %p', (value) => {
    expect(isValidUrl(value)).toBe(false);
  });
});

describe('urlHost', () => {
  it('drops the scheme, www, path, query and hash', () => {
    expect(urlHost('https://www.printables.com/model/1?x=1')).toBe('printables.com');
    expect(urlHost('https://a.co#top')).toBe('a.co');
  });

  it('keeps the port and drops user info', () => {
    expect(urlHost('http://localhost:8080/a')).toBe('localhost:8080');
    expect(urlHost('http://user:pw@a.co/x')).toBe('a.co');
  });
});
