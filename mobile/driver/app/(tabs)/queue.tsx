import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { apiGet, apiPatch } from '../../lib/api'

interface Delivery {
  id: number; status: string; address: string; recipient_name: string; recipient_phone: string
  order?: { id: string; order_number: string; product_name?: string; total_amount?: number }
  created_at: string
}

export default function QueueScreen() {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadQueue = useCallback(async () => {
    try {
      // Fetch all deliveries, filter PENDING/ASSIGNED
      const data = await apiGet('/delivery')
      const list = (Array.isArray(data) ? data : data?.data || [])
        .filter((d: Delivery) => d.status === 'PENDING' || d.status === 'ASSIGNED')
      setDeliveries(list)
    } catch { setDeliveries([]) }
  }, [])

  useEffect(() => { loadQueue() }, [loadQueue])

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadQueue(); setRefreshing(false) }, [loadQueue])

  const acceptDelivery = async (id: number) => {
    try {
      await apiPatch(`/delivery/${id}/status`, { status: 'IN_TRANSIT' })
      Alert.alert('Хүлээн авлаа', 'Хүргэлт идэвхтэй дэлгэцэд шилжлээ')
      loadQueue()
    } catch (e: any) { Alert.alert('Алдаа', e.message) }
  }

  const renderItem = ({ item }: { item: Delivery }) => {
    const date = new Date(item.created_at)
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    return (
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.orderNum}>#{item.order?.order_number || item.id}</Text>
          <Text style={s.date}>{dateStr}</Text>
        </View>
        <Text style={s.address}>{item.address}</Text>
        <Text style={s.recipient}>{item.recipient_name} • {item.recipient_phone}</Text>
        {item.order?.total_amount ? <Text style={s.amount}>{Number(item.order.total_amount).toLocaleString()}₮</Text> : null}
        <View style={s.btnRow}>
          <TouchableOpacity style={s.detailBtn} onPress={() => router.push(`/delivery/${item.id}` as any)}>
            <Text style={s.detailBtnText}>Дэлгэрэнгүй</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.acceptBtn} onPress={() => acceptDelivery(item.id)}>
            <Text style={s.acceptBtnText}>Хүлээн авах</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={s.container}>
      <FlatList data={deliveries} renderItem={renderItem} keyExtractor={i => String(i.id)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B00" />}
        ListEmptyComponent={
          <View style={s.empty}><Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
            <Text style={s.emptyTitle}>Дараалал хоосон</Text>
            <Text style={s.emptyDesc}>Шинэ хүргэлт ирэхэд энд харагдана</Text>
          </View>
        }
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  list: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#0F0F0F', borderRadius: 14, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#1A1A1A' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderNum: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  date: { fontSize: 12, color: '#666' },
  address: { fontSize: 14, color: '#F1F5F9', marginBottom: 4 },
  recipient: { fontSize: 13, color: '#888', marginBottom: 6 },
  amount: { fontSize: 15, fontWeight: '700', color: '#FF6B00', marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 10 },
  detailBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A', backgroundColor: '#1A1A1A' },
  detailBtnText: { color: '#888', fontSize: 13, fontWeight: '600' },
  acceptBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#FF6B00' },
  acceptBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
  emptyDesc: { fontSize: 13, color: '#888' },
})
