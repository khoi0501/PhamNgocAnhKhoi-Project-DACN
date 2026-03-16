import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'FormNhapOTP'> };

export default function FormNhapOTP({ navigation }: Props) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleXacThuc = async () => {
    if (otp.trim().length !== 6) { Alert.alert('Lỗi', 'Vui lòng nhập mã OTP 6 số'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/XacThucTaiKhoan/xac-thuc-ma`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maXacThuc: otp }),
      });
      const json = await res.json();
      if (json.statusCode === 200) {
        navigation.navigate('FormDatLaiMatKhau');
      } else {
        Alert.alert('Lỗi', json.message || 'Mã OTP không đúng');
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
        <Text style={s.icon}>📩</Text>
        <Text style={s.title}>Nhập Mã OTP</Text>
        <Text style={s.subtitle}>Nhập mã 6 số đã được gửi đến email của bạn.</Text>

        <TextInput
          style={s.otpInput}
          placeholder="______"
          placeholderTextColor="#ccc"
          value={otp}
          onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity style={s.btn} onPress={handleXacThuc} disabled={loading} activeOpacity={0.85}>
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
  title: { fontSize: 22, fontWeight: '700', color: '#222', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#777', textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  otpInput: { borderWidth: 2, borderColor: RED, borderRadius: 14, width: '80%', height: 64, fontSize: 32, fontWeight: '700', color: '#222', letterSpacing: 10, marginBottom: 24, backgroundColor: '#FFF5F5' },
  btn: { backgroundColor: RED, borderRadius: 30, height: 50, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  back: { color: RED, fontSize: 14 },
});
