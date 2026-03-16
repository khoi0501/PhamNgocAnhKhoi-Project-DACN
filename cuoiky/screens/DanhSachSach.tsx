import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, StatusBar, Image, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch, getPermissions, findPermission } from '../services/api';
import { SachDTO, getSachList } from '../services/sachGet';
import * as ImagePicker from 'expo-image-picker';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'DanhSachSach'> };

export default function DanhSachSach({ navigation }: Props) {
  const [list, setList] = useState<SachDTO[]>([]);
  const [filtered, setFiltered] = useState<SachDTO[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editItem, setEditItem] = useState<SachDTO | null>(null);

  // Form fields
  const [editTenSach, setEditTenSach] = useState('');
  const [editTacGia, setEditTacGia] = useState('');
  const [editGia, setEditGia] = useState('');
  const [editMoTa, setEditMoTa] = useState('');
  const [editNhaSanXuat, setEditNhaSanXuat] = useState('');
  const [editHinhAnh, setEditHinhAnh] = useState('');
  const [saving, setSaving] = useState(false);
  
  // RBAC
  const [hasEditPerm, setHasEditPerm] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const data = await getSachList();
      setList(data);
      setFiltered(data);
      
      // Load permissions
      const perms = await getPermissions();
      if (perms.some((p: any) => p.full)) {
        setHasEditPerm(true);
      } else {
        const sachPerm = findPermission(perms, { exact: ['danh sách sách', 'quản lý sách', 'sách'], matches: ['sách'], avoid: ['thêm sách'] });
        setHasEditPerm(sachPerm ? sachPerm.quyenSua : false);
      }
      
    } catch { } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  useEffect(() => {
    setFiltered(list.filter(s =>
      !search.trim() ||
      (s.tenSach || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.tenTacGia || '').toLowerCase().includes(search.toLowerCase())
    ));
  }, [search, list]);

  const openEdit = (sach: SachDTO) => {
    setEditItem(sach);
    setEditTenSach(sach.tenSach ?? '');
    setEditTacGia(sach.tenTacGia ?? '');
    setEditGia(sach.gia?.toString() ?? '');
    setEditMoTa(sach.moTa ?? '');
    setEditNhaSanXuat(sach.tenNhaSanXuat ?? '');
    setEditHinhAnh(sach.hinhAnh ?? '');
  };

  const chonAnh = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần cho phép truy cập thư viện ảnh');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
      base64: false,
    });
    if (!result.canceled && result.assets.length > 0) {
      setEditHinhAnh(result.assets[0].uri);
    }
  };

  const luuSua = async () => {
    if (!editItem) return;
    if (!editTenSach.trim()) { Alert.alert('Lỗi', 'Tên sách không được để trống'); return; }
    const giaNum = parseFloat(editGia);
    if (isNaN(giaNum) || giaNum <= 0) { Alert.alert('Lỗi', 'Giá phải là số hợp lệ lớn hơn 0'); return; }

    setSaving(true);
    try {
      const res = await authFetch(`${BASE_URL}/api/Sach/CapNhat/${editItem.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editItem,
          tenSach: editTenSach.trim(),
          tenTacGia: editTacGia.trim(),
          gia: giaNum,
          moTa: editMoTa.trim(),
          tenNhaSanXuat: editNhaSanXuat.trim(),
          hinhAnh: editHinhAnh.trim() || editItem.hinhAnh,
        }),
      });
      const json = await res.json();
      if (json.statusCode === 200) {
        Alert.alert('✅ Thành công', 'Đã cập nhật thông tin sách');
        setEditItem(null);
        fetchList();
      } else {
        Alert.alert('Lỗi', json.message || 'Cập nhật thất bại');
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  const renderItem = ({ item }: { item: SachDTO }) => (
    <TouchableOpacity 
      style={s.card} 
      onPress={() => hasEditPerm ? openEdit(item) : Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền sửa sách.')} 
      activeOpacity={0.85}
      disabled={!hasEditPerm}
    >
      {item.hinhAnh
        ? <Image source={{ uri: item.hinhAnh }} style={s.img} resizeMode="contain" />
        : <View style={[s.img, { backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={{ fontSize: 28 }}>📖</Text>
          </View>
      }
      <View style={s.info}>
        <Text style={s.name} numberOfLines={2}>{item.tenSach}</Text>
        <Text style={s.tacGia}>{item.tenTacGia ?? 'Không rõ tác giả'}</Text>
        <Text style={s.gia}>{(item.gia ?? 0).toLocaleString('vi-VN')} đ</Text>
        <View style={[s.stockBadge, { backgroundColor: (item.soLuong ?? 0) > 0 ? '#E8F5E9' : '#FFEBEE' }]}>
          <Text style={{ fontSize: 11, color: (item.soLuong ?? 0) > 0 ? '#4CAF50' : '#F44336', fontWeight: '600' }}>
            {(item.soLuong ?? 0) > 0 ? `Còn ${item.soLuong}` : 'Hết hàng'}
          </Text>
        </View>
      </View>
      <Text style={{ color: hasEditPerm ? '#aaa' : '#E0E0E0', fontSize: 20 }}>✏️</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F2F5' }}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>📚 Danh Sách Sách</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.searchWrap}>
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch}
          placeholder="Tìm kiếm sách..." placeholderTextColor="#aaa" />
      </View>

      {loading ? <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>
        : <FlatList
          data={filtered} keyExtractor={i => i.id.toString()} renderItem={renderItem}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchList(); }} colors={[RED]} />}
        />
      }

      {/* Edit modal */}
      <Modal visible={!!editItem} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.overlay}>
            <View style={s.modal}>
              {/* Header modal */}
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>✏️ Chỉnh sửa sách</Text>
                <TouchableOpacity onPress={() => setEditItem(null)}>
                  <Text style={{ fontSize: 22, color: '#aaa' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                <Text style={s.fLabel}>Tên sách <Text style={{ color: RED }}>*</Text></Text>
                <TextInput style={s.fInput} value={editTenSach} onChangeText={setEditTenSach}
                  placeholder="Nhập tên sách" placeholderTextColor="#aaa" />

                <Text style={s.fLabel}>Tác giả</Text>
                <TextInput style={s.fInput} value={editTacGia} onChangeText={setEditTacGia}
                  placeholder="Nhập tên tác giả" placeholderTextColor="#aaa" />

                <Text style={s.fLabel}>Giá bán (VNĐ) <Text style={{ color: RED }}>*</Text></Text>
                <TextInput style={s.fInput} value={editGia} onChangeText={setEditGia}
                  keyboardType="numeric" placeholder="Nhập giá bán" placeholderTextColor="#aaa" />

                <Text style={s.fLabel}>Nhà xuất bản / sản xuất</Text>
                <TextInput style={s.fInput} value={editNhaSanXuat} onChangeText={setEditNhaSanXuat}
                  placeholder="Nhập tên nhà xuất bản" placeholderTextColor="#aaa" />

                <Text style={s.fLabel}>  nh bìa</Text>
                <TouchableOpacity style={s.imgPickerBtn} onPress={chonAnh} activeOpacity={0.8}>
                  {editHinhAnh ? (
                    <Image source={{ uri: editHinhAnh }} style={s.imgPreview} resizeMode="cover" />
                  ) : (
                    <View style={s.imgPickerPlaceholder}>
                      <Text style={{ fontSize: 32 }}>📷</Text>
                      <Text style={s.imgPickerText}>Nhấn để chọn ảnh từ thư viện</Text>
                    </View>
                  )}
                  <View style={s.imgPickerOverlay}>
                    <Text style={s.imgPickerOverlayText}>🖼️ Thay ảnh</Text>
                  </View>
                </TouchableOpacity>

                <Text style={s.fLabel}>Mô tả</Text>
                <TextInput
                  style={[s.fInput, { height: 90, textAlignVertical: 'top', paddingTop: 12 }]}
                  value={editMoTa} onChangeText={setEditMoTa}
                  placeholder="Nhập mô tả sách" placeholderTextColor="#aaa"
                  multiline numberOfLines={4}
                />

                <View style={s.modalBtns}>
                  <TouchableOpacity style={[s.mBtn, { backgroundColor: '#E0E0E0' }]} onPress={() => setEditItem(null)}>
                    <Text style={[s.mBtnText, { color: '#555' }]}>Hủy</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.mBtn, { backgroundColor: RED }]} onPress={luuSua} disabled={saving}>
                    {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.mBtnText}>Lưu thay đổi</Text>}
                  </TouchableOpacity>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: RED, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  searchWrap: { margin: 12, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, height: 44, justifyContent: 'center', elevation: 2 },
  searchInput: { fontSize: 14, color: '#333' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, elevation: 2, gap: 10 },
  img: { width: 70, height: 70, borderRadius: 8 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: '#222', lineHeight: 19, marginBottom: 2 },
  tacGia: { fontSize: 12, color: '#888', marginBottom: 4 },
  gia: { fontSize: 14, fontWeight: '700', color: RED, marginBottom: 4 },
  stockBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#222' },
  fLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 6, marginTop: 4 },
  fInput: { borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 15, color: '#222', marginBottom: 12, backgroundColor: '#FAFAFA' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  mBtn: { flex: 1, borderRadius: 30, height: 50, justifyContent: 'center', alignItems: 'center' },
  mBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  imgPickerBtn: {
    width: '100%', height: 160, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1.5, borderColor: '#E8E8E8', marginBottom: 12, backgroundColor: '#FAFAFA',
  },
  imgPreview: { width: '100%', height: '100%' },
  imgPickerPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  imgPickerText: { fontSize: 13, color: '#aaa', textAlign: 'center' },
  imgPickerOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 8, alignItems: 'center',
  },
  imgPickerOverlayText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

