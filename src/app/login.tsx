import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { googleLoginUrl, useAuth } from '@/lib/auth';

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
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">SplitEasy</ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          Organize shared expenses with your group.
        </ThemedText>

        <Pressable
          onPress={handleGoogleLogin}
          disabled={isSigningIn}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <ThemedText type="smallBold" style={styles.buttonText}>
            {isSigningIn ? 'Connecting…' : 'Continue with Google'}
          </ThemedText>
        </Pressable>

        {Platform.OS === 'web' && (
          <ThemedText type="small" style={styles.hint}>
            A Google window will open for you to sign in.
          </ThemedText>
        )}
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  subtitle: {
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#208AEF',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    marginTop: Spacing.four,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
  },
  hint: {
    marginTop: Spacing.two,
    opacity: 0.7,
  },
});
