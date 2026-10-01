import * as Crypto from 'expo-crypto';

import type { Sha256 } from '../lib/backup';

export const sha256: Sha256 = (text) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, text);
