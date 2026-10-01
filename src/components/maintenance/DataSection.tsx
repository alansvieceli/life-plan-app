import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ActionButton } from '../common/ActionButton';
import { SectionCard } from '../common/SectionCard';

export type DataStatus = { kind: 'success' | 'error'; text: string } | null;

type DataSectionProps = {
  status: DataStatus;
  onBackup: () => void;
  onRestore: () => void;
  onReset: () => void;
};

export function DataSection({
  status,
  onBackup,
  onRestore,
  onReset,
}: DataSectionProps) {
  const isError = status?.kind === 'error';
  const statusColor = isError ? colors.negative : colors.positive;
  return (
    <SectionCard title="Dados">
      <ActionButton icon="share-outline" label="Fazer backup" onPress={onBackup} />
      <ActionButton
        icon="download-outline"
        label="Restaurar backup"
        onPress={onRestore}
      />
      <ActionButton
        icon="refresh-outline"
        label="Limpar tudo"
        onPress={onReset}
        variant="danger"
      />
      {status ? (
        <View style={styles.status}>
          <Ionicons
            color={statusColor}
            name={isError ? 'alert-circle' : 'checkmark-circle'}
            size={16}
          />
          <Text style={[styles.statusText, { color: statusColor }]}>{status.text}</Text>
        </View>
      ) : null}
      <Text style={styles.note}>Restaurar e limpar substituem os dados atuais.</Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  status: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  statusText: {
    ...typography.bodySmall,
  },
  note: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
});
