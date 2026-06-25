import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Font, Radius, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

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
  const { id, source } = useLocalSearchParams<{ id: string; source?: string }>();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const { api } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scanFile = async (uri: string, name: string, mimeType: string) => {
    setScanning(true);
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
      setScanning(false);
    }
  };

  const scanImageAsset = (asset: ImagePicker.ImagePickerAsset) => {
    const mimeType = asset.mimeType ?? 'image/jpeg';
    const name = asset.fileName ?? `receipt.${mimeType.split('/')[1] ?? 'jpg'}`;
    scanFile(asset.uri, name, mimeType);
  };

  const pickFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return setError(t('scanReceipt.cameraPermission'));
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) scanImageAsset(result.assets[0]);
  };

  // When opened from the "Scan" shortcut, jump straight to the camera. If the
  // user cancels or denies permission, they fall back to the options below.
  const cameraAutoStarted = useRef(false);
  useEffect(() => {
    if (source === 'camera' && !cameraAutoStarted.current) {
      cameraAutoStarted.current = true;
      pickFromCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return setError(t('scanReceipt.photosPermission'));
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ['images'] });
    if (!result.canceled) scanImageAsset(result.assets[0]);
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
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topbar}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.topTitle}>{t('scanReceipt.title')}</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={styles.body}>
          <Text style={styles.desc}>{t('scanReceipt.description')}</Text>

          {scanning ? (
            <View style={styles.scanningRow}>
              <View style={styles.spinner} />
              <Text style={styles.scanningText}>{t('scanReceipt.reading')}</Text>
            </View>
          ) : (
            <View style={styles.buttons}>
              <Pressable onPress={pickFromLibrary} style={styles.button}>
                <Text style={styles.buttonText}>{t('scanReceipt.chooseFromGallery')}</Text>
              </Pressable>
              <Pressable onPress={pickDocument} style={[styles.button, styles.secondary]}>
                <Text style={[styles.buttonText, styles.secondaryText]}>{t('scanReceipt.choosePdf')}</Text>
              </Pressable>
            </View>
          )}

          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  safe: { flex: 1 },
  topbar: {
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topTitle: { fontSize: 15, fontFamily: Font.sansSemibold, color: Palette.ink },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 12, gap: 16 },
  desc: { fontSize: 15, lineHeight: 22, color: Palette.muted2, fontFamily: Font.sans },
  buttons: { gap: 12 },
  button: {
    height: 54,
    borderRadius: 16,
    backgroundColor: Palette.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: Palette.inputBg },
  buttonText: { color: '#fff', fontSize: 15, fontFamily: Font.sansSemibold },
  secondaryText: { color: Palette.ink },
  scanningRow: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 10 },
  spinner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    borderColor: '#DCE4DF',
    borderTopColor: Palette.green,
  },
  scanningText: { fontSize: 14, fontFamily: Font.sansSemibold, color: Palette.ink },
  error: { color: Palette.red, fontSize: 13 },
});
