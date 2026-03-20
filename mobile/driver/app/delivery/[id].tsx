import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { apiGet, apiPatch, apiPost } from '../../lib/api'

interface DeliveryDetail {
  id: number; status: string; address: string
  recipient_name: string; recipient_phone: string
  courier_name?: string; courier_phone?: string
  lat?: number; lng?: number; estimated_at?: string
  provider_data?: { proof_photo?: string; proof_timestamp?: string }
  order?: { id: string; order_number: string; product_name?: string; quantity?: number; total_amount?: number }
  created_at: string; updated_at: string
}

export default function DeliveryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCamera, setShowCamera] = useState(false)
  const [cameraPermission, requestCameraPermission] = useCameraPermissions()

  useEffect(() => { load() }, [id])

  async function load() {
    try {
      const data = await apiGet(`/delivery/${id}/tracking`)
      setDelivery(data)
    } catch {}
    setLoading(false)
  }

  async function updateStatus(status: string) {
    try {
      await apiPatch(`/delivery/${id}/status`, { status })
      Alert.alert('Амжилттай', `Статус: ${status}`)
      load()
    } catch (e: any) { Alert.alert('Алдаа', e.message) }
  }

  async function takeProofPhoto() {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission()
      if (!result.granted) { Alert.alert('Камер', 'Камер зөвшөөрөл шаардлагатай'); return }
    }
    setShowCamera(true)
  }

  async function onPhotoTaken(uri: string) {
    setShowCamera(false)
    try {
      await apiPost(`/delivery/${id}/proof`, { photo_url: uri })
      Alert.alert('Амжилттай', 'Баталгаажуулах зураг хадгалагдлаа')
      load()
    } catch (e: any) { Alert.alert('Алдаа', e.message) }
  }

  if (showCamera) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView style={{ flex: 1 }} facing="back">
          <View style={s.cameraOverlay}>
            <Text style={s.cameraHint}>Хүргэлтийн баталгаажуулах зураг</Text>
            <View style={s.cameraActions}>
              <TouchableOpacity style={s.cameraCancelBtn} onPress={() => setShowCamera(false)}>
                <Text style={s.cameraCancelText}>Болих</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.cameraSnapBtn} onPress={() => onPhotoTaken(`proof_${id}_${Date.now()}.jpg`)}>
                <View style={s.cameraSnapInner} />
              </TouchableOpacity>
              <View style={{ width: 60 }} />
            </View>
          </View>
        </CameraView>
      </View>
    )
  }

  if (loading) return <View style={s.center}><Text style={s.loadingText}>Ачааллаж байна...</Text></View>
  if (!delivery) return <View style={s.center}><Text style={s.loadingText}>Хүргэлт олдсонгүй</Text></View>

  const statuses = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED']
  const currentIdx = statuses.indexOf(delivery.status)
  const statusLabels: Record<string, string> = { PENDING: 'Хүлээгдэж байна', ASSIGNED: 'Томилогдсон', PICKED_UP: 'Авсан', IN_TRANSIT: 'Замд', DELIVERED: 'Хүргэсэн' }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Header */}
      <View style={s.headerCard}>
        <Text style={s.orderId}>#{delivery.order?.order_number || delivery.id}</Text>
        <View style={[s.statusBadge, { backgroundColor: delivery.status === 'DELIVERED' ? 'rgba(34,197,94,0.15)' : 'rgba(255,107,0,0.15)' }]}>
          <Text style={[s.statusBadgeText, { color: delivery.status === 'DELIVERED' ? '#22c55e' : '#FF6B00' }]}>
            {statusLabels[delivery.status] || delivery.status}
          </Text>
        </View>
      </View>

      {/* Recipient */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>Хүлээн авагч</Text>
        <Text style={s.infoText}>{delivery.recipient_name}</Text>
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${delivery.recipient_phone}`)}>
          <Text style={s.phoneText}>📞 {delivery.recipient_phone}</Text>
        </TouchableOpacity>
      </View>

      {/* Address */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>Хаяг</Text>
        <Text style={s.infoText}>{delivery.address}</Text>
        {delivery.lat && delivery.lng && (
          <Text style={s.coordText}>📍 {delivery.lat.toFixed(4)}, {delivery.lng.toFixed(4)}</Text>
        )}
      </View>

      {/* Order info */}
      {delivery.order && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>Захиалга</Text>
          {delivery.order.product_name && <Text style={s.infoText}>{delivery.order.product_name}</Text>}
          {delivery.order.quantity && <Text style={s.subText}>Тоо: {delivery.order.quantity}</Text>}
          {delivery.order.total_amount && <Text style={s.amountText}>{Number(delivery.order.total_amount).toLocaleString()}₮</Text>}
        </View>
      )}

      {/* Status timeline */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>Төлөв</Text>
        {statuses.map((st, i) => {
          const done = i <= currentIdx
          const isCurrent = i === currentIdx
          return (
            <View key={st} style={s.timelineRow}>
              <View style={s.timelineCol}>
                <View style={[s.dot, done && s.dotDone, isCurrent && s.dotCurrent]} />
                {i < statuses.length - 1 && <View style={[s.line, done && s.lineDone]} />}
              </View>
              <Text style={[s.timelineLabel, done && s.timelineLabelDone]}>{statusLabels[st]}</Text>
            </View>
          )
        })}
      </View>

      {/* Proof */}
      {delivery.provider_data?.proof_photo && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>Баталгаажуулалт</Text>
          <Text style={s.proofText}>📸 Зураг: {delivery.provider_data.proof_photo}</Text>
          <Text style={s.subText}>{delivery.provider_data.proof_timestamp}</Text>
        </View>
      )}

      {/* Actions */}
      {delivery.status !== 'DELIVERED' && (
        <View style={s.actionSection}>
          {delivery.status === 'ASSIGNED' && (
            <TouchableOpacity style={s.actionBtn} onPress={() => updateStatus('PICKED_UP')}>
              <Text style={s.actionBtnText}>📦 Авсан</Text>
            </TouchableOpacity>
          )}
          {delivery.status === 'PICKED_UP' && (
            <TouchableOpacity style={s.actionBtn} onPress={() => updateStatus('IN_TRANSIT')}>
              <Text style={s.actionBtnText}>🚚 Явж байна</Text>
            </TouchableOpacity>
          )}
          {delivery.status === 'IN_TRANSIT' && (
            <>
              <TouchableOpacity style={s.proofBtn} onPress={takeProofPhoto}>
                <Text style={s.proofBtnText}>📸 Зураг авах</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.deliverActionBtn} onPress={() => updateStatus('DELIVERED')}>
                <Text style={s.deliverActionBtnText}>✅ Хүргэсэн</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 20, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' },
  loadingText: { color: '#888', fontSize: 15 },
  headerCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  orderId: { fontSize: 22, fontWeight: '700', color: '#F1F5F9' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  statusBadgeText: { fontSize: 13, fontWeight: '600' },
  section: { backgroundColor: '#0F0F0F', borderRadius: 14, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#1A1A1A' },
  sectionLabel: { fontSize: 12, color: '#666', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  infoText: { fontSize: 16, color: '#F1F5F9', fontWeight: '500', marginBottom: 4 },
  subText: { fontSize: 13, color: '#888' },
  phoneText: { fontSize: 15, color: '#3B82F6', fontWeight: '500', marginTop: 4 },
  coordText: { fontSize: 13, color: '#888', marginTop: 4 },
  amountText: { fontSize: 18, fontWeight: '700', color: '#FF6B00', marginTop: 4 },
  proofText: { fontSize: 14, color: '#22c55e' },
  // Timeline
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 36 },
  timelineCol: { width: 24, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#333', borderWidth: 2, borderColor: '#444' },
  dotDone: { backgroundColor: '#FF6B00', borderColor: '#FF6B00' },
  dotCurrent: { backgroundColor: '#22c55e', borderColor: '#22c55e', width: 14, height: 14, borderRadius: 7 },
  line: { width: 2, flex: 1, backgroundColor: '#333', minHeight: 20 },
  lineDone: { backgroundColor: '#FF6B00' },
  timelineLabel: { fontSize: 14, color: '#555', marginLeft: 10, paddingTop: 0 },
  timelineLabelDone: { color: '#F1F5F9', fontWeight: '500' },
  // Actions
  actionSection: { gap: 10, marginTop: 10 },
  actionBtn: { backgroundColor: '#FF6B00', padding: 16, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  proofBtn: { backgroundColor: 'rgba(59,130,246,0.1)', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' },
  proofBtnText: { color: '#3B82F6', fontSize: 16, fontWeight: '700' },
  deliverActionBtn: { backgroundColor: '#22c55e', padding: 16, borderRadius: 12, alignItems: 'center' },
  deliverActionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // Camera
  cameraOverlay: { flex: 1, justifyContent: 'flex-end', padding: 24 },
  cameraHint: { color: '#fff', textAlign: 'center', fontSize: 14, marginBottom: 20, opacity: 0.8 },
  cameraActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  cameraCancelBtn: { width: 60, alignItems: 'center' },
  cameraCancelText: { color: '#fff', fontSize: 14 },
  cameraSnapBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  cameraSnapInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
})
