import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Font, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { getLastGroupId } from '@/lib/last-group';
import { useColors } from '@/lib/settings';

// Landing point for the PWA's home-screen shortcuts ("New expense", "View
// balance") — a manifest shortcut can only point at a fixed URL, so this
// resolves the group the user last opened and forwards there. AuthGate (see
// _layout.tsx) already sends an unauthenticated visitor to /login before
// this ever renders.
export default function ShortcutScreen() {
  const { action } = useLocalSearchParams<{ action: string }>();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  useEffect(() => {
    getLastGroupId().then((groupId) => {
      if (!groupId) {
        router.replace('/');
        return;
      }
      if (action === 'balance') {
        router.replace({ pathname: '/groups/[id]', params: { id: String(groupId), tab: 'balances' } });
      } else {
        router.replace({ pathname: '/groups/[id]/add-expense', params: { id: String(groupId) } });
      }
    });
  }, [action]);

  return (
    <View style={styles.root}>
      <Text style={styles.text}>{t('shortcut.loading')}</Text>
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: Palette.bg, alignItems: 'center', justifyContent: 'center' },
    text: { color: Palette.muted, fontSize: 15, fontFamily: Font.sans },
  });
