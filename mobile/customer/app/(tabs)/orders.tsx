import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiGet } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

interface Order {
  id: string;
  order_number: string;
  product_name?: string;
  status: string;
  total_amount: number;
  created_at: string;
}

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError(true);
      return;
    }
    try {
      const data = await apiGet('/orders/my');
      const list = Array.isArray(data) ? data : data?.data || [];
      setOrders(list);
      setError(false);
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  if (!user || error) {
    return (
      <View style={s.center}>
        <Text style={s.emptyIcon}>{'\uD83D\uDCE6'}</Text>
        <Text style={s.emptyTitle}>Нэвтрэх шаардлагатай</Text>
        <Text style={s.emptyDesc}>Захиалгаа харахын тулд нэвтэрнэ үү</Text>
        <TouchableOpacity
          style={s.loginBtn}
          onPress={() => router.push('/(auth)/login' as any)}
        >
          <Text style={s.loginBtnText}>Нэвтрэх</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderOrder = ({ item }: { item: Order }) => {
    const statusColor = getStatusColor(item.status);
    const date = new Date(item.created_at);
    const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

    return (
      <TouchableOpacity
        style={s.orderCard}
        onPress={() => router.push(`/order/${item.id}` as any)}
      >
        <View style={s.orderHeader}>
          <Text style={s.orderNumber}>#{item.order_number}</Text>
          <View style={[s.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[s.statusText, { color: statusColor }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        <Text style={s.productName}>{item.product_name || 'Захиалга'}</Text>
        <View style={s.orderFooter}>
          <Text style={s.orderAmount}>
            {Number(item.total_amount || 0).toLocaleString()}\u20AE
          </Text>
          <Text style={s.orderDate}>{dateStr}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B00" />
        }
        ListEmptyComponent={
          <View style={s.center}>
            <Text style={s.emptyIcon}>{'\uD83D\uDCE6'}</Text>
            <Text style={s.emptyTitle}>Захиалга байхгүй</Text>
            <Text style={s.emptyDesc}>
              {loading ? 'Ачааллаж байна...' : 'Та одоогоор захиалга хийгээгүй байна'}
            </Text>
          </View>
        }
      />
    </View>
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

function getStatusLabel(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'Баталгаажсан';
    case 'IN_PRODUCTION':
      return 'Үйлдвэрт';
    case 'DELIVERED':
      return 'Хүргэгдсэн';
    case 'COMPLETED':
      return 'Дууссан';
    case 'CANCELLED':
      return 'Цуцлагдсан';
    case 'DISPATCHED':
      return 'Илгээсэн';
    case 'IN_TRANSIT':
      return 'Замд';
    default:
      return status;
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  list: { padding: 16, paddingBottom: 40 },
  orderCard: {
    backgroundColor: '#0F0F0F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },
  productName: { fontSize: 14, color: '#888', marginBottom: 10 },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderAmount: { fontSize: 16, fontWeight: '700', color: '#FF6B00' },
  orderDate: { fontSize: 12, color: '#666' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#F1F5F9', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 24 },
  loginBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
