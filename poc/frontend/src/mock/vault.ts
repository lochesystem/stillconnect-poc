function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function base64ToBuf(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function generateTenantKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const raw = await crypto.subtle.exportKey("raw", key);
  return bufToBase64(raw);
}

async function importKey(b64: string): Promise<CryptoKey> {
  const raw = base64ToBuf(b64);
  return crypto.subtle.importKey(
    "raw",
    raw as BufferSource,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJSON(
  payload: unknown,
  tenantKeyB64: string,
): Promise<{ ciphertext_b64: string; iv_b64: string }> {
  const key = await importKey(tenantKeyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder().encode(JSON.stringify(payload));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    enc as BufferSource,
  );
  return { ciphertext_b64: bufToBase64(ct), iv_b64: bufToBase64(iv.buffer) };
}

export async function decryptJSON<T>(
  ciphertext_b64: string,
  iv_b64: string,
  tenantKeyB64: string,
): Promise<T> {
  const key = await importKey(tenantKeyB64);
  const iv = base64ToBuf(iv_b64);
  const ct = base64ToBuf(ciphertext_b64);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ct as BufferSource,
  );
  const text = new TextDecoder().decode(pt);
  return JSON.parse(text) as T;
}

export async function sha256Hex(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", buf as BufferSource);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
