import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Task } from '../../lib/appState';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { confirmAction } from '../common/confirmAction';
import { IconButton } from '../common/IconButton';

type TaskListProps = {
  tasks: Task[];
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
};

export function TaskList({ tasks, onToggle, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) return null;
  const doneCount = tasks.filter((task) => task.done).length;

  async function handleDelete(task: Task) {
    if (await confirmAction('Excluir tarefa', `Excluir "${task.title}"?`, 'Excluir')) {
      onDelete(task.id);
    }
  }

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <Text style={styles.title}>Tarefas</Text>
        <Text style={styles.counter}>{`${doneCount} de ${tasks.length} feitas`}</Text>
      </View>
      {tasks.map((task) => (
        <View key={task.id} style={styles.row}>
          <Pressable
            accessibilityLabel={`Marcar ${task.title}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: task.done }}
            onPress={() => onToggle(task.id)}
            style={styles.check}
          >
            <Ionicons
              color={task.done ? colors.positive : colors.border}
              name={task.done ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
            />
          </Pressable>
          <Pressable
            accessibilityLabel={`Editar ${task.title}`}
            accessibilityRole="button"
            onPress={() => onEdit(task)}
            style={styles.main}
          >
            <Text style={[styles.name, task.done ? styles.nameDone : null]}>
              {task.title}
            </Text>
          </Pressable>
          <IconButton
            icon="trash-outline"
            label={`Excluir ${task.title}`}
            onPress={() => handleDelete(task)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 6,
    marginTop: 8,
  },
  header: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: colors.textPrimary,
    ...typography.sectionTitle,
  },
  counter: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    paddingLeft: 12,
  },
  check: {
    justifyContent: 'center',
    minHeight: 44,
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  name: {
    color: colors.textPrimary,
    ...typography.cardTitle,
  },
  nameDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
});
