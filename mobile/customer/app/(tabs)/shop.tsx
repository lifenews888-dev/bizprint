import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { apiGet } from '../../lib/api';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price?: number;
  base_price?: number;
  image_url?: string;
  category?: { id: string; name: string };
}

export default function ShopScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const cats = await apiGet('/categories');
      const catList = Array.isArray(cats) ? cats : cats?.data || [];
      setCategories(catList);
    } catch {}

    try {
      const endpoint = selectedCat
        ? `/products?category=${selectedCat}`
        : '/products';
      const prods = await apiGet(endpoint);
      const prodList = Array.isArray(prods) ? prods : prods?.data || [];
      setProducts(prodList);
    } catch {}

    setLoading(false);
  }, [selectedCat]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={s.productCard}
      onPress={() => Alert.alert(item.name, `Бүтээгдэхүүн ID: ${item.id}`)}
    >
      <View style={s.productImage}>
        <Text style={s.productImageText}>{'\uD83D\uDDBC\uFE0F'}</Text>
      </View>
      <Text style={s.productName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={s.productPrice}>
        {Number(item.price || item.base_price || 0).toLocaleString()}\u20AE
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.searchBar}>
        <TextInput
          style={s.searchInput}
          placeholder="Хайх..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.catScroll}
        contentContainerStyle={s.catContainer}
      >
        <TouchableOpacity
          style={[s.catChip, !selectedCat && s.catChipActive]}
          onPress={() => setSelectedCat(null)}
        >
          <Text style={[s.catChipText, !selectedCat && s.catChipTextActive]}>
            Бүгд
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[s.catChip, selectedCat === cat.id && s.catChipActive]}
            onPress={() => setSelectedCat(cat.id)}
          >
            <Text
              style={[
                s.catChipText,
                selectedCat === cat.id && s.catChipTextActive,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={s.productRow}
        contentContainerStyle={s.productList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B00" />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>
              {loading ? 'Ачааллаж байна...' : 'Бүтээгдэхүүн олдсонгүй'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  searchBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchInput: {
    backgroundColor: '#0F0F0F',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F1F5F9',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  catScroll: { maxHeight: 50, marginBottom: 8 },
  catContainer: { paddingHorizontal: 16, gap: 8 },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  catChipActive: {
    backgroundColor: '#FF6B00',
    borderColor: '#FF6B00',
  },
  catChipText: { color: '#888', fontSize: 13, fontWeight: '500' },
  catChipTextActive: { color: '#fff' },
  productList: { paddingHorizontal: 12, paddingBottom: 20 },
  productRow: { gap: 10, marginBottom: 10 },
  productCard: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  productImage: {
    height: 120,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  productImageText: { fontSize: 36 },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B00',
  },
  empty: { paddingTop: 60, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 15 },
});
