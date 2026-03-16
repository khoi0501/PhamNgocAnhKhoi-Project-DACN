import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, setToken, setIsAdmin } from '../services/api';

type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;
interface LoginProps { navigation: LoginNavigationProp; }

export default function LoginScreen({ navigation }: LoginProps) {
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDangNhap = async () => {
    if (!email.trim() || !matKhau.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/XacThucTaiKhoan/DangNhap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, matKhau }),
      });
      const json = await res.json();
      if (json.statusCode === 200) {
        await setToken(json.token);
        await setIsAdmin(json.isAdmin);
        if (json.isAdmin) {
          navigation.replace('Admin');
        } else {
          navigation.replace('Index');
        }
      } else {
        Alert.alert('Đăng nhập thất bại', json.message || 'Có lỗi xảy ra');
      }
    } catch (e) {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.bg} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* Logo */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>📚</Text>
            </View>
          </View>

          <Text style={styles.title}>Đăng Nhập</Text>

          {/* Email */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Mật khẩu */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Mật khẩu"
              placeholderTextColor="#aaa"
              value={matKhau}
              onChangeText={setMatKhau}
              secureTextEntry={!hienMatKhau}
            />
            <TouchableOpacity onPress={() => setHienMatKhau(!hienMatKhau)} style={styles.hienBtn}>
              <Text style={styles.hienText}>{hienMatKhau ? 'Ẩn' : 'Hiện'}</Text>
            </TouchableOpacity>
          </View>

          {/* Quên mật khẩu */}
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          {/* Nút Đăng Nhập */}
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleDangNhap}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginBtnText}>Đăng Nhập</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.orText}>hoặc</Text>

          {/* Nút Đăng Ký */}
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.registerBtnText}>Đăng Ký</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const RED = '#E85A4F';

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: RED,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    alignItems: 'center',
  },
  logoWrapper: {
    marginBottom: 8,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFDAD6',
  },
  logoText: {
    fontSize: 38,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 20,
    marginTop: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
    width: '100%',
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    height: 50,
  },
  hienBtn: {
    paddingLeft: 8,
  },
  hienText: {
    color: RED,
    fontWeight: '600',
    fontSize: 14,
  },
  forgotText: {
    color: RED,
    fontSize: 13,
    alignSelf: 'flex-start',
    marginBottom: 20,
    marginTop: 2,
  },
  loginBtn: {
    backgroundColor: RED,
    borderRadius: 30,
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  orText: {
    color: '#999',
    fontSize: 14,
    marginBottom: 14,
  },
  registerBtn: {
    borderRadius: 30,
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: RED,
    backgroundColor: 'transparent',
  },
  registerBtnText: {
    color: RED,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
