import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useAuth } from '../../lib/auth-context'

export default function DriverLogin() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) { setError('Имэйл, нууц үг оруулна уу'); return }
    setLoading(true); setError('')
    try {
      await login(email.trim(), password)
    } catch (e: any) {
      setError(e.message || 'Нэвтрэхэд алдаа гарлаа')
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>
        <View style={s.logoRow}>
          <Text style={s.logo}><Text style={{ color: '#FF6B00' }}>Biz</Text>Print</Text>
          <View style={s.driverBadge}><Text style={s.driverBadgeText}>DRIVER</Text></View>
        </View>
        <Text style={s.subtitle}>Жолоочийн апп</Text>

        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

        <Text style={s.label}>Имэйл</Text>
        <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="driver@bizprint.mn" placeholderTextColor="#555" keyboardType="email-address" autoCapitalize="none" />

        <Text style={s.label}>Нууц үг</Text>
        <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="••••••" placeholderTextColor="#555" secureTextEntry />

        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleLogin} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Нэвтэрж байна...' : 'Нэвтрэх'}</Text>
        </TouchableOpacity>

        <Text style={s.hint}>Зөвхөн бүртгэлтэй жолооч нэвтэрнэ</Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center' },
  inner: { padding: 32 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  logo: { fontSize: 32, fontWeight: '700', color: '#F1F5F9' },
  driverBadge: { backgroundColor: '#FF6B00', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  driverBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  subtitle: { fontSize: 15, color: '#888', marginBottom: 32 },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { color: '#EF4444', fontSize: 13 },
  label: { fontSize: 13, color: '#888', marginBottom: 6, fontWeight: '500' },
  input: { backgroundColor: '#0F0F0F', borderWidth: 1, borderColor: '#1A1A1A', borderRadius: 10, padding: 14, color: '#F1F5F9', fontSize: 15, marginBottom: 16 },
  btn: { backgroundColor: '#FF6B00', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  hint: { textAlign: 'center', color: '#555', fontSize: 12, marginTop: 20 },
})
