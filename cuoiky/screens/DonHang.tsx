import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, StatusBar, Image, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch } from '../services/api';

const RED = '#E85A4F';
const RED_LIGHT = '#FFF0EF';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'DonHang'> };

interface OrderItem { idSach: number; tenSach: string; hinhAnh?: string; gia: number; soLuong: number; thanhTien: number; }
interface Order {
  id: number; maDonHang: string; diaChiGiaoHang: string; phuongThucThanhToan: string;
  tenTrangThaiThanhToan: string; tongTien: number; giaTriGiam: number; thanhTien: number;
  trangThaiDonHang: string; ngayDat: string; ngayGiao?: string; phiVanChuyen: number;
  hovaTen: string; soDienThoai: string; chiTietDonHang: OrderItem[];
}

type StatusConfig = { color: string; bg: string; icon: string };
const TABS = [
  'Tất cả',
  'Chờ xác nhận',
  'Đã xác nhận',
  'Chuẩn bị',
  'Giao VC',
  'Đang giao',
  'Đã giao',
  'Đã hủy'
];
// This map associates the backend status strings to their UI configurations
const STATUS_UI: Record<string, StatusConfig> = {
  'Chờ xác nhận':                    { color: '#F59E0B', bg: '#FFFBEB', icon: '🕐' },
  'Đơn hàng đã xác nhận':            { color: '#3B82F6', bg: '#EFF6FF', icon: '✅' },
  'Đang chuẩn bị':                   { color: '#8B5CF6', bg: '#F5F3FF', icon: '📦' },
  'Đã giao cho đơn vị VC':           { color: '#6366F1', bg: '#EEF2FF', icon: '🚚' },
  'Đang giao đến bạn':               { color: '#06B6D4', bg: '#ECFEFF', icon: '🛵' },
  'Đơn hàng đã giao':                { color: '#10B981', bg: '#ECFDF5', icon: '🎉' },
  'Hủy đơn hàng':                    { color: '#EF4444', bg: '#FEF2F2', icon: '❌' },
};

// This maps the Tab names to the backend status string(s) they represent
const STATUS_QUERY: Record<string, string[]> = {
  'Tất cả': [],
  'Chờ xác nhận': ['Chờ xác nhận'],
  'Đã xác nhận': ['Đơn hàng đã xác nhận'],
  'Chuẩn bị': ['Đang chuẩn bị'],
  'Giao VC': ['Đã giao cho đơn vị VC'],
  'Đang giao': ['Đang giao đến bạn'],
  'Đã giao': ['Đơn hàng đã giao'],
  'Đã hủy': ['Hủy đơn hàng'],
};

const PAYMENT_ICON: Record<string, string> = {
  'Tiền mặt (COD)': '💵',
  'COD': '💵',
  'VNPay': '💳',
  'VNPAY': '💳',
};

function fmt(n: number) { return n.toLocaleString('vi-VN') + ' đ'; }

export default function DonHang({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [orders, setOrders] = useState<any[]>([]);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const fetchOrders = useCallback(async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/DatHang/LayDonHangCuaUser`);
      const json = await res.json();
      if (json.statusCode === 200 && json.data) {
        setOrders(json.data);
      } else {
        setOrders([]);
      }

      // Fetch reviews to cross-check which orders are already reviewed
      const revRes = await authFetch(`${BASE_URL}/api/DanhGia/DanhGiaCuaToi`);
      const revJson = await revRes.json();
      if (revJson.statusCode === 200 && revJson.data) {
        const ids = revJson.data.map((r: any) => r.idDonHang).filter(Boolean);
        setReviewedOrderIds(ids);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const toggleExpand = (id: number) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const displayedOrders = activeTab === 'Tất cả'
    ? orders
    : orders.filter(o => STATUS_QUERY[activeTab]?.includes(o.trangThaiDonHang));

  const huyDon = async (id: number) => {
    Alert.alert('Hủy đơn hàng', 'Bạn có chắc muốn hủy đơn hàng này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy đơn', style: 'destructive', onPress: async () => {
          try {
            const res = await authFetch(`${BASE_URL}/api/DatHang/HuyDonHang/${id}`, { method: 'PUT' });
            const json = await res.json();
            if (json.statusCode === 200) {
              Alert.alert('✅', 'Hủy đơn thành công');
              fetchOrders();
            } else {
              Alert.alert('Lỗi', json.message || 'Không thể hủy đơn');
            }
          } catch { Alert.alert('Lỗi', 'Không thể kết nối máy chủ'); }
        }
      }
    ]);
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const cfg = STATUS_UI[item.trangThaiDonHang] ?? { color: '#9CA3AF', bg: '#F9FAFB', icon: '📋' };
    const canCancel = !['Đã giao cho đơn vị VC', 'Đang giao đến bạn', 'Đơn hàng đã giao', 'Hủy đơn hàng'].includes(item.trangThaiDonHang);
    const isExpanded = expanded[item.id] ?? false;
    const showItems = isExpanded ? item.chiTietDonHang : item.chiTietDonHang?.slice(0, 2);
    const payIcon = PAYMENT_ICON[item.phuongThucThanhToan] ?? '💰';

    return (
      <View style={s.card}>
        {/* ── Header ── */}
        <View style={s.cardHeader}>
          <View>
            <Text style={s.maDon}>#{item.maDonHang}</Text>
            <Text style={s.ngayDat}>{new Date(item.ngayDat).toLocaleDateString('vi-VN')}</Text>
          </View>
          {/* Badge trạng thái */}
          {STATUS_UI[item.trangThaiDonHang] && (
            <View style={[s.badge, { backgroundColor: STATUS_UI[item.trangThaiDonHang].bg, borderColor: STATUS_UI[item.trangThaiDonHang].color + '55' }]}>
              <Text style={s.badgeIcon}>{STATUS_UI[item.trangThaiDonHang].icon}</Text>
              <Text style={[s.badgeText, { color: STATUS_UI[item.trangThaiDonHang].color }]}>
                {item.trangThaiDonHang}
              </Text>
            </View>
          )}
        </View>

        <View style={s.separator} />

        {/* ── Thông tin khách ── */}
        <View style={s.infoRow}>
          <Text style={s.infoIcon}>👤</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.infoName}>{item.hovaTen || '—'}</Text>
            <Text style={s.infoSub}>{item.soDienThoai || '—'}</Text>
          </View>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoIcon}>📍</Text>
          <Text style={[s.infoSub, { flex: 1 }]} numberOfLines={2}>{item.diaChiGiaoHang || '—'}</Text>
        </View>

        <View style={s.separator} />

        {/* ── Sản phẩm ── */}
        {showItems?.map((p, idx) => (
          <View key={idx} style={s.productRow}>
            {p.hinhAnh
              ? <Image source={{ uri: p.hinhAnh }} style={s.productImg} resizeMode="cover" />
              : <View style={s.productImgPlaceholder}><Text style={{ fontSize: 22 }}>📖</Text></View>
            }
            <View style={{ flex: 1 }}>
              <Text style={s.productName} numberOfLines={2}>{p.tenSach}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={s.productQty}>Số lượng: {p.soLuong}</Text>
                <Text style={s.productPrice}>{fmt(p.gia)}</Text>
              </View>
            </View>
          </View>
        ))}
        {(item.chiTietDonHang?.length ?? 0) > 2 && (
          <TouchableOpacity onPress={() => toggleExpand(item.id)} style={s.showMoreBtn}>
            <Text style={s.showMoreText}>
              {isExpanded ? '▲ Thu gọn' : `▼  Xem thêm ${item.chiTietDonHang.length - 2} sản phẩm`}
            </Text>
          </TouchableOpacity>
        )}

        <View style={s.separator} />

        {/* ── Tóm tắt giá ── */}
        <View style={s.priceSection}>
          {/* Trạng thái thanh toán */}
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Trạng thái thanh toán</Text>
            <Text style={[s.priceValue, { color: item.tenTrangThaiThanhToan === 'Đã thanh toán' ? '#10B981' : '#F59E0B', fontWeight: '600' }]}>
              {item.tenTrangThaiThanhToan || 'Chưa thanh toán'}
            </Text>
          </View>

          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Tiền hàng</Text>
            <Text style={s.priceValue}>{fmt(item.tongTien)}</Text>
          </View>
          {item.phiVanChuyen > 0 && (
            <View style={s.priceRow}>
              <Text style={s.priceLabel}>Phí vận chuyển</Text>
              <Text style={s.priceValue}>{fmt(item.phiVanChuyen)}</Text>
            </View>
          )}
          {item.giaTriGiam > 0 && (
            <View style={s.priceRow}>
              <Text style={s.priceLabel}>Giảm giá</Text>
              <Text style={[s.priceValue, { color: '#10B981' }]}>-{fmt(item.giaTriGiam)}</Text>
            </View>
          )}


          {/* Phương thức thanh toán */}
          <View style={s.priceRow}>
            <Text style={s.priceLabel}>Phương thức thanh toán</Text>
            <View style={s.paymentBadge}>
              <Text style={s.paymentText}>{item.phuongThucThanhToan}</Text>
            </View>
          </View>

          {/* Dự kiến giao hàng */}
          {item.ngayGiao && (
            <View style={s.priceRow}>
              <Text style={s.priceLabel}>Dự kiến giao hàng</Text>
              <Text style={[s.priceValue, { color: '#059669', fontWeight: '600' }]}>
                {new Date(item.ngayGiao).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          )}
        </View>

        {/* ── Footer: Tổng tiền + Nút hủy ── */}
        <View style={s.cardFooter}>
          <View style={{ flex: 1 }}>
            <Text style={s.footerTotalLabel}>Tổng thanh toán</Text>
            <Text style={s.footerTotalValue}>{fmt(item.thanhTien)}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
             {/* Nút Đánh giá */}
             {item.trangThaiDonHang === 'Đơn hàng đã giao' && (
                reviewedOrderIds.includes(item.id) ? (
                  <TouchableOpacity
                    style={[s.cancelBtn, { backgroundColor: '#F3F4F6', elevation: 0 }]}
                    disabled={true}
                    activeOpacity={1}
                  >
                    <Text style={[s.cancelBtnText, { color: '#9CA3AF' }]}>Đã đánh giá</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[s.cancelBtn, { backgroundColor: '#10B981', borderColor: '#059669', borderWidth: 1 }]}
                    onPress={() => (navigation as any).navigate('VietDanhGia', {
                      orderId: item.id,
                      maDonHang: item.maDonHang,
                      products: item.chiTietDonHang || []
                    })}
                    activeOpacity={0.8}
                  >
                    <Text style={s.cancelBtnText}>Đánh giá</Text>
                  </TouchableOpacity>
                )
             )}

            <TouchableOpacity
              style={[s.cancelBtn, !canCancel && { backgroundColor: '#F3F4F6', elevation: 0 }]}
              onPress={() => huyDon(item.id)}
              disabled={!canCancel}
              activeOpacity={0.8}
            >
              <Text style={[s.cancelBtnText, !canCancel && { color: '#9CA3AF' }]}>Hủy đơn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Đơn Hàng Của Tôi</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab filter */}
      <View style={{ backgroundColor: '#fff', elevation: 2, zIndex: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabScrollArea}>
          {TABS.map(t => {
            const isActive = activeTab === t;
            return (
              <TouchableOpacity key={t} onPress={() => setActiveTab(t)} style={[s.tabBtn, isActive && s.tabBtnActive]}>
                <Text style={[s.tabText, isActive && s.tabTextActive]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {displayedOrders.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>📭</Text>
          <Text style={s.emptyTitle}>Không có đơn hàng nào</Text>
          <Text style={s.emptySubtitle}>Hãy mua sắm ngay nhé!</Text>
        </View>
      ) : (
        <FlatList
          data={displayedOrders}
          keyExtractor={o => o.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[RED]} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: RED, paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16,
    elevation: 4,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800', letterSpacing: 0.3 },

  // Tabs
  tabScrollArea: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tabBtn: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F3F4F6',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  tabBtnActive: { backgroundColor: RED, borderColor: '#DC2626' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#fff' },

  // Empty
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#374151', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: '#9CA3AF' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  maDon: { fontSize: 15, fontWeight: '800', color: '#1F2937', letterSpacing: 0.2 },
  ngayDat: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5,
    maxWidth: 200,
  },
  badgeIcon: { fontSize: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  separator: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 16 },

  // Info
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 16, paddingVertical: 7 },
  infoIcon: { fontSize: 14, marginTop: 1, width: 18 },
  infoName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  infoSub: { fontSize: 13, color: '#6B7280', marginTop: 1 },

  // Products
  productRow: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 16,
    paddingVertical: 10, alignItems: 'flex-start',
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  productImg: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#F3F4F6' },
  productImgPlaceholder: {
    width: 56, height: 56, borderRadius: 10,
    backgroundColor: '#FFF0EF', justifyContent: 'center', alignItems: 'center',
  },
  productName: { fontSize: 14, color: '#1F2937', fontWeight: '600', lineHeight: 20 },
  productQty: { fontSize: 12, color: '#9CA3AF' },
  productPrice: { fontSize: 13, color: RED, fontWeight: '700' },

  showMoreBtn: { alignItems: 'center', paddingVertical: 10, marginHorizontal: 16 },
  showMoreText: { fontSize: 13, color: RED, fontWeight: '600' },

  // Price Section
  priceSection: { paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 13, color: '#6B7280' },
  priceValue: { fontSize: 13, color: '#374151', fontWeight: '500' },
  totalRow: {
    marginTop: 8, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  totalLabel: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  totalValue: { fontSize: 18, fontWeight: '900', color: RED },
  footerTotalLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  footerTotalValue: { fontSize: 18, fontWeight: '900', color: RED },

  // Footer
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  paymentBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F3F4F6', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  paymentIcon: { fontSize: 14 },
  paymentText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  cancelBtn: {
    backgroundColor: RED, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center',
    elevation: 2,
  },
  cancelBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Delivery note
  deliveryNote: {
    backgroundColor: '#ECFDF5', paddingHorizontal: 16, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: '#D1FAE5',
  },
  deliveryText: { fontSize: 12, color: '#059669', fontWeight: '600' },
});
