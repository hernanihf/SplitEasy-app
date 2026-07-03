// Web Push only applies to the installable web (PWA) build — native has no
// equivalent here (see the plan: the app ships web-only). The real
// implementation lives in push.web.ts.
import type { createApiClient } from '@/lib/api';

type ApiClient = ReturnType<typeof createApiClient>;

export function isPushSupported(): boolean {
  return false;
}

export async function requestPermissionAndSubscribe(_api: ApiClient): Promise<boolean> {
  return false;
}

export async function ensureSubscribed(_api: ApiClient): Promise<void> {}
