import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import type { createApiClient } from '@/lib/api';
import { t } from '@/lib/i18n';

type ApiClient = ReturnType<typeof createApiClient>;

type ReceiptScan = {
  merchant_name: string;
  date: string;
  total_amount: number;
  items: { description: string; price: number }[];
};

/** Prefill values for the add-expense form, derived from a scanned receipt. */
export type ScannedExpense = { description: string; amount: string };

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
  };
}

/** Derives a filename/mime type for an image-picker asset. */
export function assetToFile(asset: ImagePicker.ImagePickerAsset) {
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const name = asset.fileName ?? `receipt.${mimeType.split('/')[1] ?? 'jpg'}`;
  return { uri: asset.uri, name, mimeType };
}
