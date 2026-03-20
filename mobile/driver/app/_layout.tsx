import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import { AuthProvider, useAuth } from '../lib/auth-context'

function RootNav() {
  const { loading } = useAuth()
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#FF6B00" size="large" />
      </View>
    )
  }
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#0F0F0F' }, headerTintColor: '#F1F5F9', contentStyle: { backgroundColor: '#0A0A0A' } }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="delivery/[id]" options={{ title: 'Хүргэлт' }} />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <StatusBar style="light" />
      <AuthProvider><RootNav /></AuthProvider>
    </View>
  )
}
