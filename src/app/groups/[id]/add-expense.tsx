import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { formatAmount, t } from '@/lib/i18n';
import type { Group } from '@/app/groups/[id]/index';

type SplitMethod = 'equal' | 'percentage' | 'fixed' | 'shares';

const SPLIT_METHODS: { value: SplitMethod; labelKey: string }[] = [
  { value: 'equal', labelKey: 'addExpense.methodEqual' },
  { value: 'percentage', labelKey: 'addExpense.methodPercentage' },
  { value: 'fixed', labelKey: 'addExpense.methodFixed' },
  { value: 'shares', labelKey: 'addExpense.methodShares' },
];

export default function AddExpenseScreen() {
  const { id, description: prefillDescription, amount: prefillAmount } = useLocalSearchParams<{
    id: string;
    description?: string;
    amount?: string;
  }>();
  const { api } = useAuth();
  const theme = useTheme();

  const [group, setGroup] = useState<Group | null>(null);
  const [description, setDescription] = useState(prefillDescription ?? '');
  const [amount, setAmount] = useState(prefillAmount ?? '');
  const [paidByID, setPaidByID] = useState<number | null>(null);
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('equal');
  const [included, setIncluded] = useState<Record<number, boolean>>({});
  const [values, setValues] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<Group>(`/api/v1/groups/${id}`).then((data) => {
      setGroup(data);
      setPaidByID(data.members[0]?.id ?? null);
      setIncluded(Object.fromEntries(data.members.map((m) => [m.id, true])));
    });
  }, [id, api]);

  const amountNumber = useMemo(() => parseFloat(amount.replace(',', '.')), [amount]);

  const handleSubmit = async () => {
    if (!group || !paidByID) return;
    if (!description.trim()) {
      setError(t('addExpense.descriptionRequired'));
      return;
    }
    if (!amountNumber || amountNumber <= 0) {
      setError(t('addExpense.amountPositive'));
      return;
    }

    const memberIDs = group.members.map((m) => m.id);
    let splits: { user_id: number; value: number }[];

    if (splitMethod === 'equal') {
      splits = memberIDs.filter((memberID) => included[memberID]).map((memberID) => ({ user_id: memberID, value: 0 }));
      if (splits.length === 0) {
        setError(t('addExpense.pickMember'));
        return;
      }
    } else {
      splits = memberIDs
        .filter((memberID) => included[memberID])
        .map((memberID) => ({ user_id: memberID, value: parseFloat((values[memberID] ?? '').replace(',', '.')) || 0 }));

      if (splits.length === 0) {
        setError(t('addExpense.pickMember'));
        return;
      }
      if (splitMethod === 'percentage') {
        const total = splits.reduce((sum, s) => sum + s.value, 0);
        if (Math.abs(total - 100) > 0.01) {
          setError(t('addExpense.percentagesMustTotal', { total }));
          return;
        }
      }
      if (splitMethod === 'fixed') {
        const total = splits.reduce((sum, s) => sum + s.value, 0);
        if (Math.abs(total - amountNumber) > 0.01) {
          setError(
            t('addExpense.amountsMustTotal', {
              total: formatAmount(total),
              amount: formatAmount(amountNumber),
            }),
          );
          return;
        }
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.post('/api/v1/expenses', {
        group_id: group.id,
        paid_by_id: paidByID,
        description: description.trim(),
        amount: amountNumber,
        split_method: splitMethod,
        splits,
      });
      router.back();
    } catch {
      setError(t('addExpense.addError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!group) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="default">{t('addExpense.loading')}</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">{t('addExpense.title')}</ThemedText>

        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t('addExpense.descriptionPlaceholder')}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
        />

        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder={t('addExpense.amountPlaceholder')}
          placeholderTextColor={theme.textSecondary}
          keyboardType="decimal-pad"
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
        />

        <ThemedText type="smallBold">{t('addExpense.whoPaid')}</ThemedText>
        <ThemedView style={styles.chipRow}>
          {group.members.map((member) => (
            <Pressable key={member.id} onPress={() => setPaidByID(member.id)}>
              <ThemedView
                type={paidByID === member.id ? 'backgroundSelected' : 'backgroundElement'}
                style={styles.chip}>
                <ThemedText type="small">{member.name}</ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </ThemedView>

        <ThemedText type="smallBold">{t('addExpense.howSplit')}</ThemedText>
        <ThemedView style={styles.chipRow}>
          {SPLIT_METHODS.map((method) => (
            <Pressable key={method.value} onPress={() => setSplitMethod(method.value)}>
              <ThemedView
                type={splitMethod === method.value ? 'backgroundSelected' : 'backgroundElement'}
                style={styles.chip}>
                <ThemedText type="small">{t(method.labelKey)}</ThemedText>
              </ThemedView>
            </Pressable>
          ))}
        </ThemedView>

        {group.members.map((member) => (
          <ThemedView key={member.id} style={styles.memberRow}>
            <Pressable
              onPress={() => setIncluded((prev) => ({ ...prev, [member.id]: !prev[member.id] }))}
              style={styles.memberToggle}>
              <ThemedText type="default">
                {included[member.id] ? '☑' : '☐'} {member.name}
              </ThemedText>
            </Pressable>

            {splitMethod !== 'equal' && included[member.id] && (
              <TextInput
                value={values[member.id] ?? ''}
                onChangeText={(text) => setValues((prev) => ({ ...prev, [member.id]: text }))}
                placeholder={
                  splitMethod === 'percentage'
                    ? '%'
                    : splitMethod === 'fixed'
                      ? '$'
                      : t('addExpense.unitsPlaceholder')
                }
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                style={[styles.valueInput, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />
            )}
          </ThemedView>
        ))}

        {error && <ThemedText type="small">{error}</ThemedText>}

        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <ThemedText type="smallBold" style={styles.buttonText}>
            {isSubmitting ? t('addExpense.saving') : t('addExpense.add')}
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.four,
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberToggle: {
    flex: 1,
  },
  valueInput: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    width: 90,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#208AEF',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
  },
});
