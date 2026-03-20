import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiGet } from '../../lib/api';

interface OrderDetail {
  id: string;
  order_number: string;
  product_name?: string;
  quantity?: number;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at?: string;
}

const STATUS_FLOW = [
  'PENDING',
  'CONFIRMED',
  'IN_PRODUCTION',
  'DISPATCHED',
  'IN_TRANSIT',
  'DELIVERED',
  'COMPLETED',
];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function loadOrder() {
    try {
      const data = await apiGet(`/orders/${id}`);
      setOrder(data);
    } catch {}
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color="#FF6B00" size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={s.center}>
        <Text style={s.errorText}>Захиалга олдсонгүй</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnText}>Буцах</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentIndex = STATUS_FLOW.indexOf(order.status);
  const showTracking = order.status === 'DISPATCHED' || order.status === 'IN_TRANSIT';

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={() => router.back()} style={s.backRow}>
        <Text style={s.backArrow}>{'\u2190'}</Text>
        <Text style={s.backLabel}>Буцах</Text>
      </TouchableOpacity>

      <View style={s.card}>
        <View style={s.headerRow}>
          <Text style={s.orderNumber}>#{order.order_number}</Text>
          <View
            style={[
              s.statusBadge,
              { backgroundColor: getStatusColor(order.status) + '22' },
            ]}
          >
            <Text style={[s.statusText, { color: getStatusColor(order.status) }]}>
              {getStatusLabel(order.status)}
            </Text>
          </View>
        </View>

        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Бүтээгдэхүүн</Text>
          <Text style={s.detailValue}>{order.product_name || '-'}</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Тоо хэмжээ</Text>
          <Text style={s.detailValue}>{order.quantity || '-'}</Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Нийт дүн</Text>
          <Text style={s.detailValueOrange}>
            {Number(order.total_amount || 0).toLocaleString()}{'\u20AE'}
          </Text>
        </View>
        <View style={s.detailRow}>
          <Text style={s.detailLabel}>Огноо</Text>
          <Text style={s.detailValue}>
            {new Date(order.created_at).toLocaleDateString('mn-MN')}
          </Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Явц</Text>
        {STATUS_FLOW.map((status, i) => {
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
                {i < STATUS_FLOW.length - 1 && (
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
                {getStatusLabel(status)}
              </Text>
            </View>
          );
        })}
      </View>

      {showTracking && (
        <TouchableOpacity
          style={s.trackBtn}
          onPress={() => router.push(`/tracking/${order.id}` as any)}
        >
          <Text style={s.trackBtnText}>Хүргэлт хянах</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'CONFIRMED': return '#3B82F6';
    case 'IN_PRODUCTION': return '#EAB308';
    case 'DELIVERED': case 'COMPLETED': return '#22C55E';
    case 'CANCELLED': return '#EF4444';
    case 'DISPATCHED': case 'IN_TRANSIT': return '#8B5CF6';
    default: return '#888';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING': return 'Хүлээгдэж буй';
    case 'CONFIRMED': return 'Баталгаажсан';
    case 'IN_PRODUCTION': return 'Үйлдвэрт';
    case 'DISPATCHED': return 'Илгээсэн';
    case 'IN_TRANSIT': return 'Замд';
    case 'DELIVERED': return 'Хүргэгдсэн';
    case 'COMPLETED': return 'Дууссан';
    case 'CANCELLED': return 'Цуцлагдсан';
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
  errorText: { color: '#888', fontSize: 16, marginBottom: 16 },
  backBtn: {
    backgroundColor: '#0F0F0F',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  backBtnText: { color: '#F1F5F9', fontSize: 14 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
  backArrow: { fontSize: 20, color: '#F1F5F9' },
  backLabel: { fontSize: 15, color: '#F1F5F9', fontWeight: '500' },
  card: {
    backgroundColor: '#0F0F0F',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  orderNumber: { fontSize: 20, fontWeight: '700', color: '#F1F5F9' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  detailLabel: { fontSize: 14, color: '#888' },
  detailValue: { fontSize: 14, color: '#F1F5F9', fontWeight: '500' },
  detailValueOrange: { fontSize: 16, color: '#FF6B00', fontWeight: '700' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#F1F5F9', marginBottom: 16 },
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
  timelineLabel: { fontSize: 14, color: '#555', paddingTop: 0 },
  timelineLabelActive: { color: '#888' },
  timelineLabelCurrent: { color: '#FF6B00', fontWeight: '600' },
  trackBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  trackBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
