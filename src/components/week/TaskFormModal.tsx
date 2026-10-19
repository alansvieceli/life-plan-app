import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import type { Task } from '../../lib/appState';
import { addDays, toDateKey } from '../../lib/dates';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ActionButton } from '../common/ActionButton';
import { ChipRow } from '../common/ChipRow';
import { confirmAction } from '../common/confirmAction';
import { DateField } from '../common/DateField';
import { ModalShell } from '../common/ModalShell';

type TaskFormModalProps = {
  initialDate: string;
  editing: Task | null;
  onSave: (title: string, date: string) => void;
  onDelete: () => void;
  onClose: () => void;
};

type DayChoice = 'today' | 'tomorrow' | 'pick';

const dayOptions: { id: DayChoice; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'tomorrow', label: 'Amanhã' },
  { id: 'pick', label: 'Escolher data' },
];

export function TaskFormModal({
  initialDate,
  editing,
  onSave,
  onDelete,
  onClose,
}: TaskFormModalProps) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [date, setDate] = useState(editing?.date ?? initialDate);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const todayKey = toDateKey(new Date());
  const tomorrowKey = toDateKey(addDays(new Date(), 1));
  const choice: DayChoice = picking
    ? 'pick'
    : date === todayKey
      ? 'today'
      : date === tomorrowKey
        ? 'tomorrow'
        : 'pick';

  function handleChoice(next: DayChoice) {
    setPicking(next === 'pick');
    if (next === 'today') setDate(todayKey);
    if (next === 'tomorrow') setDate(tomorrowKey);
  }

  function handleSave() {
    if (title.trim() === '') {
      setError('Informe o título.');
      return;
    }
    onSave(title, date);
  }

  async function handleDelete() {
    if (await confirmAction('Excluir tarefa', 'Excluir esta tarefa?', 'Excluir')) {
      onDelete();
    }
  }

  return (
    <ModalShell onClose={onClose} title={editing ? 'Editar tarefa' : 'Nova tarefa'}>
      <TextInput
        accessibilityLabel="Título"
        onChangeText={setTitle}
        placeholder="Título"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={title}
      />
      <ChipRow onSelect={handleChoice} options={dayOptions} selectedId={choice} />
      {choice === 'pick' ? <DateField dateKey={date} onChange={setDate} /> : null}
      <Text style={styles.note}>
        Se não for feita até o fim do dia, passa sozinha para hoje.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ActionButton icon="checkmark" label="Salvar" onPress={handleSave} />
      {editing ? (
        <ActionButton
          icon="trash-outline"
          label="Excluir tarefa"
          onPress={handleDelete}
          variant="danger"
        />
      ) : null}
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.textPrimary,
    minHeight: 44,
    paddingHorizontal: 12,
    ...typography.input,
  },
  note: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
  error: {
    color: colors.negative,
    ...typography.bodySmall,
  },
});
