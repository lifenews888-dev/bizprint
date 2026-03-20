import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiGet } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    loadBalance();
  }, []);

  async function loadBalance() {
    try {
      const data = await apiGet('/wallet/balance');
      setBalance(data?.balance || data || 0);
    } catch {
      setBalance(0);
    }
  }

  const handleLogout = () => {
    Alert.alert('Гарах', 'Та гарахдаа итгэлтэй байна уу?', [
      { text: 'Үгүй', style: 'cancel' },
      {
        text: 'Тийм',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const menuItems = [
    { icon: '\uD83D\uDCB3', label: 'Хэтэвч', value: `${Number(balance).toLocaleString()}\u20AE` },
    { icon: '\u2699\uFE0F', label: 'Тохиргоо', onPress: () => Alert.alert('Тохиргоо', 'Удахгүй...') },
    { icon: '\u2753', label: 'Тусламж', onPress: () => Alert.alert('Тусламж', 'support@bizprint.mn') },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {user?.full_name?.charAt(0)?.toUpperCase() || '\uD83D\uDC64'}
          </Text>
        </View>
        <Text style={s.name}>{user?.full_name || 'Зочин'}</Text>
        <Text style={s.email}>{user?.email || ''}</Text>
        {user?.role && (
          <View style={s.roleBadge}>
            <Text style={s.roleText}>{user.role}</Text>
          </View>
        )}
      </View>

      <View style={s.menuSection}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={s.menuItem}
            onPress={item.onPress}
            disabled={!item.onPress}
          >
            <Text style={s.menuIcon}>{item.icon}</Text>
            <Text style={s.menuLabel}>{item.label}</Text>
            <Text style={s.menuValue}>{item.value || '\u203A'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Гарах</Text>
      </TouchableOpacity>

      <Text style={s.version}>BizPrint v1.0.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 24, paddingBottom: 60 },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
  email: { fontSize: 14, color: '#888', marginBottom: 12 },
  roleBadge: {
    backgroundColor: 'rgba(255,107,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: { color: '#FF6B00', fontSize: 12, fontWeight: '600' },
  menuSection: { marginBottom: 32 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  menuIcon: { fontSize: 22, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, color: '#F1F5F9', fontWeight: '500' },
  menuValue: { fontSize: 14, color: '#888' },
  logoutBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    marginBottom: 24,
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12, color: '#444' },
});
