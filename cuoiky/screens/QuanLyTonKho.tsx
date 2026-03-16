import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, TextInput, Modal, Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch, getPermissions, findPermission } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'QuanLyTonKho'> };

export default function QuanLyTonKho({ navigation }: Props) {
  const [list, setList] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [xuatItem, setXuatItem] = useState<any | null>(null);
  const [soLuongXuat, setSoLuongXuat] = useState('');
  const [xuatLoading, setXuatLoading] = useState(false);

  // RBAC
  const [hasEditPerm, setHasEditPerm] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/TonKho/LayDanhSach`);
      const json = await res.json();
      if (json.statusCode === 200 && json.data) {
        setList(json.data);
        setFiltered(json.data);
      }
      
      // Load permissions
      const perms = await getPermissions();
      if (perms.some((p: any) => p.full)) {
        setHasEditPerm(true);
      } else {
        const tkPerm = findPermission(perms, { exact: ['tồn kho', 'quản lý tồn kho', 'kho'], matches: ['tồn kho'] });
        setHasEditPerm(tkPerm ? tkPerm.quyenSua : false);
      }
    } catch { } finally { setLoading(false); setRefreshing(false); }
  }, []);

  const xuatKho = async () => {
    if (!xuatItem) return;
    const sl = parseInt(soLuongXuat);
    if (!sl || sl <= 0) { Alert.alert('Lỗi', 'Số lượng xuất phải lớn hơn 0'); return; }
    if (sl > (xuatItem.soLuong ?? 0)) { Alert.alert('Lỗi', `Tồn kho chỉ còn ${xuatItem.soLuong} quyển`); return; }
    setXuatLoading(true);
    try {
      const res = await authFetch(`${BASE_URL}/api/TonKho/XuatKho`, {
        method: 'POST',
        body: JSON.stringify({ idTonKho: xuatItem.id, soLuongXuat: sl }),
      });
      const json = await res.json();
      if (json.statusCode === 200) {
        Alert.alert('✅ Thành công', `Đã xuất ${sl} quyển "${xuatItem.tenSach}"
Tồn kho còn lại: ${json.data?.soLuongTonKhoConLai ?? '?'}`);
        setXuatItem(null);
        setSoLuongXuat('');
        fetchList();
      } else {
        Alert.alert('Lỗi', json.message || 'Không thể xuất kho');
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ');
    } finally {
      setXuatLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    setFiltered(list.filter(s =>
      !search.trim() || (s.tenSach || '').toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, list]);

  const duHang = filtered.filter(s => (s.soLuong ?? 0) > 10).length;
  const sapHet = filtered.filter(s => (s.soLuong ?? 0) > 0 && (s.soLuong ?? 0) <= 10).length;
  const hetHang = filtered.filter(s => (s.soLuong ?? 0) <= 0).length;

  const renderItem = ({ item }: { item: any }) => {
    const qty = item.soLuong ?? 0;
    const statusColor = qty > 10 ? '#4CAF50' : qty > 0 ? '#FF9800' : '#F44336';

    return (
      <View style={s.card}>
        <View style={[s.qtyBox, { borderColor: statusColor }]}>
          <Text style={[s.qtyNum, { color: statusColor }]}>{qty}</Text>
          <Text style={s.qtyLabel}>quyển</Text>
        </View>
        <View style={s.info}>
          <Text style={s.name} numberOfLines={2}>{item.tenSach}</Text>
          <Text style={s.sub}>{item.tenTacGia ?? 'Không rõ tác giả'}</Text>
          {item.tenTheLoai ? <Text style={s.theLoai}>{item.tenTheLoai}</Text> : null}
        </View>
        <TouchableOpacity
          style={[s.xuatBtn, { opacity: (qty <= 0 || !hasEditPerm) ? 0.4 : 1 }]}
          onPress={() => hasEditPerm ? (setSoLuongXuat(''), setXuatItem(item)) : Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền sửa (xuất) tồn kho.')}
          disabled={qty <= 0 || !hasEditPerm}
        >
          <Text style={s.xuatBtnText}>Xuất{`\n`}kho</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F2F5' }}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🗃️ Tồn Kho</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tóm tắt */}
      <View style={s.summaryRow}>
        <View style={s.sumItem}>
          <Text style={[s.sumNum, { color: '#4CAF50' }]}>{duHang}</Text>
          <Text style={s.sumLabel}>Đủ hàng</Text>
        </View>
        <View style={s.divider} />
        <View style={s.sumItem}>
          <Text style={[s.sumNum, { color: '#FF9800' }]}>{sapHet}</Text>
          <Text style={s.sumLabel}>Sắp hết</Text>
        </View>
        <View style={s.divider} />
        <View style={s.sumItem}>
          <Text style={[s.sumNum, { color: '#F44336' }]}>{hetHang}</Text>
          <Text style={s.sumLabel}>Hết hàng</Text>
        </View>
      </View>

      <View style={s.searchWrap}>
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch}
          placeholder="Tìm kiếm sách..." placeholderTextColor="#aaa" />
      </View>

      {loading
        ? <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>
        : <FlatList
            data={filtered}
            keyExtractor={i => i.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 12, gap: 8 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchList(); }} colors={[RED]} />}
            ListEmptyComponent={
              <View style={s.center}>
                <Text style={{ color: '#999', marginTop: 40 }}>Không có dữ liệu tồn kho</Text>
              </View>
            }
          />
      }

      {/* Modal xuất kho */}
      <Modal visible={!!xuatItem} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>📤 Xuất Kho</Text>
            <Text style={s.modalSub} numberOfLines={2}>{xuatItem?.tenSach}</Text>
            <Text style={s.modalStock}>Tồn kho hiện tại: <Text style={{ fontWeight: '700', color: '#333' }}>{xuatItem?.soLuong ?? 0} quyển</Text></Text>
            <Text style={s.fLabel}>Số lượng xuất</Text>
            <TextInput
              style={s.fInput}
              value={soLuongXuat}
              onChangeText={setSoLuongXuat}
              keyboardType="numeric"
              placeholder="Nhập số lượng"
              placeholderTextColor="#aaa"
              autoFocus
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.mBtn, { backgroundColor: '#E0E0E0' }]} onPress={() => setXuatItem(null)}>
                <Text style={[s.mBtnText, { color: '#555' }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.mBtn, { backgroundColor: RED }]} onPress={xuatKho} disabled={xuatLoading}>
                {xuatLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.mBtnText}>Xác nhận</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: RED, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  summaryRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 12, marginTop: 12, borderRadius: 12, paddingVertical: 14, elevation: 1 },
  sumItem: { flex: 1, alignItems: 'center' },
  sumNum: { fontSize: 22, fontWeight: '800' },
  sumLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  divider: { width: 1, backgroundColor: '#EEEEEE' },

  searchWrap: { margin: 12, backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, height: 42, justifyContent: 'center', elevation: 1 },
  searchInput: { fontSize: 14, color: '#333' },

  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 1, gap: 12, alignItems: 'center' },
  qtyBox: { width: 58, height: 58, borderRadius: 10, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
  qtyNum: { fontSize: 20, fontWeight: '800' },
  qtyLabel: { fontSize: 10, color: '#aaa' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#222', lineHeight: 18, marginBottom: 3 },
  sub: { fontSize: 12, color: '#888', marginBottom: 2 },
  theLoai: { fontSize: 11, color: '#aaa' },
  xuatBtn: { backgroundColor: '#FFF0EE', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FFCDD2' },
  xuatBtnText: { fontSize: 11, color: RED, fontWeight: '700', textAlign: 'center' },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '82%', elevation: 8 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#222', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#666', marginBottom: 6 },
  modalStock: { fontSize: 13, color: '#888', marginBottom: 14 },
  fLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 6 },
  fInput: { borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 15, color: '#222', marginBottom: 14, backgroundColor: '#FAFAFA' },
  modalBtns: { flexDirection: 'row', gap: 10 },
  mBtn: { flex: 1, borderRadius: 24, height: 46, justifyContent: 'center', alignItems: 'center' },
  mBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
