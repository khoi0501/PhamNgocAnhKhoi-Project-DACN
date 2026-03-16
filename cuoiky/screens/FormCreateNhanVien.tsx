import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, StatusBar, Modal, FlatList,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'FormCreateNhanVien'> };

export default function FormCreateNhanVien({ navigation }: Props) {
  const [hovaTen, setHovaTen] = useState('');
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [xacNhan, setXacNhan] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [diaChi, setDiaChi] = useState('');
  const [soCCCD, setSoCCCD] = useState('');
  
  // Chức vụ
  const [chucVuList, setChucVuList] = useState<any[]>([]);
  const [selectedChucVu, setSelectedChucVu] = useState<any | null>(null);
  const [showChucVuModal, setShowChucVuModal] = useState(false);

  // Phân quyền
  const [chucNangList, setChucNangList] = useState<any[]>([]);
  const [phanQuyens, setPhanQuyens] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      // Fetch chức vụ
      const resCV = await authFetch(`${BASE_URL}/api/Admin/LayDanhSachChucVu`);
      const jsonCV = await resCV.json();
      if (jsonCV.statusCode === 200) setChucVuList(jsonCV.data);

      // Fetch chức năng
      const resCN = await authFetch(`${BASE_URL}/api/Admin/LayDanhSachChucNang`);
      const jsonCN = await resCN.json();
      if (jsonCN.statusCode === 200 && jsonCN.data) {
        setChucNangList(jsonCN.data);
        // Khởi tạo state phân quyền mặc định là false
        const initPQ = jsonCN.data.map((cn: any) => ({
          IdChucNang: cn.id,
          TenChucNang: cn.tenChucNang,
          Quyen_Xem: false,
          Quyen_Them: false,
          Quyen_Sua: false,
          Quyen_Xoa: false
        }));
        setPhanQuyens(initPQ);
      }
    } catch (error) {
      console.log('Lỗi fetch config:', error);
    }
  };

  const togglePermission = (idChucNang: number, field: string) => {
    setPhanQuyens(prev => prev.map(pq => {
      if (pq.IdChucNang === idChucNang) {
        return { ...pq, [field]: !pq[field] };
      }
      return pq;
    }));
  };

  const handleTao = async () => {
    if (!hovaTen.trim() || !email.trim() || !matKhau.trim() || !selectedChucVu) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường bắt buộc và chọn chức vụ'); return;
    }
    if (matKhau !== xacNhan) { Alert.alert('Lỗi', 'Mật khẩu không khớp'); return; }
    
    setLoading(true);
    try {
      // Lọc ra những phân quyền có ít nhất 1 quyền true
      const activePhanQuyens = phanQuyens.filter(
        pq => pq.Quyen_Xem || pq.Quyen_Them || pq.Quyen_Sua || pq.Quyen_Xoa
      );

      const res = await authFetch(`${BASE_URL}/api/Admin/TaoTaiKhoanAdmin`, {
        method: 'POST',
        body: JSON.stringify({
          hovaTen,
          email,
          matKhau,
          xacNhanMatKhau: xacNhan,
          soDienThoai,
          diaChi,
          soCCCD,
          idChucVu: selectedChucVu.id,
          phanQuyens: activePhanQuyens,
        }),
      });
      const json = await res.json();
      if (json.statusCode === 200) {
        Alert.alert('✅ Thành công', 'Đã tạo tài khoản nhân viên', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Lỗi', json.message || 'Không thể tạo tài khoản');
      }
    } catch {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>➕ Thêm Nhân Viên</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={s.section}>
          <Field label="Họ và tên *" value={hovaTen} onChange={setHovaTen} placeholder="Nhập họ tên" />
          <Field label="Email *" value={email} onChange={setEmail} placeholder="email@domain.com" keyboardType="email-address" />
          
          <Text style={s.label}>Chức vụ *</Text>
          <TouchableOpacity style={s.selectBox} onPress={() => setShowChucVuModal(true)} activeOpacity={0.7}>
            {selectedChucVu ? (
              <Text style={s.selectBoxText}>{selectedChucVu.tenChucVu}</Text>
            ) : (
              <Text style={s.selectBoxPlaceholder}>Chọn chức vụ...</Text>
            )}
            <Text style={{ color: '#aaa', fontSize: 16 }}>▾</Text>
          </TouchableOpacity>

          <Field label="Mật khẩu *" value={matKhau} onChange={setMatKhau} placeholder="Mật khẩu" secure />
          <Field label="Xác nhận mật khẩu *" value={xacNhan} onChange={setXacNhan} placeholder="Nhập lại mật khẩu" secure />
          
          <Field label="Số CCCD" value={soCCCD} onChange={setSoCCCD} placeholder="(tùy chọn)" keyboardType="numeric" />
          <Field label="Số điện thoại" value={soDienThoai} onChange={setSoDienThoai} placeholder="(tùy chọn)" keyboardType="phone-pad" />
          <Field label="Địa chỉ" value={diaChi} onChange={setDiaChi} placeholder="(tùy chọn)" />
        </View>

        {/* Phân Quyền */}
        {chucNangList.length > 0 && (
          <View style={s.section}>
            <Text style={[s.label, { fontSize: 15, marginBottom: 12, color: RED }]}>Phân quyền chức năng</Text>
            {phanQuyens.map((pq, idx) => (
              <View key={pq.IdChucNang} style={[s.pqRow, idx > 0 && { borderTopWidth: 1, borderTopColor: '#EEE' }]}>
                <Text style={s.pqName}>{pq.TenChucNang}</Text>
                <View style={s.pqChecks}>
                  <Checkbox label="Xem" value={pq.Quyen_Xem} onToggle={() => togglePermission(pq.IdChucNang, 'Quyen_Xem')} />
                  <Checkbox label="Thêm" value={pq.Quyen_Them} onToggle={() => togglePermission(pq.IdChucNang, 'Quyen_Them')} />
                  <Checkbox label="Sửa" value={pq.Quyen_Sua} onToggle={() => togglePermission(pq.IdChucNang, 'Quyen_Sua')} />
                  <Checkbox label="Xóa" value={pq.Quyen_Xoa} onToggle={() => togglePermission(pq.IdChucNang, 'Quyen_Xoa')} />
                </View>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={s.btn} onPress={handleTao} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>✅ Tạo tài khoản</Text>}
        </TouchableOpacity>
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal chọn chức vụ */}
      <Modal visible={showChucVuModal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={[s.modal, { maxHeight: '60%' }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Briefcase Chọn chức vụ</Text>
              <TouchableOpacity onPress={() => setShowChucVuModal(false)} style={{ padding: 5 }}>
                <Text style={{ fontSize: 24, color: '#aaa' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={chucVuList}
              keyExtractor={i => i.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.modalItem, selectedChucVu?.id === item.id && s.modalItemActive]}
                  onPress={() => { setSelectedChucVu(item); setShowChucVuModal(false); }}
                >
                  <Text style={[s.modalItemText, selectedChucVu?.id === item.id && { color: RED, fontWeight: '700' }]}>
                    {item.tenChucVu}
                  </Text>
                  {selectedChucVu?.id === item.id && <Text style={{ color: RED, fontSize: 18 }}>✓</Text>}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F0F0F0' }} />}
              ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#999', marginTop: 20 }}>Không tải được danh sách chức vụ</Text>}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType = 'default', secure = false }: any) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input} value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor="#aaa"
        keyboardType={keyboardType} secureTextEntry={secure}
        autoCapitalize="none"
      />
    </View>
  );
}

function Checkbox({ label, value, onToggle }: any) {
  return (
    <TouchableOpacity style={s.cbWrap} onPress={onToggle} activeOpacity={0.7}>
      <View style={[s.cbBox, value && s.cbBoxActive]}>
        {value && <Text style={s.cbCheck}>✓</Text>}
      </View>
      <Text style={[s.cbLabel, value && { color: '#222', fontWeight: '600' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: RED, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 18, elevation: 2 },
  label: { fontSize: 13, color: '#444', fontWeight: '700', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 15, color: '#222', backgroundColor: '#FAFAFA' },
  btn: { backgroundColor: RED, borderRadius: 30, height: 54, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  
  // Select Box
  selectBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 10, paddingHorizontal: 14, height: 48, backgroundColor: '#FAFAFA', marginBottom: 16 },
  selectBoxText: { fontSize: 15, color: '#222' },
  selectBoxPlaceholder: { fontSize: 15, color: '#aaa' },
  
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#222' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8 },
  modalItemActive: { backgroundColor: '#FFF5F5', borderRadius: 8 },
  modalItemText: { fontSize: 16, color: '#333' },

  // Phân quyền
  pqRow: { paddingVertical: 14, gap: 10 },
  pqName: { fontSize: 15, fontWeight: '700', color: '#333' },
  pqChecks: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cbWrap: { flexDirection: 'row', alignItems: 'center', marginRight: 4, width: 70 },
  cbBox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  cbBoxActive: { backgroundColor: RED, borderColor: RED },
  cbCheck: { color: '#fff', fontSize: 14, fontWeight: '900' },
  cbLabel: { fontSize: 13, color: '#777', marginLeft: 8 },
});
