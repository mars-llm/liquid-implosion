export type CacheRecord = {
  proof: readonly string[];
  valueCommitment: readonly string[];
  assetGenerator: readonly string[];
  script: readonly string[];
};

export const VALID_RECORD: CacheRecord = {
  proof: ['4c', '49'],
  valueCommitment: ['51', '55', '49', '44'],
  assetGenerator: ['2d', '50', '52', '4f'],
  script: ['4f', '46'],
};

export const SHIFTED_RECORD: CacheRecord = {
  proof: ['4c'],
  valueCommitment: ['49', '51', '55', '49'],
  assetGenerator: ['44', '2d', '50', '52'],
  script: ['4f', '4f', '46'],
};

const encoder = new TextEncoder();

export function serializeCacheRecord(record: CacheRecord): string[] {
  return [
    ...record.proof,
    ...record.valueCommitment,
    ...record.assetGenerator,
    ...record.script,
  ];
}

export function recordsDiffer(left: CacheRecord, right: CacheRecord): boolean {
  return JSON.stringify(left) !== JSON.stringify(right);
}

export function sameSerializedBytes(left: CacheRecord, right: CacheRecord): boolean {
  return serializeCacheRecord(left).join('') === serializeCacheRecord(right).join('');
}

export async function cacheFingerprint(record: CacheRecord): Promise<string> {
  const bytes = Uint8Array.from(
    serializeCacheRecord(record),
    (byte) => Number.parseInt(byte, 16),
  );
  const salt = encoder.encode('liquid-implosion:educational-cache-salt:');
  const input = new Uint8Array(salt.length + bytes.length);
  input.set(salt);
  input.set(bytes, salt.length);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function compactBitcoin(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
