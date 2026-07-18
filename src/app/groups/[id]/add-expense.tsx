import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { CategoryPicker } from '@/components/category-picker';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ScreenMeta } from '@/components/screen-meta';
import { DEFAULT_CATEGORY, guessCategory } from '@/constants/categories';
import { Font, Radius, avatarColor, initial, type ThemeColors } from '@/constants/design';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useColors } from '@/lib/settings';
import { currencySymbol, formatAmount, fromCents, t, toCents } from '@/lib/i18n';
import { useIsOnline } from '@/lib/network';
import { getCachedData } from '@/lib/offline-cache';
import { queueExpense } from '@/lib/offline-queue';
import { assetToFile, scanReceiptFile } from '@/lib/receipt-scan';
import type { Expense, Group } from '@/app/groups/[id]/index';

type SplitMethod = 'equal' | 'fixed' | 'percentage';

const METHODS: { value: SplitMethod; key: string }[] = [
  { value: 'equal', key: 'addExpense.methodEqual' },
  { value: 'fixed', key: 'addExpense.methodFixed' },
  { value: 'percentage', key: 'addExpense.methodPercentage' },
];

export default function AddExpenseScreen() {
  const {
    id,
    description: prefillDesc,
    amount: prefillAmount,
    category: prefillCategory,
    receiptImagePath: prefillReceiptImagePath,
    expense: expenseParam,
  } = useLocalSearchParams<{
    id: string;
    description?: string;
    amount?: string;
    category?: string;
    receiptImagePath?: string;
    expense?: string;
  }>();
  const { api } = useAuth();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const isOnline = useIsOnline();

  // Editing an existing expense: prefilled from the snapshot passed in by
  // expense-detail, not re-fetched. There's no way to know which split
  // method originally produced the current per-person amounts (only the
  // resulting cents are stored), so editing always starts from "fixed"
  // with those amounts pre-filled — faithful to the current state, and the
  // user can still switch method from there.
  const existing = useMemo<Expense | null>(() => {
    if (!expenseParam) return null;
    try {
      return JSON.parse(expenseParam);
    } catch {
      return null;
    }
  }, [expenseParam]);
  const isEditMode = existing != null;

  const [group, setGroup] = useState<Group | null>(null);
  const [desc, setDesc] = useState(existing?.description ?? prefillDesc ?? '');
  const [amount, setAmount] = useState(existing ? fromCents(existing.amount) : prefillAmount ?? '');
  const [category, setCategory] = useState<string>(
    existing?.category ?? prefillCategory ?? DEFAULT_CATEGORY,
  );
  const [paidBy, setPaidBy] = useState<number | null>(existing?.paid_by.id ?? null);
  const [method, setMethod] = useState<SplitMethod>(isEditMode ? 'fixed' : 'equal');
  const [values, setValues] = useState<Record<number, string>>(() => {
    if (!existing) return {};
    const initialValues: Record<number, string> = {};
    for (const s of existing.splits ?? []) {
      initialValues[s.user_id] = fromCents(s.amount);
    }
    return initialValues;
  });
  const [error, setError] = useState<string | null>(null);
  // Separate from `error` (which lives at the bottom of the form, next to
  // the submit button) — a scan failure needs to be seen right where the
  // Scan/Upload buttons are, not scrolled past several sections down.
  const [scanError, setScanError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(!!(prefillDesc || prefillAmount));
  // Only ever set for a brand-new expense created from a scan — the scan UI
  // is hidden in edit mode, and the backend never sends the raw storage path
  // back to the client (only a short-lived signed URL), so there's nothing
  // to "preserve" here: an edit that never re-scans just omits this field,
  // which the backend already treats as "leave the existing image alone".
  const [receiptImagePath, setReceiptImagePath] = useState<string | undefined>(prefillReceiptImagePath);
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  // A receipt scan or an edit already has an authoritative category — this
  // only guards the from-scratch manual entry path, where the category is
  // just a keyword-based suggestion from the description until the user
  // actually picks one themselves.
  const categoryTouched = useRef(isEditMode || scanned);

  // A new expense is "dirty" once the user typed something real; an edit is
  // dirty once anything actually differs from what's being edited — either
  // way, tapping back without asking would silently throw that away.
  const isDirty = isEditMode
    ? desc !== existing?.description ||
      toCents(amount) !== existing?.amount ||
      category !== existing?.category ||
      paidBy !== existing?.paid_by.id
    : desc.trim() !== '' || amount.trim() !== '';

  const handleBack = () => {
    if (isDirty) {
      setConfirmingDiscard(true);
    } else {
      router.back();
    }
  };

  // "Scan" opens the camera directly and fills the form in place — no detour
  // through the scan-receipt screen. That screen is only for the "Upload" flow.
  const scanFromCamera = async () => {
    if (!group) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return setScanError(t('scanReceipt.cameraPermission'));
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled) return;

    const file = assetToFile(result.assets[0]);
    setScanning(true);
    setScanError(null);
    try {
      const prefill = await scanReceiptFile(api, file.uri, file.name, file.mimeType, group.currency);
      if (prefill.items.length > 0) {
        // Detected line items → go assign them per member.
        router.replace({
          pathname: '/groups/[id]/itemize',
          params: {
            id: id as string,
            description: prefill.description,
            total: String(prefill.totalCents),
            category: prefill.category,
            items: JSON.stringify(prefill.items),
            ...(prefill.receiptImagePath ? { receiptImagePath: prefill.receiptImagePath } : {}),
          },
        });
        return;
      }
      setDesc(prefill.description);
      setAmount(prefill.amount);
      setCategory(prefill.category);
      categoryTouched.current = true;
      setReceiptImagePath(prefill.receiptImagePath);
      setScanned(true);
    } catch {
      setScanError(t('scanReceipt.readError'));
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<Group>(`/api/v1/groups/${id}`),
      api.get<{ id: number }>('/api/v1/users/me'),
    ])
      .then(([g, me]) => {
        setGroup(g);
        // Editing keeps the expense's actual payer; only default it for a new one.
        if (!isEditMode) {
          setPaidBy(g.members.some((m) => m.id === me.id) ? me.id : (g.members[0]?.id ?? null));
        }
      })
      .catch(async () => {
        // Offline — reuse whatever group-detail last cached for this group,
        // so a new expense can still be filled out and queued.
        const [cachedGroup, cachedMe] = await Promise.all([
          getCachedData<{ group: Group }>(`group-${id}`),
          getCachedData<{ id: number }>('me'),
        ]);
        if (!cachedGroup) return;
        const g = cachedGroup.data.group;
        setGroup(g);
        if (!isEditMode) {
          const meId = cachedMe?.data.id;
          setPaidBy(g.members.some((m) => m.id === meId) ? (meId ?? null) : (g.members[0]?.id ?? null));
        }
      });
  }, [id, api, isEditMode]);

  const amountNumber = useMemo(() => parseFloat(amount.replace(',', '.')) || 0, [amount]);
  const amountCents = useMemo(() => toCents(amount), [amount]);

  // "Amounts" and "Percent" share the same `values` state but disagree on
  // its unit (cents vs. percentage points) — switching tabs without
  // converting leaves whatever was typed (or, in edit mode, the existing
  // split's dollar amounts) displayed under the wrong unit, e.g. "$17.33"
  // reappearing as "17.33%" instead of the real share of the total.
  const changeMethod = (next: SplitMethod) => {
    if (group && amountCents > 0) {
      if (method === 'fixed' && next === 'percentage') {
        setValues((prev) => {
          const converted: Record<number, string> = {};
          for (const m of group.members) {
            const cents = toCents(prev[m.id] ?? '');
            converted[m.id] = cents > 0 ? String(Math.round((cents / amountCents) * 10000) / 100) : '';
          }
          return converted;
        });
      } else if (method === 'percentage' && next === 'fixed') {
        setValues((prev) => {
          const converted: Record<number, string> = {};
          for (const m of group.members) {
            const pct = parseFloat((prev[m.id] ?? '').replace(',', '.')) || 0;
            converted[m.id] = pct > 0 ? fromCents(Math.round((pct / 100) * amountCents)) : '';
          }
          return converted;
        });
      }
    }
    setMethod(next);
  };

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
        return setError(t('addExpense.amountsMustTotal', { amount: formatAmount(amountCents, group.currency) }));
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
      if (isEditMode && existing) {
        await api.put(`/api/v1/expenses/${existing.id}`, {
          paid_by_id: paidBy,
          description: desc.trim(),
          category,
          amount: amountCents,
          split_method: method,
          splits,
          ...(receiptImagePath ? { receipt_image_path: receiptImagePath } : {}),
        });
      } else {
        const payload = {
          group_id: group.id,
          paid_by_id: paidBy,
          description: desc.trim(),
          category,
          amount: amountCents,
          split_method: method,
          splits,
          ...(receiptImagePath ? { receipt_image_path: receiptImagePath } : {}),
        };
        // Offline (or the server is simply unreachable) — a new expense is
        // safe to queue and retry later; edits stay online-only since
        // there's no conflict-resolution story yet for a group that may
        // have changed server-side in the meantime.
        if (!isOnline) {
          await queueExpense(group.id, payload);
        } else {
          try {
            await api.post('/api/v1/expenses', payload);
          } catch (e) {
            if (e instanceof ApiError) throw e;
            await queueExpense(group.id, payload);
          }
        }
      }
      // Go straight back to the group list rather than to expense-detail
      // (which was pushed with a snapshot, not a live fetch, and would show
      // stale data after an edit) — also true for a queued expense, which
      // now shows up there tagged "Pending".
      router.replace(`/groups/${id}`);
    } catch {
      setError(t(isEditMode ? 'addExpense.updateError' : 'addExpense.addError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!group) {
    return (
      <View style={styles.root}>
        <ScreenMeta title={t(isEditMode ? 'addExpense.editTitle' : 'addExpense.title')} />
        <SafeAreaView edges={['top']} style={styles.center}>
          <Text style={styles.muted}>{t('addExpense.loading')}</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenMeta title={t(isEditMode ? 'addExpense.editTitle' : 'addExpense.title')} />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topbar}>
          <BackButton onPress={handleBack} />
          <Text style={styles.topTitle}>{t(isEditMode ? 'addExpense.editTitle' : 'addExpense.title')}</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* amount */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>{t('addExpense.amountIn', { group: group.name })}</Text>
            <View style={styles.amountRow}>
              <Text style={styles.dollar}>{currencySymbol(group.currency)}</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Palette.muted}
                underlineColorAndroid="transparent"
                selectionColor={Palette.green}
                style={styles.amountInput}
              />
              {/* Mirrors the currency symbol's width on the other side so the
                  row centers as [symbol][number][symbol] — otherwise the
                  digits themselves sit right of center, most visibly with a
                  wide code like "ARS" instead of a narrow "$". */}
              <Text style={[styles.dollar, styles.dollarGhost]} aria-hidden>
                {currencySymbol(group.currency)}
              </Text>
            </View>
          </View>

          {/* receipt scan */}
          {!isEditMode && (
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
            {scanError && <Text style={styles.scanError}>{scanError}</Text>}
          </View>
          )}

          {/* description */}
          <View style={styles.inputCard}>
            <TextInput
              value={desc}
              onChangeText={(text) => {
                setDesc(text);
                if (!categoryTouched.current) {
                  const guess = guessCategory(text);
                  if (guess) setCategory(guess);
                }
              }}
              placeholder={t('addExpense.descriptionPlaceholder')}
              placeholderTextColor={Palette.muted}
              style={styles.descInput}
            />
          </View>

          {/* category */}
          <Text style={styles.sectionLabel}>{t('categories.label')}</Text>
          <View style={styles.categoryPicker}>
            <CategoryPicker
              value={category}
              onChange={(slug) => {
                categoryTouched.current = true;
                setCategory(slug);
              }}
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
                  onPress={() => changeMethod(mth.value)}
                  style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
                  <Text
                    numberOfLines={1}
                    style={[styles.segmentText, active && styles.segmentTextActive]}>
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
                  <Text style={styles.rowName} numberOfLines={1}>
                    {m.name}
                  </Text>
                  {method === 'equal' ? (
                    <Text style={styles.rowDisplay}>{formatAmount(equalShare, group.currency)}</Text>
                  ) : (
                    <View style={styles.rowInputBox}>
                      {method === 'fixed' && <Text style={styles.rowPrefix}>{currencySymbol(group.currency)}</Text>}
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
                  {method === 'percentage'
                    ? `${splitTotal}%`
                    : formatAmount(Math.round(splitTotal * 100), group.currency)}
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
              {submitting ? t('addExpense.saving') : t(isEditMode ? 'addExpense.save' : 'addExpense.add')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
      <ConfirmDialog
        visible={confirmingDiscard}
        title={t('addExpense.discardTitle')}
        message={t('addExpense.discardMessage')}
        confirmLabel={t('addExpense.discard')}
        onCancel={() => setConfirmingDiscard(false)}
        onConfirm={() => router.back()}
      />
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
  amountCard: {
    alignItems: 'center',
    paddingVertical: 22,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: Palette.inputBg,
    borderRadius: Radius.lg,
  },
  amountLabel: { fontSize: 12.5, color: Palette.muted, fontFamily: Font.sansMedium, marginBottom: 8 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dollar: { fontFamily: Font.monoSemibold, fontSize: 30, color: Palette.ink },
  dollarGhost: { opacity: 0 },
  // maxWidth caps a runaway width react-native-web otherwise computes for
  // this <input> (it was resolving to the viewport's width, not the card's —
  // pushing the currency symbol before it off-screen and the digits far from
  // true center) while minWidth keeps it from feeling cramped when empty.
  amountInput: {
    minWidth: 120,
    maxWidth: 220,
    fontFamily: Font.monoSemibold,
    fontSize: 44,
    letterSpacing: -1.5,
    color: Palette.ink,
    textAlign: 'center',
    padding: 0,
    // Web/PWA: drop the browser's focus outline on the <input>.
    outlineStyle: 'none',
  } as object,
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
  scanError: { color: Palette.red, fontSize: 12.5, marginTop: 10 },
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
  categoryPicker: { marginBottom: 18 },
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
  rowName: { flex: 1, minWidth: 0, fontSize: 14, fontFamily: Font.sansMedium, color: Palette.ink },
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
  // Left-aligned so digits sit right after the currency symbol/prefix
  // instead of leaving a gap when the value is short — same fix as
  // itemize.tsx's itemAmountInput.
  rowInput: {
    width: 52,
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
