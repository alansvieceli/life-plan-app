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
  countExpiredOneOffs as countExpired,
  purgeOldOneOffs as purgeOneOffs,
} from '../lib/retention';
import { addItem, clearBought, deleteItem, toggleBought } from '../lib/shopping';

const STORAGE_KEY = '@life-plan-app/state/v1';
const LOAD_ERROR = 'Não foi possível ler os dados salvos.';
const SAVE_ERROR = 'Não foi possível salvar os dados.';

export function useAppState() {
  const [state, setState] = useState<AppState>(createDefaultState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // A failed read must never be followed by a save that overwrites the stored data.
  const canSave = useRef(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (raw) => {
        const loaded = parseStoredState(raw);
        if (loaded.wasInvalid && raw !== null) {
          await AsyncStorage.setItem(`${STORAGE_KEY}.invalid`, raw);
        }
        setState(loaded.state);
      })
      .catch(() => {
        canSave.current = false;
        setSaveError(LOAD_ERROR);
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const update = useCallback((next: AppState) => {
    setState(next);
    if (!canSave.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      .then(() => setSaveError(null))
      .catch(() => setSaveError(SAVE_ERROR));
  }, []);

  return {
    state,
    isLoaded,
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
      const next = purgeOneOffs(state, keepDays, new Date());
      if (next !== state) update(next);
    },
    countExpiredOneOffs: (keepDays: number) =>
      countExpired(state, keepDays, new Date()),
    replaceState: update,
    resetState: () => update(createDefaultState()),
  };
}

export type AppStore = ReturnType<typeof useAppState>;
