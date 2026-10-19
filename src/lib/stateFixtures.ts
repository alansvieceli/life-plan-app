import type { AppState } from './appState';

export function createSampleState(): AppState {
  return {
    houses: [
      { id: 'house-a', name: 'Casa 1' },
      { id: 'house-b', name: 'Sítio' },
    ],
    routines: [
      {
        id: 'routine-1',
        title: 'Trabalhar',
        weekdays: [1, 2, 3, 4, 5],
        startTime: '08:00',
        durationMin: 240,
      },
    ],
    oneOffs: [
      {
        id: 'oneoff-1',
        title: 'Dentista',
        date: '2026-10-06',
        startTime: '15:30',
        durationMin: 60,
      },
    ],
    shoppingItems: [{ id: 'item-1', name: 'Café', houseId: 'house-a', bought: false }],
    tasks: [
      { id: 'task-1', title: 'Ligar para o banco', date: '2026-10-06', done: false },
    ],
    printItems: [
      {
        id: 'print-1',
        title: 'Suporte de fone',
        url: 'https://www.printables.com/model/1',
        printed: false,
      },
    ],
  };
}
