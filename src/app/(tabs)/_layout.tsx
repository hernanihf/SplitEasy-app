import { Tabs } from 'expo-router';

import { BottomNav } from '@/components/bottom-nav';
import { useColors } from '@/lib/settings';

export default function TabLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
      tabBar={(props) => {
        // A screen (e.g. Home during its first-load splash) can hide the bar
        // via navigation.setOptions({ tabBarStyle: { display: 'none' } }).
        const focused = props.state.routes[props.state.index];
        const tabBarStyle = props.descriptors[focused.key]?.options?.tabBarStyle as
          | { display?: string }
          | undefined;
        return tabBarStyle?.display === 'none' ? null : <BottomNav {...props} />;
      }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
