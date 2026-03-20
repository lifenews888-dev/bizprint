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
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0F0F0F' },
        headerTintColor: '#F1F5F9',
        contentStyle: { backgroundColor: '#0A0A0A' },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="order/[id]" options={{ title: 'Захиалга' }} />
      <Stack.Screen name="quote/[category]" options={{ title: 'Үнийн санал' }} />
      <Stack.Screen name="tracking/[orderId]" options={{ title: 'Хүргэлт хянах' }} />
      <Stack.Screen name="payment/[invoiceId]" options={{ title: 'Төлбөр' }} />
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <StatusBar style="light" />
      <AuthProvider>
        <RootNav />
      </AuthProvider>
    </View>
  )
}
