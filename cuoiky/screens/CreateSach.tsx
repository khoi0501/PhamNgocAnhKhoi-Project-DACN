import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, StatusBar, Image, Modal, FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch, getPermissions, findPermission } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'CreateSach'> };

export default function CreateSach({ navigation }: Props) {
  const [tenSach, setTenSach] = useState('');
  const [tenTacGia, setTenTacGia] = useState('');
  const [gia, setGia] = useState('');
  const [soLuong, setSoLuong] = useState('0');
  const [hinhAnh, setHinhAnh] = useState('');
  const [moTa, setMoTa] = useState('');
  const [idTheLoai, setIdTheLoai] = useState('');
  const [tenNhaSanXuat, setTenNhaSanXuat] = useState('');
  const [theLoaiList, setTheLoaiList] = useState<{id: number, tenTheLoai: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTheLoaiModal, setShowTheLoaiModal] = useState(false);
  
  // RBAC
  const [hasAddPerm, setHasAddPerm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/TheLoai/GetAll`);
        const json = await res.json();
        if (Array.isArray(json)) setTheLoaiList(json);
        
        // Kiểm tra phân quyền
        const perms = await getPermissions();
        if (perms.some((p: any) => p.full)) {
          setHasAddPerm(true);
        } else {
          const sachPerm = findPermission(perms, { exact: ['thêm sách', 'tạo sách'], matches: ['thêm sách'] });
          setHasAddPerm(sachPerm ? sachPerm.quyenThem : false);
        }
      } catch { }
    })();
  }, []);

  const handleTao = async () => {
    if (!tenSach.trim() || !gia) { Alert.alert('Lỗi', 'Vui lòng nhập tên sách và giá'); return; }
    setLoading(true);
    try {
      const res = await authFetch(`${BASE_URL}/api/Sach/CreateSach`, {
        method: 'POST',
        body: JSON.stringify({
          tenSach, tenTacGia, gia: parseFloat(gia), soLuong: parseInt(soLuong) || 0,
          hinhAnh, moTa, idTheLoai: parseInt(idTheLoai) || null, tenNhaSanXuat,
        }),
      });
      const json = await res.json();
      if (json.statusCode === 200) {
        Alert.alert('✅ Thành công', 'Đã thêm sách mới', [
          { text: 'Thêm sách khác', onPress: () => { setTenSach(''); setGia(''); setMoTa(''); setHinhAnh(''); } },
          { text: 'Quay lại', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Lỗi', json.message || 'Không thể thêm sách');
      }
    } catch {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối máy chủ');
    } finally {
      setLoading(false);
    }
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
      setHinhAnh(result.assets[0].uri);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F2F5' }}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>➕ Thêm Sách Mới</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={s.section}>
          <Field label="Tên sách *" value={tenSach} onChange={setTenSach} placeholder="Nhập tên sách" />
          <Field label="Tác giả" value={tenTacGia} onChange={setTenTacGia} placeholder="Tên tác giả" />
          <Field label="Giá (VNĐ) *" value={gia} onChange={setGia} placeholder="VD: 150000" keyboardType="numeric" />
          <View style={{ marginBottom: 12 }}>
            <Text style={s.label}>Số lượng ban đầu</Text>
            <TextInput
              style={[s.input, { backgroundColor: '#EFEFEF', color: '#aaa' }]}
              value="0"
              editable={false}
              placeholderTextColor="#aaa"
            />
          </View>
          <Text style={s.label}>Hình bìa</Text>
          <TouchableOpacity style={s.imgPickerBtn} onPress={chonAnh} activeOpacity={0.8}>
            {hinhAnh ? (
              <Image source={{ uri: hinhAnh }} style={s.imgPreview} resizeMode="cover" />
            ) : (
              <View style={s.imgPickerPlaceholder}>
                <Text style={{ fontSize: 32 }}>📷</Text>
                <Text style={s.imgPickerText}>Nhấn để chọn ảnh từ thư viện</Text>
              </View>
            )}
            <View style={s.imgPickerOverlay}>
              <Text style={s.imgPickerOverlayText}>🖼️ {hinhAnh ? 'Thay ảnh' : 'Chọn ảnh'}</Text>
            </View>
          </TouchableOpacity>
          <Field label="Nhà xuất bản" value={tenNhaSanXuat} onChange={setTenNhaSanXuat} placeholder="(tùy chọn)" />

          <Text style={s.label}>Thể loại</Text>
          <TouchableOpacity style={s.selectBox} onPress={() => setShowTheLoaiModal(true)} activeOpacity={0.7}>
            <Text style={idTheLoai ? s.selectBoxText : s.selectBoxPlaceholder}>
              {idTheLoai ? (theLoaiList.find(tl => tl.id.toString() === idTheLoai)?.tenTheLoai ?? 'Chọn thể loại') : 'Chọn thể loại'}
            </Text>
            <Text style={{ color: '#aaa', fontSize: 16 }}>▾</Text>
          </TouchableOpacity>

          {/* Modal chọn thể loại */}
          <Modal visible={showTheLoaiModal} transparent animationType="fade">
            <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowTheLoaiModal(false)}>
              <View style={s.modalBox}>
                <Text style={s.modalTitle}>Chọn thể loại</Text>
                <FlatList
                  data={theLoaiList}
                  keyExtractor={item => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[s.modalItem, idTheLoai === item.id.toString() && s.modalItemActive]}
                      onPress={() => { setIdTheLoai(item.id.toString()); setShowTheLoaiModal(false); }}
                    >
                      <Text style={[s.modalItemText, idTheLoai === item.id.toString() && { color: RED, fontWeight: '700' }]}>
                        {item.tenTheLoai}
                      </Text>
                      {idTheLoai === item.id.toString() && <Text style={{ color: RED }}>✓</Text>}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F0F0F0' }} />}
                  style={{ maxHeight: 320 }}
                />
              </View>
            </TouchableOpacity>
          </Modal>

          <Text style={s.label}>Mô tả</Text>
          <TextInput
            style={[s.input, { height: 90, textAlignVertical: 'top' }]}
            value={moTa} onChangeText={setMoTa}
            placeholder="Mô tả nội dung sách..." placeholderTextColor="#aaa"
            multiline
          />
        </View>

        <TouchableOpacity 
          style={[s.btn, !hasAddPerm && { backgroundColor: '#ccc' }]} 
          onPress={handleTao} 
          disabled={loading || !hasAddPerm} 
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>{hasAddPerm ? '📚 Thêm sách' : '🔒 Không có quyền thêm'}</Text>}
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType = 'default' }: any) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input} value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor="#aaa"
        keyboardType={keyboardType} autoCapitalize="none"
      />
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: RED, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2, marginBottom: 14 },
  label: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 14, height: 46, fontSize: 15, color: '#222', backgroundColor: '#FAFAFA' },
  selectBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 14, height: 46, backgroundColor: '#FAFAFA', marginBottom: 12 },
  selectBoxText: { fontSize: 15, color: '#222' },
  selectBoxPlaceholder: { fontSize: 15, color: '#aaa' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '80%', elevation: 8 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginBottom: 12, textAlign: 'center' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8 },
  modalItemActive: { backgroundColor: '#FFF5F5' },
  modalItemText: { fontSize: 15, color: '#333' },
  btn: { backgroundColor: RED, borderRadius: 30, height: 54, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  imgPickerBtn: {
    width: '100%', height: 160, borderRadius: 12, overflow: 'hidden',
    borderWidth: 1.5, borderColor: '#E0E0E0', marginBottom: 14, backgroundColor: '#FAFAFA',
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
