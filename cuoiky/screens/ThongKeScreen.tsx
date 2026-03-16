import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ThongKe'> };

export default function ThongKeScreen({ navigation }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // 1. Doanh thu & Tổng đơn (API: /api/ThongKe/DoanhThu?loai=nam)
      const currentYear = new Date().getFullYear();
      const dtRes = await authFetch(`${BASE_URL}/api/ThongKe/DoanhThu?loai=nam&tuNgay=${currentYear}-01-01&denNgay=${currentYear}-12-31`);
      const dtJson = await dtRes.json();
      const tongDoanhThu = dtJson.data?.length > 0 ? (dtJson.data[0].tongDoanhThu ?? dtJson.data[0].TongDoanhThu ?? 0) : 0;
      const totalOrders = dtJson.data?.length > 0 ? (dtJson.data[0].soDonHang ?? dtJson.data[0].SoDonHang ?? 0) : 0;

      // 2. Trạng thái đơn hàng (API: /api/ThongKe/DonHangTheoTrangThai)
      const ttRes = await authFetch(`${BASE_URL}/api/ThongKe/DonHangTheoTrangThai`);
      const ttJson = await ttRes.json();
      const ttList = ttJson.data?.chiTiet || [];
      const donHoanThanh = ttList.find((x: any) => (x.tenTrangThai || x.TenTrangThai) === 'Đơn hàng đã giao')?.soLuong || ttList.find((x: any) => (x.tenTrangThai || x.TenTrangThai) === 'Đơn hàng đã giao')?.SoLuong || 0;
      const donChoXacNhan = ttList.find((x: any) => (x.tenTrangThai || x.TenTrangThai) === 'Chờ xác nhận')?.soLuong || ttList.find((x: any) => (x.tenTrangThai || x.TenTrangThai) === 'Chờ xác nhận')?.SoLuong || 0;
      const donHuy = ttList.find((x: any) => (x.tenTrangThai || x.TenTrangThai) === 'Hủy đơn hàng')?.soLuong || ttList.find((x: any) => (x.tenTrangThai || x.TenTrangThai) === 'Hủy đơn hàng')?.SoLuong || 0;
      const realTotalOrders = ttJson.data?.tongDonHang || ttJson.data?.TongDonHang || totalOrders;

      // 3. Nhân viên (API: /api/Admin/LayDanhSachAdmin)
      const adminRes = await authFetch(`${BASE_URL}/api/Admin/LayDanhSachAdmin`);
      const adminJson = await adminRes.json();
      const totalAdmin = adminJson.data?.length || 0;

      // 4. Tình trạng sách: Tổng đầu sách (API: /api/ThongKe/TonKhoHienTai)
      const tkRes = await authFetch(`${BASE_URL}/api/ThongKe/TonKhoHienTai`);
      const tkJson = await tkRes.json();
      const totalSach = tkJson.data?.chiTiet?.length || 0;

      // 5. Tình trạng sách: Hết hàng (API: /api/ThongKe/SanPhamSapHet?nguong=0)
      const hhRes = await authFetch(`${BASE_URL}/api/ThongKe/SanPhamSapHet?nguong=0`);
      const hhJson = await hhRes.json();
      const sachHetHang = hhJson.data?.length || 0;

      // 6. Sách xem nhiều nhất (API: /api/ThongKe/SachDuocXemNhieuNhat?top=5)
      const spRes = await authFetch(`${BASE_URL}/api/ThongKe/SachDuocXemNhieuNhat?top=5`);
      const spJson = await spRes.json();
      const topSachs = spJson.data?.map((s: any) => ({
        id: s.id || s.Id,
        tenSach: s.tenSach || s.TenSach,
        luotXem: s.luotXem ?? s.LuotXem ?? 0
      })) || [];

      // 7. Sản phẩm bán chạy (API: /api/ThongKe/SanPhamBanChay?top=5)
      const bcRes = await authFetch(`${BASE_URL}/api/ThongKe/SanPhamBanChay?top=5`);
      const bcJson = await bcRes.json();
      const banChay = bcJson.data?.map((s: any) => ({
        id: s.idSach || s.IdSach,
        tenSach: s.tenSach || s.TenSach,
        soLuongBan: s.soLuongBan || s.SoLuongBan || 0,
        doanhThu: s.doanhThu || s.DoanhThu || 0
      })) || [];

      // 8. Tồn kho theo thể loại (API: /api/ThongKe/TonKhoTheoTheLoai)
      const tlRes = await authFetch(`${BASE_URL}/api/ThongKe/TonKhoTheoTheLoai`);
      const tlJson = await tlRes.json();
      const theoTheLoai = tlJson.data?.map((t: any) => ({
        tenTheLoai: t.tenTheLoai || t.TenTheLoai,
        soSanPham: t.soSanPham || t.SoSanPham || 0,
        tongSoLuong: t.tongSoLuong || t.TongSoLuong || 0,
        tongGiaTri: t.tongGiaTri || t.TongGiaTri || 0
      })) || [];

      // 9. Đánh giá cao nhất (API: /api/ThongKe/DanhGiaTheoSanPham?top=5)
      const dgRes = await authFetch(`${BASE_URL}/api/ThongKe/DanhGiaTheoSanPham?top=5`);
      const dgJson = await dgRes.json();
      const topRated = dgJson.data?.map((s: any) => ({
        id: s.idSach || s.IdSach,
        tenSach: s.tenSach || s.TenSach,
        soLuongDanhGia: s.soLuongDanhGia || s.SoLuongDanhGia || 0,
        diemTrungBinh: s.diemTrungBinh || s.DiemTrungBinh || 0
      })) || [];

      // 10. Phiếu giảm giá (API: /api/ThongKe/PhieuGiamGia)
      const pgRes = await authFetch(`${BASE_URL}/api/ThongKe/PhieuGiamGia`);
      const pgJson = await pgRes.json();
      const pgStats = pgJson.data?.tongSoat || {};

      // 11. Tổng hợp chi tiết (API: /api/ThongKe/TongHop)
      const thRes = await authFetch(`${BASE_URL}/api/ThongKe/TongHop`);
      const thJson = await thRes.json();
      const tongHopData = thJson.data || {};

      setData({
        tongDoanhThu: tongHopData.doanhThu?.namNay || tongHopData.DoanhThu?.NamNay || tongDoanhThu,
        donHoanThanh,
        donChoXacNhan,
        donHuy,
        totalOrders: realTotalOrders,
        totalSach: tongHopData.sanPham?.tong || tongHopData.SanPham?.Tong || totalSach,
        sachHetHang,
        totalAdmin,
        topSachs,
        banChay,
        theoTheLoai,
        topRated,
        pgStats: {
          tongSoPhieu: pgStats.tongSoPhieu || pgStats.TongSoPhieu || 0,
          soPhieuDaSuDung: pgStats.soPhieuDaSuDung || pgStats.SoPhieuDaSuDung || 0,
          soPhieuSapHetHan: pgStats.soPhieuSapHetHan || pgStats.SoPhieuSapHetHan || 0,
          tongGiaTriGiam: pgStats.tongGiaTriGiam || pgStats.TongGiaTriGiam || 0
        },
        // Dữ liệu từ TongHop
        doanhThuHomNay: tongHopData.doanhThu?.homNay || tongHopData.DoanhThu?.HomNay || 0,
        doanhThuThangNay: tongHopData.doanhThu?.thangNay || tongHopData.DoanhThu?.ThangNay || 0,
        chiPhiNhapThangNay: tongHopData.chiPhiNhapHang?.thangNay || tongHopData.ChiPhiNhapHang?.ThangNay || 0,
        loiNhuanThangNay: tongHopData.loiNhuan?.thangNay || tongHopData.LoiNhuan?.ThangNay || 0,
        diemTrungBinh: tongHopData.danhGia?.diemTrungBinh || tongHopData.DanhGia?.DiemTrungBinh || 0,
        tongDanhGia: tongHopData.danhGia?.tong || tongHopData.DanhGia?.Tong || 0,
        tongPhieuGiamGia: tongHopData.phieuGiamGia?.tong || tongHopData.PhieuGiamGia?.Tong || 0,
        phieuSapHetHan: tongHopData.phieuGiamGia?.sapHetHan || tongHopData.PhieuGiamGia?.SapHetHan || 0,
      });
    } catch (e) {
      console.error('Lỗi tải thống kê:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F2F5' }}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>📊 Thống Kê</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} colors={[RED]} />}>

        {/* Revenue card */}
        <View style={s.revenueCard}>
          <Text style={s.revenueLabel}>Tổng Doanh Thu</Text>
          <Text style={s.revenueValue}>{(data?.tongDoanhThu ?? 0).toLocaleString('vi-VN')} đ</Text>
          <Text style={s.revenueSub}>Từ {data?.totalOrders ?? 0} đơn hàng tất cả</Text>
          
          {/* Doanh thu hôm nay (nhỏ ở dưới) */}
          <View style={s.todayTag}>
            <Text style={s.todayTagText}>Hôm nay: {(data?.doanhThuHomNay ?? 0).toLocaleString('vi-VN')} đ</Text>
          </View>
        </View>

        {/* Order stats */}
        <View style={s.gridRow}>
          <StatCard label="Đơn hoàn thành" value={data?.donHoanThanh} color="#4CAF50" icon="✅" />
          <StatCard label="Chờ xác nhận" value={data?.donChoXacNhan} color="#FF9800" icon="⏳" />
        </View>
        <View style={s.gridRow}>
          <StatCard label="Đơn đã hủy" value={data?.donHuy} color="#F44336" icon="❌" />
          <StatCard label="Nhân viên" value={data?.totalAdmin} color="#2196F3" icon="👥" />
        </View>

        {/* Doanh thu & Lợi Nhuận Tháng Này */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>💰 Tình hình kinh doanh tháng này</Text>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={[s.statNumSmall, { color: '#4CAF50' }]}>{(data?.doanhThuThangNay ?? 0).toLocaleString('vi-VN')} đ</Text>
              <Text style={s.statLabel}>Doanh thu</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statNumSmall, { color: '#F44336' }]}>{(data?.chiPhiNhapThangNay ?? 0).toLocaleString('vi-VN')} đ</Text>
              <Text style={s.statLabel}>Chi phí nhập</Text>
            </View>
          </View>
          <View style={[s.statDividerHorizontal]} />
          <View style={s.statItemFull}>
              <Text style={[s.statNum, { color: (data?.loiNhuanThangNay ?? 0) >= 0 ? '#2E7D32' : '#D32F2F' }]}>{(data?.loiNhuanThangNay ?? 0).toLocaleString('vi-VN')} đ</Text>
              <Text style={s.statLabel}>LỢI NHUẬN</Text>
          </View>
        </View>

        {/* Khách hàng & Mã giảm giá */}
        <View style={s.gridRow}>
          <View style={s.halfSection}>
            <Text style={s.sectionTitleSmall}>⭐ Trải nghiệm</Text>
            <Text style={[s.statNum, { color: '#FFB300' }]}>{data?.diemTrungBinh}/5</Text>
            <Text style={s.statLabel}>{data?.tongDanhGia} lượt đánh giá</Text>
          </View>
          <View style={s.halfSection}>
            <Text style={s.sectionTitleSmall}>🎟️ Phiếu ưu đãi</Text>
            <Text style={[s.statNum, { color: '#9C27B0' }]}>{data?.tongPhieuGiamGia || data?.pgStats?.tongSoPhieu}</Text>
            <Text style={s.statLabel}>{data?.pgStats?.soPhieuSapHetHan || data?.phieuSapHetHan} phiếu sắp hết hạn</Text>
            {data?.pgStats?.tongGiaTriGiam > 0 && (
              <Text style={[s.statLabel, { marginTop: 4, fontWeight: '600' }]}>Đã giảm: {data.pgStats.tongGiaTriGiam.toLocaleString('vi-VN')} đ</Text>
            )}
          </View>
        </View>

        {/* Books stats */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>📚 Tình trạng sách</Text>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={[s.statNum, { color: '#333' }]}>{data?.totalSach}</Text>
              <Text style={s.statLabel}>Tổng đầu sách</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={[s.statNum, { color: '#F44336' }]}>{data?.sachHetHang}</Text>
              <Text style={s.statLabel}>Hết hàng</Text>
            </View>
          </View>
        </View>

        {/* Best selling books */}
        {data?.banChay?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>🏆 Sản phẩm bán chạy nhất</Text>
            {data.banChay.map((s: any, idx: number) => (
              <View key={`bc_${s.id}_${idx}`} style={styles.topItem}>
                <Text style={styles.topRank}>#{idx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topName} numberOfLines={1}>{s.tenSach}</Text>
                  <Text style={styles.subText}>{s.soLuongBan} bản đã bán</Text>
                </View>
                <Text style={styles.topValue}>{s.doanhThu.toLocaleString('vi-VN')} đ</Text>
              </View>
            ))}
          </View>
        )}


        {/* Top rated books */}
        {data?.topRated?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>⭐ Sản phẩm được yêu thích nhất</Text>
            {data.topRated.map((s: any, idx: number) => (
              <View key={`tr_${s.id}_${idx}`} style={styles.topItem}>
                <Text style={styles.topRank}>#{idx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.topName} numberOfLines={1}>{s.tenSach}</Text>
                  <Text style={styles.subText}>{s.soLuongDanhGia} lượt đánh giá</Text>
                </View>
                <Text style={[styles.topValue, { color: '#FFB300' }]}>{s.diemTrungBinh}/5 ⭐</Text>
              </View>
            ))}
          </View>
        )}

        {/* Top books by view count */}
        {data?.topSachs?.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>👁️ Sách xem nhiều nhất</Text>
            {data.topSachs.map((s: any, idx: number) => (
              <View key={`${s.id}_${idx}`} style={styles.topItem}>
                <Text style={styles.topRank}>#{idx + 1}</Text>
                <Text style={styles.topName} numberOfLines={1}>{s.tenSach}</Text>
                <Text style={styles.topViews}>{s.luotXem ?? 0} lượt xem</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={[s.statCard, { borderLeftColor: color }]}>
      <Text style={s.statCardIcon}>{icon}</Text>
      <Text style={[s.statCardNum, { color }]}>{value ?? 0}</Text>
      <Text style={s.statCardLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  topRank: { width: 28, fontSize: 14, fontWeight: '700', color: '#aaa' },
  topName: { flex: 1, fontSize: 13, color: '#333', fontWeight: '500' },
  topViews: { fontSize: 12, color: '#888' },
  topValue: { fontSize: 12, fontWeight: '700', color: RED, marginLeft: 8 },
  subText: { fontSize: 11, color: '#888', marginTop: 2 },
});

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: RED, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  revenueCard: { backgroundColor: RED, borderRadius: 20, padding: 24, alignItems: 'center', elevation: 6 },
  revenueLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  revenueValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 6 },
  revenueSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  todayTag: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 12 },
  todayTagText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  gridRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2, borderLeftWidth: 4, alignItems: 'center' },
  statCardIcon: { fontSize: 28, marginBottom: 8 },
  statCardNum: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statCardLabel: { fontSize: 12, color: '#888', textAlign: 'center' },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 14 },
  sectionTitleSmall: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8 },
  halfSection: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2, alignItems: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statItemFull: { alignItems: 'center', paddingVertical: 10 },
  statNum: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statNumSmall: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#888' },
  statDivider: { width: 1, height: 50, backgroundColor: '#E0E0E0' },
  statDividerHorizontal: { height: 1, backgroundColor: '#E0E0E0', width: '100%', marginVertical: 12 },
});
