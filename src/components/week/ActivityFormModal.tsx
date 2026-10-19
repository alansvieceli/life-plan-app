import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import type { ActivityDraft } from '../../lib/activities';
import { type FormValues, parseActivityForm } from '../../lib/activityForm';
import type { Activity } from '../../lib/schedule';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ActionButton } from '../common/ActionButton';
import { ChipRow } from '../common/ChipRow';
import { confirmAction } from '../common/confirmAction';
import { DateField } from '../common/DateField';
import { ModalShell } from '../common/ModalShell';
import { NumberPairField } from '../common/NumberPairField';
import { WeekdayPicker } from './WeekdayPicker';

type ActivityFormModalProps = {
  initial: FormValues;
  editing: Activity | null;
  onSave: (draft: ActivityDraft) => void;
  onDelete: () => void;
  onClose: () => void;
};

type RepeatMode = 'once' | 'weekly';

const modeOptions: { id: RepeatMode; label: string }[] = [
  { id: 'once', label: 'Só neste dia' },
  { id: 'weekly', label: 'Repete toda semana' },
];

export function ActivityFormModal({
  initial,
  editing,
  onSave,
  onDelete,
  onClose,
}: ActivityFormModalProps) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function handleSave() {
    const result = parseActivityForm(values);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSave(result.draft);
  }

  async function handleDelete() {
    const message =
      editing?.kind === 'routine'
        ? 'Esta rotina será removida de todas as semanas.'
        : 'Excluir esta atividade?';
    if (await confirmAction('Excluir atividade', message, 'Excluir')) onDelete();
  }

  return (
    <ModalShell
      onClose={onClose}
      title={editing ? 'Editar atividade' : 'Nova atividade'}
    >
      <TextInput
        accessibilityLabel="Título"
        onChangeText={(text) => setField('title', text)}
        placeholder="Título"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={values.title}
      />
      <NumberPairField
        first={{
          value: values.startHour,
          label: 'Hora de início',
          onChange: (text) => setField('startHour', text),
        }}
        label="Começa às"
        second={{
          value: values.startMinute,
          label: 'Minuto de início',
          onChange: (text) => setField('startMinute', text),
        }}
        separator=":"
      />
      <NumberPairField
        first={{
          value: values.durationHours,
          label: 'Horas de duração',
          onChange: (text) => setField('durationHours', text),
        }}
        label="Duração (horas e minutos)"
        second={{
          value: values.durationMinutes,
          label: 'Minutos de duração',
          onChange: (text) => setField('durationMinutes', text),
        }}
        separator="h"
      />
      {editing ? null : (
        <ChipRow
          onSelect={(mode) => setField('repeats', mode === 'weekly')}
          options={modeOptions}
          selectedId={values.repeats ? 'weekly' : 'once'}
        />
      )}
      {values.repeats ? (
        <>
          <WeekdayPicker
            onChange={(days) => setField('weekdays', days)}
            selected={values.weekdays}
          />
          <Text style={styles.note}>Vale para todas as semanas.</Text>
        </>
      ) : (
        <DateField dateKey={values.date} onChange={(date) => setField('date', date)} />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <ActionButton icon="checkmark" label="Salvar" onPress={handleSave} />
      {editing ? (
        <ActionButton
          icon="trash-outline"
          label="Excluir"
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
