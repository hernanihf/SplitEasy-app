import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Font, Palette, Radius, initial } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { i18n, t } from '@/lib/i18n';

type Me = { id: number; name: string; email: string };

export default function ProfileScreen() {
  const { api, signOut } = useAuth();
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
            <View style={styles.settingRow}>
              <View style={[styles.glyphBox, { backgroundColor: '#E3EEFB' }]}>
                <Text style={[styles.glyph, { color: Palette.blue }]}>🌐</Text>
              </View>
              <Text style={styles.settingLabel}>
                {i18n.locale === 'es' ? 'Idioma · Español' : 'Language · English'}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={signOut}
            style={({ pressed }) => [styles.logout, pressed && styles.pressed]}>
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  glyphBox: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 14 },
  settingLabel: { flex: 1, fontSize: 14.5, color: Palette.ink, fontFamily: Font.sansMedium },
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
  pressed: { opacity: 0.7 },
  logoutText: { fontSize: 14.5, fontFamily: Font.sansSemibold, color: Palette.red },
});
