import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#0F0F0F', borderTopColor: '#1A1A1A' },
        tabBarActiveTintColor: '#FF6B00',
        tabBarInactiveTintColor: '#888',
        headerStyle: { backgroundColor: '#0F0F0F' },
        headerTintColor: '#F1F5F9',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Нүүр', tabBarLabel: 'Нүүр' }} />
      <Tabs.Screen name="shop" options={{ title: 'Дэлгүүр', tabBarLabel: 'Дэлгүүр' }} />
      <Tabs.Screen name="orders" options={{ title: 'Захиалга', tabBarLabel: 'Захиалга' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профайл', tabBarLabel: 'Профайл' }} />
    </Tabs>
  )
}
