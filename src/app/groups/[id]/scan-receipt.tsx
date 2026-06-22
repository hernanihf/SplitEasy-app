import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';

type ReceiptScan = {
  merchant_name: string;
  date: string;
  total_amount: number;
  items: { description: string; price: number }[];
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

export default function ScanReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanFile = async (uri: string, name: string, mimeType: string) => {
    setIsScanning(true);
    setError(null);
    try {
      const formData = await fileToFormData(uri, name, mimeType);
      const scan = await api.postFormData<ReceiptScan>('/api/v1/receipts/scan', formData);
      router.replace({
        pathname: '/groups/[id]/add-expense',
        params: {
          id: id as string,
          description: scan.merchant_name || t('scanReceipt.defaultMerchant'),
          amount: String(scan.total_amount || ''),
        },
      });
    } catch {
      setError(t('scanReceipt.readError'));
      setIsScanning(false);
    }
  };

  const scanImageAsset = (asset: ImagePicker.ImagePickerAsset) => {
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const name = asset.fileName ?? `receipt.${mimeType.split('/')[1] ?? 'jpg'}`;
    scanFile(asset.uri, name, mimeType);
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError(t('scanReceipt.cameraPermission'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) {
      scanImageAsset(result.assets[0]);
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(t('scanReceipt.photosPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ['images'] });
    if (!result.canceled) {
      scanImageAsset(result.assets[0]);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      scanFile(asset.uri, asset.name, asset.mimeType ?? 'application/pdf');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">{t('scanReceipt.title')}</ThemedText>
        <ThemedText type="default">{t('scanReceipt.description')}</ThemedText>

        {isScanning ? (
          <ThemedText type="default">{t('scanReceipt.reading')}</ThemedText>
        ) : (
          <>
            <Pressable onPress={pickFromCamera} style={styles.button}>
              <ThemedText type="smallBold" style={styles.buttonText}>
                {t('scanReceipt.takePhoto')}
              </ThemedText>
            </Pressable>

            <Pressable onPress={pickFromLibrary} style={[styles.button, styles.secondaryButton]}>
              <ThemedText type="smallBold" style={styles.buttonText}>
                {t('scanReceipt.chooseFromGallery')}
              </ThemedText>
            </Pressable>

            <Pressable onPress={pickDocument} style={[styles.button, styles.secondaryButton]}>
              <ThemedText type="smallBold" style={styles.buttonText}>
                {t('scanReceipt.choosePdf')}
              </ThemedText>
            </Pressable>
          </>
        )}

        {error && <ThemedText type="small">{error}</ThemedText>}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: '#208AEF',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#5B8DEF',
  },
  buttonText: {
    color: '#fff',
  },
});
