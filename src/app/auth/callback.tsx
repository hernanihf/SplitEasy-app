import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Font, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

// On web, the OAuth redirect lands here directly. On native, expo-web-browser
// intercepts the URL before it renders, but we keep this screen so deep links
// opened outside that flow still resolve.
export default function AuthCallbackScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { signIn } = useAuth();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  useEffect(() => {
    if (typeof token === 'string') {
      signIn(token).then(() => router.replace('/'));
    } else {
      router.replace('/login');
    }
  }, [token]);

  return (
    <View style={styles.root}>
      <Text style={styles.text}>{t('auth.signingIn')}</Text>
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: Palette.bg, alignItems: 'center', justifyContent: 'center' },
    text: { color: Palette.muted, fontSize: 15, fontFamily: Font.sans },
  });
