import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import type { AppStore } from '../../hooks/useAppState';
import type { DeviceSetting } from '../../hooks/useDeviceSetting';
import type { RemindersStore } from '../../hooks/useReminders';
import {
  backupFileName,
  createBackupText,
  parseBackupText,
  type RestoreResult,
} from '../../lib/backup';
import type { RetentionSettings } from '../../lib/retention';
import { pickBackupText, shareBackupFile } from '../../services/backupFiles';
import { sha256 } from '../../services/sha256';
import { confirmAction } from '../common/confirmAction';
import { DataSection, type DataStatus } from './DataSection';
import { HousesSection } from './HousesSection';
import { RemindersSection } from './RemindersSection';
import { RetentionSection } from './RetentionSection';

export function MaintenanceScreen({
  store,
  reminders,
  retention,
}: {
  store: AppStore;
  reminders: RemindersStore;
  retention: DeviceSetting<RetentionSettings>;
}) {
  const [status, setStatus] = useState<DataStatus>(null);

  async function handleKeepDays(keepDays: number) {
    const expired = store.countExpiredOneOffs(keepDays);
    if (expired > 0) {
      const confirmed = await confirmAction(
        'Apagar itens antigos',
        `Apagar ${expired} item(ns) (eventos avulsos e tarefas feitas) mais antigo(s) que ${keepDays} dias?`,
        'Apagar',
      );
      if (!confirmed) return;
    }
    await retention.save({ keepDays });
    store.purgeOldOneOffs(keepDays);
  }

  async function handleBackup() {
    try {
      const now = new Date();
      const text = await createBackupText(store.state, now, sha256);
      await shareBackupFile(backupFileName(now), text);
      setStatus({ kind: 'success', text: 'Backup pronto para salvar.' });
    } catch {
      setStatus({ kind: 'error', text: 'Não foi possível criar o backup.' });
    }
  }

  // Confirm before opening the picker: an alert raised right after returning from the
  // picker activity can be dropped by Android, leaving the restore hanging silently.
  async function handleRestore() {
    const confirmed = await confirmAction(
      'Restaurar backup',
      'Os dados atuais serão substituídos pelo backup escolhido.',
      'Escolher arquivo',
    );
    if (!confirmed) return;
    setStatus(null);
    let result: RestoreResult;
    try {
      const text = await pickBackupText();
      if (text === null) return;
      result = await parseBackupText(text, sha256);
    } catch {
      setStatus({ kind: 'error', text: 'Não foi possível ler o arquivo.' });
      return;
    }
    if (!result.ok) {
      setStatus({ kind: 'error', text: result.error });
      return;
    }
    store.replaceState(result.state);
    setStatus({ kind: 'success', text: result.message });
  }

  async function handleReset() {
    const confirmed = await confirmAction(
      'Limpar tudo',
      'Todos os dados serão apagados e o app volta ao estado inicial.',
      'Limpar',
    );
    if (!confirmed) return;
    store.resetState();
    setStatus({ kind: 'success', text: 'Dados apagados.' });
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <HousesSection
        getDeleteBlock={store.getDeleteBlock}
        houses={store.state.houses}
        onAdd={() => store.addHouse(`Casa ${store.state.houses.length + 1}`)}
        onDelete={store.deleteHouse}
        onRename={store.renameHouse}
      />
      <RemindersSection
        hasPermission={reminders.hasPermission}
        onSelectMinutes={reminders.setMinutesBefore}
        onToggle={reminders.setEnabled}
        settings={reminders.settings}
      />
      <RetentionSection keepDays={retention.value.keepDays} onSelect={handleKeepDays} />
      <DataSection
        onBackup={handleBackup}
        onReset={handleReset}
        onRestore={handleRestore}
        status={status}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 12,
  },
});
