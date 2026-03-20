import { View, Text, StyleSheet } from 'react-native'

export default function OrdersScreen() {
  return (
    <View style={s.container}>
      <Text style={s.title}>Захиалгууд</Text>
      <Text style={s.sub}>Нэвтэрч захиалгаа хянаарай</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#F1F5F9', marginBottom: 8 },
  sub: { fontSize: 14, color: '#888' },
})
