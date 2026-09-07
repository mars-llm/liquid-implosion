import { describe, expect, it } from 'vitest';
import {
  SHIFTED_RECORD,
  VALID_RECORD,
  cacheFingerprint,
  compactBitcoin,
  recordsDiffer,
  sameSerializedBytes,
  serializeCacheRecord,
} from '../lib/model';

describe('cache-key boundary model', () => {
  it('uses two genuinely different field layouts', () => {
    expect(recordsDiffer(VALID_RECORD, SHIFTED_RECORD)).toBe(true);
    expect(VALID_RECORD.proof).not.toEqual(SHIFTED_RECORD.proof);
    expect(VALID_RECORD.script).not.toEqual(SHIFTED_RECORD.script);
  });

  it('serializes both layouts to the same undelimited byte sequence', () => {
    expect(serializeCacheRecord(VALID_RECORD)).toEqual(serializeCacheRecord(SHIFTED_RECORD));
    expect(sameSerializedBytes(VALID_RECORD, SHIFTED_RECORD)).toBe(true);
  });

  it('therefore produces the same SHA-256 fingerprint under the same salt', async () => {
    const fingerprint = await cacheFingerprint(VALID_RECORD);

    expect(fingerprint).toBe('1c19200a5684951ff17a9ef8037ff183ecfb6c1986dec1387b13bea6dfc70c3a');
    expect(fingerprint).toBe(await cacheFingerprint(SHIFTED_RECORD));
  });

  it('formats the observed peg-out total without overstating precision', () => {
    expect(compactBitcoin(3998.6697328)).toBe('3,998.67');
  });
});
