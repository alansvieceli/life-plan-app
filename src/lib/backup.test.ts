import {
  backupFileName,
  createBackupText,
  parseBackupText,
  type Sha256,
} from './backup';
import { createSampleState } from './stateFixtures';

// Deterministic stand-in for SHA-256; the real hash comes from expo-crypto in the app.
const sha256: Sha256 = async (text) => {
  let hash = 7;
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `h${text.length}-${hash}`;
};

const exportedAt = new Date('2026-10-01T12:00:00.000Z');

async function sampleBackup() {
  return createBackupText(createSampleState(), exportedAt, sha256);
}

describe('backup round trip', () => {
  it('restores exactly what was exported', async () => {
    const result = await parseBackupText(await sampleBackup(), sha256);
    expect(result).toEqual({
      ok: true,
      state: createSampleState(),
      message: 'Backup de 01/10/2026 restaurado.',
    });
  });

  it('names the local backup date in the success message', async () => {
    const at = new Date(2026, 9, 22, 23, 30);
    const result = await parseBackupText(
      await createBackupText(createSampleState(), at, sha256),
      sha256,
    );
    expect(result.ok && result.message).toBe('Backup de 22/10/2026 restaurado.');
  });

  it('uses a plain success message when the backup date is unreadable', async () => {
    const constantHash: Sha256 = async () => 'fixed';
    const envelope = JSON.parse(
      await createBackupText(createSampleState(), exportedAt, constantHash),
    );
    envelope.exportedAt = 'ontem';
    const result = await parseBackupText(JSON.stringify(envelope), constantHash);
    expect(result.ok && result.message).toBe('Backup restaurado.');
  });

  it('writes the documented envelope', async () => {
    const envelope = JSON.parse(await sampleBackup());
    expect(envelope).toMatchObject({
      format: 'life-plan-backup',
      formatVersion: 1,
      exportedAt: '2026-10-01T12:00:00.000Z',
      app: { name: 'Life Plan', storageVersion: 1 },
      integrity: { algorithm: 'SHA-256' },
    });
    expect(typeof envelope.integrity.canonicalPayloadHash).toBe('string');
  });
});

describe('backup with tasks and print items', () => {
  it('restores a backup written before the new lists existed', async () => {
    const { tasks: _tasks, printItems: _printItems, ...old } = createSampleState();
    const text = await createBackupText(old as never, exportedAt, sha256);
    const result = await parseBackupText(text, sha256);
    expect(result).toEqual({
      ok: true,
      state: { ...old, tasks: [], printItems: [] },
      message: 'Backup de 01/10/2026 restaurado.',
    });
  });

  it('rejects a task edited after export', async () => {
    const envelope = JSON.parse(await sampleBackup());
    envelope.data.tasks[0].title = 'Outra tarefa';
    expect(await parseBackupText(JSON.stringify(envelope), sha256)).toEqual({
      ok: false,
      error: 'Backup inválido: o conteúdo foi alterado ou está corrompido.',
    });
  });
});

describe('parseBackupText rejections', () => {
  it('rejects text that is not JSON', async () => {
    expect(await parseBackupText('{oops', sha256)).toEqual({
      ok: false,
      error: 'Arquivo inválido ou corrompido.',
    });
  });

  it('rejects JSON that is not an object', async () => {
    expect(await parseBackupText('[1,2]', sha256)).toEqual({
      ok: false,
      error: 'Arquivo inválido ou corrompido.',
    });
  });

  it('rejects another format', async () => {
    expect(await parseBackupText('{"format":"other"}', sha256)).toEqual({
      ok: false,
      error: 'Este arquivo não é um backup do Life Plan.',
    });
  });

  it('rejects an unsupported version', async () => {
    const envelope = JSON.parse(await sampleBackup());
    envelope.formatVersion = 2;
    expect(await parseBackupText(JSON.stringify(envelope), sha256)).toEqual({
      ok: false,
      error: 'Versão de backup não suportada.',
    });
  });

  it('rejects a missing integrity section', async () => {
    const envelope = JSON.parse(await sampleBackup());
    delete envelope.integrity;
    expect(await parseBackupText(JSON.stringify(envelope), sha256)).toEqual({
      ok: false,
      error: 'Backup inválido: o conteúdo foi alterado ou está corrompido.',
    });
  });

  it('rejects an unsupported hash algorithm', async () => {
    const envelope = JSON.parse(await sampleBackup());
    envelope.integrity.algorithm = 'MD5';
    expect(await parseBackupText(JSON.stringify(envelope), sha256)).toEqual({
      ok: false,
      error: 'Backup inválido: o conteúdo foi alterado ou está corrompido.',
    });
  });

  it('rejects content edited after export (renamed house)', async () => {
    const envelope = JSON.parse(await sampleBackup());
    envelope.data.houses[0].name = 'Outra casa';
    expect(await parseBackupText(JSON.stringify(envelope), sha256)).toEqual({
      ok: false,
      error: 'Backup inválido: o conteúdo foi alterado ou está corrompido.',
    });
  });

  it('rejects items that point to a missing house', async () => {
    const state = createSampleState();
    state.shoppingItems[0].houseId = 'house-zzz';
    const text = await createBackupText(state, exportedAt, sha256);
    expect(await parseBackupText(text, sha256)).toEqual({
      ok: false,
      error: 'Backup inválido: há itens ligados a casas que não existem.',
    });
  });

  it('rejects a backup with no houses', async () => {
    const state = { ...createSampleState(), houses: [], shoppingItems: [] };
    const text = await createBackupText(state, exportedAt, sha256);
    expect(await parseBackupText(text, sha256)).toEqual({
      ok: false,
      error: 'Arquivo inválido ou corrompido.',
    });
  });
});

describe('backupFileName', () => {
  it('uses the local date and the .lpb extension', () => {
    expect(backupFileName(new Date(2026, 9, 6, 8, 0))).toBe(
      'life-plan-backup-2026-10-06.lpb',
    );
  });
});
