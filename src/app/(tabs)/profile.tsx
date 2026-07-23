import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Icon, type IconName } from '@/components/icon';
import { ScreenMeta } from '@/components/screen-meta';
import { Font, Radius, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';
import { isPushSupported, requestPermissionAndSubscribe } from '@/lib/push';
import { useColors, useSettings, type ThemePref } from '@/lib/settings';

type Me = {
  id: number;
  name: string;
  email: string;
  avatar_url: string;
  push_enabled: boolean;
  push_expenses_enabled: boolean;
  push_payments_enabled: boolean;
  push_comments_enabled: boolean;
};

type PushCategoryField = 'push_expenses_enabled' | 'push_payments_enabled' | 'push_comments_enabled';

const THEME_CYCLE: ThemePref[] = ['system', 'light', 'dark'];
const THEME_ICON: Record<ThemePref, IconName> = { system: 'contrast', light: 'sun', dark: 'moon' };

export default function ProfileScreen() {
  const { api, signOut } = useAuth();
  const { language, setLanguage, themePref, setThemePref } = useSettings();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const [me, setMe] = useState<Me | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState(false);
  const notifSupported = useMemo(() => isPushSupported(), []);

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

  const togglePush = async (value: boolean) => {
    if (!me || pushBusy) return;
    setPushBusy(true);
    setPushError(false);
    try {
      if (value) {
        // Only asks the browser permission (and subscribes this device) when
        // actually turning it on — disabling never touches the subscription,
        // so re-enabling later doesn't need the permission prompt again.
        const subscribed = await requestPermissionAndSubscribe(api);
        if (!subscribed) {
          setPushError(true);
          return;
        }
      }
      await api.patch('/api/v1/users/me/push-preference', {
        push_enabled: value,
        push_expenses_enabled: me.push_expenses_enabled,
        push_payments_enabled: me.push_payments_enabled,
        push_comments_enabled: me.push_comments_enabled,
      });
      setMe((prev) => (prev ? { ...prev, push_enabled: value } : prev));
    } catch {
      setPushError(true);
    } finally {
      setPushBusy(false);
    }
  };

  // The backend always wants the full preference set on every PATCH — there's
  // no partial-update endpoint — so each category toggle sends the other
  // three fields unchanged alongside the one that actually flipped.
  const toggleCategory = async (field: PushCategoryField, value: boolean) => {
    if (!me || pushBusy) return;
    setPushBusy(true);
    setPushError(false);
    const next = { ...me, [field]: value };
    try {
      await api.patch('/api/v1/users/me/push-preference', {
        push_enabled: next.push_enabled,
        push_expenses_enabled: next.push_expenses_enabled,
        push_payments_enabled: next.push_payments_enabled,
        push_comments_enabled: next.push_comments_enabled,
      });
      setMe(next);
    } catch {
      setPushError(true);
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenMeta title={t('nav.profile')} />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('profile.title')}</Text>
          </View>

          <View style={styles.card}>
            <Avatar uri={me?.avatar_url} name={name} size={58} color={Palette.green} fontSize={23} />
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
                <Icon name="world" size={16} color={Palette.green} />
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
                <Icon name={THEME_ICON[themePref]} size={16} color={Palette.ink} />
              </View>
              <Text style={styles.settingLabel}>{t('profile.appearance')}</Text>
              <Text style={styles.settingValue}>{t(`theme.${themePref}`)}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {notifSupported && me && (
              <>
                <View style={styles.rowDivider} />

                {/* Notifications */}
                <View style={styles.settingRow}>
                  <View style={[styles.glyphBox, { backgroundColor: Palette.greenTint }]}>
                    <Icon name="bell" size={16} color={Palette.green} />
                  </View>
                  <Text style={styles.settingLabel}>{t('profile.notifications')}</Text>
                  <Switch
                    value={me.push_enabled}
                    onValueChange={togglePush}
                    disabled={pushBusy}
                    trackColor={{ true: Palette.green }}
                  />
                </View>

                {/* Per-category sub-toggles — only meaningful, so only
                    shown, once notifications are on at all. */}
                {me.push_enabled && (
                  <>
                    <View style={[styles.rowDivider, styles.subRowDivider]} />
                    <View style={[styles.settingRow, styles.subRow]}>
                      <Text style={styles.subRowLabel}>{t('profile.notificationsExpenses')}</Text>
                      <Switch
                        value={me.push_expenses_enabled}
                        onValueChange={(v) => toggleCategory('push_expenses_enabled', v)}
                        disabled={pushBusy}
                        trackColor={{ true: Palette.green }}
                      />
                    </View>
                    <View style={[styles.rowDivider, styles.subRowDivider]} />
                    <View style={[styles.settingRow, styles.subRow]}>
                      <Text style={styles.subRowLabel}>{t('profile.notificationsPayments')}</Text>
                      <Switch
                        value={me.push_payments_enabled}
                        onValueChange={(v) => toggleCategory('push_payments_enabled', v)}
                        disabled={pushBusy}
                        trackColor={{ true: Palette.green }}
                      />
                    </View>
                    <View style={[styles.rowDivider, styles.subRowDivider]} />
                    <View style={[styles.settingRow, styles.subRow]}>
                      <Text style={styles.subRowLabel}>{t('profile.notificationsComments')}</Text>
                      <Switch
                        value={me.push_comments_enabled}
                        onValueChange={(v) => toggleCategory('push_comments_enabled', v)}
                        disabled={pushBusy}
                        trackColor={{ true: Palette.green }}
                      />
                    </View>
                  </>
                )}
              </>
            )}
          </View>

          {!notifSupported && (
            <Text style={styles.notifNote}>{t('profile.notificationsUnsupported')}</Text>
          )}
          {pushError && <Text style={styles.notifError}>{t('profile.notificationsError')}</Text>}

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
    // Sub-toggles nested under "Notifications" — no icon box, indented
    // further, and a slightly muted label to read as children of the row
    // above rather than peers of it.
    subRow: { paddingLeft: 58, paddingVertical: 13 },
    subRowDivider: { marginLeft: 58 },
    subRowLabel: { flex: 1, fontSize: 13.5, color: Palette.muted2, fontFamily: Font.sansMedium },
    glyphBox: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    settingLabel: { flex: 1, fontSize: 14.5, color: Palette.ink, fontFamily: Font.sansMedium },
    settingValue: { fontSize: 13.5, color: Palette.muted, fontFamily: Font.sansMedium },
    chevron: { fontSize: 16, color: Palette.faint },
    notifNote: {
      marginHorizontal: 24,
      marginTop: 10,
      fontSize: 12.5,
      color: Palette.muted,
      fontFamily: Font.sans,
    },
    notifError: {
      marginHorizontal: 24,
      marginTop: 10,
      fontSize: 12.5,
      color: Palette.red,
      fontFamily: Font.sans,
    },
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
