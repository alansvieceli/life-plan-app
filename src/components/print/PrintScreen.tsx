import { useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { AppStore } from '../../hooks/useAppState';
import { isValidUrl, sortPrintItems } from '../../lib/printItems';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { ActionButton } from '../common/ActionButton';
import { confirmAction } from '../common/confirmAction';
import { PrintItemRow } from './PrintItemRow';

const LINK_ERROR_MS = 2500;

export function PrintScreen({ store }: { store: AppStore }) {
  const { printItems } = store.state;
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [failedId, setFailedId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleAdd() {
    if (title.trim() === '') return;
    if (!isValidUrl(link)) {
      setFormError('Cole um link que comece com http:// ou https://');
      return;
    }
    store.addPrintItem(title, link);
    setTitle('');
    setLink('');
    setFormError(null);
  }

  async function handleOpen(id: string, url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      setFailedId(id);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setFailedId(null), LINK_ERROR_MS);
    }
  }

  async function handleClearPrinted() {
    const confirmed = await confirmAction(
      'Limpar impressos',
      'Remover da lista todos os itens impressos?',
      'Limpar',
    );
    if (confirmed) store.clearPrintedItems();
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TextInput
        accessibilityLabel="Título"
        onChangeText={setTitle}
        placeholder="Título"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={title}
      />
      <TextInput
        accessibilityLabel="Link"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        onChangeText={setLink}
        onSubmitEditing={handleAdd}
        placeholder="Link"
        placeholderTextColor={colors.textSecondary}
        style={styles.input}
        value={link}
      />
      {formError ? <Text style={styles.error}>{formError}</Text> : null}
      <ActionButton icon="add-circle-outline" label="Adicionar" onPress={handleAdd} />
      {printItems.length === 0 ? (
        <Text style={styles.empty}>
          Nenhum modelo na lista. Cole um link para começar.
        </Text>
      ) : null}
      <View>
        {sortPrintItems(printItems).map((item) => (
          <PrintItemRow
            item={item}
            key={item.id}
            linkError={failedId === item.id}
            onDelete={() => store.deletePrintItem(item.id)}
            onOpen={() => handleOpen(item.id, item.url)}
            onToggle={() => store.togglePrintItem(item.id)}
          />
        ))}
      </View>
      {printItems.some((item) => item.printed) ? (
        <ActionButton
          icon="trash-bin-outline"
          label="Limpar impressos"
          onPress={handleClearPrinted}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 8,
    paddingBottom: 12,
  },
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
  error: {
    color: colors.negative,
    ...typography.bodySmall,
  },
  empty: {
    color: colors.textSecondary,
    ...typography.body,
  },
});
