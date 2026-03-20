import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Link } from 'expo-router'

export default function HomeScreen() {
  return (
    <ScrollView style={s.container}>
      <View style={s.hero}>
        <Text style={s.badge}>Print Industry Platform</Text>
        <Text style={s.heroTitle}>
          Хэвлэлийн бүх{'\n'}
          <Text style={{ color: '#FF6B00' }}>шийдэл</Text> нэг дор
        </Text>
        <Text style={s.heroSub}>
          AI-д суурилсан үнийн тооцоо, автомат үйлдвэр сонголт, бодит цагийн хүргэлт
        </Text>
        <Link href="/quote" asChild>
          <TouchableOpacity style={s.ctaBtn}>
            <Text style={s.ctaBtnText}>Үнийн санал авах</Text>
          </TouchableOpacity>
        </Link>
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Яагаад BizPrint?</Text>
        {[
          { icon: '⚡', title: '1 секундэд үнэ', desc: 'AI системтэй үнэ тооцоолол' },
          { icon: '🏭', title: 'Олон үйлдвэр', desc: 'Монголын шилдэг үйлдвэрүүдтэй' },
          { icon: '🚚', title: 'Хурдан хүргэлт', desc: 'Хотын дотор 24-48 цагт' },
          { icon: '💯', title: 'Чанарын баталгаа', desc: '100% чанарын баталгаатай' },
        ].map(f => (
          <View key={f.title} style={s.featureCard}>
            <Text style={{ fontSize: 28 }}>{f.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  hero: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  badge: { color: '#FF6B00', fontSize: 12, fontWeight: '500', marginBottom: 16, backgroundColor: 'rgba(255,107,0,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', overflow: 'hidden' },
  heroTitle: { fontSize: 36, fontWeight: '700', color: '#F1F5F9', lineHeight: 42, marginBottom: 12 },
  heroSub: { fontSize: 15, color: '#888', lineHeight: 22, marginBottom: 24 },
  ctaBtn: { backgroundColor: '#FF6B00', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10, alignSelf: 'flex-start' },
  ctaBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  section: { padding: 24 },
  sectionTitle: { fontSize: 24, fontWeight: '700', color: '#F1F5F9', marginBottom: 20 },
  featureCard: { flexDirection: 'row', gap: 14, backgroundColor: '#0F0F0F', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1A1A1A' },
  featureTitle: { fontSize: 15, fontWeight: '600', color: '#F1F5F9', marginBottom: 4 },
  featureDesc: { fontSize: 13, color: '#888' },
})
