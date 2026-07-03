import { getItem, setItem } from '@/lib/storage';

const LAST_GROUP_KEY = 'spliteasy.lastGroupId';

// Remembers the most recently opened group so PWA shortcuts and the
// share-target flow — neither of which have a group in context — know where
// to send an expense without asking the user every time.
export async function rememberLastGroup(groupId: number): Promise<void> {
  await setItem(LAST_GROUP_KEY, String(groupId));
}

export async function getLastGroupId(): Promise<number | null> {
  const raw = await getItem(LAST_GROUP_KEY);
  const id = raw ? Number(raw) : NaN;
  return Number.isFinite(id) ? id : null;
}
