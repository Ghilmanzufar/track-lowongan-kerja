// Ekstraktor khusus untuk payload __NEXT_DATA__ dari halaman Next.js
// JobStreet dan Glints menyertakan seluruh data backend di dalam tag JSON ini.

export function extractNextData<T = unknown>(html: string): T | null {
  try {
    // Cari tag <script id="__NEXT_DATA__" type="application/json">...</script>
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!match || !match[1]) {
      return null;
    }
    return JSON.parse(match[1]) as T;
  } catch {
    return null;
  }
}

// Ekstraktor alternatif untuk data JSON yang disimpan di window.__INITIAL_STATE__ atau similar
export function extractWindowVar<T = unknown>(html: string, varName: string): T | null {
  try {
    const pattern = new RegExp(`window\\.${varName}\\s*=\\s*({[\\s\\S]*?});`);
    const match = html.match(pattern);
    if (!match || !match[1]) return null;
    return JSON.parse(match[1]) as T;
  } catch {
    return null;
  }
}

// Navigate JSON path safely (e.g. "props.pageProps.companies")
export function getNestedValue<T = unknown>(obj: unknown, path: string): T | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current as T;
}
