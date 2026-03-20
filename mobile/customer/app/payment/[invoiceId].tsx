import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PaymentScreen() {
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [paid, setPaid] = useState(false);

  const handleQPay = () => {
    Alert.alert('QPay', 'QPay төлбөрийн систем удахгүй нэмэгдэнэ');
  };

  const checkStatus = async () => {
    setChecking(true);
    // Placeholder - would call API to check payment status
    setTimeout(() => {
      setChecking(false);
      Alert.alert('Төлбөр', 'Төлбөр хүлээгдэж байна');
    }, 1500);
  };

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={() => router.back()} style={s.backRow}>
        <Text style={s.backArrow}>{'\u2190'}</Text>
        <Text style={s.backLabel}>Буцах</Text>
      </TouchableOpacity>

      <View style={s.card}>
        <Text style={s.cardIcon}>{'\uD83D\uDCB3'}</Text>
        <Text style={s.cardTitle}>Төлбөр</Text>
        <Text style={s.invoiceId}>Нэхэмжлэх: #{invoiceId}</Text>

        <View style={s.statusRow}>
          <Text style={s.statusLabel}>Төлөв:</Text>
          <View style={[s.statusBadge, paid ? s.statusPaid : s.statusPending]}>
            <Text style={[s.statusText, { color: paid ? '#22C55E' : '#EAB308' }]}>
              {paid ? 'Төлөгдсөн' : 'Хүлээгдэж буй'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={s.qpayBtn} onPress={handleQPay}>
        <Text style={s.qpayBtnText}>QPay-аар төлөх</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.checkBtn, checking && { opacity: 0.6 }]}
        onPress={checkStatus}
        disabled={checking}
      >
        {checking ? (
          <ActivityIndicator color="#F1F5F9" />
        ) : (
          <Text style={s.checkBtnText}>Төлбөр шалгах</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', padding: 20 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
  backArrow: { fontSize: 20, color: '#F1F5F9' },
  backLabel: { fontSize: 15, color: '#F1F5F9', fontWeight: '500' },
  card: {
    backgroundColor: '#0F0F0F',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    marginBottom: 24,
  },
  cardIcon: { fontSize: 48, marginBottom: 16 },
  cardTitle: { fontSize: 24, fontWeight: '700', color: '#F1F5F9', marginBottom: 8 },
  invoiceId: { fontSize: 14, color: '#888', marginBottom: 24 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusLabel: { fontSize: 14, color: '#888' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  statusPending: { backgroundColor: 'rgba(234,179,8,0.15)' },
  statusPaid: { backgroundColor: 'rgba(34,197,94,0.15)' },
  statusText: { fontSize: 13, fontWeight: '600' },
  qpayBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  qpayBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  checkBtn: {
    backgroundColor: '#0F0F0F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  checkBtnText: { color: '#F1F5F9', fontSize: 15, fontWeight: '500' },
});
