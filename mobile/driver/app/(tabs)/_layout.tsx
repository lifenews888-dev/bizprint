import { Tabs } from 'expo-router'
import { Text } from 'react-native'

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarStyle: { backgroundColor: '#0F0F0F', borderTopColor: '#1A1A1A', borderTopWidth: 1, height: 60, paddingBottom: 8, paddingTop: 4 },
      tabBarActiveTintColor: '#FF6B00', tabBarInactiveTintColor: '#888',
      tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      headerStyle: { backgroundColor: '#0F0F0F' }, headerTintColor: '#F1F5F9', headerTitleStyle: { fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Идэвхтэй', tabBarIcon: ({ focused }) => <TabIcon emoji="🚚" focused={focused} /> }} />
      <Tabs.Screen name="queue" options={{ title: 'Дараалал', tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} /> }} />
      <Tabs.Screen name="history" options={{ title: 'Түүх', tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Профайл', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }} />
    </Tabs>
  )
}
