import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Cart'> };

interface CartItem { id: number; idSach: number; tenSach: string; hinhAnh?: string; gia?: number; soLuong?: number; }

export default function CartScreen({ navigation }: Props) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/CartShop/HienThiGioHang`);
      const json = await res.json();
      if (json.statusCode === 200 && json.data?.items) {
        setItems(json.data.items);
      } else {
        setItems([]);
      }
    } catch { } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const onRefresh = () => { setRefreshing(true); fetchCart(); };

  const capNhatSoLuong = async (id: number, soLuong: number) => {
    if (soLuong < 1) { xoaSanPham(id); return; }
    try {
      const res = await authFetch(`${BASE_URL}/api/CartShop/SuaSoLuong/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ soLuong }),
      });
      const json = await res.json();
      if (json.statusCode === 200 || res.ok) {
        setItems(prev => prev.map(i => i.id === id ? { ...i, soLuong } : i));
      } else {
        Alert.alert('Thông báo', json.message || 'Số lượng không hợp lệ');
      }
    } catch { Alert.alert('Lỗi', 'Không thể kết nối máy chủ'); }
  };

  const xoaSanPham = async (id: number) => {
    Alert.alert('Xóa sản phẩm', 'Bạn có chắc muốn xóa sản phẩm này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            await authFetch(`${BASE_URL}/api/CartShop/XoaSanPham/${id}`, { method: 'DELETE' });
            setItems(prev => prev.filter(i => i.id !== id));
          } catch { Alert.alert('Lỗi', 'Không thể xóa sản phẩm'); }
        }
      }
    ]);
  };

  const tongTien = items.reduce((sum, i) => sum + (i.gia ?? 0) * (i.soLuong ?? 1), 0);

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={s.card}>
      {item.hinhAnh
        ? <Image source={{ uri: item.hinhAnh }} style={s.img} resizeMode="cover" />
        : <View style={[s.img, s.imgPlaceholder]}><Text style={{ fontSize: 32 }}>📖</Text></View>
      }
      <View style={s.info}>
        <Text style={s.tenSach} numberOfLines={2}>{item.tenSach}</Text>
        <Text style={s.gia}>{(item.gia ?? 0).toLocaleString('vi-VN')} đ</Text>
        <View style={s.qtyRow}>
          <TouchableOpacity style={s.qtyBtn} onPress={() => capNhatSoLuong(item.id, (item.soLuong ?? 1) - 1)}>
            <Text style={s.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={s.qty}>{item.soLuong ?? 1}</Text>
          <TouchableOpacity style={s.qtyBtn} onPress={() => capNhatSoLuong(item.id, (item.soLuong ?? 1) + 1)}>
            <Text style={s.qtyBtnText}>＋</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.deleteBtn} onPress={() => xoaSanPham(item.id)}>
            <Text style={s.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🛒 Giỏ Hàng ({items.length})</Text>
        <View style={{ width: 40 }} />
      </View>

      {items.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>🛒</Text>
          <Text style={{ fontSize: 16, color: '#999' }}>Giỏ hàng trống</Text>
          <TouchableOpacity style={s.shopBtn} onPress={() => navigation.navigate('Index')}>
            <Text style={s.shopBtnText}>Mua sắm ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={i => i.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[RED]} />}
          />
          <View style={s.footer}>
            <View>
              <Text style={s.totalLabel}>Tổng cộng:</Text>
              <Text style={s.totalValue}>{tongTien.toLocaleString('vi-VN')} đ</Text>
            </View>
            <TouchableOpacity style={s.checkoutBtn} onPress={() => navigation.navigate('Checkout')} activeOpacity={0.85}>
              <Text style={s.checkoutBtnText}>Đặt hàng →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: RED, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 12, elevation: 3, gap: 12 },
  img: { width: 80, height: 80, borderRadius: 10 },
  imgPlaceholder: { backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  tenSach: { fontSize: 14, fontWeight: '600', color: '#222', marginBottom: 4, lineHeight: 19 },
  gia: { fontSize: 15, fontWeight: '700', color: RED, marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 18, color: '#333', fontWeight: '700' },
  qty: { fontSize: 16, fontWeight: '700', color: '#222', minWidth: 24, textAlign: 'center' },
  deleteBtn: { marginLeft: 'auto' },
  deleteBtnText: { fontSize: 18 },
  shopBtn: { marginTop: 16, backgroundColor: RED, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 30 },
  shopBtnText: { color: '#fff', fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', elevation: 10 },
  totalLabel: { fontSize: 12, color: '#888' },
  totalValue: { fontSize: 20, fontWeight: '700', color: RED },
  checkoutBtn: { backgroundColor: RED, borderRadius: 30, paddingHorizontal: 28, paddingVertical: 14, elevation: 4 },
  checkoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
