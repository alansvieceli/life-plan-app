import { StyleSheet, Text } from 'react-native';

import { RETENTION_DAYS_OPTIONS } from '../../lib/retention';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ChipRow } from '../common/ChipRow';
import { SectionCard } from '../common/SectionCard';

type RetentionSectionProps = {
  keepDays: number;
  onSelect: (keepDays: number) => void;
};

const options = RETENTION_DAYS_OPTIONS.map((days) => ({
  id: String(days),
  label: `${days} dias`,
}));

export function RetentionSection({ keepDays, onSelect }: RetentionSectionProps) {
  return (
    <SectionCard title="Histórico">
      <Text style={styles.note}>Manter eventos passados por</Text>
      <ChipRow
        onSelect={(id) => onSelect(Number(id))}
        options={options}
        selectedId={String(keepDays)}
      />
      <Text style={styles.note}>
        Eventos avulsos e tarefas feitas mais antigos são apagados automaticamente.
      </Text>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  note: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
});
