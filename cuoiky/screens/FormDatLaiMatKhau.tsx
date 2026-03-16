import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'FormDatLaiMatKhau'> };

export default function FormDatLaiMatKhau({ navigation }: Props) {
  const [matKhauMoi, setMatKhauMoi] = useState('');
  const [xacNhan, setXacNhan] = useState('');
  const [hienMk, setHienMk] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDatLai = async () => {
    if (!matKhauMoi.trim() || !xacNhan.trim()) { Alert.alert('Lỗi', 'Vui lòng điền đầy đủ'); return; }
    if (matKhauMoi !== xacNhan) { Alert.alert('Lỗi', 'Mật khẩu không trùng khớp'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/XacThucTaiKhoan/dat-lai-mat-khau`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matKhauMoi, xacNhanMatKhauMoi: xacNhan }),
      });
      const json = await res.json();
      if (json.statusCode === 200) {
        Alert.alert('✅ Thành công', 'Mật khẩu đã được đặt lại.', [
          { text: 'Đăng nhập', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Lỗi', json.message || 'Không thể đặt lại mật khẩu');
      }
    } catch {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.bg} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.card}>
        <Text style={s.icon}>🔒</Text>
        <Text style={s.title}>Đặt Lại Mật Khẩu</Text>

        <View style={s.inputWrap}>
          <TextInput style={[s.input, { flex: 1 }]} placeholder="Mật khẩu mới" placeholderTextColor="#aaa"
            value={matKhauMoi} onChangeText={setMatKhauMoi} secureTextEntry={!hienMk} />
          <TouchableOpacity onPress={() => setHienMk(!hienMk)}>
            <Text style={s.toggle}>{hienMk ? 'Ẩn' : 'Hiện'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.inputWrap}>
          <TextInput style={s.input} placeholder="Xác nhận mật khẩu mới" placeholderTextColor="#aaa"
            value={xacNhan} onChangeText={setXacNhan} secureTextEntry={!hienMk} />
        </View>

        <TouchableOpacity style={s.btn} onPress={handleDatLai} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Xác Nhận</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Quay lại</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: RED, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, alignItems: 'center', elevation: 10 },
  icon: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 20 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 14, marginBottom: 12, backgroundColor: '#FAFAFA', width: '100%', height: 50 },
  input: { flex: 1, fontSize: 15, color: '#222' },
  toggle: { color: RED, fontWeight: '600', fontSize: 14 },
  btn: { backgroundColor: RED, borderRadius: 30, height: 50, width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 16, elevation: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  back: { color: RED, fontSize: 14 },
});
