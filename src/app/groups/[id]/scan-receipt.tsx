import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ScreenMeta } from '@/components/screen-meta';
import { Font, Radius, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';
import { assetToFile, navigateAfterScan, scanReceiptFile } from '@/lib/receipt-scan';
import { useColors } from '@/lib/settings';

// Only the "Upload" flow (gallery / PDF) lands here. "Scan" opens the camera
// directly from the add-expense screen without rendering this screen.
export default function ScanReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const { api } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScan = async (uri: string, name: string, mimeType: string) => {
    setScanning(true);
    setError(null);
    try {
      const prefill = await scanReceiptFile(api, uri, name, mimeType);
      navigateAfterScan(id as string, prefill);
    } catch {
      setError(t('scanReceipt.readError'));
      setScanning(false);
    }
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return setError(t('scanReceipt.photosPermission'));
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ['images'] });
    if (!result.canceled) {
      const file = assetToFile(result.assets[0]);
      runScan(file.uri, file.name, file.mimeType);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      runScan(asset.uri, asset.name, asset.mimeType ?? 'application/pdf');
    }
  };

  return (
    <View style={styles.root}>
      <ScreenMeta title={t('scanReceipt.title')} />
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
