import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Register'> };

export default function RegisterScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [xacNhan, setXacNhan] = useState('');
  const [hienMk, setHienMk] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDangKy = async () => {
    if (!email.trim() || !matKhau.trim() || !xacNhan.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin'); return;
    }
    if (matKhau !== xacNhan) {
      Alert.alert('Lỗi', 'Mật khẩu và xác nhận không trùng khớp'); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/XacThucTaiKhoan/DangKy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, matKhau, xacNhanMatKhau: xacNhan }),
      });
      const json = await res.json();
      if (json.statusCode === 200) {
        Alert.alert('✅ Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Đăng ký thất bại', json.message || 'Có lỗi xảy ra');
      }
    } catch {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.bg} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <View style={s.logoCircle}><Text style={s.logoText}>📚</Text></View>
          <Text style={s.title}>Tạo Tài Khoản</Text>

          <View style={s.inputWrap}>
            <TextInput style={s.input} placeholder="Email" placeholderTextColor="#aaa"
              value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={s.inputWrap}>
            <TextInput style={[s.input, { flex: 1 }]} placeholder="Mật khẩu" placeholderTextColor="#aaa"
              value={matKhau} onChangeText={setMatKhau} secureTextEntry={!hienMk} />
            <TouchableOpacity onPress={() => setHienMk(!hienMk)}>
              <Text style={s.toggle}>{hienMk ? 'Ẩn' : 'Hiện'}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.inputWrap}>
            <TextInput style={s.input} placeholder="Xác nhận mật khẩu" placeholderTextColor="#aaa"
              value={xacNhan} onChangeText={setXacNhan} secureTextEntry={!hienMk} />
          </View>

          <TouchableOpacity style={s.btn} onPress={handleDangKy} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Đăng Ký</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.link}>Đã có tài khoản? <Text style={{ color: RED }}>Đăng nhập</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: RED },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, alignItems: 'center', elevation: 10 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF3F2', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#FFDAD6' },
  logoText: { fontSize: 38 },
  title: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 20 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 14, marginBottom: 12, backgroundColor: '#FAFAFA', width: '100%', height: 50 },
  input: { flex: 1, fontSize: 15, color: '#222' },
  toggle: { color: RED, fontWeight: '600', fontSize: 14 },
  btn: { backgroundColor: RED, borderRadius: 30, height: 50, width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 16, elevation: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { color: '#666', fontSize: 14 },
});
