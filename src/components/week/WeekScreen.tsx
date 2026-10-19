import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { AppStore } from '../../hooks/useAppState';
import type { ActivityDraft } from '../../lib/activities';
import { emptyForm, type FormValues, formFromActivity } from '../../lib/activityForm';
import type { Task } from '../../lib/appState';
import {
  addDays,
  formatDayTitle,
  parseDateKey,
  startOfWeek,
  toDateKey,
  weekNumber,
} from '../../lib/dates';
import { type Activity, activitiesForDate } from '../../lib/schedule';
import { hasPendingTask, tasksForDate } from '../../lib/tasks';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { FloatingAddButton } from '../common/FloatingAddButton';
import { ActivityCard } from './ActivityCard';
import { ActivityFormModal } from './ActivityFormModal';
import { AddChoiceSheet } from './AddChoiceSheet';
import { DayStrip } from './DayStrip';
import { TaskFormModal } from './TaskFormModal';
import { TaskList } from './TaskList';
import { WeekHeader } from './WeekHeader';

type FormState = { editing: Activity | null; initial: FormValues };

export function WeekScreen({ store }: { store: AppStore }) {
  const todayKey = toDateKey(new Date());
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [form, setForm] = useState<FormState | null>(null);
  const [isChoosing, setIsChoosing] = useState(false);
  const [taskForm, setTaskForm] = useState<{ editing: Task | null } | null>(null);

  const selected = parseDateKey(selectedKey);
  const weekStart = startOfWeek(selected);
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const activities = activitiesForDate(store.state, selectedKey);
  const tasks = tasksForDate(store.state, selectedKey);

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

  function handleSaveTask(title: string, date: string) {
    if (taskForm?.editing) store.updateTask(taskForm.editing.id, title, date);
    else store.addTask(title, date);
    setTaskForm(null);
  }

  function handleDeleteTask() {
    if (taskForm?.editing) store.deleteTask(taskForm.editing.id);
    setTaskForm(null);
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
        hasPending={(key) => hasPendingTask(store.state, key)}
        onSelect={setSelectedKey}
        selectedKey={selectedKey}
        todayKey={todayKey}
      />
      <ScrollView contentContainerStyle={styles.list}>
        {activities.length === 0 && tasks.length === 0 ? (
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
        <TaskList
          onDelete={store.deleteTask}
          onEdit={(task) => setTaskForm({ editing: task })}
          onToggle={store.toggleTask}
          tasks={tasks}
        />
      </ScrollView>
      <FloatingAddButton label="Adicionar" onPress={() => setIsChoosing(true)} />
      {isChoosing ? (
        <AddChoiceSheet
          onClose={() => setIsChoosing(false)}
          onEvent={() => {
            setIsChoosing(false);
            setForm({ editing: null, initial: emptyForm(selectedKey) });
          }}
          onTask={() => {
            setIsChoosing(false);
            setTaskForm({ editing: null });
          }}
        />
      ) : null}
      {taskForm ? (
        <TaskFormModal
          editing={taskForm.editing}
          initialDate={selectedKey}
          onClose={() => setTaskForm(null)}
          onDelete={handleDeleteTask}
          onSave={handleSaveTask}
        />
      ) : null}
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
