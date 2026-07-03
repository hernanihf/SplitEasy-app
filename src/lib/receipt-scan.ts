import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { DEFAULT_CATEGORY } from '@/constants/categories';
import type { createApiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

type ApiClient = ReturnType<typeof createApiClient>;

type ReceiptScan = {
  merchant_name: string;
  date: string;
  total_amount: number;
  category: string;
  items: { description: string; price: number }[];
  receipt_image_path?: string;
};

/** A scanned line item, amount already converted to cents. */
export type ScannedItem = { description: string; amount: number };

/** Prefill values for the add-expense form, derived from a scanned receipt. */
export type ScannedExpense = {
  description: string;
  amount: string; // dollar string for the amount input prefill
  totalCents: number;
  category: string;
  items: ScannedItem[];
  receiptImagePath?: string;
};

async function fileToFormData(uri: string, name: string, mimeType: string): Promise<FormData> {
  const formData = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    formData.append('image', blob, name);
  } else {
    formData.append('image', { uri, name, type: mimeType } as unknown as Blob);
  }
  return formData;
}

/** Uploads a receipt file to the scan endpoint and returns expense-form prefill. */
export async function scanReceiptFile(
  api: ApiClient,
  uri: string,
  name: string,
  mimeType: string,
): Promise<ScannedExpense> {
  const formData = await fileToFormData(uri, name, mimeType);
  const scan = await api.postFormData<ReceiptScan>('/api/v1/receipts/scan', formData);
  return {
    description: scan.merchant_name || t('scanReceipt.defaultMerchant'),
    amount: String(scan.total_amount || ''),
    totalCents: Math.round((scan.total_amount || 0) * 100),
    category: scan.category || DEFAULT_CATEGORY,
    items: (scan.items ?? [])
      .filter((it) => it.description && it.price > 0)
      .map((it) => ({ description: it.description, amount: Math.round(it.price * 100) })),
    receiptImagePath: scan.receipt_image_path,
  };
}

/** Derives a filename/mime type for an image-picker asset. */
export function assetToFile(asset: ImagePicker.ImagePickerAsset) {
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const name = asset.fileName ?? `receipt.${mimeType.split('/')[1] ?? 'jpg'}`;
  return { uri: asset.uri, name, mimeType };
}

/**
 * Sends the user to the itemize screen if the scan found line items, or
 * straight to add-expense with the totals prefilled otherwise. Shared by
 * every entry point into a receipt scan (manual upload, share-target) so
 * they can't drift out of sync on which fields get forwarded.
 */
export function navigateAfterScan(groupId: string, prefill: ScannedExpense) {
  if (prefill.items.length > 0) {
    router.replace({
      pathname: '/groups/[id]/itemize',
      params: {
        id: groupId,
        description: prefill.description,
        total: String(prefill.totalCents),
        category: prefill.category,
        items: JSON.stringify(prefill.items),
        ...(prefill.receiptImagePath ? { receiptImagePath: prefill.receiptImagePath } : {}),
      },
    });
    return;
  }
  router.replace({
    pathname: '/groups/[id]/add-expense',
    params: {
      id: groupId,
      description: prefill.description,
      amount: prefill.amount,
      category: prefill.category,
      ...(prefill.receiptImagePath ? { receiptImagePath: prefill.receiptImagePath } : {}),
    },
  });
}
