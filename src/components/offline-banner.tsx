import { StyleSheet, Text } from 'react-native';

import { Font, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { useIsOnline } from '@/lib/network';
import { useColors } from '@/lib/settings';

type Props = {
  // Expenses queued locally for this screen's scope (a specific group, or
  // every group on Home) — shown as "N to sync" while offline, or
  // "syncing N" for the brief window after reconnecting but before the
  // queue has drained.
  pendingCount?: number;
};

export function OfflineBanner({ pendingCount = 0 }: Props) {
  const Palette = useColors();
  const isOnline = useIsOnline();

  if (isOnline && pendingCount === 0) return null;

  const message = !isOnline
    ? pendingCount > 0
      ? t('offline.bannerPending', { count: pendingCount })
      : t('offline.bannerCached')
    : t('offline.syncing', { count: pendingCount });

  return <Text style={makeStyles(Palette).banner}>{message}</Text>;
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    banner: {
      position: 'absolute',
      top: 52,
      alignSelf: 'center',
      maxWidth: '90%',
      backgroundColor: Palette.ink,
      color: Palette.bg,
      fontSize: 12.5,
      fontFamily: Font.sansMedium,
      paddingVertical: 9,
      paddingHorizontal: 14,
      borderRadius: 12,
      overflow: 'hidden',
      textAlign: 'center',
      zIndex: 10,
    },
  });
