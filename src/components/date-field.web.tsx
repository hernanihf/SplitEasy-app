import { Font, Radius } from '@/constants/design';
import { useColors } from '@/lib/settings';

type Props = {
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder: string;
};

function toInputValue(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// The browser's own <input type="date"> — a real native picker on every
// platform that matters here (desktop Chrome/Safari/Firefox, and the PWA on
// iOS/Android), with zero extra UI to build or maintain.
export function DateField({ value, onChange, placeholder }: Props) {
  const Palette = useColors();
  return (
    <input
      type="date"
      value={toInputValue(value)}
      onChange={(e) => {
        const v = e.target.value;
        if (!v) return;
        const [y, m, d] = v.split('-').map(Number);
        onChange(new Date(y, m - 1, d));
      }}
      placeholder={placeholder}
      style={{
        height: 44,
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: Palette.card,
        border: `1px solid ${Palette.cardBorder}`,
        borderRadius: Radius.md,
        paddingLeft: 14,
        paddingRight: 14,
        fontSize: 14.5,
        fontFamily: Font.sans,
        color: Palette.ink,
      }}
    />
  );
}
