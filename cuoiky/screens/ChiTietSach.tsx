import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, StatusBar, FlatList,
} from 'react-native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch } from '../services/api';

const RED = '#E85A4F';
type Props = NativeStackScreenProps<RootStackParamList, 'ChiTietSach'>;

interface Review { id: number; email: string; soSao?: number; noiDung?: string; ngayDanhGia?: string; }

export default function ChiTietSach({ route, navigation }: Props) {
  const { sach } = route.params;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgStar, setAvgStar] = useState(0);
  const [addingCart, setAddingCart] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Increase view count
        await fetch(`${BASE_URL}/api/SachController/TangLuotXem/${sach.id}`, { method: 'POST' });
        // Fetch reviews
        const res = await fetch(`${BASE_URL}/api/DanhGia/Sach/${sach.id}`);
        const json = await res.json();
        if (json.statusCode === 200 && json.data) {
          setReviews(json.data);
          const avg = json.data.length > 0 ? json.data.reduce((s: number, r: Review) => s + (r.soSao ?? 0), 0) / json.data.length : 0;
          setAvgStar(Math.round(avg * 10) / 10);
        }
      } catch { }
    })();
  }, [sach.id]);

  const themGioHang = async () => {
    setAddingCart(true);
    try {
      const res = await authFetch(`${BASE_URL}/api/CartShop/ThemSanPham`, {
        method: 'POST',
        body: JSON.stringify({ idSach: sach.id, soLuong: 1 }),
      });
      const json = await res.json();
      Alert.alert(json.statusCode === 200 ? '✅ Thành công' : '❌ Lỗi', json.message || '');
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ');
    } finally {
      setAddingCart(false);
    }
  };

  const hetHang = (sach.soLuong ?? 0) <= 0;

  const Stars = ({ count }: { count: number }) => (
    <Text style={{ fontSize: 14 }}>{Array.from({ length: 5 }, (_, i) => i < Math.round(count) ? '⭐' : '☆').join('')}</Text>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F8F8' }}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>Chi tiết sách</Text>
        <TouchableOpacity style={{ width: 40 }} onPress={() => navigation.navigate('Cart')}>
          <Text style={{ fontSize: 22, color: '#fff', textAlign: 'right' }}>🛒</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Book cover */}
        <View style={s.imgContainer}>
          {sach.hinhAnh
            ? <Image source={{ uri: sach.hinhAnh }} style={s.img} resizeMode="contain" />
            : <View style={s.imgPlaceholder}><Text style={{ fontSize: 80 }}>📖</Text></View>
          }
          {hetHang && (
            <View style={s.hetHangOverlay}>
              <Text style={s.hetHangText}>Hết hàng</Text>
            </View>
          )}
        </View>

        <View style={s.content}>
          <Text style={s.tenSach}>{sach.tenSach}</Text>
          <Text style={s.tacGia}>Tác giả: {sach.tenTacGia ?? 'Không rõ'}</Text>

          <View style={s.infoRow}>
            <View style={s.infoChip}>
              <Text style={s.infoChipText}>📚 Còn {sach.soLuong ?? 0} quyển</Text>
            </View>
            {sach.luotXem != null && (
              <View style={s.infoChip}>
                <Text style={s.infoChipText}>👁️ {sach.luotXem} lượt xem</Text>
              </View>
            )}
          </View>

          {reviews.length > 0 && (
            <View style={s.starRow}>
              <Stars count={avgStar} />
              <Text style={s.avgStar}> {avgStar} ({reviews.length} đánh giá)</Text>
            </View>
          )}

          <Text style={s.gia}>{(sach.gia ?? 0).toLocaleString('vi-VN')} đ</Text>

          {sach.moTa ? (
            <>
              <Text style={s.sectionTitle}>Mô tả</Text>
              <Text style={s.moTa}>{sach.moTa}</Text>
            </>
          ) : null}

          {/* Reviews */}
          {reviews.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Đánh giá ({reviews.length})</Text>
              {reviews.map(r => (
                <View key={r.id} style={s.reviewCard}>
                  <View style={s.reviewHeader}>
                    <Text style={s.reviewEmail}>{r.email}</Text>
                    <Stars count={r.soSao ?? 0} />
                  </View>
                  {r.noiDung ? <Text style={s.reviewContent}>{r.noiDung}</Text> : null}
                  {r.ngayDanhGia && (
                    <Text style={s.reviewDate}>{new Date(r.ngayDanhGia).toLocaleDateString('vi-VN')}</Text>
                  )}
                </View>
              ))}
            </>
          )}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={s.bottomBar}>
        <View>
          <Text style={{ fontSize: 11, color: '#888' }}>Giá</Text>
          <Text style={s.bottomPrice}>{(sach.gia ?? 0).toLocaleString('vi-VN')} đ</Text>
        </View>
        <TouchableOpacity
          style={[s.addBtn, hetHang && s.addBtnDisabled]}
          disabled={hetHang || addingCart}
          onPress={themGioHang}
          activeOpacity={0.85}
        >
          {addingCart ? <ActivityIndicator color="#fff" /> : <Text style={s.addBtnText}>{hetHang ? 'Hết hàng' : '🛒 Thêm giỏ hàng'}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: RED, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  imgContainer: { backgroundColor: '#fff', height: 260, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  img: { width: '70%', height: '90%' },
  imgPlaceholder: { justifyContent: 'center', alignItems: 'center', width: '70%', height: '90%', backgroundColor: '#F5F5F5', borderRadius: 12 },
  hetHangOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  hetHangText: { color: '#fff', fontWeight: '700', fontSize: 22 },
  content: { padding: 20 },
  tenSach: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 6, lineHeight: 30 },
  tacGia: { fontSize: 14, color: '#666', marginBottom: 12 },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  infoChip: { backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  infoChipText: { fontSize: 12, color: '#444' },
  starRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avgStar: { fontSize: 14, color: '#666' },
  gia: { fontSize: 28, fontWeight: '800', color: RED, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 10, marginTop: 4 },
  moTa: { fontSize: 14, color: '#555', lineHeight: 22 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 2 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewEmail: { fontSize: 13, fontWeight: '600', color: '#333', flex: 1, marginRight: 8 },
  reviewContent: { fontSize: 13, color: '#555', lineHeight: 20 },
  reviewDate: { fontSize: 11, color: '#aaa', marginTop: 6 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', elevation: 10 },
  bottomPrice: { fontSize: 22, fontWeight: '800', color: RED },
  addBtn: { backgroundColor: RED, borderRadius: 30, paddingHorizontal: 28, paddingVertical: 14, elevation: 4 },
  addBtnDisabled: { backgroundColor: '#ccc' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
