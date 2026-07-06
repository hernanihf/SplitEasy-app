import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { categoryColor } from '@/constants/categories';
import { Font, type ThemeColors } from '@/constants/design';
import { formatAmount, formatAmountPlain, formatPercent, t } from '@/lib/i18n';
import { useColors } from '@/lib/settings';

export type CategorySlice = { slug: string; amount: number };

type Props = {
  // Already aggregated and sorted (largest first) by the caller.
  slices: CategorySlice[];
  total: number;
  currency: string;
};

const SIZE = 180;
const STROKE = 26;
const R = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function CategoryChart({ slices, total, currency }: Props) {
  const Palette = useColors();
  const styles = useMemo(() => makeStyles(Palette), [Palette]);

  if (total <= 0 || slices.length === 0) {
    return <Text style={styles.empty}>{t('groupDetail.spendingEmpty')}</Text>;
  }

  const plainTotal = formatAmountPlain(total);

  // Precompute each slice's arc length and starting offset around the ring.
  let offset = 0;
  const arcs = slices.map((s) => {
    const length = (s.amount / total) * CIRCUMFERENCE;
    const arc = { slug: s.slug, amount: s.amount, length, offset };
    offset += length;
    return arc;
  });

  return (
    <View style={styles.container}>
      <View style={styles.chartWrap}>
        <Svg width={SIZE} height={SIZE}>
          {/* Track behind the slices — also the whole ring when there's a
              single category (its arc already covers 360°, but this keeps
              sub-pixel gaps from showing the background through). */}
          <Circle cx={CX} cy={CY} r={R} stroke={Palette.divider} strokeWidth={STROKE} fill="none" />
          {arcs.map((a) => (
            <Circle
              key={a.slug}
              cx={CX}
              cy={CY}
              r={R}
              stroke={categoryColor(a.slug)}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${a.length} ${CIRCUMFERENCE - a.length}`}
              // A circle's stroke starts at 3 o'clock; adding a quarter-turn
              // moves the first slice to 12 o'clock without a transform (which
              // react-native-web turns into an invalid transform-origin attr).
              strokeDashoffset={CIRCUMFERENCE / 4 - a.offset}
            />
          ))}
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.centerLabel}>{t('groupDetail.totalSpent')}</Text>
          <Text
            style={[styles.centerValue, plainTotal.length > 9 && styles.centerValueSmall]}
            numberOfLines={1}>
            {plainTotal}
          </Text>
          <Text style={styles.centerCurrency}>{currency}</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {arcs.map((a) => {
          const pct = formatPercent(a.amount / total);
          return (
            <View key={a.slug} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: categoryColor(a.slug) }]} />
              <Text style={styles.legendName} numberOfLines={1}>
                {t(`categories.${a.slug}`)}
              </Text>
              <Text style={styles.legendPct}>{pct}</Text>
              <Text style={styles.legendAmount}>{formatAmount(a.amount, currency)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (Palette: ThemeColors) =>
  StyleSheet.create({
    container: { alignItems: 'center' },
    empty: { paddingTop: 8, color: Palette.muted, fontSize: 14, fontFamily: Font.sans, textAlign: 'center' },
    chartWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    // maxWidth keeps a long total from bleeding past the ring's inner
    // diameter (SIZE - 2*STROKE = 128) — numberOfLines lets it ellipsize
    // rather than overflow if it's still too wide even split onto its own line.
    center: { position: 'absolute', alignItems: 'center', maxWidth: SIZE - STROKE * 2 - 8 },
    centerLabel: { fontSize: 11.5, color: Palette.muted, fontFamily: Font.sansMedium },
    centerValue: { marginTop: 2, fontSize: 20, fontFamily: Font.monoSemibold, color: Palette.ink, letterSpacing: -0.5 },
    // Long totals (many digits, or grouping separators) shrink instead of
    // ellipsizing — a truncated total is useless, a smaller one still reads.
    centerValueSmall: { fontSize: 14.5, letterSpacing: -0.2 },
    centerCurrency: {
      marginTop: 1,
      fontSize: 10.5,
      fontFamily: Font.sansSemibold,
      color: Palette.muted,
      letterSpacing: 0.5,
    },
    legend: { alignSelf: 'stretch', marginTop: 20, gap: 2 },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    dot: { width: 12, height: 12, borderRadius: 6 },
    legendName: { flex: 1, fontSize: 14, fontFamily: Font.sansMedium, color: Palette.ink },
    legendPct: { fontSize: 12.5, color: Palette.muted, fontFamily: Font.sansMedium, minWidth: 56, textAlign: 'right' },
    legendAmount: { fontSize: 13.5, fontFamily: Font.monoSemibold, color: Palette.ink, minWidth: 74, textAlign: 'right' },
  });
