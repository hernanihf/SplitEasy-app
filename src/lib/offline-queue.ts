import { getItem, setItem } from '@/lib/storage';
import type { createApiClient } from '@/lib/api';

// Mirrors the body add-expense.tsx posts to /api/v1/expenses.
export type AddExpensePayload = {
  group_id: number;
  paid_by_id: number;
  description: string;
  category: string;
  amount: number;
  split_method: 'equal' | 'fixed' | 'percentage';
  splits: { user_id: number; value: number }[];
  receipt_image_path?: string;
};

export type PendingExpense = {
  localId: string;
  groupId: number;
  payload: AddExpensePayload;
  createdAt: string;
};

const QUEUE_KEY = 'spliteasy.pendingExpenses';

async function readQueue(): Promise<PendingExpense[]> {
  const raw = await getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingExpense[];
  } catch {
    return [];
  }
}

async function writeQueue(queue: PendingExpense[]): Promise<void> {
  await setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function queueExpense(groupId: number, payload: AddExpensePayload): Promise<PendingExpense> {
  const entry: PendingExpense = {
    localId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    groupId,
    payload,
    createdAt: new Date().toISOString(),
  };
  const queue = await readQueue();
  queue.push(entry);
  await writeQueue(queue);
  return entry;
}

export async function getPendingExpenses(groupId: number): Promise<PendingExpense[]> {
  const queue = await readQueue();
  return queue.filter((e) => e.groupId === groupId);
}

export async function removePendingExpense(localId: string): Promise<void> {
  const queue = await readQueue();
  await writeQueue(queue.filter((e) => e.localId !== localId));
}

// Attempts every queued expense once, regardless of which group it belongs
// to. Entries that fail stay queued (most likely still offline) — no
// backoff/retry scheduling, callers just call this again on the next
// reasonable opportunity (focus, reconnect). Returns how many synced.
export async function syncPendingExpenses(api: ReturnType<typeof createApiClient>): Promise<number> {
  const queue = await readQueue();
  if (queue.length === 0) return 0;

  let synced = 0;
  const remaining: PendingExpense[] = [];
  for (const entry of queue) {
    try {
      await api.post('/api/v1/expenses', entry.payload);
      synced++;
    } catch {
      remaining.push(entry);
    }
  }
  await writeQueue(remaining);
  return synced;
}
