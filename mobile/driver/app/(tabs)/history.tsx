import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native'
import { apiGet } from '../../lib/api'

interface Delivery {
  id: number; status: string; address: string; recipient_name: string
  order?: { order_number: string; total_amount?: number }
  created_at: string
}

export default function HistoryScreen() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [totalEarnings, setTotalEarnings] = useState(0)

  const load = useCallback(async () => {
    try {
      const data = await apiGet('/delivery/driver/history')
      const list = Array.isArray(data) ? data : data?.data || []
      setDeliveries(list)
      // Estimate earnings: 5000₮ per delivery
      setTotalEarnings(list.length * 5000)
    } catch { setDeliveries([]) }
  }, [])

  useEffect(() => { load() }, [load])
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false) }, [load])

  const renderItem = ({ item }: { item: Delivery }) => {
    const d = new Date(item.created_at)
    const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    return (
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.orderNum}>#{item.order?.order_number || item.id}</Text>
          <View style={s.badge}><Text style={s.badgeText}>Хүргэсэн</Text></View>
        </View>
        <Text style={s.address}>{item.address}</Text>
        <View style={s.row}>
          <Text style={s.recipient}>{item.recipient_name}</Text>
          <Text style={s.date}>{dateStr}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <View style={s.earningsCard}>
        <Text style={s.earningsLabel}>Нийт орлого</Text>
        <Text style={s.earningsValue}>{totalEarnings.toLocaleString()}₮</Text>
        <Text style={s.earningsCount}>{deliveries.length} хүргэлт</Text>
      </View>

      <FlatList data={deliveries} renderItem={renderItem} keyExtractor={i => String(i.id)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B00" />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📊</Text>
            <Text style={s.emptyText}>Түүх хоосон байна</Text>
          </View>
        }
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  earningsCard: { margin: 16, backgroundColor: '#0F0F0F', borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#1A1A1A' },
  earningsLabel: { fontSize: 13, color: '#888', marginBottom: 4 },
  earningsValue: { fontSize: 32, fontWeight: '700', color: '#FF6B00', marginBottom: 4 },
  earningsCount: { fontSize: 13, color: '#666' },
  list: { padding: 16, paddingTop: 0, paddingBottom: 40 },
  card: { backgroundColor: '#0F0F0F', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#1A1A1A' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNum: { fontSize: 14, fontWeight: '700', color: '#F1F5F9' },
  badge: { backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: '#22c55e', fontSize: 11, fontWeight: '600' },
  address: { fontSize: 13, color: '#aaa', marginBottom: 6 },
  recipient: { fontSize: 13, color: '#888' },
  date: { fontSize: 12, color: '#555' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: '#888', fontSize: 15 },
})
