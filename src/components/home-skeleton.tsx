import { StyleSheet, View } from 'react-native';

import { SkeletonBlock } from '@/components/skeleton';
import { type ThemeColors } from '@/constants/design';
import { useColors } from '@/lib/settings';

// Mirrors the shape of Home's balance numbers (inside the always-visible
// green hero card) while the first /api/v1/home load is in flight.
export function HeroSkeleton() {
  return (
    <View style={{ marginTop: 6 }}>
      <SkeletonBlock width={140} height={30} radius={6} style={styles.onHero} />
      <View style={styles.heroRow}>
        <SkeletonBlock width={"100%"} height={44} radius={14} style={styles.onHero} />
        <SkeletonBlock width={"100%"} height={44} radius={14} style={styles.onHero} />
      </View>
    </View>
  );
}

// Mirrors the group-row cards below it — see (tabs)/index.tsx groupCard.
export function GroupListSkeleton() {
  const Palette = useColors();
  const rowStyles = makeRowStyles(Palette);
  return (
    <View style={rowStyles.list}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={rowStyles.row}>
          <SkeletonBlock width={48} height={48} radius={15} />
          <View style={rowStyles.info}>
            <SkeletonBlock width="55%" height={15} radius={4} />
            <SkeletonBlock width="30%" height={12} radius={4} style={{ marginTop: 8 }} />
          </View>
          <SkeletonBlock width={60} height={14} radius={4} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  onHero: { backgroundColor: 'rgba(255,255,255,0.16)' },
  heroRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
});

const makeRowStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    list: { paddingHorizontal: 20, gap: 12 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: Palette.card,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      borderRadius: 20,
      padding: 16,
    },
    info: { flex: 1 },
  });
