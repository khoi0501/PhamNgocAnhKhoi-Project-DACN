import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Clipboard,
  ActivityIndicator, RefreshControl, StatusBar, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'DanhSachPhieuGiamGia'> };

interface PhieuGiamGia {
  id: number; maGiamGia: string; giaTriGiam: number; ngayKetThuc: string;
  loaiPhieuGiamGia: string; dieuKienGiamGia?: string; noiDung?: string; daysRemaining: number;
}

export default function DanhSachPhieuGiamGia({ navigation }: Props) {
  const [list, setList] = useState<PhieuGiamGia[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/PhieuGiamGia/User/List`);
      const json = await res.json();
      if (json.statusCode === 200 && json.data) setList(json.data);
    } catch { } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const copyCode = (ma: string) => {
    Clipboard.setString(ma);
    Alert.alert('✅ Đã sao chép', `Mã "${ma}" đã được sao chép`);
  };

  const renderItem = ({ item }: { item: PhieuGiamGia }) => {
    const isPct = item.loaiPhieuGiamGia === 'Phần trăm';
    const urgent = item.daysRemaining <= 3;

    return (
      <View style={s.card}>
        <View style={s.leftBar} />
        <View style={s.cardContent}>
          <View style={s.topRow}>
            <View style={s.badgeWrap}>
              <Text style={s.badgeText}>{isPct ? `${item.giaTriGiam}%` : `${item.giaTriGiam.toLocaleString('vi-VN')}đ`} OFF</Text>
            </View>
            {urgent && <View style={s.urgentBadge}><Text style={s.urgentText}>🔥 Sắp hết hạn!</Text></View>}
          </View>

          <TouchableOpacity style={s.codeBox} onPress={() => copyCode(item.maGiamGia)} activeOpacity={0.7}>
            <Text style={s.code}>{item.maGiamGia}</Text>
            <Text style={s.copyHint}>Nhấn để sao chép</Text>
          </TouchableOpacity>

          {item.noiDung && <Text style={s.desc}>{item.noiDung}</Text>}
          {item.dieuKienGiamGia && <Text style={s.condition}>📋 {item.dieuKienGiamGia}</Text>}

          <Text style={[s.expire, urgent && { color: '#F44336' }]}>
            ⏳ Hết hạn: {new Date(item.ngayKetThuc).toLocaleDateString('vi-VN')} (còn {item.daysRemaining} ngày)
          </Text>
        </View>
      </View>
    );
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F8F8' }}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🎁 Ưu Đãi Của Bạn</Text>
        <View style={{ width: 40 }} />
      </View>

      {list.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 52, marginBottom: 12 }}>🎁</Text>
          <Text style={{ color: '#999', fontSize: 16 }}>Hiện không có ưu đãi nào</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={i => i.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchList(); }} colors={[RED]} />}
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
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 3 },
  leftBar: { width: 6, backgroundColor: RED },
  cardContent: { flex: 1, padding: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  badgeWrap: { backgroundColor: RED, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  urgentBadge: { backgroundColor: '#FFF3E0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  urgentText: { color: '#FF9800', fontSize: 12, fontWeight: '600' },
  codeBox: { borderWidth: 1.5, borderColor: RED, borderRadius: 10, borderStyle: 'dashed', padding: 12, alignItems: 'center', marginBottom: 8, backgroundColor: '#FFF9F9' },
  code: { fontSize: 20, fontWeight: '800', color: RED, letterSpacing: 2 },
  copyHint: { fontSize: 10, color: '#aaa', marginTop: 4 },
  desc: { fontSize: 13, color: '#555', marginBottom: 4 },
  condition: { fontSize: 12, color: '#777', marginBottom: 6 },
  expire: { fontSize: 12, color: '#888' },
});
