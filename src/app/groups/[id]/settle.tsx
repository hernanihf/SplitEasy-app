import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';

export default function SettleScreen() {
  const { id, from, to, amount, fromName, toName } = useLocalSearchParams<{
    id: string;
    from: string;
    to: string;
    amount: string;
    fromName?: string;
    toName?: string;
  }>();
  const { api } = useAuth();
  const theme = useTheme();

  const maxAmount = useMemo(() => parseFloat(amount ?? '0'), [amount]);
  const [value, setValue] = useState(amount ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSettle = async () => {
    const paid = parseFloat(value.replace(',', '.'));
    if (!paid || paid <= 0) {
      setError('El monto tiene que ser mayor a 0.');
      return;
    }
    if (paid > maxAmount + 0.01) {
      setError(`No podés saldar más de $${maxAmount.toFixed(2)}.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.post(`/api/v1/groups/${id}/settlements`, {
        from_user_id: Number(from),
        to_user_id: Number(to),
        amount: paid,
      });
      router.back();
    } catch {
      setError('No se pudo registrar el pago. Probá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Saldar deuda</ThemedText>

        <ThemedView type="backgroundElement" style={styles.summary}>
          <ThemedText type="default">
            {fromName ?? `Usuario #${from}`} le paga a {toName ?? `Usuario #${to}`}
          </ThemedText>
          <ThemedText type="small" style={styles.hint}>
            Deuda actual: ${maxAmount.toFixed(2)}
          </ThemedText>
        </ThemedView>

        <ThemedText type="smallBold">¿Cuánto se paga?</ThemedText>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Monto"
          placeholderTextColor={theme.textSecondary}
          keyboardType="decimal-pad"
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
          autoFocus
        />

        {error && <ThemedText type="small">{error}</ThemedText>}

        <Pressable
          onPress={handleSettle}
          disabled={isSubmitting}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <ThemedText type="smallBold" style={styles.buttonText}>
            {isSubmitting ? 'Registrando…' : 'Registrar pago'}
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
  summary: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  hint: {
    opacity: 0.7,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1FA971',
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
