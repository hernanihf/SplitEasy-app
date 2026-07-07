import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { ScreenMeta } from '@/components/screen-meta';
import { Font, Radius, tileBg, type ThemeColors } from '@/constants/design';
import { PENDING_INVITE_KEY, useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';
import { setItem } from '@/lib/storage';

type GroupPreview = {
  name: string;
  emoji: string;
  currency: string;
  member_count: number;
};

export default function JoinScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { token: authToken, api } = useAuth();
  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  // Public endpoint — no auth required, so the preview loads and can be
  // shown even before the person has signed in.
  useEffect(() => {
    if (!token) return;
    api
      .get<GroupPreview>(`/api/v1/groups/preview?token=${encodeURIComponent(token)}`)
      .then(setPreview)
      .catch(() => setError(t('join.error')));
  }, [token, api]);

  const handleJoin = async () => {
    if (!token || joining) return;

    if (!authToken) {
      // Not signed in yet — resume this same confirmation screen after
      // login instead of joining blind.
      await setItem(PENDING_INVITE_KEY, token);
      router.replace('/login');
      return;
    }

    setJoining(true);
    try {
      const group = await api.post<{ id: number }>('/api/v1/groups/join', { token });
      router.replace(`/groups/${group.id}`);
    } catch {
      setError(t('join.error'));
      setJoining(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenMeta title={t('join.title')} description={t('join.description')} />
      <SafeAreaView edges={['top']} style={styles.safe}>
        {error ? (
          <View style={styles.center}>
            <BackButton onPress={() => router.replace('/')} style={styles.backBtn} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : !preview ? (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.green} />
          </View>
        ) : (
          <View style={styles.center}>
            <View style={[styles.tile, { backgroundColor: tileBg(preview.name) }]}>
              <Text style={styles.tileEmoji}>{preview.emoji || '💸'}</Text>
            </View>
            <Text style={styles.groupName}>{preview.name}</Text>
            <Text style={styles.meta}>
              {t('groupDetail.memberCount', { count: preview.member_count })} · {preview.currency}
            </Text>
            <Text style={styles.description}>{t('join.description')}</Text>

            <Pressable
              onPress={handleJoin}
              disabled={joining}
              style={[styles.joinBtn, joining && styles.disabled]}>
              <Text style={styles.joinBtnText}>{joining ? t('join.joining') : t('join.confirm')}</Text>
            </Pressable>
            <Pressable onPress={() => router.replace('/')} disabled={joining}>
              <Text style={styles.notNow}>{t('join.notNow')}</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: Palette.bg },
    safe: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
    backBtn: { position: 'absolute', top: 8, left: 0 },
    errorText: { color: Palette.red, fontSize: 15, fontFamily: Font.sans, textAlign: 'center' },
    tile: { width: 76, height: 76, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
    tileEmoji: { fontSize: 34 },
    groupName: {
      marginTop: 18,
      fontSize: 22,
      fontFamily: Font.sansBold,
      color: Palette.ink,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    meta: { marginTop: 6, fontSize: 13.5, color: Palette.muted, fontFamily: Font.sansMedium },
    description: {
      marginTop: 16,
      fontSize: 14,
      color: Palette.muted2,
      textAlign: 'center',
      lineHeight: 20,
      maxWidth: 300,
    },
    joinBtn: {
      marginTop: 28,
      height: 54,
      paddingHorizontal: 40,
      borderRadius: 16,
      backgroundColor: Palette.green,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabled: { opacity: 0.6 },
    joinBtnText: { color: '#fff', fontSize: 15.5, fontFamily: Font.sansSemibold },
    notNow: { marginTop: 16, fontSize: 13.5, color: Palette.muted, fontFamily: Font.sansMedium },
  });
