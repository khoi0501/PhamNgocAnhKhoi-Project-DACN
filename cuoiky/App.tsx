// App.tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import IndexScreen from './screens/IndexScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPassword from './screens/ForgotPassword';
import AdminScreen from './screens/AdminScreen';
import QuanLyNhanVien from './screens/QuanLyNhanVien';
import FormCreateNhanVien from './screens/FormCreateNhanVien';
import FormNhapOTP from './screens/FormNhapOTP';
import FormDatLaiMatKhau from './screens/FormDatLaiMatKhau';
import CreateTheLoai from './screens/CreateTheLoai';
import CreateSach from './screens/CreateSach';
import DanhSachSach from "./screens/DanhSachSach";
import ChiTietSach from "./screens/ChiTietSach";
import Thongtin from "./screens/Thongtin";
import CartScreen from "./screens/CartScreen";
import DonHangScreen from "./screens/DonHang";
import CheckoutScreen from "./screens/CheckoutScreen";
import DuyetDonHang from "./screens/DuyetDonHang";
import QuanLyPhieuGiamGia from "./screens/QuanLyPhieuGiamGia";
import DanhSachPhieuGiamGia from "./screens/DanhSachPhieuGiamGia";
import QuanLyNhapHang from "./screens/QuanLyNhapHang";
import QuanLyTonKho from "./screens/QuanLyTonKho";
import DanhGiaCuaToi from "./screens/DanhGiaCuaToi";
import ThongKeScreen from "./screens/ThongKeScreen";
import { SachDTO } from "./services/sachGet";



// Khai báo các màn hình trong Stack
export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
   ForgotPassword: undefined;
   Index: undefined;
   Admin: undefined;
   QuanLyNhanVien: undefined;
   FormCreateNhanVien: undefined;
   FormNhapOTP: undefined;
   FormDatLaiMatKhau: undefined;
   CreateTheLoai: undefined;
   CreateSach: undefined;
   DanhSachSach: undefined;
   ChiTietSach: { sach: SachDTO };
   Thongtin: undefined;
   Cart: undefined;
   DonHang: undefined;
   Checkout: undefined;
  DuyetDonHang: undefined;
  QuanLyPhieuGiamGia: undefined;
  DanhSachPhieuGiamGia: undefined;
  QuanLyNhapHang: undefined;
  QuanLyTonKho: undefined;
  DanhGiaCuaToi: undefined;
  ThongKe: undefined;
}; // Updated to include DonHang route

// Type cho navigation của Home
type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
interface HomeProps {
  navigation: HomeScreenNavigationProp;
}

function HomeScreen({ navigation }: HomeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>K</Text>
      <Text style={styles.title}>Chào Mừng Đến Với</Text>
      <Text style={styles.subtitle}>Cửa Hàng Sách K</Text>

      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.mainButtonText}>Đăng Nhập</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.mainButton, styles.outlineButton]}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.outlineButtonText}>Đăng Ký</Text>
      </TouchableOpacity>

      <StatusBar style="light" />
    </View>
  );
}

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="ForgotPassword"
          component={ForgotPassword}
          options={{ headerShown: false }} 
        />
 <Stack.Screen name="Index" component={IndexScreen} options={{ headerShown: false }} />
 <Stack.Screen name="Admin" component={AdminScreen} options={{ headerShown: false }} />
 <Stack.Screen name="QuanLyNhanVien" component={QuanLyNhanVien} options={{ headerShown: false }} />
 <Stack.Screen name="FormCreateNhanVien" component={FormCreateNhanVien} options={{ headerShown: false }} />
 <Stack.Screen name="FormNhapOTP" component={FormNhapOTP} options={{ headerShown: false }} />
 <Stack.Screen name="FormDatLaiMatKhau" component={FormDatLaiMatKhau} options={{ headerShown: false }} />
 <Stack.Screen name="CreateTheLoai" component={CreateTheLoai} options={{ headerShown: false }} />
 <Stack.Screen name="CreateSach" component={CreateSach} options={{ headerShown: false }} />
 <Stack.Screen name="DanhSachSach" component={DanhSachSach} options={{ headerShown: false }} />
 <Stack.Screen name="ChiTietSach" component={ChiTietSach} options={{ headerShown: false }} />
 <Stack.Screen name="Thongtin" component={Thongtin} options={{ headerShown: false }} />
 <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
 <Stack.Screen name="DonHang" component={DonHangScreen} options={{ headerShown: false }} />
 <Stack.Screen name="DuyetDonHang" component={DuyetDonHang} options={{ headerShown: false }} />
 <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
 <Stack.Screen name="QuanLyPhieuGiamGia" component={QuanLyPhieuGiamGia} options={{ headerShown: false }} />
 <Stack.Screen name="DanhSachPhieuGiamGia" component={DanhSachPhieuGiamGia} options={{ headerShown: false }} />
 <Stack.Screen name="QuanLyNhapHang" component={QuanLyNhapHang} options={{ headerShown: false }} />
 <Stack.Screen name="QuanLyTonKho" component={QuanLyTonKho} options={{ headerShown: false }} />
 <Stack.Screen name="DanhGiaCuaToi" component={DanhGiaCuaToi} options={{ headerShown: false }} />
 <Stack.Screen name="ThongKe" component={ThongKeScreen} options={{ headerShown: false }} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E85A4F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 90,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 36,
  },
  mainButton: {
    width: '80%',
    height: 52,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    marginBottom: 14,
  },
  mainButtonText: {
    color: '#E85A4F',
    fontSize: 16,
    fontWeight: '700',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
  },
  outlineButtonText: {
    color: '#fff',
  },
});
