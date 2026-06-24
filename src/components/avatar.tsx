import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Font, initial } from '@/constants/design';

type AvatarProps = {
  name?: string | null;
  uri?: string | null;
  size: number;
  /** Background color used for the initial fallback. */
  color: string;
  fontSize?: number;
};

/** Shows the user's photo when available, otherwise a coloured initial. */
export function Avatar({ name, uri, size, color, fontSize }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const radius = size / 2;

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        onError={() => setFailed(true)}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: color }}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: radius, backgroundColor: color },
      ]}>
      <Text style={[styles.initial, { fontSize: fontSize ?? size * 0.4 }]}>{initial(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontFamily: Font.sansSemibold },
});
