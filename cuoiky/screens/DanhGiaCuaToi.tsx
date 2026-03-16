import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'DanhGiaCuaToi'> };

interface DanhGia { id: number; idSach: number; tenSach?: string; soSao?: number; noiDung?: string; ngayDanhGia?: string; }

const Stars = ({ count }: { count: number }) => (
  <Text>{Array.from({ length: 5 }, (_, i) => i < (count ?? 0) ? '⭐' : '☆').join('')}</Text>
);

export default function DanhGiaCuaToi({ navigation }: Props) {
  const [reviews, setReviews] = useState<DanhGia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/DanhGia/DanhGiaCuaToi`);
      const json = await res.json();
      if (json.statusCode === 200 && json.data) setReviews(json.data);
    } catch { } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const renderItem = ({ item }: { item: DanhGia }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.tenSach} numberOfLines={2}>{item.tenSach ?? `Sách #${item.idSach}`}</Text>
        <Stars count={item.soSao ?? 0} />
      </View>
      {item.noiDung ? <Text style={s.noiDung}>{item.noiDung}</Text> : <Text style={s.noiDungEmpty}>Không có nội dung đánh giá</Text>}
      {item.ngayDanhGia && (
        <Text style={s.date}>📅 {new Date(item.ngayDanhGia).toLocaleDateString('vi-VN')}</Text>
      )}
    </View>
  );

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F8F8' }}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>⭐ Đánh Giá Của Tôi</Text>
        <View style={{ width: 40 }} />
      </View>

      {reviews.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 52, marginBottom: 12 }}>⭐</Text>
          <Text style={{ color: '#999', fontSize: 16 }}>Chưa có đánh giá nào</Text>
          <Text style={{ color: '#bbb', fontSize: 13, marginTop: 6 }}>Hãy mua sách và đánh giá sau khi nhận hàng</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={r => r.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReviews(); }} colors={[RED]} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: RED, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  tenSach: { flex: 1, fontSize: 15, fontWeight: '700', color: '#222', marginRight: 10, lineHeight: 20 },
  noiDung: { fontSize: 14, color: '#555', lineHeight: 21 },
  noiDungEmpty: { fontSize: 13, color: '#bbb', fontStyle: 'italic' },
  date: { fontSize: 11, color: '#aaa', marginTop: 8 },
});
