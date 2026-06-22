import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

type Group = {
  id: number;
  name: string;
};

export default function NewGroupScreen() {
  const { api } = useAuth();
  const theme = useTheme();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Ponele un nombre al grupo.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const group = await api.post<Group>('/api/v1/groups', { name: name.trim() });
      router.replace(`/groups/${group.id}`);
    } catch {
      setError('No se pudo crear el grupo. Probá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Nuevo grupo</ThemedText>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ej: Viaje a Bariloche"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          autoFocus
        />

        {error && <ThemedText type="small">{error}</ThemedText>}

        <Pressable
          onPress={handleCreate}
          disabled={isSubmitting}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <ThemedText type="smallBold" style={styles.buttonText}>
            {isSubmitting ? 'Creando…' : 'Crear grupo'}
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
