import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native'
import { apiGet } from '../../lib/api'
import { useAuth } from '../../lib/auth-context'

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const [balance, setBalance] = useState(0)

  useEffect(() => {
    apiGet('/wallet/balance').then(d => setBalance(d?.balance || d || 0)).catch(() => {})
  }, [])

  const handleLogout = () => {
    Alert.alert('Гарах', 'Та гарахдаа итгэлтэй байна уу?', [
      { text: 'Үгүй', style: 'cancel' },
      { text: 'Тийм', style: 'destructive', onPress: logout },
    ])
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.profileCard}>
        <View style={s.avatar}><Text style={s.avatarText}>{user?.full_name?.charAt(0)?.toUpperCase() || '🚚'}</Text></View>
        <Text style={s.name}>{user?.full_name || 'Жолооч'}</Text>
        <Text style={s.email}>{user?.email || ''}</Text>
        <View style={s.roleBadge}><Text style={s.roleText}>ЖОЛООЧ</Text></View>
      </View>

      <View style={s.walletCard}>
        <Text style={s.walletLabel}>Хэтэвч</Text>
        <Text style={s.walletValue}>{Number(balance).toLocaleString()}₮</Text>
      </View>

      <View style={s.menu}>
        {[
          { icon: '📊', label: 'Хүргэлтийн статистик', onPress: () => Alert.alert('Статистик', 'Удахгүй...') },
          { icon: '⚙️', label: 'Тохиргоо', onPress: () => Alert.alert('Тохиргоо', 'Удахгүй...') },
          { icon: '❓', label: 'Тусламж', onPress: () => Alert.alert('Тусламж', 'support@bizprint.mn') },
        ].map(item => (
          <TouchableOpacity key={item.label} style={s.menuItem} onPress={item.onPress}>
            <Text style={s.menuIcon}>{item.icon}</Text>
            <Text style={s.menuLabel}>{item.label}</Text>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Гарах</Text>
      </TouchableOpacity>

      <Text style={s.version}>BizPrint Driver v1.0.0</Text>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 24, paddingBottom: 60 },
  profileCard: { alignItems: 'center', paddingVertical: 28, marginBottom: 20 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#FF6B00', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  avatarText: { fontSize: 30, color: '#fff', fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: '#F1F5F9', marginBottom: 4 },
  email: { fontSize: 14, color: '#888', marginBottom: 10 },
  roleBadge: { backgroundColor: 'rgba(255,107,0,0.12)', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 8 },
  roleText: { color: '#FF6B00', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  walletCard: { backgroundColor: '#0F0F0F', borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#1A1A1A' },
  walletLabel: { fontSize: 13, color: '#888', marginBottom: 4 },
  walletValue: { fontSize: 28, fontWeight: '700', color: '#22c55e' },
  menu: { marginBottom: 28 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F0F0F', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1A1A1A' },
  menuIcon: { fontSize: 20, marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, color: '#F1F5F9', fontWeight: '500' },
  menuArrow: { fontSize: 18, color: '#555' },
  logoutBtn: { backgroundColor: 'rgba(239,68,68,0.1)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', marginBottom: 20 },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12, color: '#444' },
})
