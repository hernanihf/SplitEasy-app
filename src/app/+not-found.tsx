import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { ScreenMeta } from '@/components/screen-meta';
import { Font, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

// Replaces expo-router's default "Unmatched Route" screen (a bare
// framework page, not on-brand) for any URL that doesn't match a route —
// a mistyped link, an old bookmark, or someone poking at the app's routes.
export default function NotFoundScreen() {
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  return (
    <View style={styles.root}>
      <ScreenMeta title={t('notFound.title')} />
      <SafeAreaView style={styles.safe}>
        <View style={styles.iconWrap}>
          <Icon name="question" size={40} color={Palette.muted} />
        </View>
        <Text style={styles.title}>{t('notFound.title')}</Text>
        <Text style={styles.subtitle}>{t('notFound.subtitle')}</Text>
        <Pressable onPress={() => router.replace('/')} style={styles.button}>
          <Text style={styles.buttonText}>{t('notFound.backHome')}</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: Palette.bg },
    safe: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    iconWrap: { marginBottom: 16 },
    title: { fontSize: 19, fontFamily: Font.sansBold, color: Palette.ink, textAlign: 'center' },
    subtitle: {
      marginTop: 8,
      fontSize: 14,
      color: Palette.muted,
      textAlign: 'center',
      lineHeight: 20,
    },
    button: {
      marginTop: 28,
      height: 50,
      paddingHorizontal: 28,
      borderRadius: 16,
      backgroundColor: Palette.green,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: { color: '#fff', fontSize: 15, fontFamily: Font.sansSemibold },
  });
