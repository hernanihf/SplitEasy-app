import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { formatAmount, t } from '@/lib/i18n';

export type Group = {
  id: number;
  name: string;
  members: { id: number; name: string }[];
};

type Expense = {
  id: number;
  description: string;
  amount: number;
  paid_by: { id: number; name: string };
};

type Debt = {
  from_user_id: number;
  to_user_id: number;
  amount: number;
};

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useAuth();

  const [group, setGroup] = useState<Group | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memberName = useCallback(
    (userID: number) =>
      group?.members.find((m) => m.id === userID)?.name ?? t('groupDetail.userN', { id: userID }),
    [group],
  );

  const loadGroup = useCallback(() => {
    if (!id) return;
    setIsLoading(true);
    setError(null);

    Promise.all([
      api.get<Group>(`/api/v1/groups/${id}`),
      api.get<Expense[]>(`/api/v1/groups/${id}/expenses`),
      api.get<Debt[]>(`/api/v1/groups/${id}/balances`),
    ])
      .then(([groupData, expensesData, debtsData]) => {
        setGroup(groupData);
        setExpenses(expensesData ?? []);
        setDebts(debtsData ?? []);
      })
      .catch(() => setError(t('groupDetail.loadError')))
      .finally(() => setIsLoading(false));
  }, [id, api]);

  useFocusEffect(loadGroup);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="default">{t('groupDetail.loading')}</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (error || !group) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="default">{error ?? t('groupDetail.notFound')}</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">{group.name}</ThemedText>
          <ThemedView style={styles.headerActions}>
            <Pressable
              onPress={() => router.push(`/groups/${id}/scan-receipt`)}
              style={[styles.newButton, styles.scanButton]}>
              <ThemedText type="smallBold" style={styles.newButtonText}>
                {t('groupDetail.receipt')}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/groups/${id}/add-expense`)}
              style={styles.newButton}>
              <ThemedText type="smallBold" style={styles.newButtonText}>
                {t('groupDetail.expense')}
              </ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>

        <ThemedText type="subtitle">{t('groupDetail.balances')}</ThemedText>
        {debts.length === 0 ? (
          <ThemedText type="default">{t('groupDetail.allSettled')}</ThemedText>
        ) : (
          debts.map((debt, index) => (
            <Pressable
              key={index}
              onPress={() =>
                router.push({
                  pathname: '/groups/[id]/settle',
                  params: {
                    id: id as string,
                    from: String(debt.from_user_id),
                    to: String(debt.to_user_id),
                    amount: String(debt.amount),
                    fromName: memberName(debt.from_user_id),
                    toName: memberName(debt.to_user_id),
                  },
                })
              }>
              <ThemedView type="backgroundElement" style={styles.debtRow}>
                <ThemedText type="default">
                  {t('groupDetail.owes', {
                    from: memberName(debt.from_user_id),
                    to: memberName(debt.to_user_id),
                    amount: formatAmount(debt.amount),
                  })}
                </ThemedText>
                <ThemedText type="smallBold" style={styles.settleHint}>
                  {t('groupDetail.settle')}
                </ThemedText>
              </ThemedView>
            </Pressable>
          ))
        )}

        <ThemedText type="subtitle">{t('groupDetail.expenses')}</ThemedText>
        <FlatList
          data={expenses}
          keyExtractor={(expense) => String(expense.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<ThemedText type="default">{t('groupDetail.noExpenses')}</ThemedText>}
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.row}>
              <ThemedText type="default">{item.description}</ThemedText>
              <ThemedText type="small">
                {t('groupDetail.paidBy', {
                  name: item.paid_by.name,
                  amount: formatAmount(item.amount),
                })}
              </ThemedText>
            </ThemedView>
          )}
        />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  newButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#208AEF',
  },
  scanButton: {
    backgroundColor: '#5B8DEF',
  },
  newButtonText: {
    color: '#fff',
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  debtRow: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settleHint: {
    color: '#1FA971',
  },
});
