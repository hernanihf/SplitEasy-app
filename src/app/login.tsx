import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

import { GoogleG } from '@/components/google-g';
import { Font, Palette } from '@/constants/design';
import { googleLoginUrl, useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      const redirectUri = Linking.createURL('auth/callback');
      const result = await WebBrowser.openAuthSessionAsync(googleLoginUrl, redirectUri);
      if (result.type === 'success' && result.url) {
        const token = Linking.parse(result.url).queryParams?.token;
        if (typeof token === 'string') {
          await signIn(token);
          router.replace('/');
        }
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.blob, styles.blobGreen]} />
      <View style={[styles.blob, styles.blobBlue]} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <View style={styles.logoGreen} />
              <View style={styles.logoSplit} />
              <View style={styles.logoBlue} />
            </View>
            <Text style={styles.brand}>SplitEasy</Text>
          </View>
          <Text style={styles.h1}>
            {t('login.tagline1')}
            {'\n'}
            {t('login.tagline2')}
          </Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={handleGoogleLogin}
            disabled={isSigningIn}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <GoogleG size={20} />
            <Text style={styles.buttonText}>
              {isSigningIn ? t('login.connecting') : t('login.continueWithGoogle')}
            </Text>
          </Pressable>
          <Text style={styles.terms}>{t('login.terms')}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999 },
  blobGreen: {
    width: 420,
    height: 420,
    backgroundColor: 'rgba(14,124,90,0.10)',
    top: -150,
    right: -170,
  },
  blobBlue: {
    width: 380,
    height: 380,
    backgroundColor: 'rgba(47,111,237,0.09)',
    bottom: -60,
    left: -170,
  },
  safe: { flex: 1, paddingHorizontal: 28 },
  hero: { flex: 1, justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 36 },
  logo: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden', flexDirection: 'row' },
  logoGreen: { flex: 1, backgroundColor: Palette.green },
  logoSplit: { width: 2, backgroundColor: Palette.bg },
  logoBlue: { flex: 1, backgroundColor: Palette.blue },
  brand: { fontSize: 25, fontFamily: Font.sansBold, letterSpacing: -0.5, color: Palette.ink },
  h1: {
    fontSize: 40,
    lineHeight: 42,
    fontFamily: Font.sansBold,
    letterSpacing: -1.2,
    color: Palette.ink,
    marginBottom: 16,
  },
  subtitle: { fontSize: 16, lineHeight: 24, color: Palette.muted2, maxWidth: 300 },
  footer: { paddingBottom: 40 },
  button: {
    height: 56,
    borderRadius: 16,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: '#E2E6E3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  pressed: { opacity: 0.85 },
  buttonText: { fontSize: 16, fontFamily: Font.sansSemibold, color: Palette.ink },
  terms: {
    textAlign: 'center',
    fontSize: 12.5,
    color: Palette.faint,
    marginTop: 16,
    lineHeight: 18,
  },
});
