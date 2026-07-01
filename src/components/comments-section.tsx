import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Font, Radius, avatarColor, type ThemeColors } from '@/constants/design';
import { i18n, t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

export type Comment = {
  id: number;
  body: string;
  created_at: string;
  user: { id: number; name: string; avatar_url?: string | null };
};

type Props = {
  comments: Comment[];
  loading: boolean;
  loadError: boolean;
  myId: number | null;
  onAdd: (body: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
};

function formatCommentDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const locale = i18n.locale === 'es' ? 'es-AR' : 'en-US';
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function CommentsSection({ comments, loading, loadError, myId, onAdd, onDelete }: Props) {
  const Palette = useColors();
  const styles = makeStyles(Palette);

  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(false);
  const [deletingID, setDeletingID] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  const submit = async () => {
    const body = draft.trim();
    if (!body || posting) return;
    setPosting(true);
    setPostError(false);
    try {
      await onAdd(body);
      setDraft('');
    } catch {
      setPostError(true);
    } finally {
      setPosting(false);
    }
  };

  const confirmDelete = async () => {
    if (deletingID == null || deleting) return;
    setDeleting(true);
    setDeleteError(false);
    try {
      await onDelete(deletingID);
      setDeletingID(null);
    } catch {
      setDeletingID(null);
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View>
      <Text style={styles.sectionLabel}>{t('comments.title')}</Text>

      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator color={Palette.muted} size="small" />
        </View>
      )}

      {!loading && loadError && <Text style={styles.errorText}>{t('comments.loadError')}</Text>}

      {!loading && !loadError && comments.length === 0 && (
        <Text style={styles.empty}>{t('comments.empty')}</Text>
      )}

      {!loading &&
        comments.map((c) => (
          <View key={c.id} style={styles.row}>
            <Avatar
              uri={c.user.avatar_url}
              name={c.user.name}
              size={30}
              color={avatarColor(c.user.id)}
              fontSize={13}
            />
            <View style={styles.bubble}>
              <View style={styles.bubbleHead}>
                <Text style={styles.author} numberOfLines={1}>
                  {c.user.name}
                </Text>
                <Text style={styles.date}>{formatCommentDate(c.created_at)}</Text>
              </View>
              <Text style={styles.body}>{c.body}</Text>
            </View>
            {myId === c.user.id && (
              <Pressable onPress={() => setDeletingID(c.id)} hitSlop={8} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </Pressable>
            )}
          </View>
        ))}

      {deleteError && <Text style={styles.errorText}>{t('comments.deleteError')}</Text>}

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t('comments.placeholder')}
          placeholderTextColor={Palette.muted}
          style={styles.input}
          multiline
        />
        <Pressable
          onPress={submit}
          disabled={!draft.trim() || posting}
          style={[styles.sendBtn, (!draft.trim() || posting) && styles.sendBtnDisabled]}>
          {posting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendBtnText}>{t('comments.send')}</Text>
          )}
        </Pressable>
      </View>
      {postError && <Text style={styles.errorText}>{t('comments.postError')}</Text>}

      <ConfirmDialog
        visible={deletingID != null}
        title={t('comments.deleteTitle')}
        message={t('comments.deleteMessage')}
        onCancel={() => setDeletingID(null)}
        onConfirm={confirmDelete}
      />
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    sectionLabel: { fontSize: 13, fontFamily: Font.sansSemibold, color: Palette.ink, marginTop: 16, marginBottom: 8 },
    loading: { paddingVertical: 12, alignItems: 'center' },
    empty: { fontSize: 13, color: Palette.muted, marginBottom: 8 },
    errorText: { fontSize: 12.5, color: Palette.red, marginTop: 6, marginBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginBottom: 12 },
    bubble: {
      flex: 1,
      minWidth: 0,
      backgroundColor: Palette.card,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      borderRadius: Radius.md,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    bubbleHead: { flexDirection: 'row', alignItems: 'baseline', gap: 7 },
    author: { flex: 1, fontSize: 13, fontFamily: Font.sansSemibold, color: Palette.ink },
    date: { fontSize: 11, color: Palette.faint },
    body: { marginTop: 3, fontSize: 13.5, color: Palette.ink, fontFamily: Font.sans, lineHeight: 18 },
    deleteBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    deleteBtnText: { fontSize: 12, color: Palette.muted, fontFamily: Font.sansSemibold },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 9,
      marginTop: 4,
    },
    input: {
      flex: 1,
      minHeight: 42,
      maxHeight: 100,
      backgroundColor: Palette.card,
      borderWidth: 1,
      borderColor: Palette.cardBorder,
      borderRadius: Radius.md,
      paddingHorizontal: 13,
      paddingVertical: 10,
      fontSize: 14,
      color: Palette.ink,
      fontFamily: Font.sans,
    },
    sendBtn: {
      height: 42,
      paddingHorizontal: 16,
      borderRadius: Radius.md,
      backgroundColor: Palette.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.4 },
    sendBtnText: { color: Palette.bg, fontSize: 13.5, fontFamily: Font.sansSemibold },
  });
