import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Font, Radius, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';
import { getLastGroupId, rememberLastGroup } from '@/lib/last-group';
import { navigateAfterScan, scanReceiptFile } from '@/lib/receipt-scan';
import { useColors } from '@/lib/settings';

const SHARE_TARGET_CACHE = 'spliteasy-share-target';
const SHARED_RECEIPT_URL = '/shared-receipt';

type GroupOption = { id: number; name: string; emoji: string; currency: string };

type Status = 'loading' | 'choosing' | 'scanning' | 'error';

// Landing point for the OS share sheet ("Share" a photo → SplitEasy). The
// image itself already made it here via the service worker (which
// intercepted the POST and stashed it in Cache Storage — see public/sw.js);
// this screen just needs a group to attach it to. If the user has one
// recently open, skip straight to it; otherwise ask.
export default function ShareTargetScreen() {
  const { shared } = useLocalSearchParams<{ shared?: string }>();
  const { api } = useAuth();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const imageRef = useRef<{ uri: string; mimeType: string } | null>(null);

  const proceedWithGroup = useCallback(
    async (groupId: number, currency: string) => {
      setStatus('scanning');
      try {
        const prefill = await scanReceiptFile(
          api,
          imageRef.current!.uri,
          `receipt.${imageRef.current!.mimeType.split('/')[1] ?? 'jpg'}`,
          imageRef.current!.mimeType,
          currency,
        );
        navigateAfterScan(String(groupId), prefill);
      } catch {
        setStatus('error');
        setErrorMsg(t('shareTarget.scanError'));
      }
    },
    [api],
  );

  useEffect(() => {
    if (shared !== '1') {
      router.replace('/');
      return;
    }

    (async () => {
      const cache = await caches.open(SHARE_TARGET_CACHE);
      const response = await cache.match(SHARED_RECEIPT_URL);
      await cache.delete(SHARED_RECEIPT_URL);

      if (!response) {
        setStatus('error');
        setErrorMsg(t('shareTarget.noFile'));
        return;
      }

      const blob = await response.blob();
      imageRef.current = {
        uri: URL.createObjectURL(blob),
        mimeType: response.headers.get('Content-Type') || 'image/jpeg',
      };

      const lastGroupId = await getLastGroupId();
      if (lastGroupId) {
        try {
          const group = await api.get<{ currency: string }>(`/api/v1/groups/${lastGroupId}`);
          proceedWithGroup(lastGroupId, group.currency);
          return;
        } catch {
          // Fall through to the group picker — e.g. the remembered group was
          // deleted, or this request failed transiently.
        }
      }

      try {
        const home = await api.get<{ groups: GroupOption[] }>('/api/v1/home');
        setGroups(home.groups ?? []);
        setStatus('choosing');
      } catch {
        setStatus('error');
        setErrorMsg(t('shareTarget.scanError'));
      }
    })();
  }, [shared, api, proceedWithGroup]);

  const chooseGroup = (group: GroupOption) => {
    rememberLastGroup(group.id);
    proceedWithGroup(group.id, group.currency);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {(status === 'loading' || status === 'scanning') && (
          <View style={styles.center}>
            <ActivityIndicator color={Palette.green} />
            <Text style={styles.muted}>
              {status === 'scanning' ? t('shareTarget.scanning') : t('shortcut.loading')}
            </Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.center}>
            <Text style={styles.error}>{errorMsg}</Text>
            <Pressable onPress={() => router.replace('/')} style={styles.button}>
              <Text style={styles.buttonText}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        )}

        {status === 'choosing' && (
          <View style={styles.body}>
            <Text style={styles.title}>{t('shareTarget.chooseGroup')}</Text>
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {groups.map((g) => (
                <Pressable key={g.id} onPress={() => chooseGroup(g)} style={styles.groupRow}>
                  <Text style={styles.groupEmoji}>{g.emoji}</Text>
                  <Text style={styles.groupName}>{g.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
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
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 28 },
    muted: { color: Palette.muted, fontSize: 15, fontFamily: Font.sans },
    error: { color: Palette.red, fontSize: 15, fontFamily: Font.sans, textAlign: 'center' },
    button: {
      height: 46,
      paddingHorizontal: 24,
      borderRadius: 14,
      backgroundColor: Palette.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: { color: Palette.ink, fontSize: 15, fontFamily: Font.sansSemibold },
    body: { flex: 1, paddingHorizontal: 24, paddingTop: 24, gap: 16 },
    title: { fontSize: 19, fontFamily: Font.sansSemibold, color: Palette.ink },
    list: { gap: 10, paddingBottom: 24 },
    groupRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      height: 60,
      paddingHorizontal: 16,
      borderRadius: Radius.lg,
      backgroundColor: Palette.card,
    },
    groupEmoji: { fontSize: 22 },
    groupName: { fontSize: 16, fontFamily: Font.sansSemibold, color: Palette.ink },
  });
