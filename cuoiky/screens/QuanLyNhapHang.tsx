import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar, TextInput, Alert,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch, getPermissions, findPermission } from '../services/api';
import { SachDTO, getSachList } from '../services/sachGet';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'QuanLyNhapHang'> };

export default function QuanLyNhapHang({ navigation }: Props) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);

  // Form thêm phiếu
  const [showForm, setShowForm] = useState(false);
  const [sachList, setSachList] = useState<SachDTO[]>([]);
  const [showSachModal, setShowSachModal] = useState(false);
  const [selectedSach, setSelectedSach] = useState<SachDTO | null>(null);
  const [soLuongNhap, setSoLuongNhap] = useState('');
  const [giaNhap, setGiaNhap] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchSach, setSearchSach] = useState('');

  // RBAC
  const [hasAddPerm, setHasAddPerm] = useState(false);
  const [hasDeletePerm, setHasDeletePerm] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/Sach/NhapHang/LayDanhSach?page=1&pageSize=50`);
      const json = await res.json();
      if (json.statusCode === 200 && json.data) {
        setList(json.data.results ?? []);
        setTotal(json.data.pagination?.totalCount ?? 0);
      }
      
      // Load permissions
      const perms = await getPermissions();
      if (perms.some((p: any) => p.full)) {
        setHasAddPerm(true);
        setHasDeletePerm(true);
      } else {
        const nhPerm = findPermission(perms, { exact: ['nhập hàng', 'quản lý nhập hàng'], matches: ['nhập hàng'] });
        setHasAddPerm(nhPerm ? nhPerm.quyenThem : false);
        setHasDeletePerm(nhPerm ? nhPerm.quyenXoa : false);
      }
    } catch { } finally { setLoading(false); setRefreshing(false); }
  }, []);

  const fetchSachList = useCallback(async () => {
    const data = await getSachList();
    setSachList(data);
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const openForm = () => {
    fetchSachList();
    setSelectedSach(null);
    setSoLuongNhap('');
    setGiaNhap('');
    setSearchSach('');
    setShowForm(true);
  };

  const themPhieu = async () => {
    if (!selectedSach) { Alert.alert('Lỗi', 'Vui lòng chọn sách'); return; }
    const sl = parseInt(soLuongNhap);
    const gia = parseFloat(giaNhap);
    if (!sl || sl <= 0) { Alert.alert('Lỗi', 'Số lượng nhập phải lớn hơn 0'); return; }
    if (!gia || gia <= 0) { Alert.alert('Lỗi', 'Giá nhập phải lớn hơn 0'); return; }

    setSaving(true);
    try {
      const res = await authFetch(`${BASE_URL}/api/Sach/NhapHang/Them`, {
        method: 'POST',
        body: JSON.stringify({
          tenSach: selectedSach.tenSach,
          idTheLoai: selectedSach.idTheLoai,
          soLuongNhap: sl,
          giaNhap: gia,
          ngayNhap: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (json.statusCode === 200) {
        Alert.alert('✅ Thành công', `Đã nhập ${sl} cuốn "${selectedSach.tenSach}"\nTồn kho hiện tại: ${json.data?.soLuongTonKhoHienTai ?? '?'}`);
        setShowForm(false);
        fetchList();
      } else {
        Alert.alert('Lỗi', json.message || 'Không thể thêm phiếu nhập hàng');
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  const xoa = async (id: number, tenSach: string) => {
    Alert.alert('Xóa phiếu', `Xóa phiếu nhập "${tenSach}"?\nTồn kho sẽ được trừ lại.`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            const res = await authFetch(`${BASE_URL}/api/Sach/NhapHang/Xoa/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.statusCode === 200) {
              Alert.alert('✅', 'Đã xóa phiếu nhập hàng');
              fetchList();
            } else Alert.alert('Lỗi', json.message || 'Không thể xóa');
          } catch {
            Alert.alert('Lỗi', 'Không thể kết nối máy chủ');
          }
        }
      }
    ]);
  };

  const filteredSach = sachList.filter(s =>
    !searchSach.trim() ||
    (s.tenSach ?? '').toLowerCase().includes(searchSach.toLowerCase()) ||
    (s.tenTacGia ?? '').toLowerCase().includes(searchSach.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.bookName} numberOfLines={2}>{item.tenSach}</Text>
          {item.tenTheLoai ? <Text style={s.theLoaiTag}>{item.tenTheLoai}</Text> : null}
        </View>
        <TouchableOpacity 
          onPress={() => hasDeletePerm ? xoa(item.id, item.tenSach) : Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền xóa phiếu nhập.')} 
          style={{ padding: 6, opacity: hasDeletePerm ? 1 : 0.3 }}
          disabled={!hasDeletePerm}
        >
          <Text style={{ fontSize: 20 }}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <View style={s.cardRow}>
        <View style={s.cardStat}>
          <Text style={s.statLabel}>📦 Số lượng nhập</Text>
          <Text style={s.statValue}>{item.soLuongNhap}</Text>
        </View>
        <View style={s.cardStat}>
          <Text style={s.statLabel}>💰 Giá nhập</Text>
          <Text style={s.statValue}>{(item.giaNhap ?? 0).toLocaleString('vi-VN')} đ</Text>
        </View>
        <View style={s.cardStat}>
          <Text style={s.statLabel}>💵 Thành tiền</Text>
          <Text style={[s.statValue, { color: RED }]}>{(item.thanhTien ?? 0).toLocaleString('vi-VN')} đ</Text>
        </View>
      </View>

      <View style={s.cardFooter}>
        <Text style={s.footerText}>📅 {item.ngayNhap ? new Date(item.ngayNhap).toLocaleDateString('vi-VN') : 'N/A'}</Text>
        {item.tenTaiKhoan ? <Text style={s.footerText}>👤 {item.tenTaiKhoan}</Text> : null}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F2F5' }}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>📥 Nhập Hàng ({total})</Text>
        <TouchableOpacity 
          onPress={openForm} 
          style={[s.addBtn, !hasAddPerm && { opacity: 0.3 }]}
          disabled={!hasAddPerm}
        >
          <Text style={s.addBtnText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>
        : <FlatList
            data={list}
            keyExtractor={i => i.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 30 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchList(); }} colors={[RED]} />}
            ListEmptyComponent={
              <View style={[s.center, { marginTop: 60 }]}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>📦</Text>
                <Text style={{ color: '#999', fontSize: 15 }}>Chưa có phiếu nhập hàng</Text>
                <TouchableOpacity 
                  style={[s.addBtnLarge, !hasAddPerm && { backgroundColor: '#ccc' }]} 
                  onPress={openForm}
                  disabled={!hasAddPerm}
                >
                  <Text style={{ color: '#fff', fontWeight: '700' }}>+ Thêm phiếu nhập đầu tiên</Text>
                </TouchableOpacity>
              </View>
            }
          />
      }

      {/* Modal thêm phiếu nhập hàng */}
      <Modal visible={showForm} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.overlay}>
            <View style={s.modal}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>📥 Thêm Phiếu Nhập Hàng</Text>
                <TouchableOpacity onPress={() => setShowForm(false)}>
                  <Text style={{ fontSize: 22, color: '#aaa' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Chọn sách */}
                <Text style={s.fLabel}>Tên sách <Text style={{ color: RED }}>*</Text></Text>
                <TouchableOpacity style={s.selectBox} onPress={() => setShowSachModal(true)} activeOpacity={0.7}>
                  {selectedSach ? (
                    <View style={{ flex: 1 }}>
                      <Text style={s.selectBoxText} numberOfLines={1}>{selectedSach.tenSach}</Text>
                      <Text style={{ fontSize: 11, color: '#aaa' }}>{selectedSach.tenTacGia} • Tồn: {selectedSach.soLuong ?? 0}</Text>
                    </View>
                  ) : (
                    <Text style={s.selectBoxPlaceholder}>Chọn sách cần nhập...</Text>
                  )}
                  <Text style={{ color: '#aaa', fontSize: 16 }}>▾</Text>
                </TouchableOpacity>

                {/* Số lượng nhập */}
                <Text style={s.fLabel}>Số lượng nhập <Text style={{ color: RED }}>*</Text></Text>
                <TextInput
                  style={s.fInput} value={soLuongNhap} onChangeText={setSoLuongNhap}
                  keyboardType="numeric" placeholder="VD: 50" placeholderTextColor="#aaa"
                />

                {/* Giá nhập */}
                <Text style={s.fLabel}>Giá nhập (VNĐ/cuốn) <Text style={{ color: RED }}>*</Text></Text>
                <TextInput
                  style={s.fInput} value={giaNhap} onChangeText={setGiaNhap}
                  keyboardType="numeric" placeholder="VD: 80000" placeholderTextColor="#aaa"
                />

                {/* Preview thành tiền */}
                {soLuongNhap && giaNhap ? (
                  <View style={s.previewBox}>
                    <Text style={s.previewLabel}>Thành tiền dự kiến</Text>
                    <Text style={s.previewValue}>
                      {(parseInt(soLuongNhap || '0') * parseFloat(giaNhap || '0')).toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                ) : null}

                <View style={s.modalBtns}>
                  <TouchableOpacity style={[s.mBtn, { backgroundColor: '#E0E0E0' }]} onPress={() => setShowForm(false)}>
                    <Text style={[s.mBtnText, { color: '#555' }]}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.mBtn, { backgroundColor: RED }]} onPress={themPhieu} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.mBtnText}>✅ Xác nhận nhập</Text>}
                  </TouchableOpacity>
                </View>
                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal chọn sách */}
      <Modal visible={showSachModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={[s.modal, { maxHeight: '80%' }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>📚 Chọn sách</Text>
              <TouchableOpacity onPress={() => setShowSachModal(false)}>
                <Text style={{ fontSize: 22, color: '#aaa' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.searchWrap}>
              <TextInput
                style={s.searchInput} value={searchSach} onChangeText={setSearchSach}
                placeholder="Tìm sách..." placeholderTextColor="#aaa"
                autoFocus
              />
            </View>
            <FlatList
              data={filteredSach}
              keyExtractor={i => i.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.sachItem, selectedSach?.id === item.id && s.sachItemActive]}
                  onPress={() => { setSelectedSach(item); setShowSachModal(false); }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[s.sachItemName, selectedSach?.id === item.id && { color: RED }]} numberOfLines={1}>
                      {item.tenSach}
                    </Text>
                    <Text style={s.sachItemSub}>{item.tenTacGia ?? 'Không rõ tác giả'} • Tồn: {item.soLuong ?? 0}</Text>
                  </View>
                  {selectedSach?.id === item.id && <Text style={{ color: RED, fontSize: 18 }}>✓</Text>}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F5F5F5' }} />}
              keyboardShouldPersistTaps="handled"
            />
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
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  addBtnLarge: { marginTop: 16, backgroundColor: RED, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12 },

  // Card
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  bookName: { fontSize: 15, fontWeight: '700', color: '#222' },
  theLoaiTag: { fontSize: 11, color: RED, marginTop: 3, fontWeight: '600' },
  cardRow: { flexDirection: 'row', backgroundColor: '#F9F9F9', borderRadius: 10, padding: 10, gap: 4, marginBottom: 8 },
  cardStat: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, color: '#999', marginBottom: 3, textAlign: 'center' },
  statValue: { fontSize: 13, fontWeight: '700', color: '#333', textAlign: 'center' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 12, color: '#aaa' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#222' },
  fLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 6, marginTop: 4 },
  fInput: { borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 15, color: '#222', marginBottom: 12, backgroundColor: '#FAFAFA' },
  selectBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 10, paddingHorizontal: 14, minHeight: 48, paddingVertical: 8, backgroundColor: '#FAFAFA', marginBottom: 12 },
  selectBoxText: { fontSize: 15, color: '#222', flex: 1 },
  selectBoxPlaceholder: { fontSize: 15, color: '#aaa', flex: 1 },
  previewBox: { backgroundColor: '#FFF5F5', borderRadius: 10, padding: 12, marginBottom: 12, alignItems: 'center' },
  previewLabel: { fontSize: 12, color: '#aaa', marginBottom: 4 },
  previewValue: { fontSize: 20, fontWeight: '800', color: RED },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  mBtn: { flex: 1, borderRadius: 30, height: 50, justifyContent: 'center', alignItems: 'center' },
  mBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Sách modal
  searchWrap: { borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 10, paddingHorizontal: 12, height: 44, justifyContent: 'center', marginBottom: 12, backgroundColor: '#FAFAFA' },
  searchInput: { fontSize: 14, color: '#333' },
  sachItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  sachItemActive: { backgroundColor: '#FFF5F5' },
  sachItemName: { fontSize: 14, fontWeight: '600', color: '#222' },
  sachItemSub: { fontSize: 11, color: '#aaa', marginTop: 2 },
});
