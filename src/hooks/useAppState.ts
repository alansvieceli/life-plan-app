import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { type ActivityDraft, removeActivity, upsertActivity } from '../lib/activities';
import { type AppState, createDefaultState, parseStoredState } from '../lib/appState';
import {
  addHouse,
  type DeleteBlock,
  deleteBlockReason,
  deleteHouse,
  renameHouse,
} from '../lib/houses';
import { createId } from '../lib/ids';
import {
  addPrintItem,
  clearPrinted,
  deletePrintItem,
  togglePrinted,
} from '../lib/printItems';
import {
  countExpiredOneOffs as countExpired,
  purgeOldOneOffs as purgeOneOffs,
} from '../lib/retention';
import { addItem, clearBought, deleteItem, toggleBought } from '../lib/shopping';
import {
  addTask,
  deleteTask,
  rollOverTasks as rollOver,
  toggleTask,
  updateTask,
} from '../lib/tasks';

const STORAGE_KEY = '@life-plan-app/state/v1';
const LOAD_ERROR = 'Não foi possível ler os dados salvos.';
const SAVE_ERROR = 'Não foi possível salvar os dados.';

export function useAppState() {
  const [state, setState] = useState<AppState>(createDefaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  // A failed read must never be followed by a save that overwrites the stored data.
  const canSave = useRef(true);
  // Time-based actions (start-up cleanup, rollover) can fire in the same commit or from
  // a listener registered earlier; they must see the latest state, not a stale render.
  const latest = useRef(state);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (raw) => {
        const loaded = parseStoredState(raw);
        if (loaded.wasInvalid && raw !== null) {
          await AsyncStorage.setItem(`${STORAGE_KEY}.invalid`, raw);
        }
        latest.current = loaded.state;
        setState(loaded.state);
      })
      .catch(() => {
        canSave.current = false;
        setLoadFailed(true);
        setSaveError(LOAD_ERROR);
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const update = useCallback((next: AppState) => {
    latest.current = next;
    setState(next);
    if (!canSave.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      .then(() => setSaveError(null))
      .catch(() => setSaveError(SAVE_ERROR));
  }, []);

  return {
    state,
    isLoaded,
    loadFailed,
    saveError,
    addHouse: (name: string) => update(addHouse(state, createId('house'), name)),
    renameHouse: (id: string, name: string) => update(renameHouse(state, id, name)),
    deleteHouse: (id: string) => update(deleteHouse(state, id)),
    getDeleteBlock: (id: string): DeleteBlock | null => deleteBlockReason(state, id),
    addShoppingItem: (name: string, houseId: string) =>
      update(addItem(state, createId('item'), name, houseId)),
    toggleShoppingItem: (id: string) => update(toggleBought(state, id)),
    deleteShoppingItem: (id: string) => update(deleteItem(state, id)),
    clearBoughtItems: () => update(clearBought(state)),
    saveActivity: (id: string | null, draft: ActivityDraft) =>
      update(upsertActivity(state, id ?? createId(draft.kind), draft)),
    deleteActivity: (kind: 'routine' | 'oneoff', id: string) =>
      update(removeActivity(state, kind, id)),
    purgeOldOneOffs: (keepDays: number) => {
      const next = purgeOneOffs(latest.current, keepDays, new Date());
      if (next !== latest.current) update(next);
    },
    rollOverTasks: () => {
      const next = rollOver(latest.current, new Date());
      if (next !== latest.current) update(next);
    },
    addTask: (title: string, date: string) =>
      update(addTask(state, createId('task'), title, date)),
    updateTask: (id: string, title: string, date: string) =>
      update(updateTask(state, id, title, date)),
    toggleTask: (id: string) => update(toggleTask(state, id)),
    deleteTask: (id: string) => update(deleteTask(state, id)),
    addPrintItem: (title: string, url: string) =>
      update(addPrintItem(state, createId('print'), title, url)),
    togglePrintItem: (id: string) => update(togglePrinted(state, id)),
    deletePrintItem: (id: string) => update(deletePrintItem(state, id)),
    clearPrintedItems: () => update(clearPrinted(state)),
    countExpiredOneOffs: (keepDays: number) =>
      countExpired(state, keepDays, new Date()),
    replaceState: update,
    resetState: () => update(createDefaultState()),
  };
}

export type AppStore = ReturnType<typeof useAppState>;
