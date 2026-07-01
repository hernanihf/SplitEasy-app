import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Font, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

// On web, the OAuth redirect lands here directly. On native, expo-web-browser
// intercepts the URL before it renders, but we keep this screen so deep links
// opened outside that flow still resolve.
export default function AuthCallbackScreen() {
  const { signIn } = useAuth();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  useEffect(() => {
    // The backend puts both tokens in the URL fragment
    // (#access_token=...&refresh_token=...), not a query param, so neither
    // reaches server/proxy access logs. The fragment is browser-only —
    // expo-router's search-param parsing doesn't cover it — so it has to be
    // read straight off window.location on web.
    const params =
      Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hash
        ? new URLSearchParams(window.location.hash.slice(1))
        : null;
    const accessToken = params?.get('access_token');
    const refreshToken = params?.get('refresh_token');

    if (accessToken && refreshToken) {
      signIn(accessToken, refreshToken).then(() => router.replace('/'));
    } else {
      router.replace('/login');
    }
  }, []);

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
