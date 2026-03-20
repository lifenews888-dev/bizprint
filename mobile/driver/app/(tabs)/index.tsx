import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet, RefreshControl, Alert, Linking } from 'react-native'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { io, Socket } from 'socket.io-client'
import { apiGet, apiPatch, API } from '../../lib/api'

interface Delivery {
  id: number
  status: string
  address: string
  recipient_name: string
  recipient_phone: string
  order?: { id: string; order_number: string; product_name?: string; total_amount?: number }
  lat?: number
  lng?: number
}

export default function ActiveScreen() {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [tracking, setTracking] = useState<number | null>(null) // delivery id being tracked
  const socketRef = useRef<Socket | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadActive = useCallback(async () => {
    try {
      const data = await apiGet('/delivery/driver/active')
      const list = Array.isArray(data) ? data : data?.data || []
      setDeliveries(list)
    } catch {
      setDeliveries([])
    }
  }, [])

  useEffect(() => { loadActive() }, [loadActive])

  // Socket.IO connection
  useEffect(() => {
    const socket = io(`${API}/delivery`, { transports: ['websocket'], reconnection: true })
    socketRef.current = socket
    return () => { socket.disconnect() }
  }, [])

  // GPS tracking loop
  useEffect(() => {
    if (!tracking) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
      return
    }

    let mounted = true

    async function startTracking() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('GPS', 'Байршил зөвшөөрөл шаардлагатай')
        setTracking(null)
        return
      }

      intervalRef.current = setInterval(async () => {
        if (!mounted) return
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
          const { latitude: lat, longitude: lng, accuracy } = loc.coords

          // Send to backend
          await apiPatch(`/delivery/${tracking}/location`, { lat, lng, accuracy })

          // Send via Socket.IO for real-time
          socketRef.current?.emit('driver_location', { deliveryId: tracking, lat, lng, accuracy })
        } catch {}
      }, 10000)
    }

    startTracking()
    return () => { mounted = false; if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [tracking])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadActive()
    setRefreshing(false)
  }, [loadActive])

  const startDelivery = (id: number) => {
    setTracking(id)
    Alert.alert('GPS эхэллээ', '10 секунд тутамд байршил илгээнэ')
  }

  const stopTracking = () => {
    setTracking(null)
    Alert.alert('GPS зогссон', 'Байршил илгээхээ болилоо')
  }

  const callRecipient = (phone: string) => {
    Linking.openURL(`tel:${phone}`)
  }

  const markDelivered = async (id: number) => {
    Alert.alert('Хүргэлт баталгаажуулах', 'Хүргэсэн гэж баталгаажуулах уу?', [
      { text: 'Үгүй', style: 'cancel' },
      { text: 'Тийм', onPress: async () => {
        try {
          await apiPatch(`/delivery/${id}/status`, { status: 'DELIVERED' })
          setTracking(null)
          loadActive()
          Alert.alert('Амжилттай', 'Хүргэлт баталгаажлаа')
        } catch (e: any) { Alert.alert('Алдаа', e.message) }
      }},
    ])
  }

  const renderDelivery = ({ item }: { item: Delivery }) => {
    const isTracking = tracking === item.id
    return (
      <TouchableOpacity style={[s.card, isTracking && s.cardActive]} onPress={() => router.push(`/delivery/${item.id}` as any)}>
        <View style={s.cardHeader}>
          <Text style={s.orderNum}>#{item.order?.order_number || item.id}</Text>
          {isTracking && <View style={s.liveBadge}><View style={s.liveDot} /><Text style={s.liveText}>LIVE</Text></View>}
        </View>

        <Text style={s.address}>{item.address}</Text>
        <Text style={s.recipient}>{item.recipient_name} • {item.recipient_phone}</Text>

        {item.order?.product_name && <Text style={s.product}>{item.order.product_name}</Text>}
        {item.order?.total_amount && <Text style={s.amount}>{Number(item.order.total_amount).toLocaleString()}₮</Text>}

        <View style={s.actions}>
          <TouchableOpacity style={s.callBtn} onPress={() => callRecipient(item.recipient_phone)}>
            <Text style={s.callBtnText}>📞 Залгах</Text>
          </TouchableOpacity>

          {!isTracking ? (
            <TouchableOpacity style={s.startBtn} onPress={() => startDelivery(item.id)}>
              <Text style={s.startBtnText}>🚀 Явж байна</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.stopBtn} onPress={stopTracking}>
              <Text style={s.stopBtnText}>⏹ GPS зогсоох</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={s.deliverBtn} onPress={() => markDelivered(item.id)}>
            <Text style={s.deliverBtnText}>✅ Хүргэсэн</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={s.container}>
      <View style={s.statusRow}>
        <View style={[s.statusIndicator, tracking ? s.statusLive : s.statusIdle]} />
        <Text style={s.statusLabel}>{tracking ? 'GPS идэвхтэй' : 'Хүлээгдэж байна'}</Text>
        <Text style={s.countLabel}>{deliveries.length} хүргэлт</Text>
      </View>

      <FlatList
        data={deliveries}
        renderItem={renderDelivery}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B00" />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📦</Text>
            <Text style={s.emptyTitle}>Идэвхтэй хүргэлт байхгүй</Text>
            <Text style={s.emptyDesc}>Шинэ хүргэлт ирэхэд энд харагдана</Text>
          </View>
        }
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  statusRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 },
  statusIndicator: { width: 10, height: 10, borderRadius: 5 },
  statusLive: { backgroundColor: '#22c55e' },
  statusIdle: { backgroundColor: '#888' },
  statusLabel: { fontSize: 14, color: '#F1F5F9', fontWeight: '600', flex: 1 },
  countLabel: { fontSize: 13, color: '#888' },
  list: { padding: 16, paddingTop: 0, paddingBottom: 40 },
  card: { backgroundColor: '#0F0F0F', borderRadius: 14, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#1A1A1A' },
  cardActive: { borderColor: '#22c55e', borderWidth: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  orderNum: { fontSize: 16, fontWeight: '700', color: '#F1F5F9' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  liveText: { fontSize: 10, fontWeight: '700', color: '#22c55e', letterSpacing: 1 },
  address: { fontSize: 15, color: '#F1F5F9', fontWeight: '500', marginBottom: 4 },
  recipient: { fontSize: 13, color: '#888', marginBottom: 8 },
  product: { fontSize: 13, color: '#666', marginBottom: 2 },
  amount: { fontSize: 16, fontWeight: '700', color: '#FF6B00', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  callBtn: { flex: 1, backgroundColor: 'rgba(59,130,246,0.1)', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)' },
  callBtnText: { color: '#3B82F6', fontSize: 13, fontWeight: '600' },
  startBtn: { flex: 1, backgroundColor: 'rgba(34,197,94,0.1)', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
  startBtnText: { color: '#22c55e', fontSize: 13, fontWeight: '600' },
  stopBtn: { flex: 1, backgroundColor: 'rgba(234,179,8,0.1)', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(234,179,8,0.2)' },
  stopBtnText: { color: '#eab308', fontSize: 13, fontWeight: '600' },
  deliverBtn: { flex: 1, backgroundColor: '#FF6B00', padding: 10, borderRadius: 8, alignItems: 'center' },
  deliverBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#F1F5F9', marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: '#888' },
})
