import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiGet } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

interface CmsSettings {
  hero_title?: string;
  hero_subtitle?: string;
}

interface Order {
  id: string;
  order_number: string;
  product_name?: string;
  status: string;
  total_amount: number;
  created_at: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [settings, setSettings] = useState<CmsSettings>({});
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const cms = await apiGet('/cms/settings/public');
      if (cms) setSettings(cms);
    } catch {}

    if (user) {
      try {
        const orders = await apiGet('/orders/my');
        const list = Array.isArray(orders) ? orders : orders?.data || [];
        setRecentOrders(list.slice(0, 3));
      } catch {}
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const quickActions = [
    { key: 'offset', label: 'Офсет хэвлэл', icon: '\uD83D\uDCC4' },
    { key: 'hadag', label: 'Хаяг реклам', icon: '\uD83C\uDFAF' },
    { key: 'wide', label: 'Өргөн хэвлэл', icon: '\uD83D\uDDBC\uFE0F' },
  ];

  return (
    <ScrollView
      style={s.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B00" />
      }
    >
      <View style={s.hero}>
        <Text style={s.badge}>BizPrint</Text>
        <Text style={s.heroTitle}>
          {settings.hero_title || 'Хэвлэлийн бүх\n'}
          {!settings.hero_title && (
            <Text style={{ color: '#FF6B00' }}>шийдэл</Text>
          )}
          {!settings.hero_title && ' нэг дор'}
        </Text>
        <Text style={s.heroSub}>
          {settings.hero_subtitle ||
            'AI-д суурилсан үнийн тооцоо, автомат үйлдвэр сонголт, бодит цагийн хүргэлт'}
        </Text>
        <TouchableOpacity
          style={s.ctaBtn}
          onPress={() => router.push('/quote/offset')}
        >
          <Text style={s.ctaBtnText}>Үнэ авах</Text>
        </TouchableOpacity>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Хэвлэлийн үйлчилгээ</Text>
        <View style={s.quickGrid}>
          {quickActions.map((a) => (
            <TouchableOpacity
              key={a.key}
              style={s.quickCard}
              onPress={() => router.push(`/quote/${a.key}` as any)}
            >
              <Text style={s.quickIcon}>{a.icon}</Text>
              <Text style={s.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {user && recentOrders.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Сүүлийн захиалгууд</Text>
          {recentOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={s.orderCard}
              onPress={() => router.push(`/order/${order.id}` as any)}
            >
              <View style={s.orderRow}>
                <Text style={s.orderNumber}>#{order.order_number}</Text>
                <View
                  style={[
                    s.statusBadge,
                    { backgroundColor: getStatusColor(order.status) + '22' },
                  ]}
                >
                  <Text
                    style={[s.statusText, { color: getStatusColor(order.status) }]}
                  >
                    {order.status}
                  </Text>
                </View>
              </View>
              <Text style={s.orderProduct}>{order.product_name || 'Захиалга'}</Text>
              <Text style={s.orderAmount}>
                {Number(order.total_amount || 0).toLocaleString()}\u20AE
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return '#3B82F6';
    case 'IN_PRODUCTION':
      return '#EAB308';
    case 'DELIVERED':
    case 'COMPLETED':
      return '#22C55E';
    case 'CANCELLED':
      return '#EF4444';
    default:
      return '#888';
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  hero: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  badge: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    backgroundColor: 'rgba(255,107,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#F1F5F9',
    lineHeight: 40,
    marginBottom: 12,
  },
  heroSub: { fontSize: 15, color: '#888', lineHeight: 22, marginBottom: 24 },
  ctaBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  ctaBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  quickGrid: { flexDirection: 'row', gap: 12 },
  quickCard: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  quickIcon: { fontSize: 28, marginBottom: 8 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: '#F1F5F9', textAlign: 'center' },
  orderCard: {
    backgroundColor: '#0F0F0F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderNumber: { fontSize: 14, fontWeight: '600', color: '#F1F5F9' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  orderProduct: { fontSize: 13, color: '#888', marginBottom: 4 },
  orderAmount: { fontSize: 15, fontWeight: '700', color: '#FF6B00' },
});
