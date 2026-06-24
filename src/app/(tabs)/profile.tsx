import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Font, Radius, initial, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';
import { useColors, useSettings, type ThemePref } from '@/lib/settings';

type Me = { id: number; name: string; email: string };

const THEME_CYCLE: ThemePref[] = ['system', 'light', 'dark'];
const THEME_GLYPH: Record<ThemePref, string> = { system: '🌓', light: '☀️', dark: '🌙' };

export default function ProfileScreen() {
  const { api, signOut } = useAuth();
  const { language, setLanguage, themePref, setThemePref } = useSettings();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const [me, setMe] = useState<Me | null>(null);

  useFocusEffect(
    useCallback(() => {
      api
        .get<Me>('/api/v1/users/me')
        .then(setMe)
        .catch(() => {});
    }, [api]),
  );

  const name = me?.name || t('profile.anonymous');

  const cycleTheme = () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(themePref) + 1) % THEME_CYCLE.length];
    setThemePref(next);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('profile.title')}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial(name)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{name}</Text>
              {me?.email ? <Text style={styles.email}>{me.email}</Text> : null}
            </View>
          </View>

          <View style={styles.settings}>
            {/* Language */}
            <Pressable
              onPress={() => setLanguage(language === 'es' ? 'en' : 'es')}
              style={({ pressed }) => [styles.settingRow, pressed && styles.rowPressed]}>
              <View style={[styles.glyphBox, { backgroundColor: Palette.greenTint }]}>
                <Text style={styles.glyph}>🌐</Text>
              </View>
              <Text style={styles.settingLabel}>{t('profile.language')}</Text>
              <Text style={styles.settingValue}>{language === 'es' ? 'Español' : 'English'}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <View style={styles.rowDivider} />

            {/* Appearance */}
            <Pressable
              onPress={cycleTheme}
              style={({ pressed }) => [styles.settingRow, pressed && styles.rowPressed]}>
              <View style={[styles.glyphBox, { backgroundColor: Palette.inputBg }]}>
                <Text style={styles.glyph}>{THEME_GLYPH[themePref]}</Text>
              </View>
              <Text style={styles.settingLabel}>{t('profile.appearance')}</Text>
              <Text style={styles.settingValue}>{t(`theme.${themePref}`)}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={signOut}
            style={({ pressed }) => [styles.logout, pressed && styles.rowPressed]}>
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: Palette.bg },
    safe: { flex: 1 },
    scroll: { paddingBottom: 24 },
    header: { paddingHorizontal: 24, paddingTop: 6 },
    title: { fontSize: 24, fontFamily: Font.sansBold, letterSpacing: -0.6, color: Palette.ink },
    card: {
      margin: 20,
      backgroundColor: Palette.card,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      borderRadius: Radius.xl,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15,
    },
    avatar: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: Palette.green,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: '#fff', fontSize: 23, fontFamily: Font.sansSemibold },
    info: { flex: 1 },
    name: { fontSize: 17, fontFamily: Font.sansSemibold, color: Palette.ink },
    email: { marginTop: 3, fontSize: 13, color: Palette.muted },
    settings: {
      marginHorizontal: 20,
      backgroundColor: Palette.card,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      borderRadius: Radius.xl,
      overflow: 'hidden',
    },
    settingRow: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 15 },
    rowPressed: { opacity: 0.6 },
    rowDivider: { height: 1, backgroundColor: Palette.divider, marginLeft: 58 },
    glyphBox: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    glyph: { fontSize: 14 },
    settingLabel: { flex: 1, fontSize: 14.5, color: Palette.ink, fontFamily: Font.sansMedium },
    settingValue: { fontSize: 13.5, color: Palette.muted, fontFamily: Font.sansMedium },
    chevron: { fontSize: 16, color: Palette.faint },
    logout: {
      marginHorizontal: 20,
      marginTop: 18,
      height: 50,
      borderRadius: Radius.md,
      backgroundColor: Palette.card,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoutText: { fontSize: 14.5, fontFamily: Font.sansSemibold, color: Palette.red },
  });
