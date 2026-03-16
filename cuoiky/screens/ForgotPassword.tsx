import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'> };

export default function ForgotPassword({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGuiOtp = async () => {
    if (!email.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập email'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/XacThucTaiKhoan/gui-ma-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.statusCode === 200) {
        Alert.alert('✅ Đã gửi OTP', 'Vui lòng kiểm tra email của bạn', [
          { text: 'OK', onPress: () => navigation.navigate('FormNhapOTP') },
        ]);
      } else {
        Alert.alert('Lỗi', json.message || 'Không gửi được OTP');
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
        <Text style={s.icon}>🔑</Text>
        <Text style={s.title}>Quên Mật Khẩu</Text>
        <Text style={s.subtitle}>Nhập email của bạn, chúng tôi sẽ gửi mã OTP để xác thực.</Text>

        <View style={s.inputWrap}>
          <TextInput style={s.input} placeholder="Email của bạn" placeholderTextColor="#aaa"
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <TouchableOpacity style={s.btn} onPress={handleGuiOtp} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Gửi Mã OTP</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: RED, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 380, alignItems: 'center', elevation: 10 },
  icon: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#777', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  inputWrap: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 14, marginBottom: 16, backgroundColor: '#FAFAFA', width: '100%', height: 50, justifyContent: 'center' },
  input: { fontSize: 15, color: '#222' },
  btn: { backgroundColor: RED, borderRadius: 30, height: 50, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  back: { color: RED, fontSize: 14 },
});
