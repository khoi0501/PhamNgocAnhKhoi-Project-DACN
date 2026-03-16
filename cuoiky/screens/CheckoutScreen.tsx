import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, StatusBar, Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch } from '../services/api';
import AddressPicker from '../components/AddressPicker';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Checkout'> };

export default function CheckoutScreen({ navigation }: Props) {
  const [hovaTen, setHovaTen] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [diaChi, setDiaChi] = useState('');
  const [maGiamGia, setMaGiamGia] = useState('');
  const [phuongThuc, setPhuongThuc] = useState<'COD' | 'VNPAY'>('COD');
  const [loading, setLoading] = useState(false);
  const [loadingAddr, setLoadingAddr] = useState(true);
  const [tongTienHang, setTongTienHang] = useState(0);
  const [giaTriGiam, setGiaTriGiam] = useState(0);
  
  const tinhPhiVanChuyen = (diaChiParam: string) => {
    if (!diaChiParam) return { phi: 25000, soNgay: 2 };
    const txt = diaChiParam.toLowerCase();
    
    if (txt.includes("tp. hồ chí minh") || txt.includes("tp hồ chí minh") || txt.includes("thành phố hồ chí minh") || txt.includes("hồ chí minh") || txt.includes("ho chi minh") || txt.includes("sài gòn") || txt.includes("saigon") || txt.includes("tp.hcm") || txt.includes("tp hcm")) {
      return { phi: 15000, soNgay: 1 };
    }
    if (txt.includes("cần thơ") || txt.includes("can tho")) {
      return { phi: 25000, soNgay: 2 };
    }
    if (txt.includes("huế") || txt.includes("hue") || txt.includes("quảng bình") || txt.includes("quang binh") || txt.includes("quảng trị") || txt.includes("quang tri") || txt.includes("thừa thiên huế") || txt.includes("thua thien hue") || txt.includes("đà nẵng") || txt.includes("da nang") || txt.includes("quảng nam") || txt.includes("quang nam") || txt.includes("quảng ngãi") || txt.includes("quang ngai") || txt.includes("bình định") || txt.includes("binh dinh") || txt.includes("phú yên") || txt.includes("phu yen") || txt.includes("khánh hòa") || txt.includes("khanh hoa") || txt.includes("ninh thuận") || txt.includes("ninh thuan") || txt.includes("bình thuận") || txt.includes("binh thuan") || txt.includes("lâm đồng") || txt.includes("lam dong")) {
      return { phi: 35000, soNgay: 3 };
    }
    if (txt.includes("hà nội") || txt.includes("ha noi") || txt.includes("hải phòng") || txt.includes("hai phong") || txt.includes("quảng ninh") || txt.includes("quang ninh") || txt.includes("lạng sơn") || txt.includes("lang son") || txt.includes("cao bằng") || txt.includes("cao bang") || txt.includes("bắc kạn") || txt.includes("bac kan") || txt.includes("thái nguyên") || txt.includes("thai nguyen") || txt.includes("phú thọ") || txt.includes("phu tho") || txt.includes("vĩnh phúc") || txt.includes("vinh phuc") || txt.includes("bắc giang") || txt.includes("bac giang") || txt.includes("bắc ninh") || txt.includes("bac ninh") || txt.includes("hải dương") || txt.includes("hai duong") || txt.includes("hưng yên") || txt.includes("hung yen") || txt.includes("hà nam") || txt.includes("ha nam") || txt.includes("nam định") || txt.includes("nam dinh") || txt.includes("ninh bình") || txt.includes("ninh binh") || txt.includes("thanh hóa") || txt.includes("thanh hoa") || txt.includes("nghệ an") || txt.includes("nghe an") || txt.includes("hà tĩnh") || txt.includes("ha tinh")) {
      return { phi: 45000, soNgay: 4 };
    }
    return { phi: 25000, soNgay: 2 };
  };

  const deliveryInfo = tongTienHang > 0 ? tinhPhiVanChuyen(diaChi) : { phi: 0, soNgay: 0 };
  const phiVanChuyen = deliveryInfo.phi;
  
  // Tính ngày giao thực tế
  const getNgayGiao = () => {
    if (deliveryInfo.soNgay === 0) return '';
    const d = new Date();
    d.setDate(d.getDate() + deliveryInfo.soNgay);
    return `Nhận hàng vào ${d.toLocaleDateString('vi-VN')}`;
  };

  // Fetch cart to calc total
  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`${BASE_URL}/api/CartShop/HienThiGioHang`);
        const json = await res.json();
        if (json.statusCode === 200 && json.data?.items) {
          const sum = json.data.items.reduce((acc: number, item: any) => acc + (item.gia * item.soLuong), 0);
          setTongTienHang(sum);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch(`${BASE_URL}/api/DatHang/LayDiaChiUser`);
        const json = await res.json();
        if (json.statusCode === 200 && json.data) {
          setHovaTen(json.data.hovaTen ?? '');
          setSoDienThoai(json.data.soDienThoai ?? '');
          setDiaChi(json.data.diaChi ?? '');
        }
      } catch { } finally { setLoadingAddr(false); }
    })();
  }, []);

  const handleDatHang = async () => {
    if (!diaChi.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ giao hàng'); return; }
    setLoading(true);
    try {
      const res = await authFetch(`${BASE_URL}/api/DatHang/DatHang`, {
        method: 'POST',
        body: JSON.stringify({
          diaChiGiaoHang: diaChi,
          hovaTen,
          soDienThoai,
          maGiamGia: maGiamGia.trim() || undefined,
          phuongThucThanhToan: phuongThuc,
        }),
      });
      const json = await res.json();
      if (json.statusCode === 200) {
        Alert.alert('✅ Thành công', 'Đơn hàng đã đặt thành công vui lòng vào cá nhân chọn đơn hàng để xem lại thông tin', [
          { text: 'OK', onPress: () => navigation.replace('Index') },
        ]);
      } else if (json.statusCode === 201 && json.url) {
        // VNPAY - open payment URL
        Alert.alert('💳 Thanh toán VNPay', 'Đơn hàng đã đặt, nhấn OK để chuyển đến trang thanh toán VNPay', [
          { 
            text: 'OK', 
            onPress: () => {
              if (json.url) {
                Linking.openURL(json.url).catch(err => {
                  console.error("Failed to open URL:", err);
                  Alert.alert('Lỗi', 'Không thể mở trang thanh toán');
                });
                navigation.replace('Index');
              }
            } 
          },
        ]);
      } else {
        Alert.alert('Lỗi', json.message || 'Không thể đặt hàng');
      }
    } catch {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  if (loadingAddr) return <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F8F8' }}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Đặt Hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>📍 Thông tin giao hàng</Text>
          <Field label="Họ và tên" value={hovaTen} onChange={setHovaTen} placeholder="Nhập họ tên" />
          <Field label="Số điện thoại" value={soDienThoai} onChange={setSoDienThoai} placeholder="Số điện thoại" keyboardType="phone-pad" />
          <AddressPicker value={diaChi} onChange={setDiaChi} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>🎁 Mã giảm giá (tuỳ chọn)</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[s.inputWrap, { flex: 1 }]}>
              <TextInput style={s.input} value={maGiamGia} onChangeText={setMaGiamGia}
                placeholder="Nhập mã giảm giá..." placeholderTextColor="#aaa"
                autoCapitalize="characters" />
            </View>
            <TouchableOpacity style={s.applyBtn} onPress={async () => {
              if (!maGiamGia) return;
              try {
                const res = await authFetch(`${BASE_URL}/api/PhieuGiamGia/User/List`);
                const json = await res.json();
                if (json.statusCode === 200 && json.data) {
                  const km = json.data.find((p: any) => p.maGiamGia === maGiamGia.trim().toUpperCase());
                  if (!km) {
                    Alert.alert('Lỗi', 'Mã không tồn tại hoặc hết hạn');
                  } else {
                    // Kiểm tra điều kiện đơn hàng tối thiểu
                    let dkHopLe = true;
                    if (km.dieuKienGiamGia) {
                      const txtDk = km.dieuKienGiamGia.toLowerCase();
                      if (txtDk.includes('100k') || txtDk.includes('100.000') || txtDk.includes('100000')) {
                        if (tongTienHang < 100000) {
                          Alert.alert('Chưa đạt điều kiện', 'Đơn hàng chưa đạt mức tối thiểu 100.000đ để áp dụng mã này.');
                          dkHopLe = false;
                        }
                      } else if (txtDk.includes('200k') || txtDk.includes('200.000') || txtDk.includes('200000')) {
                        if (tongTienHang < 200000) {
                          Alert.alert('Chưa đạt điều kiện', 'Đơn hàng chưa đạt mức tối thiểu 200.000đ để áp dụng mã này.');
                          dkHopLe = false;
                        }
                      } else if (txtDk.includes('300k') || txtDk.includes('300.000') || txtDk.includes('300000')) {
                        if (tongTienHang < 300000) {
                          Alert.alert('Chưa đạt điều kiện', 'Đơn hàng chưa đạt mức tối thiểu 300.000đ để áp dụng mã này.');
                          dkHopLe = false;
                        }
                      } else if (txtDk.includes('500k') || txtDk.includes('500.000') || txtDk.includes('500000')) {
                        if (tongTienHang < 500000) {
                          Alert.alert('Chưa đạt điều kiện', 'Đơn hàng chưa đạt mức tối thiểu 500.000đ để áp dụng mã này.');
                          dkHopLe = false;
                        }
                      } else if (txtDk.includes('1 triệu') || txtDk.includes('1.000.000') || txtDk.includes('1000000')) {
                        if (tongTienHang < 1000000) {
                          Alert.alert('Chưa đạt điều kiện', 'Đơn hàng chưa đạt mức tối thiểu 1.000.000đ để áp dụng mã này.');
                          dkHopLe = false;
                        }
                      }
                    }

                    if (dkHopLe) {
                      const tongCongTruocGiam = tongTienHang + phiVanChuyen;
                      let giamMoi = 0;
                      if (km.loaiPhieuGiamGia === 'Phần trăm') {
                        giamMoi = (tongCongTruocGiam * km.giaTriGiam) / 100;
                      } else {
                        giamMoi = km.giaTriGiam;
                      }
                      if (giamMoi > tongCongTruocGiam) giamMoi = tongCongTruocGiam;
                      setGiaTriGiam(giamMoi);
                      Alert.alert('✅', 'Áp dụng mã thành công!');
                    } else {
                      setGiaTriGiam(0); // Hủy giảm giá nếu không đủ điều kiện
                    }
                  }
                }
              } catch {}
            }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>🧾 Tổng Quan Đơn Hàng</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Tổng tiền hàng:</Text>
            <Text style={s.summaryValue}>{tongTienHang.toLocaleString('vi-VN')} đ</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Phí vận chuyển:</Text>
            <Text style={s.summaryValue}>{phiVanChuyen.toLocaleString('vi-VN')} đ</Text>
          </View>
          {phiVanChuyen > 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Dự kiến giao hàng:</Text>
              <Text style={s.summaryValue}>{getNgayGiao()}</Text>
            </View>
          )}
          {giaTriGiam > 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Giảm giá:</Text>
              <Text style={[s.summaryValue, { color: '#4CAF50' }]}>-{giaTriGiam.toLocaleString('vi-VN')} đ</Text>
            </View>
          )}
          <View style={s.divider} />
          <View style={s.summaryRow}>
            <Text style={[s.summaryLabel, { fontWeight: '700', color: '#111', fontSize: 15 }]}>Tổng thanh toán:</Text>
            <Text style={s.totalFinal}>{(tongTienHang + phiVanChuyen - giaTriGiam > 0 ? tongTienHang + phiVanChuyen - giaTriGiam : 0).toLocaleString('vi-VN')} đ</Text>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>💳 Phương thức thanh toán</Text>
          <View style={s.ptRow}>
            {(['COD', 'VNPAY'] as const).map(pt => (
              <TouchableOpacity
                key={pt}
                style={[s.ptBtn, phuongThuc === pt && s.ptBtnActive]}
                onPress={() => setPhuongThuc(pt)}
              >
                <Text style={s.ptIcon}>{pt === 'COD' ? '💵' : '🏧'}</Text>
                <Text style={[s.ptText, phuongThuc === pt && s.ptTextActive]}>
                  {pt === 'COD' ? 'Tiền mặt (COD)' : 'VNPay'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {phuongThuc === 'COD' && (
            <Text style={s.ptNote}>Thanh toán khi nhận hàng</Text>
          )}
          {phuongThuc === 'VNPAY' && (
            <Text style={s.ptNote}>Thanh toán qua VNPay (sandbox)</Text>
          )}
        </View>

        <TouchableOpacity style={s.orderBtn} onPress={handleDatHang} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.orderBtnText}>✅ Xác nhận đặt hàng</Text>}
        </TouchableOpacity>
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChange, placeholder, keyboardType = 'default', multiline = false }: any) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputWrap}>
        <TextInput
          style={[s.input, multiline && { height: 72, textAlignVertical: 'top' }]}
          value={value} onChangeText={onChange} placeholder={placeholder}
          placeholderTextColor="#aaa" keyboardType={keyboardType} multiline={multiline}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: RED, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#333', marginBottom: 12 },
  label: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 4 },
  inputWrap: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#FAFAFA' },
  input: { fontSize: 15, color: '#222', height: 46 },
  ptRow: { flexDirection: 'row', gap: 12 },
  ptBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: '#fff' },
  ptBtnActive: { borderColor: RED, backgroundColor: '#FFF5F5' },
  ptIcon: { fontSize: 26, marginBottom: 6 },
  ptText: { fontSize: 12, color: '#666', fontWeight: '600', textAlign: 'center' },
  ptTextActive: { color: RED },
  ptNote: { fontSize: 12, color: '#888', marginTop: 8, textAlign: 'center' },
  orderBtn: { backgroundColor: RED, borderRadius: 30, height: 54, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  orderBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  applyBtn: { backgroundColor: '#333', justifyContent: 'center', paddingHorizontal: 16, borderRadius: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: '#666' },
  summaryValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 10 },
  totalFinal: { fontSize: 18, color: RED, fontWeight: '800' },
});
