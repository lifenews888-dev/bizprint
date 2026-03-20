import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiGet } from '../../lib/api';

interface Delivery {
  id?: string;
  status?: string;
  courier_name?: string;
  courier_phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  estimated_delivery?: string;
  updated_at?: string;
}

const DELIVERY_STATUSES = [
  'ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'NEAR_DESTINATION',
  'DELIVERED',
];

export default function TrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadDelivery() {
    try {
      const data = await apiGet(`/delivery/order/${orderId}`);
      setDelivery(data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    loadDelivery();
    intervalRef.current = setInterval(loadDelivery, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [orderId]);

  const callCourier = () => {
    const phone = delivery?.courier_phone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#FF6B00" size="large" />
      </View>
    );
  }

  const lat = delivery?.latitude || delivery?.lat;
  const lng = delivery?.longitude || delivery?.lng;
  const currentIndex = DELIVERY_STATUSES.indexOf(delivery?.status || '');

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={() => router.back()} style={s.backRow}>
        <Text style={s.backArrow}>{'\u2190'}</Text>
        <Text style={s.backLabel}>Буцах</Text>
      </TouchableOpacity>

      <Text style={s.title}>Хүргэлт хянах</Text>

      <View style={s.card}>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Төлөв</Text>
          <View
            style={[
              s.statusBadge,
              {
                backgroundColor:
                  (delivery?.status === 'DELIVERED' ? '#22C55E' : '#FF6B00') + '22',
              },
            ]}
          >
            <Text
              style={[
                s.statusText,
                {
                  color:
                    delivery?.status === 'DELIVERED' ? '#22C55E' : '#FF6B00',
                },
              ]}
            >
              {delivery?.status || 'Мэдэгдэхгүй'}
            </Text>
          </View>
        </View>

        {delivery?.courier_name && (
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Жолооч</Text>
            <Text style={s.infoValue}>{delivery.courier_name}</Text>
          </View>
        )}

        {delivery?.courier_phone && (
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Утас</Text>
            <Text style={s.infoValue}>{delivery.courier_phone}</Text>
          </View>
        )}

        {delivery?.address && (
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Хаяг</Text>
            <Text style={[s.infoValue, { flex: 1, textAlign: 'right' }]}>
              {delivery.address}
            </Text>
          </View>
        )}
      </View>

      {lat != null && lng != null && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Байршил</Text>
          <View style={s.coordBox}>
            <Text style={s.coordText}>
              {'\uD83D\uDCCD'} {lat.toFixed(6)}, {lng.toFixed(6)}
            </Text>
          </View>
          <Text style={s.coordHint}>
            10 секунд тутамд шинэчлэгдэнэ
          </Text>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.cardTitle}>Хүргэлтийн явц</Text>
        {DELIVERY_STATUSES.map((status, i) => {
          const isActive = i <= currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <View key={status} style={s.timelineItem}>
              <View style={s.timelineLeft}>
                <View
                  style={[
                    s.dot,
                    isActive && s.dotActive,
                    isCurrent && s.dotCurrent,
                  ]}
                />
                {i < DELIVERY_STATUSES.length - 1 && (
                  <View
                    style={[s.line, isActive && i < currentIndex && s.lineActive]}
                  />
                )}
              </View>
              <Text
                style={[
                  s.timelineLabel,
                  isActive && s.timelineLabelActive,
                  isCurrent && s.timelineLabelCurrent,
                ]}
              >
                {getDeliveryStatusLabel(status)}
              </Text>
            </View>
          );
        })}
      </View>

      {delivery?.courier_phone && (
        <TouchableOpacity style={s.callBtn} onPress={callCourier}>
          <Text style={s.callBtnText}>
            {'\u260E'} Жолоочид залгах
          </Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function getDeliveryStatusLabel(status: string): string {
  switch (status) {
    case 'ASSIGNED': return 'Жолооч товлогдсон';
    case 'PICKED_UP': return 'Авсан';
    case 'IN_TRANSIT': return 'Замд';
    case 'NEAR_DESTINATION': return 'Ойрхон байна';
    case 'DELIVERED': return 'Хүргэгдсэн';
    default: return status;
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 20 },
  center: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
  backArrow: { fontSize: 20, color: '#F1F5F9' },
  backLabel: { fontSize: 15, color: '#F1F5F9', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: '700', color: '#F1F5F9', marginBottom: 24 },
  card: {
    backgroundColor: '#0F0F0F',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#F1F5F9', marginBottom: 16 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: '#F1F5F9', fontWeight: '500' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  coordBox: {
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  coordText: { fontSize: 15, color: '#F1F5F9', fontWeight: '500' },
  coordHint: { fontSize: 12, color: '#555', textAlign: 'center' },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 40 },
  timelineLeft: { alignItems: 'center', width: 24, marginRight: 12 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#444',
  },
  dotActive: { backgroundColor: '#FF6B00', borderColor: '#FF6B00' },
  dotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FF6B00',
    backgroundColor: '#0F0F0F',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#333',
    marginVertical: 2,
  },
  lineActive: { backgroundColor: '#FF6B00' },
  timelineLabel: { fontSize: 14, color: '#555' },
  timelineLabelActive: { color: '#888' },
  timelineLabelCurrent: { color: '#FF6B00', fontWeight: '600' },
  callBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  callBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
