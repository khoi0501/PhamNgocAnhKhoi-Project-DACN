import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch, removeToken } from '../services/api';
import AddressPicker from '../components/AddressPicker';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Thongtin'> };

export default function Thongtin({ navigation }: Props) {
  const [hovaTen, setHovaTen] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [soCCCD, setSoCCCD] = useState('');
  const [diaChi, setDiaChi] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`${BASE_URL}/api/DatHang/LayDiaChiUser`);
        const json = await res.json();
        if (json.statusCode === 200 && json.data) {
          const d = json.data;
          setHovaTen(d.hovaTen || '');
          setSoDienThoai(d.soDienThoai || '');
          setSoCCCD(d.soCCCD || '');
          setDiaChi(d.diaChi || '');
          setEmail(d.email || '');
        }
      } catch { } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLuu = async () => {
    if (!hovaTen.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập họ và tên'); return; }
    if (soDienThoai.length !== 10) { Alert.alert('Lỗi', 'Số điện thoại phải đủ 10 số'); return; }
    if (soCCCD.length !== 12) { Alert.alert('Lỗi', 'Số CCCD phải đủ 12 số'); return; }
    setSaving(true);
    try {
      const res = await authFetch(`${BASE_URL}/api/Thongtincanhan/Thongtincanhan`, {
        method: 'POST',
        body: JSON.stringify({ hovaTen, soDienThoai, soCCCD, diaChi }),
      });
      const json = await res.json();
      if (json.statusCode === 200) {
        Alert.alert('✅ Thành công', 'Đã lưu thông tin cá nhân');
      } else {
        Alert.alert('Lỗi', json.message || 'Không thể lưu');
      }
    } catch {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối máy chủ');
    } finally {
      setSaving(false);
    }
  };

  const handleDangXuat = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất', style: 'destructive', onPress: async () => {
          await removeToken();
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }
      },
    ]);
  };

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Thông Tin Cá Nhân</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.container} contentContainerStyle={{ padding: 20 }}>
        {/* Avatar section */}
        <View style={s.avatarSection}>
          <View style={s.avatar}><Text style={s.avatarText}>👤</Text></View>
          <Text style={s.emailText}>{email}</Text>
        </View>

        {/* Quick actions */}
        <View style={s.quickRow}>
          <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('DonHang')}>
            <Text style={s.quickIcon}>📦</Text>
            <Text style={s.quickLabel}>Đơn hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('DanhGiaCuaToi')}>
            <Text style={s.quickIcon}>⭐</Text>
            <Text style={s.quickLabel}>Đánh giá</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.quickBtn} onPress={() => navigation.navigate('DanhSachPhieuGiamGia')}>
            <Text style={s.quickIcon}>🎁</Text>
            <Text style={s.quickLabel}>Ưu đãi</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle}>Thông tin cá nhân</Text>

        <Field label="Họ và tên" value={hovaTen} onChange={setHovaTen} placeholder="Nhập họ và tên" />
        <Field label="Số điện thoại" value={soDienThoai} onChange={setSoDienThoai} placeholder="10 số" keyboardType="phone-pad" maxLength={10} />
        <Field label="Số CC CD" value={soCCCD} onChange={setSoCCCD} placeholder="12 số" keyboardType="number-pad" maxLength={12} />
        <AddressPicker value={diaChi} onChange={setDiaChi} />

        <TouchableOpacity style={s.saveBtn} onPress={handleLuu} disabled={saving} activeOpacity={0.85}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>💾 Lưu thông tin</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.logoutBtn} onPress={handleDangXuat} activeOpacity={0.85}>
          <Text style={s.logoutText}>🚪 Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType = 'default', maxLength, multiline = false }: any) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="#aaa" keyboardType={keyboardType}
        maxLength={maxLength} multiline={multiline}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: RED, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  container: { flex: 1, backgroundColor: '#F8F8F8' },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFEAE9', borderWidth: 3, borderColor: RED, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 44 },
  emailText: { color: '#555', fontSize: 14 },
  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  quickBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 14, alignItems: 'center', padding: 14, elevation: 3 },
  quickIcon: { fontSize: 26, marginBottom: 6 },
  quickLabel: { fontSize: 12, color: '#555', fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 12 },
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 13, color: '#666', marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#222' },
  saveBtn: { backgroundColor: RED, borderRadius: 30, height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 14, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  logoutBtn: { borderRadius: 30, height: 52, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: RED, marginBottom: 40 },
  logoutText: { color: RED, fontSize: 16, fontWeight: '700' },
});
