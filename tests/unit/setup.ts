import { vi } from 'vitest';

// Language detection only needs the document's language attribute.
vi.stubGlobal('document', { documentElement: {} });
vi.stubGlobal('localStorage', { getItem: () => null });
