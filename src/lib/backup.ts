import { type AppState, isRecord, validateAppState } from './appState';

const BACKUP_FORMAT = 'life-plan-backup';
const FORMAT_VERSION = 1;
const STORAGE_VERSION = 1;
const HASH_ALGORITHM = 'SHA-256';

export type Sha256 = (text: string) => Promise<string>;

export type RestoreResult =
  | { ok: true; state: AppState }
  | { ok: false; error: string };

const errors = {
  invalidFile: 'Arquivo inválido ou corrompido.',
  notBackup: 'Este arquivo não é um backup do Life Plan.',
  unsupportedVersion: 'Versão de backup não suportada.',
  tampered: 'Backup inválido: o conteúdo foi alterado ou está corrompido.',
  references: 'Backup inválido: há itens ligados a casas que não existem.',
} as const;

function fail(error: string): RestoreResult {
  return { ok: false, error };
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).sort(([a], [b]) => (a < b ? -1 : 1));
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export async function createBackupText(
  state: AppState,
  exportedAt: Date,
  sha256: Sha256,
) {
  const body = {
    format: BACKUP_FORMAT,
    formatVersion: FORMAT_VERSION,
    exportedAt: exportedAt.toISOString(),
    app: { name: 'Life Plan', storageVersion: STORAGE_VERSION },
    data: state,
  };
  const canonicalPayloadHash = await sha256(canonicalJson(body));
  return JSON.stringify(
    { ...body, integrity: { algorithm: HASH_ALGORITHM, canonicalPayloadHash } },
    null,
    2,
  );
}

export async function parseBackupText(
  text: string,
  sha256: Sha256,
): Promise<RestoreResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail(errors.invalidFile);
  }
  if (!isRecord(parsed)) return fail(errors.invalidFile);
  if (parsed.format !== BACKUP_FORMAT) return fail(errors.notBackup);
  if (parsed.formatVersion !== FORMAT_VERSION) return fail(errors.unsupportedVersion);

  const { integrity, ...body } = parsed;
  if (
    !isRecord(integrity) ||
    integrity.algorithm !== HASH_ALGORITHM ||
    typeof integrity.canonicalPayloadHash !== 'string' ||
    (await sha256(canonicalJson(body))) !== integrity.canonicalPayloadHash
  ) {
    return fail(errors.tampered);
  }

  const check = validateAppState(parsed.data);
  if (!check.ok) {
    return fail(check.reason === 'references' ? errors.references : errors.invalidFile);
  }
  return { ok: true, state: check.state };
}

export function backupFileName(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `life-plan-backup-${day}.lpb`;
}
