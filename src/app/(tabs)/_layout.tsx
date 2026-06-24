import { Tabs } from 'expo-router';

import { BottomNav } from '@/components/bottom-nav';
import { useColors } from '@/lib/settings';

export default function TabLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={(props) => <BottomNav {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
