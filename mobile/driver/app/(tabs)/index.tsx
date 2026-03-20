import { View, Text, StyleSheet } from 'react-native'

export default function ActiveScreen() {
  return (
    <View style={s.container}>
      <View style={s.statusCard}>
        <Text style={s.statusIcon}>🟢</Text>
        <Text style={s.statusText}>Идэвхтэй</Text>
      </View>
      <Text style={s.title}>Одоогийн хүргэлт</Text>
      <View style={s.emptyCard}>
        <Text style={s.emptyIcon}>📦</Text>
        <Text style={s.emptyText}>Идэвхтэй хүргэлт байхгүй</Text>
        <Text style={s.emptyHint}>Шинэ хүргэлт ирэхэд энд харагдана</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 24 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 24 },
  statusIcon: { fontSize: 12 },
  statusText: { color: '#22c55e', fontSize: 14, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: '#F1F5F9', marginBottom: 20 },
  emptyCard: { backgroundColor: '#0F0F0F', borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: '#1A1A1A' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#F1F5F9', marginBottom: 4 },
  emptyHint: { fontSize: 13, color: '#888' },
})
