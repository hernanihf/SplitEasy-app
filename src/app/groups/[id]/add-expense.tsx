import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Font, Radius, avatarColor, initial, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/lib/settings';
import { formatAmount, t, toCents } from '@/lib/i18n';
import { assetToFile, scanReceiptFile } from '@/lib/receipt-scan';
import type { Group } from '@/app/groups/[id]/index';

type SplitMethod = 'equal' | 'fixed' | 'percentage';

const METHODS: { value: SplitMethod; key: string }[] = [
  { value: 'equal', key: 'addExpense.methodEqual' },
  { value: 'fixed', key: 'addExpense.methodFixed' },
  { value: 'percentage', key: 'addExpense.methodPercentage' },
];

export default function AddExpenseScreen() {
  const { id, description: prefillDesc, amount: prefillAmount } = useLocalSearchParams<{
    id: string;
    description?: string;
    amount?: string;
  }>();
  const { api } = useAuth();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  const [group, setGroup] = useState<Group | null>(null);
  const [desc, setDesc] = useState(prefillDesc ?? '');
  const [amount, setAmount] = useState(prefillAmount ?? '');
  const [paidBy, setPaidBy] = useState<number | null>(null);
  const [method, setMethod] = useState<SplitMethod>('equal');
  const [values, setValues] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(!!(prefillDesc || prefillAmount));

  // "Scan" opens the camera directly and fills the form in place — no detour
  // through the scan-receipt screen. That screen is only for the "Upload" flow.
  const scanFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return setError(t('scanReceipt.cameraPermission'));
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled) return;

    const file = assetToFile(result.assets[0]);
    setScanning(true);
    setError(null);
    try {
      const prefill = await scanReceiptFile(api, file.uri, file.name, file.mimeType);
      setDesc(prefill.description);
      setAmount(prefill.amount);
      setScanned(true);
    } catch {
      setError(t('scanReceipt.readError'));
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<Group>(`/api/v1/groups/${id}`),
      api.get<{ id: number }>('/api/v1/users/me'),
    ]).then(([g, me]) => {
      setGroup(g);
      setPaidBy(g.members.some((m) => m.id === me.id) ? me.id : (g.members[0]?.id ?? null));
    });
  }, [id, api]);

  const amountNumber = useMemo(() => parseFloat(amount.replace(',', '.')) || 0, [amount]);
  const amountCents = useMemo(() => toCents(amount), [amount]);

  const splitTotal = useMemo(() => {
    if (!group || method === 'equal') return 0;
    return group.members.reduce(
      (sum, m) => sum + (parseFloat((values[m.id] ?? '').replace(',', '.')) || 0),
      0,
    );
  }, [group, method, values]);

  const submit = async () => {
    if (!group || !paidBy) return;
    if (!desc.trim()) return setError(t('addExpense.descriptionRequired'));
    if (amountNumber <= 0) return setError(t('addExpense.amountPositive'));

    // Fixed split values are sent as cents; percentage values stay percentages.
    let splits: { user_id: number; value: number }[];
    if (method === 'equal') {
      splits = group.members.map((m) => ({ user_id: m.id, value: 0 }));
    } else if (method === 'fixed') {
      splits = group.members.map((m) => ({ user_id: m.id, value: toCents(values[m.id] ?? '') }));
      if (Math.abs(splitTotal - amountNumber) > 0.01)
        return setError(t('addExpense.amountsMustTotal', { amount: formatAmount(amountCents) }));
    } else {
      splits = group.members.map((m) => ({
        user_id: m.id,
        value: parseFloat((values[m.id] ?? '').replace(',', '.')) || 0,
      }));
      if (Math.abs(splitTotal - 100) > 0.01)
        return setError(t('addExpense.percentagesMustTotal'));
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post('/api/v1/expenses', {
        group_id: group.id,
        paid_by_id: paidBy,
        description: desc.trim(),
        amount: amountCents,
        split_method: method,
        splits,
      });
      router.replace(`/groups/${id}`);
    } catch {
      setError(t('addExpense.addError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!group) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.center}>
          <Text style={styles.muted}>{t('addExpense.loading')}</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topbar}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.topTitle}>{t('addExpense.title')}</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* amount */}
          <View style={styles.amountWrap}>
            <Text style={styles.amountLabel}>{t('addExpense.amountIn', { group: group.name })}</Text>
            <View style={styles.amountRow}>
              <Text style={styles.dollar}>$</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#C8D0CB"
                style={styles.amountInput}
              />
            </View>
          </View>

          {/* receipt scan */}
          <View style={styles.card}>
            {scanning ? (
              <View style={styles.scannedRow}>
                <ActivityIndicator color={Palette.green} />
                <Text style={styles.scannedText}>{t('scanReceipt.reading')}</Text>
              </View>
            ) : scanned ? (
              <View style={styles.scannedRow}>
                <View style={styles.scannedIcon}>
                  <Text style={styles.scannedCheck}>✓</Text>
                </View>
                <Text style={styles.scannedText}>{t('addExpense.receiptAdded')}</Text>
              </View>
            ) : (
              <View style={styles.scanRow}>
                <Pressable onPress={scanFromCamera} style={styles.scanBtn}>
                  <Text style={styles.scanBtnText}>{t('addExpense.scan')}</Text>
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/groups/${id}/scan-receipt`)}
                  style={styles.scanBtn}>
                  <Text style={styles.scanBtnText}>{t('addExpense.upload')}</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* description */}
          <View style={styles.inputCard}>
            <TextInput
              value={desc}
              onChangeText={setDesc}
              placeholder={t('addExpense.descriptionPlaceholder')}
              placeholderTextColor={Palette.muted}
              style={styles.descInput}
            />
          </View>

          {/* who paid */}
          <Text style={styles.sectionLabel}>{t('addExpense.whoPaid')}</Text>
          <View style={styles.chipWrap}>
            {group.members.map((m) => {
              const active = paidBy === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setPaidBy(m.id)}
                  style={[styles.chip, active && styles.chipActive]}>
                  <View style={[styles.chipAvatar, { backgroundColor: avatarColor(m.id) }]}>
                    <Text style={styles.chipAvatarText}>{initial(m.name)}</Text>
                  </View>
                  <Text style={[styles.chipName, active && styles.chipNameActive]}>{m.name}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* split mode */}
          <Text style={styles.sectionLabel}>{t('addExpense.howSplit')}</Text>
          <View style={styles.segment}>
            {METHODS.map((mth) => {
              const active = method === mth.value;
              return (
                <Pressable
                  key={mth.value}
                  onPress={() => setMethod(mth.value)}
                  style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {t(mth.key)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* split rows */}
          <View style={styles.splitCard}>
            {group.members.map((m) => {
              const equalShare = group.members.length
                ? Math.round(amountCents / group.members.length)
                : 0;
              return (
                <View key={m.id} style={styles.splitRow}>
                  <View style={[styles.rowAvatar, { backgroundColor: avatarColor(m.id) }]}>
                    <Text style={styles.rowAvatarText}>{initial(m.name)}</Text>
                  </View>
                  <Text style={styles.rowName}>{m.name}</Text>
                  {method === 'equal' ? (
                    <Text style={styles.rowDisplay}>{formatAmount(equalShare)}</Text>
                  ) : (
                    <View style={styles.rowInputBox}>
                      {method === 'fixed' && <Text style={styles.rowPrefix}>$</Text>}
                      <TextInput
                        value={values[m.id] ?? ''}
                        onChangeText={(txt) => setValues((p) => ({ ...p, [m.id]: txt }))}
                        keyboardType="decimal-pad"
                        placeholder="0"
                        placeholderTextColor={Palette.muted}
                        style={styles.rowInput}
                      />
                      {method === 'percentage' && <Text style={styles.rowSuffix}>%</Text>}
                    </View>
                  )}
                </View>
              );
            })}
            {method !== 'equal' && (
              <View style={styles.splitHint}>
                <Text style={styles.splitHintLabel}>{t('addExpense.splitTotal')}</Text>
                <Text style={styles.splitHintValue}>
                  {method === 'percentage' ? `${splitTotal}%` : formatAmount(Math.round(splitTotal * 100))}
                </Text>
              </View>
            )}
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={submit}
            disabled={submitting}
            style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}>
            <Text style={styles.saveText}>
              {submitting ? t('addExpense.saving') : t('addExpense.add')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.bg },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: Palette.muted, fontSize: 14 },
  topbar: {
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topTitle: { fontSize: 15, fontFamily: Font.sansSemibold, color: Palette.ink },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  amountWrap: { alignItems: 'center', paddingVertical: 14 },
  amountLabel: { fontSize: 12.5, color: Palette.muted, fontFamily: Font.sansMedium, marginBottom: 6 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dollar: { fontFamily: Font.monoSemibold, fontSize: 30, color: Palette.ink },
  amountInput: {
    minWidth: 120,
    fontFamily: Font.monoSemibold,
    fontSize: 44,
    letterSpacing: -1.5,
    color: Palette.ink,
    textAlign: 'center',
    padding: 0,
  },
  card: {
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 14,
  },
  scanRow: { flexDirection: 'row', gap: 10 },
  scanBtn: {
    flex: 1,
    height: 48,
    borderRadius: 13,
    backgroundColor: Palette.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnText: { fontSize: 13.5, fontFamily: Font.sansSemibold, color: Palette.ink },
  scannedRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  scannedIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: Palette.greenTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannedCheck: { color: Palette.green, fontSize: 18 },
  scannedText: { fontSize: 13.5, fontFamily: Font.sansSemibold, color: Palette.ink },
  inputCard: {
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  descInput: { height: 48, fontSize: 15, color: Palette.ink, fontFamily: Font.sans },
  sectionLabel: { fontSize: 13, fontFamily: Font.sansSemibold, color: Palette.ink, marginBottom: 9, marginLeft: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingRight: 13,
    paddingLeft: 7,
    borderRadius: Radius.pill,
    backgroundColor: Palette.card,
    borderWidth: 1.5,
    borderColor: Palette.cardBorder,
  },
  chipActive: { backgroundColor: Palette.greenTint, borderColor: Palette.greenTintBorder },
  chipAvatar: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chipAvatarText: { color: '#fff', fontSize: 11, fontFamily: Font.sansSemibold },
  chipName: { fontSize: 13, fontFamily: Font.sansSemibold, color: Palette.muted2 },
  chipNameActive: { color: Palette.ink },
  segment: { flexDirection: 'row', backgroundColor: Palette.inputBg, borderRadius: 13, padding: 4, marginBottom: 14 },
  segmentBtn: { flex: 1, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentBtnActive: { backgroundColor: Palette.card, borderWidth: StyleSheet.hairlineWidth, borderColor: Palette.cardBorder },
  segmentText: { fontSize: 12.5, fontFamily: Font.sansSemibold, color: Palette.muted3 },
  segmentTextActive: { color: Palette.ink },
  splitCard: {
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 16,
    overflow: 'hidden',
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.divider,
  },
  rowAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rowAvatarText: { color: '#fff', fontSize: 13, fontFamily: Font.sansSemibold },
  rowName: { flex: 1, fontSize: 14, fontFamily: Font.sansMedium, color: Palette.ink },
  rowDisplay: { fontFamily: Font.monoSemibold, fontSize: 14, color: Palette.ink },
  rowInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Palette.inputBg,
    borderRadius: 9,
    paddingHorizontal: 10,
    height: 36,
  },
  rowPrefix: { fontSize: 13, color: Palette.muted },
  rowSuffix: { fontSize: 13, color: Palette.muted },
  rowInput: {
    width: 64,
    textAlign: 'right',
    fontFamily: Font.monoSemibold,
    fontSize: 14,
    color: Palette.ink,
    padding: 0,
  },
  splitHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: Palette.inputBg,
  },
  splitHintLabel: { fontSize: 12.5, fontFamily: Font.sansSemibold, color: Palette.muted3 },
  splitHintValue: { fontFamily: Font.monoSemibold, fontSize: 13, color: Palette.ink },
  error: { color: Palette.red, fontSize: 13, marginTop: 12, marginLeft: 4 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 26,
    borderTopWidth: 1,
    borderTopColor: Palette.cardBorder,
    backgroundColor: Palette.bg,
  },
  saveBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: Palette.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontSize: 15.5, fontFamily: Font.sansSemibold },
});
