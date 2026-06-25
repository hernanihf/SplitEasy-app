import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/components/logo';
import { Font, type ThemeColors } from '@/constants/design';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

const DISMISS_KEY = 'spliteasy_install_dismissed';

// Chrome/Edge fire this before showing their own install UI; we capture it so
// we can trigger the native prompt from our own button instead.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const safari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  return ios && safari;
}

export function InstallPrompt() {
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const [mode, setMode] = useState<'install' | 'ios' | null>(null);
  const deferred = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferred.current = e as BeforeInstallPromptEvent;
      setMode('install');
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // iOS Safari never fires beforeinstallprompt, so fall back to instructions.
    if (isIosSafari()) setMode('ios');

    const onInstalled = () => setMode(null);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setMode(null);
  };

  const install = async () => {
    const evt = deferred.current;
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    deferred.current = null;
    setMode(null);
  };

  if (!mode) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <View style={styles.icon}>
        <Logo size={36} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{t('install.title')}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {mode === 'ios' ? t('install.iosSubtitle') : t('install.subtitle')}
        </Text>
      </View>
      {mode === 'install' && (
        <Pressable onPress={install} style={styles.cta}>
          <Text style={styles.ctaText}>{t('install.action')}</Text>
        </Pressable>
      )}
      <Pressable onPress={dismiss} hitSlop={10} accessibilityLabel={t('install.dismiss')}>
        <Text style={styles.close}>×</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(Palette: ThemeColors) {
  return StyleSheet.create({
    banner: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      backgroundColor: Palette.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: Palette.cardBorder,
      borderRadius: 16,
      paddingVertical: 11,
      paddingHorizontal: 12,
      // Subtle lift so it reads as floating above the list (web-only).
      boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
    } as object,
    icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    copy: { flex: 1, minWidth: 0 },
    title: { fontSize: 13.5, fontFamily: Font.sansSemibold, color: Palette.ink },
    subtitle: { fontSize: 12, fontFamily: Font.sans, color: Palette.muted2, marginTop: 1 },
    cta: {
      backgroundColor: Palette.green,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    ctaText: { fontSize: 13, fontFamily: Font.sansSemibold, color: '#FFFFFF' },
    close: { fontSize: 22, lineHeight: 22, color: Palette.faint, paddingHorizontal: 2 },
  });
}
