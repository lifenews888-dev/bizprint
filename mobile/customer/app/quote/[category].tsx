import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiPost } from '../../lib/api';

type Category = 'offset' | 'hadag' | 'wide';

// -- OFFSET CONFIG --
const OFFSET_SIZES = ['A4', 'A5', 'A3', 'BC'];
const OFFSET_GSM = ['80', '100', '128', '150', '200', '250', '300'];
const OFFSET_FINISHING = ['none', 'lamination_glossy', 'lamination_matte', 'uv_coating', 'foil'];

// -- HADAG CONFIG --
const HADAG_PRODUCTS = ['tovgor', 'nerj', 'd3', 'pvc', 'epoxy', 'sambar'];

// -- WIDE CONFIG --
const WIDE_TYPES = ['banner', 'sticker', 'flag', 'canvas'];

interface QuoteResult {
  total_price?: number;
  unit_price?: number;
  breakdown?: Array<{ label: string; amount: number }>;
}

export default function QuoteScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const cat = (category || 'offset') as Category;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Offset state
  const [size, setSize] = useState('A4');
  const [quantity, setQuantity] = useState('100');
  const [gsm, setGsm] = useState('128');
  const [colorMode, setColorMode] = useState<'full' | 'bw'>('full');
  const [sides, setSides] = useState<'single' | 'double'>('single');
  const [finishing, setFinishing] = useState('none');
  const [rush, setRush] = useState(false);

  // Hadag state
  const [hadagProduct, setHadagProduct] = useState('tovgor');
  const [hadagSize, setHadagSize] = useState('');
  const [hadagQty, setHadagQty] = useState('100');

  // Wide state
  const [wideType, setWideType] = useState('banner');
  const [wideWidth, setWideWidth] = useState('');
  const [wideLength, setWideLength] = useState('');

  const [result, setResult] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const calculate = useCallback(async () => {
    setLoading(true);
    try {
      let endpoint = '';
      let body: any = {};

      if (cat === 'offset') {
        endpoint = '/quote-engine/calculate-offset';
        body = {
          size,
          quantity: parseInt(quantity) || 100,
          gsm: parseInt(gsm) || 128,
          color: colorMode,
          sides,
          finishing,
          rush,
        };
      } else if (cat === 'hadag') {
        endpoint = '/quote-engine/calculate-hadag';
        body = {
          product: hadagProduct,
          size: hadagSize || undefined,
          quantity: parseInt(hadagQty) || 100,
        };
      } else {
        endpoint = '/quote-engine/calculate-wide';
        body = {
          type: wideType,
          width: parseFloat(wideWidth) || 1,
          length: parseFloat(wideLength) || 1,
        };
      }

      const data = await apiPost(endpoint, body);
      setResult(data);
    } catch {
      setResult(null);
    }
    setLoading(false);
  }, [cat, size, quantity, gsm, colorMode, sides, finishing, rush, hadagProduct, hadagSize, hadagQty, wideType, wideWidth, wideLength]);

  // Debounced calculation
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      calculate();
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [calculate]);

  const submitOrder = async () => {
    if (!result?.total_price) {
      Alert.alert('Алдаа', 'Эхлээд үнэ тооцоолно уу');
      return;
    }
    setSubmitting(true);
    try {
      const body: any = {
        category: cat,
        total_amount: result.total_price,
        guest_name: 'Зочин',
        guest_email: 'guest@bizprint.mn',
      };

      if (cat === 'offset') {
        body.specs = { size, quantity: parseInt(quantity), gsm: parseInt(gsm), color: colorMode, sides, finishing, rush };
      } else if (cat === 'hadag') {
        body.specs = { product: hadagProduct, size: hadagSize, quantity: parseInt(hadagQty) };
      } else {
        body.specs = { type: wideType, width: parseFloat(wideWidth), length: parseFloat(wideLength) };
      }

      await apiPost('/quotes-v2', body);
      Alert.alert('Амжилттай', 'Үнийн санал илгээгдлээ', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Алдаа', e?.message || 'Алдаа гарлаа');
    }
    setSubmitting(false);
  };

  const getCategoryTitle = () => {
    switch (cat) {
      case 'offset': return 'Офсет хэвлэл';
      case 'hadag': return 'Хаяг реклам';
      case 'wide': return 'Өргөн хэвлэл';
      default: return 'Үнэ тооцоолох';
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={() => router.back()} style={s.backRow}>
        <Text style={s.backArrow}>{'\u2190'}</Text>
        <Text style={s.backLabel}>Буцах</Text>
      </TouchableOpacity>

      <Text style={s.title}>{getCategoryTitle()}</Text>

      {cat === 'offset' && (
        <View style={s.form}>
          <Text style={s.label}>Хэмжээ</Text>
          <View style={s.chipRow}>
            {OFFSET_SIZES.map((v) => (
              <TouchableOpacity
                key={v}
                style={[s.chip, size === v && s.chipActive]}
                onPress={() => setSize(v)}
              >
                <Text style={[s.chipText, size === v && s.chipTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Тоо ширхэг</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="100"
            placeholderTextColor="#555"
          />

          <Text style={s.label}>Цаасны GSM</Text>
          <View style={s.chipRow}>
            {OFFSET_GSM.map((v) => (
              <TouchableOpacity
                key={v}
                style={[s.chip, gsm === v && s.chipActive]}
                onPress={() => setGsm(v)}
              >
                <Text style={[s.chipText, gsm === v && s.chipTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Өнгө</Text>
          <View style={s.chipRow}>
            <TouchableOpacity
              style={[s.chip, colorMode === 'full' && s.chipActive]}
              onPress={() => setColorMode('full')}
            >
              <Text style={[s.chipText, colorMode === 'full' && s.chipTextActive]}>
                Бүтэн өнгөт
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.chip, colorMode === 'bw' && s.chipActive]}
              onPress={() => setColorMode('bw')}
            >
              <Text style={[s.chipText, colorMode === 'bw' && s.chipTextActive]}>
                Хар цагаан
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={s.label}>Тал</Text>
          <View style={s.chipRow}>
            <TouchableOpacity
              style={[s.chip, sides === 'single' && s.chipActive]}
              onPress={() => setSides('single')}
            >
              <Text style={[s.chipText, sides === 'single' && s.chipTextActive]}>
                Нэг тал
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.chip, sides === 'double' && s.chipActive]}
              onPress={() => setSides('double')}
            >
              <Text style={[s.chipText, sides === 'double' && s.chipTextActive]}>
                Хоёр тал
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={s.label}>Дуусгалт</Text>
          <View style={s.chipRow}>
            {OFFSET_FINISHING.map((v) => (
              <TouchableOpacity
                key={v}
                style={[s.chip, finishing === v && s.chipActive]}
                onPress={() => setFinishing(v)}
              >
                <Text style={[s.chipText, finishing === v && s.chipTextActive]}>
                  {getFinishingLabel(v)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[s.toggleRow, rush && s.toggleRowActive]}
            onPress={() => setRush(!rush)}
          >
            <Text style={s.toggleLabel}>Яаралтай захиалга</Text>
            <View style={[s.toggle, rush && s.toggleActive]}>
              <View style={[s.toggleDot, rush && s.toggleDotActive]} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {cat === 'hadag' && (
        <View style={s.form}>
          <Text style={s.label}>Бүтээгдэхүүн</Text>
          <View style={s.chipRow}>
            {HADAG_PRODUCTS.map((v) => (
              <TouchableOpacity
                key={v}
                style={[s.chip, hadagProduct === v && s.chipActive]}
                onPress={() => setHadagProduct(v)}
              >
                <Text style={[s.chipText, hadagProduct === v && s.chipTextActive]}>
                  {getHadagLabel(v)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Хэмжээ (жишээ: 90x50)</Text>
          <TextInput
            style={s.input}
            value={hadagSize}
            onChangeText={setHadagSize}
            placeholder="90x50"
            placeholderTextColor="#555"
          />

          <Text style={s.label}>Тоо ширхэг</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={hadagQty}
            onChangeText={setHadagQty}
            placeholder="100"
            placeholderTextColor="#555"
          />
        </View>
      )}

      {cat === 'wide' && (
        <View style={s.form}>
          <Text style={s.label}>Төрөл</Text>
          <View style={s.chipRow}>
            {WIDE_TYPES.map((v) => (
              <TouchableOpacity
                key={v}
                style={[s.chip, wideType === v && s.chipActive]}
                onPress={() => setWideType(v)}
              >
                <Text style={[s.chipText, wideType === v && s.chipTextActive]}>
                  {getWideLabel(v)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Өргөн (м)</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={wideWidth}
            onChangeText={setWideWidth}
            placeholder="1.0"
            placeholderTextColor="#555"
          />

          <Text style={s.label}>Урт (м)</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={wideLength}
            onChangeText={setWideLength}
            placeholder="2.0"
            placeholderTextColor="#555"
          />
        </View>
      )}

      {/* Result */}
      <View style={s.resultCard}>
        <Text style={s.resultTitle}>Үнийн тооцоо</Text>
        {loading ? (
          <ActivityIndicator color="#FF6B00" style={{ marginVertical: 20 }} />
        ) : result?.total_price ? (
          <>
            <View style={s.resultRow}>
              <Text style={s.resultLabel}>Нийт үнэ</Text>
              <Text style={s.resultTotal}>
                {Number(result.total_price).toLocaleString()}{'\u20AE'}
              </Text>
            </View>
            {result.unit_price != null && (
              <View style={s.resultRow}>
                <Text style={s.resultLabel}>Нэгж үнэ</Text>
                <Text style={s.resultValue}>
                  {Number(result.unit_price).toLocaleString()}{'\u20AE'}
                </Text>
              </View>
            )}
            {result.breakdown?.map((item, i) => (
              <View key={i} style={s.resultRow}>
                <Text style={s.resultLabel}>{item.label}</Text>
                <Text style={s.resultValue}>
                  {Number(item.amount).toLocaleString()}{'\u20AE'}
                </Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={s.resultEmpty}>Тооцоо хийгдээгүй</Text>
        )}
      </View>

      <TouchableOpacity
        style={[s.submitBtn, submitting && { opacity: 0.6 }]}
        onPress={submitOrder}
        disabled={submitting}
      >
        <Text style={s.submitBtnText}>
          {submitting ? 'Илгээж байна...' : 'Захиалга үүсгэх'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function getFinishingLabel(v: string): string {
  switch (v) {
    case 'none': return 'Байхгүй';
    case 'lamination_glossy': return 'Гялгар';
    case 'lamination_matte': return 'Матт';
    case 'uv_coating': return 'UV';
    case 'foil': return 'Фойл';
    default: return v;
  }
}

function getHadagLabel(v: string): string {
  switch (v) {
    case 'tovgor': return 'Товгор';
    case 'nerj': return 'Нэрж';
    case 'd3': return '3D';
    case 'pvc': return 'PVC';
    case 'epoxy': return 'Эпокси';
    case 'sambar': return 'Самбар';
    default: return v;
  }
}

function getWideLabel(v: string): string {
  switch (v) {
    case 'banner': return 'Баннер';
    case 'sticker': return 'Стикер';
    case 'flag': return 'Тугны';
    case 'canvas': return 'Канвас';
    default: return v;
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 20 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 8 },
  backArrow: { fontSize: 20, color: '#F1F5F9' },
  backLabel: { fontSize: 15, color: '#F1F5F9', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: '700', color: '#F1F5F9', marginBottom: 24 },
  form: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#888', marginBottom: 10, marginTop: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  chipActive: { backgroundColor: '#FF6B00', borderColor: '#FF6B00' },
  chipText: { color: '#888', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  input: {
    backgroundColor: '#0F0F0F',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F1F5F9',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F0F0F',
    padding: 16,
    borderRadius: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  toggleRowActive: { borderColor: '#FF6B00' },
  toggleLabel: { fontSize: 14, color: '#F1F5F9', fontWeight: '500' },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: { backgroundColor: '#FF6B00' },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#888',
  },
  toggleDotActive: {
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
  },
  resultCard: {
    backgroundColor: '#0F0F0F',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  resultTitle: { fontSize: 17, fontWeight: '700', color: '#F1F5F9', marginBottom: 16 },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  resultLabel: { fontSize: 14, color: '#888' },
  resultTotal: { fontSize: 20, fontWeight: '700', color: '#FF6B00' },
  resultValue: { fontSize: 14, color: '#F1F5F9', fontWeight: '500' },
  resultEmpty: { color: '#555', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  submitBtn: {
    backgroundColor: '#FF6B00',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
