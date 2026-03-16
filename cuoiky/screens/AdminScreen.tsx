import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { removeToken, authFetch, BASE_URL, setPermissions, findPermission } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Admin'> };

// Cấu hình match từ khóa chính xác cho từng menu
const menuItems = [
  { icon: '📦', label: 'Duyệt Đơn Hàng', route: 'DuyetDonHang', permConfig: { exact: ['duyệt đơn hàng', 'quản lý đơn hàng', 'đơn hàng'], matches: ['đơn hàng'] } },
  { icon: '📚', label: 'Danh Sách Sách', route: 'DanhSachSach', permConfig: { exact: ['danh sách sách', 'quản lý sách', 'sách'], matches: ['sách'], avoid: ['thêm sách'] } },
  { icon: '➕', label: 'Thêm Sách', route: 'CreateSach', permConfig: { exact: ['thêm sách', 'tạo sách'], matches: ['thêm sách'] } },
  { icon: '🏷️', label: 'Quản Lý Thể Loại', route: 'CreateTheLoai', permConfig: { exact: ['quản lý thể loại', 'danh mục thể loại', 'thể loại'], matches: ['thể loại'] } },
  { icon: '🎁', label: 'Phiếu Giảm Giá', route: 'QuanLyPhieuGiamGia', permConfig: { exact: ['phiếu giảm giá', 'quản lý khuyến mãi', 'khuyến mãi'], matches: ['giảm giá', 'khuyến mãi'] } },
  { icon: '📥', label: 'Nhập Hàng', route: 'QuanLyNhapHang', permConfig: { exact: ['nhập hàng', 'quản lý nhập hàng'], matches: ['nhập hàng'] } },
  { icon: '🗃️', label: 'Tồn Kho', route: 'QuanLyTonKho', permConfig: { exact: ['tồn kho', 'quản lý tồn kho', 'kho'], matches: ['tồn kho'] } },
  { icon: '👥', label: 'Quản Lý Nhân Viên', route: 'QuanLyNhanVien', permConfig: { exact: ['nhân viên', 'tài khoản', 'quản lý nhân viên'], matches: ['nhân viên', 'tài khoản'] } },
  { icon: '📊', label: 'Thống Kê', route: 'ThongKe', permConfig: { exact: ['thống kê', 'báo cáo'], matches: ['thống kê'] } },
] as const;

export default function AdminScreen({ navigation }: Props) {
  const [isAdminFull, setIsAdminFull] = useState(false);
  const [userPerms, setUserPerms] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchPermissions();
    }, [])
  );

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      // 1. Fetch danh sách chức năng để lấy Map ID -> Tên
      const resCN = await authFetch(`${BASE_URL}/api/Admin/LayDanhSachChucNang`);
      const jsonCN = await resCN.json();
      let funcList = [];
      if (jsonCN.statusCode === 200) {
        funcList = jsonCN.data;
        setFeatures(funcList);
      }

      // 2. Fetch danh sách quyền của tài khoản
      const resPQ = await authFetch(`${BASE_URL}/api/Admin/LayPhanQuyenCuaToi`);
      const jsonPQ = await resPQ.json();
      
      if (jsonPQ.statusCode === 200) {
        if (jsonPQ.message.includes('full quyền')) {
          setIsAdminFull(true);
          await setPermissions([{ full: true }]);
        } else {
          // Map ID chức năng -> Tên chức năng
          const mappedPerms = jsonPQ.data.map((pq: any) => {
            const f = funcList.find((x: any) => x.id === pq.idChucNang);
            return {
              ...pq,
              tenChucNang: f ? f.tenChucNang.toLowerCase() : ''
            };
          });
          setUserPerms(mappedPerms);
          await setPermissions(mappedPerms); 
        }
      }
    } catch (e) {
      console.log('Lỗi fetch phân quyền AdminScreen', e);
    } finally {
      setLoading(false);
    }
  };

  const hasViewPermission = (permConfig: any) => {
    if (isAdminFull) return true;
    const perm = findPermission(userPerms, permConfig);
    return perm ? perm.quyenXem : false;
  };

  const handleLogout = async () => {
    await removeToken();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F2F5' }}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.welcome}>Chào mừng, Admin 👑</Text>
          <Text style={s.subtitle}>Quản lý hệ thống cửa hàng sách</Text>
        </View>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {loading ? (
           <View style={{ padding: 40, alignItems: 'center' }}>
             <ActivityIndicator size="large" color={RED} />
             <Text style={{ marginTop: 10, color: '#666' }}>Đang tải phân quyền...</Text>
           </View>
        ) : (
          <View style={s.grid}>
            {menuItems.map((item, idx) => {
              const canView = hasViewPermission(item.permConfig);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[s.menuCard, !canView && { opacity: 0.4, backgroundColor: '#E0E0E0' }]}
                  onPress={() => canView ? navigation.navigate(item.route as any) : null}
                  activeOpacity={0.8}
                  disabled={!canView}
                >
                  <Text style={[s.menuIcon, !canView && { opacity: 0.5 }]}>{item.icon}</Text>
                  <Text style={s.menuLabel}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { backgroundColor: RED, paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  welcome: { color: '#fff', fontSize: 20, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  logoutText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  menuCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', elevation: 3 },
  menuIcon: { fontSize: 38, marginBottom: 10 },
  menuLabel: { fontSize: 13, fontWeight: '700', color: '#333', textAlign: 'center', lineHeight: 18 },
});
