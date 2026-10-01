import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { AppStore } from '../../hooks/useAppState';
import type { ActivityDraft } from '../../lib/activities';
import { emptyForm, type FormValues, formFromActivity } from '../../lib/activityForm';
import {
  addDays,
  formatDayTitle,
  parseDateKey,
  startOfWeek,
  toDateKey,
  weekNumber,
} from '../../lib/dates';
import { type Activity, activitiesForDate } from '../../lib/schedule';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { FloatingAddButton } from '../common/FloatingAddButton';
import { ActivityCard } from './ActivityCard';
import { ActivityFormModal } from './ActivityFormModal';
import { DayStrip } from './DayStrip';
import { WeekHeader } from './WeekHeader';

type FormState = { editing: Activity | null; initial: FormValues };

export function WeekScreen({ store }: { store: AppStore }) {
  const todayKey = toDateKey(new Date());
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [form, setForm] = useState<FormState | null>(null);

  const selected = parseDateKey(selectedKey);
  const weekStart = startOfWeek(selected);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const activities = activitiesForDate(store.state, selectedKey);

  function shiftWeek(weeks: number) {
    setSelectedKey(toDateKey(addDays(selected, weeks * 7)));
  }

  function handleSave(draft: ActivityDraft) {
    store.saveActivity(form?.editing?.id ?? null, draft);
    setForm(null);
  }

  function handleDelete() {
    if (form?.editing) store.deleteActivity(form.editing.kind, form.editing.id);
    setForm(null);
  }

  return (
    <View style={styles.container}>
      <WeekHeader
        onNext={() => shiftWeek(1)}
        onPrevious={() => shiftWeek(-1)}
        title={formatDayTitle(selected)}
        weekNumber={weekNumber(selected)}
      />
      <DayStrip
        days={days}
        onSelect={setSelectedKey}
        selectedKey={selectedKey}
        todayKey={todayKey}
      />
      <ScrollView contentContainerStyle={styles.list}>
        {activities.length === 0 ? (
          <Text style={styles.empty}>Nada planejado para este dia.</Text>
        ) : null}
        {activities.map((activity) => (
          <ActivityCard
            activity={activity}
            key={`${activity.kind}-${activity.id}`}
            onPress={() =>
              setForm({ editing: activity, initial: formFromActivity(activity) })
            }
          />
        ))}
      </ScrollView>
      <FloatingAddButton
        label="Adicionar atividade"
        onPress={() => setForm({ editing: null, initial: emptyForm(selectedKey) })}
      />
      {form ? (
        <ActivityFormModal
          editing={form.editing}
          initial={form.initial}
          onClose={() => setForm(null)}
          onDelete={handleDelete}
          onSave={handleSave}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  list: {
    gap: 8,
    paddingBottom: 80,
  },
  empty: {
    color: colors.textSecondary,
    ...typography.body,
  },
});
