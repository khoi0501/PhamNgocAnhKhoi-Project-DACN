import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, FlatList, RefreshControl, StatusBar, Modal, ScrollView, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch, getPermissions, findPermission } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'QuanLyPhieuGiamGia'> };

export default function QuanLyPhieuGiamGia({ navigation }: Props) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [ma, setMa] = useState('');
  const [giaTri, setGiaTri] = useState('');
  const [loai, setLoai] = useState('Số tiền');
  const [ngayHetHan, setNgayHetHan] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dieuKien, setDieuKien] = useState('Cho mọi đơn hàng');
  const [noiDung, setNoiDung] = useState('');
  const [saving, setSaving] = useState(false);

  // RBAC
  const [hasAddPerm, setHasAddPerm] = useState(false);
  const [hasDeletePerm, setHasDeletePerm] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/PhieuGiamGia/Admin/List`);
      const json = await res.json();
      if (json.statusCode === 200 && json.data) setList(json.data);
      
      // Load permissions
      const perms = await getPermissions();
      if (perms.some((p: any) => p.full)) {
        setHasAddPerm(true);
        setHasDeletePerm(true);
      } else {
        const pggPerm = findPermission(perms, { exact: ['phiếu giảm giá', 'quản lý khuyến mãi', 'khuyến mãi'], matches: ['giảm giá', 'khuyến mãi'] });
        setHasAddPerm(pggPerm ? pggPerm.quyenThem : false);
        setHasDeletePerm(pggPerm ? pggPerm.quyenXoa : false);
      }
    } catch { } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const them = async () => {
    if (!ma.trim() || !giaTri || !ngayHetHan) { Alert.alert('Lỗi', 'Vui lòng điền đầy đủ'); return; }
    setSaving(true);
    try {
      const res = await authFetch(`${BASE_URL}/api/PhieuGiamGia/Admin/Create`, {
        method: 'POST',
        body: JSON.stringify({
          maGiamGia: ma.toUpperCase(), giaTriGiam: parseFloat(giaTri),
          ngayKetThuc: ngayHetHan.toISOString(),
          loaiPhieuGiamGia: loai, dieuKienGiamGia: dieuKien, noiDung,
        }),
      });
      const json = await res.json();
      if (json.statusCode === 200) {
        Alert.alert('✅', 'Tạo phiếu thành công'); setShowForm(false); fetchList();
        setMa(''); setGiaTri(''); setNgayHetHan(new Date()); setDieuKien('Cho mọi đơn hàng'); setNoiDung('');
      } else Alert.alert('Lỗi', json.message || 'Không thể tạo phiếu');
    } catch { Alert.alert('Lỗi', 'Không thể kết nối'); } finally { setSaving(false); }
  };

  const xoa = async (id: number, ma: string) => {
    Alert.alert('Xóa phiếu', `Xóa mã "${ma}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          const res = await authFetch(`${BASE_URL}/api/PhieuGiamGia/Admin/${id}`, { method: 'DELETE' });
          const json = await res.json();
          if (json.statusCode === 200) fetchList();
          else Alert.alert('Lỗi', json.message);
        }
      }
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={s.card}>
      <View style={s.cardTop}>
        <Text style={s.code}>{item.maGiamGia}</Text>
        <View style={[s.badge, { backgroundColor: item.isValid ? '#E8F5E9' : '#FFEBEE', borderColor: item.isValid ? '#4CAF50' : '#F44336' }]}>
          <Text style={[s.badgeText, { color: item.isValid ? '#4CAF50' : '#F44336' }]}>{item.isValid ? 'Còn hạn' : 'Hết hạn'}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => xoa(item.id, item.maGiamGia)}
          disabled={!hasDeletePerm}
        >
          <Text style={{ fontSize: 18, opacity: hasDeletePerm ? 1 : 0.3 }}>🗑️</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.detail}>
        {item.loaiPhieuGiamGia === 'Phần trăm' ? `Giảm ${item.giaTriGiam}%` : `Giảm ${item.giaTriGiam?.toLocaleString('vi-VN')}đ`}
      </Text>
      <Text style={s.detail}>Hết hạn: {new Date(item.ngayKetThuc).toLocaleDateString('vi-VN')} (còn {item.daysRemaining} ngày)</Text>
      {item.dieuKienGiamGia ? <Text style={s.detail}>📋 {item.dieuKienGiamGia}</Text> : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F2F5' }}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🎁 Phiếu Giảm Giá</Text>
        <TouchableOpacity 
          onPress={() => setShowForm(true)}
          style={!hasAddPerm ? { opacity: 0.3 } : undefined}
          disabled={!hasAddPerm}
        >
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300' }}>＋</Text>
        </TouchableOpacity>
      </View>

      {loading ? <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>
        : <FlatList
          data={list} keyExtractor={i => i.id.toString()} renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchList(); }} colors={[RED]} />}
          ListEmptyComponent={<View style={s.center}><Text style={{ color: '#999' }}>Chưa có phiếu giảm giá</Text></View>}
        />
      }

      {/* Modal tạo mới */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>Tạo phiếu giảm giá</Text>
            <ScrollView>
                <View style={{ marginBottom: 10 }}>
                  <Text style={s.fLabel}>Mã giảm giá *</Text>
                  <TextInput style={s.fInput} value={ma} onChangeText={setMa} placeholder="VD: SALE50" placeholderTextColor="#aaa" autoCapitalize="characters" />
                </View>
                <View style={{ marginBottom: 10 }}>
                  <Text style={s.fLabel}>Giá trị giảm *</Text>
                  <TextInput style={s.fInput} value={giaTri} onChangeText={setGiaTri} placeholder="VD: 50000" placeholderTextColor="#aaa" keyboardType="numeric" />
                </View>
                
                <View style={{ marginBottom: 10 }}>
                  <Text style={s.fLabel}>Ngày hết hạn *</Text>
                  <TouchableOpacity style={s.dateBtn} onPress={() => setShowDatePicker(true)}>
                    <Text style={{ fontSize: 14, color: '#222' }}>{ngayHetHan.toLocaleDateString('vi-VN')}</Text>
                    <Text>📅</Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={ngayHetHan}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (selectedDate) setNgayHetHan(selectedDate);
                      }}
                    />
                  )}
                </View>

                <View style={{ marginBottom: 10 }}>
                  <Text style={s.fLabel}>Điều kiện áp dụng</Text>
                  <View style={s.conditionRow}>
                    {[
                      'Cho mọi đơn hàng', 
                      'Đơn hàng tối thiểu 100k', 
                      'Đơn hàng tối thiểu 200k',
                      'Đơn hàng tối thiểu 300k',
                      'Đơn hàng tối thiểu 500k',
                      'Đơn hàng tối thiểu 1 triệu'
                    ].map((dk) => (
                      <TouchableOpacity 
                        key={dk} 
                        style={[s.condBtn, dieuKien === dk && s.condBtnActive]}
                        onPress={() => setDieuKien(dk)}
                      >
                        <Text style={[s.condText, dieuKien === dk && { color: RED }]}>{dk}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={{ marginBottom: 10 }}>
                  <Text style={s.fLabel}>Mô tả</Text>
                  <TextInput style={s.fInput} value={noiDung} onChangeText={setNoiDung} placeholder="Mô tả ngắn" placeholderTextColor="#aaa" />
                </View>

              <Text style={s.fLabel}>Loại giảm</Text>
              <View style={s.typeRow}>
                {['Số tiền', 'Phần trăm'].map(t => (
                  <TouchableOpacity key={t} style={[s.typeBtn, loai === t && s.typeBtnActive]} onPress={() => setLoai(t)}>
                    <Text style={[s.typeBtnText, loai === t && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={s.modalBtns}>
              <TouchableOpacity style={[s.mBtn, { backgroundColor: '#aaa' }]} onPress={() => setShowForm(false)}>
                <Text style={s.mBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.mBtn, { backgroundColor: RED }]} onPress={them} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.mBtnText}>Tạo</Text>}
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
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  code: { fontSize: 16, fontWeight: '800', color: RED, flex: 1 },
  badge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  detail: { fontSize: 13, color: '#666', marginBottom: 3 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#222', marginBottom: 16, textAlign: 'center' },
  fLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 5 },
  fInput: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: 14, color: '#222', backgroundColor: '#FAFAFA', marginBottom: 0 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  typeBtnActive: { backgroundColor: RED, borderColor: RED },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#555' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  mBtn: { flex: 1, borderRadius: 30, height: 48, justifyContent: 'center', alignItems: 'center' },
  mBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dateBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 12, height: 44, backgroundColor: '#FAFAFA' },
  conditionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  condBtn: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FAFAFA' },
  condBtnActive: { borderColor: RED, backgroundColor: '#FFF5F5' },
  condText: { fontSize: 12, color: '#666' },
});
