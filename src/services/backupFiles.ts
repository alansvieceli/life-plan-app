import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function shareBackupFile(fileName: string, text: string) {
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(text);
  await Sharing.shareAsync(file.uri, {
    dialogTitle: 'Salvar backup',
    mimeType: 'application/json',
  });
}

export async function pickBackupText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    type: '*/*',
  });
  if (result.canceled) return null;
  return new File(result.assets[0].uri).text();
}
