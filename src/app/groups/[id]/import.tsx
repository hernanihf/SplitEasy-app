import * as DocumentPicker from 'expo-document-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { BackButton } from '@/components/back-button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ScreenMeta } from '@/components/screen-meta';
import { guessCategory } from '@/constants/categories';
import { Font, Radius, avatarColor, type ThemeColors } from '@/constants/design';
import { useAuth } from '@/lib/auth';
import { t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';
import type { Group } from '@/app/groups/[id]/index';

type ImportRow = {
  date: string;
  description: string;
  category: string;
  amount_cents: number;
  member_nets: Record<string, number>;
};

type ImportPreview = {
  member_columns: string[];
  rows: ImportRow[];
  skipped_rows: number;
  currency_mismatch?: string;
};

type ImportResult = { imported: number; failed: number };

export default function ImportCsvScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { api } = useAuth();
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  const [group, setGroup] = useState<Group | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<Group>(`/api/v1/groups/${id}`)
      .then(setGroup)
      .catch(() => {});
  }, [id, api]);

  const pickFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', 'text/plain'],
      copyToCacheDirectory: true,
    });
    if (picked.canceled) return;
    const asset = picked.assets[0];

    setError(null);
    setPreview(null);
    setResult(null);
    setMapping({});
    setUploading(true);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const blob = await (await fetch(asset.uri)).blob();
        formData.append('file', blob, asset.name);
      } else {
        formData.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'text/csv' } as unknown as Blob);
      }
      const parsed = await api.postFormData<ImportPreview>(`/api/v1/groups/${id}/import/preview`, formData);
      if (parsed.currency_mismatch) {
        setError(
          t('importCsv.currencyMismatch', {
            fileCurrency: parsed.currency_mismatch,
            groupCurrency: group?.currency ?? '',
          }),
        );
        return;
      }
      // Best-effort local re-guess for rows Splitwise left uncategorized (its
      // "General" bucket maps to "other") — reuses the same keyword heuristic
      // that suggests a category while typing a manual expense.
      setPreview({
        ...parsed,
        rows: parsed.rows.map((r) =>
          r.category === 'other' ? { ...r, category: guessCategory(r.description) ?? 'other' } : r,
        ),
      });
    } catch {
      setError(t('importCsv.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const assignMember = (column: string, userId: number) => {
    setMapping((prev) => {
      const next: Record<string, number> = {};
      for (const [col, uid] of Object.entries(prev)) {
        if (uid !== userId) next[col] = uid;
      }
      next[column] = userId;
      return next;
    });
  };

  const allMapped = preview != null && preview.member_columns.every((c) => mapping[c] != null);

  const doImport = async () => {
    if (!preview || !allMapped || importing) return;
    setImporting(true);
    setError(null);
    try {
      const res = await api.post<ImportResult>(`/api/v1/groups/${id}/import`, {
        rows: preview.rows,
        member_mapping: mapping,
      });
      setResult(res);
    } catch {
      setError(t('importCsv.importError'));
    } finally {
      setImporting(false);
      setConfirming(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenMeta title={t('importCsv.title')} />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topbar}>
          <BackButton onPress={() => router.back()} />
          <Text style={styles.topTitle}>{t('importCsv.title')}</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {result ? (
            <View style={styles.resultCard}>
              <View style={styles.resultCheck}>
                <Text style={styles.resultCheckText}>✓</Text>
              </View>
              <Text style={styles.resultText}>
                {t('importCsv.resultImported', { count: result.imported })}
                {result.failed > 0 ? t('importCsv.resultFailed', { count: result.failed }) : ''}
              </Text>
              <Pressable onPress={() => router.replace(`/groups/${id}`)} style={styles.primaryBtn}>
                <Text style={styles.primaryBtnText}>{t('importCsv.goToGroup')}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.description}>{t('importCsv.description')}</Text>

              <Pressable onPress={pickFile} disabled={uploading} style={[styles.primaryBtn, uploading && styles.disabled]}>
                <Text style={styles.primaryBtnText}>
                  {preview ? t('importCsv.pickAnotherFile') : t('importCsv.pickFile')}
                </Text>
              </Pressable>

              {uploading && (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={Palette.green} />
                  <Text style={styles.loadingText}>{t('importCsv.uploading')}</Text>
                </View>
              )}

              {error && <Text style={styles.error}>{error}</Text>}

              {preview && !uploading && (
                <>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLine}>{t('importCsv.rowsFound', { count: preview.rows.length })}</Text>
                    {preview.skipped_rows > 0 && (
                      <Text style={styles.summaryLineMuted}>
                        {t('importCsv.rowsSkipped', { count: preview.skipped_rows })}
                      </Text>
                    )}
                  </View>

                  <Text style={styles.sectionLabel}>{t('importCsv.mapTitle')}</Text>
                  <Text style={styles.mapHint}>{t('importCsv.mapHint')}</Text>

                  {preview.member_columns.map((column) => (
                    <View key={column} style={styles.mapRow}>
                      <Text style={styles.mapColumnName} numberOfLines={1}>
                        {column}
                      </Text>
                      <View style={styles.memberChips}>
                        {group?.members.map((m) => {
                          const active = mapping[column] === m.id;
                          return (
                            <Pressable
                              key={m.id}
                              onPress={() => assignMember(column, m.id)}
                              style={[styles.memberChip, active && styles.memberChipActive]}>
                              <Avatar
                                uri={m.avatar_url}
                                name={m.name}
                                size={24}
                                color={avatarColor(m.id)}
                                fontSize={11}
                              />
                              <Text style={[styles.memberChipText, active && styles.memberChipTextActive]} numberOfLines={1}>
                                {m.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                      {mapping[column] == null && <Text style={styles.mapUnassigned}>{t('importCsv.mapChoose')}</Text>}
                    </View>
                  ))}

                  <Pressable
                    onPress={() => setConfirming(true)}
                    disabled={!allMapped || importing}
                    style={[styles.primaryBtn, (!allMapped || importing) && styles.disabled]}>
                    <Text style={styles.primaryBtnText}>
                      {importing ? t('importCsv.importing') : t('importCsv.confirm')}
                    </Text>
                  </Pressable>
                </>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <ConfirmDialog
        visible={confirming}
        title={t('importCsv.confirmTitle')}
        message={t('importCsv.confirmMessage')}
        confirmLabel={t('importCsv.confirm')}
        destructive={false}
        loading={importing}
        onCancel={() => setConfirming(false)}
        onConfirm={doImport}
      />
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
    scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
    description: { fontSize: 14, lineHeight: 21, color: Palette.muted2, fontFamily: Font.sans, marginBottom: 4 },
    primaryBtn: {
      height: 54,
      borderRadius: 16,
      backgroundColor: Palette.green,
      alignItems: 'center',
      justifyContent: 'center',
    },
    disabled: { opacity: 0.6 },
    primaryBtnText: { color: '#fff', fontSize: 15, fontFamily: Font.sansSemibold },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
    loadingText: { fontSize: 13.5, color: Palette.muted, fontFamily: Font.sans },
    error: { color: Palette.red, fontSize: 13, fontFamily: Font.sans },
    summaryCard: {
      backgroundColor: Palette.card,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      borderRadius: Radius.md,
      padding: 14,
      gap: 4,
    },
    summaryLine: { fontSize: 14, fontFamily: Font.sansSemibold, color: Palette.ink },
    summaryLineMuted: { fontSize: 12.5, color: Palette.muted, fontFamily: Font.sans },
    sectionLabel: { fontSize: 13, fontFamily: Font.sansSemibold, color: Palette.ink, marginTop: 6 },
    mapHint: { fontSize: 12.5, color: Palette.muted, fontFamily: Font.sans, marginTop: -8 },
    mapRow: {
      backgroundColor: Palette.card,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      borderRadius: Radius.md,
      padding: 12,
      gap: 8,
    },
    mapColumnName: { fontSize: 14, fontFamily: Font.sansSemibold, color: Palette.ink },
    memberChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    memberChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: Radius.pill,
      borderWidth: 1.5,
      borderColor: Palette.cardBorder,
      maxWidth: 160,
    },
    memberChipActive: { backgroundColor: Palette.greenTint, borderColor: Palette.greenTintBorder },
    memberChipText: { fontSize: 12.5, fontFamily: Font.sansMedium, color: Palette.ink },
    memberChipTextActive: { color: Palette.greenDark },
    mapUnassigned: { fontSize: 11.5, color: Palette.red, fontFamily: Font.sans },
    resultCard: {
      backgroundColor: Palette.greenTint,
      borderWidth: 1,
      borderColor: Palette.greenTintBorder,
      borderRadius: Radius.lg,
      padding: 24,
      alignItems: 'center',
      gap: 16,
      marginTop: 24,
    },
    resultCheck: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: Palette.green,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultCheckText: { color: '#fff', fontSize: 22 },
    resultText: { fontSize: 14.5, fontFamily: Font.sansMedium, color: Palette.greenDark, textAlign: 'center' },
  });
