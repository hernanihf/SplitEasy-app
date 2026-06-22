import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';

type Group = {
  id: number;
  name: string;
};

export default function GroupsScreen() {
  const { api, signOut } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<Group[]>('/api/v1/groups');
      setGroups(data ?? []);
    } catch {
      setError(t('groups.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">{t('groups.title')}</ThemedText>
          <Pressable onPress={() => router.push('/groups/new')} style={styles.newButton}>
            <ThemedText type="smallBold" style={styles.newButtonText}>
              {t('groups.new')}
            </ThemedText>
          </Pressable>
        </ThemedView>

        {isLoading && <ThemedText type="default">{t('groups.loading')}</ThemedText>}

        {!isLoading && error && (
          <ThemedView type="backgroundElement" style={styles.emptyState}>
            <ThemedText type="default">{error}</ThemedText>
          </ThemedView>
        )}

        {!isLoading && !error && groups.length === 0 && (
          <ThemedView type="backgroundElement" style={styles.emptyState}>
            <ThemedText type="default">{t('groups.empty')}</ThemedText>
            <ThemedText type="small" style={styles.hint}>
              {t('groups.emptyHint')}
            </ThemedText>
          </ThemedView>
        )}

        {!isLoading && !error && groups.length > 0 && (
          <FlatList
            data={groups}
            keyExtractor={(group) => String(group.id)}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/groups/${item.id}`)}>
                <ThemedView type="backgroundElement" style={styles.groupRow}>
                  <ThemedText type="default">{item.name}</ThemedText>
                </ThemedView>
              </Pressable>
            )}
          />
        )}

        <Pressable onPress={signOut} style={styles.signOut}>
          <ThemedText type="smallBold">{t('groups.signOut')}</ThemedText>
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
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#208AEF',
  },
  newButtonText: {
    color: '#fff',
  },
  emptyState: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  hint: {
    opacity: 0.7,
  },
  list: {
    gap: Spacing.two,
  },
  groupRow: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  signOut: {
    marginTop: 'auto',
    alignSelf: 'center',
    paddingVertical: Spacing.three,
  },
});
