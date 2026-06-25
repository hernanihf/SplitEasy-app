import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Font, Radius, avatarColor, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { formatAmount, fromCents, t, toCents } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

export default function SettleScreen() {
  const { id, from, to, amount, fromName, toName, fromAvatar, toAvatar } = useLocalSearchParams<{
    id: string;
    from: string;
    to: string;
    amount: string;
    fromName?: string;
    toName?: string;
    fromAvatar?: string;
    toAvatar?: string;
  }>();
  const { api } = useAuth();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  // The `amount` param arrives in cents (the debt amount from the balances).
  const maxAmount = useMemo(() => parseInt(amount ?? '0', 10) || 0, [amount]);
  const [value, setValue] = useState(() => fromCents(parseInt(amount ?? '0', 10) || 0));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fName = fromName ?? t('groupDetail.userN', { id: from });
  const tName = toName ?? t('groupDetail.userN', { id: to });

  const confirm = async () => {
    const paid = toCents(value);
    if (paid <= 0) return setError(t('settle.amountPositive'));
    if (paid > maxAmount)
      return setError(t('settle.amountTooHigh', { max: formatAmount(maxAmount) }));

    setSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/v1/groups/${id}/settlements`, {
        from_user_id: Number(from),
        to_user_id: Number(to),
        amount: paid,
      });
      router.back();
    } catch {
      setError(t('settle.recordError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <Pressable style={styles.dim} onPress={() => router.back()} />
      <SafeAreaView edges={['bottom']} style={styles.sheetWrap}>
        <View style={styles.sheet}>
          <View style={styles.grab} />
          <Text style={styles.title}>{t('settle.title')}</Text>
          <Text style={styles.subtitle}>{t('settle.subtitle')}</Text>

          <View style={styles.flow}>
            <View style={styles.person}>
              <Avatar uri={fromAvatar} name={fName} size={48} color={avatarColor(Number(from))} fontSize={18} />
              <Text style={styles.personName}>{fName}</Text>
            </View>
            <View style={styles.person}>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.flowAmount}>{formatAmount(maxAmount)}</Text>
            </View>
            <View style={styles.person}>
              <Avatar uri={toAvatar} name={tName} size={48} color={avatarColor(Number(to))} fontSize={18} />
              <Text style={styles.personName}>{tName}</Text>
            </View>
          </View>

          <Text style={styles.howMuch}>{t('settle.howMuch')}</Text>
          <View style={styles.amountBox}>
            <Text style={styles.dollar}>$</Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              placeholder={t('settle.amountPlaceholder')}
              placeholderTextColor={Palette.muted}
              style={styles.amountInput}
              autoFocus
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={confirm}
            disabled={submitting}
            style={[styles.confirm, submitting && styles.disabled]}>
            <Text style={styles.confirmText}>{t('settle.confirm')}</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} style={styles.cancel}>
            <Text style={styles.cancelText}>{t('settle.cancel')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  dim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,16,12,0.42)' },
  sheetWrap: { width: '100%' },
  sheet: {
    backgroundColor: Palette.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 8,
  },
  grab: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#E2E6E3', alignSelf: 'center', marginVertical: 12 },
  title: { fontSize: 19, fontFamily: Font.sansBold, letterSpacing: -0.4, color: Palette.ink },
  subtitle: { marginTop: 4, marginBottom: 20, fontSize: 13.5, color: Palette.muted },
  flow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 20,
    backgroundColor: Palette.bg,
    borderRadius: Radius.lg,
  },
  person: { alignItems: 'center' },
  personName: { marginTop: 7, fontSize: 12, fontFamily: Font.sansMedium, color: Palette.ink },
  arrow: { fontSize: 20, color: Palette.green },
  flowAmount: { marginTop: 4, fontSize: 14, fontFamily: Font.monoSemibold, color: Palette.ink },
  howMuch: { marginTop: 18, marginBottom: 9, fontSize: 13, fontFamily: Font.sansSemibold, color: Palette.ink },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.inputBg,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 52,
  },
  dollar: { fontFamily: Font.monoSemibold, fontSize: 18, color: Palette.ink },
  amountInput: { flex: 1, fontFamily: Font.monoSemibold, fontSize: 18, color: Palette.ink, padding: 0 },
  error: { color: Palette.red, fontSize: 13, marginTop: 10 },
  confirm: {
    height: 54,
    borderRadius: 16,
    backgroundColor: Palette.green,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  disabled: { opacity: 0.6 },
  confirmText: { color: '#fff', fontSize: 15.5, fontFamily: Font.sansSemibold },
  cancel: { height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  cancelText: { color: Palette.muted, fontSize: 14, fontFamily: Font.sansSemibold },
});
