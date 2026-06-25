import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { Font, GROUP_EMOJIS, Radius, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

type Group = { id: number };

export default function NewGroupScreen() {
  const { api } = useAuth();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(GROUP_EMOJIS[0]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const create = async () => {
    if (!name.trim()) return setError(t('newGroup.nameRequired'));
    setSubmitting(true);
    setError(null);
    try {
      const group = await api.post<Group>('/api/v1/groups', { name: name.trim(), emoji });
      router.replace(`/groups/${group.id}`);
    } catch {
      setError(t('newGroup.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topbar}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.topTitle}>{t('newGroup.title')}</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.emojiPreviewWrap}>
            <View style={styles.emojiPreview}>
              <Text style={styles.emojiBig}>{emoji}</Text>
            </View>
            <View style={styles.emojiOptions}>
              {GROUP_EMOJIS.slice(0, 8).map((em) => (
                <Pressable
                  key={em}
                  onPress={() => setEmoji(em)}
                  style={[styles.emojiOption, em === emoji && styles.emojiOptionActive]}>
                  <Text style={styles.emojiOptionChar}>{em}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Text style={styles.label}>{t('newGroup.groupName')}</Text>
          <View style={styles.inputCard}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('newGroup.namePlaceholder')}
              placeholderTextColor={Palette.muted}
              style={styles.input}
              autoFocus
            />
          </View>

          <View style={styles.hintCard}>
            <Text style={styles.hintGlyph}>🔗</Text>
            <Text style={styles.hint}>{t('newGroup.membersHint')}</Text>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={create}
            disabled={submitting}
            style={[styles.saveBtn, submitting && styles.disabled]}>
            <Text style={styles.saveText}>
              {submitting ? t('newGroup.creating') : t('newGroup.create')}
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
  emojiPreviewWrap: { alignItems: 'center', paddingVertical: 18 },
  emojiPreview: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    backgroundColor: Palette.greenTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBig: { fontSize: 32 },
  emojiOptions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7, marginTop: 13 },
  emojiOption: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.card,
    borderWidth: 1.5,
    borderColor: Palette.cardBorder,
  },
  emojiOptionActive: { backgroundColor: Palette.greenTint, borderColor: Palette.greenTintBorder },
  emojiOptionChar: { fontSize: 18 },
  label: { fontSize: 13, fontFamily: Font.sansSemibold, color: Palette.ink, marginBottom: 8, marginLeft: 4 },
  inputCard: {
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  input: { height: 50, fontSize: 15, color: Palette.ink, fontFamily: Font.sans },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: Palette.card,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: Radius.md,
    padding: 14,
  },
  hintGlyph: { fontSize: 17 },
  hint: { flex: 1, fontSize: 13, color: Palette.muted2, fontFamily: Font.sans },
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
  disabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontSize: 15.5, fontFamily: Font.sansSemibold },
});
