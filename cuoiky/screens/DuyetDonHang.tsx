import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, StatusBar, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch, getPermissions, findPermission } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'DuyetDonHang'> };

const TABS = ['Tất cả', 'Chờ xác nhận', 'Đã xác nhận', 'Chuẩn bị', 'Giao VC', 'Đang giao', 'Đã giao', 'Đã hủy'];
const STATUS_QUERY: Record<string, string> = {
  'Tất cả': '', 'Chờ xác nhận': 'cho-xac-nhan', 'Đã xác nhận': 'da-xac-nhan',
  'Chuẩn bị': 'chuan-bi', 'Giao VC': 'giao-vc', 'Đang giao': 'dang-giao',
  'Đã giao': 'da-giao', 'Đã hủy': 'da-huy',
};

type StatusCfg = { color: string; bg: string; icon: string };
const STATUS_MAP: Record<string, StatusCfg> = {
  'Chờ xác nhận':                    { color: '#F59E0B', bg: '#FFFBEB', icon: '🕐' },
  'Đã xác nhận':                     { color: '#3B82F6', bg: '#EFF6FF', icon: '✅' },
  'Đang chuẩn bị':                   { color: '#8B5CF6', bg: '#F5F3FF', icon: '📦' },
  'Đã giao cho đơn vị VC':           { color: '#6366F1', bg: '#EEF2FF', icon: '🚚' },
  'Đang giao đến bạn':               { color: '#06B6D4', bg: '#ECFEFF', icon: '🛵' },
  'Đơn hàng đã giao':                { color: '#10B981', bg: '#ECFDF5', icon: '🎉' },
  'Hủy đơn hàng':                    { color: '#EF4444', bg: '#FEF2F2', icon: '❌' },
};

// Mỗi action là 1 bước trong pipeline
const ACTIONS = [
  { label: 'Xác nhận',   action: 'confirm',    color: '#3B82F6', bg: '#EFF6FF' },
  { label: 'Chuẩn bị',   action: 'prepare',    color: '#8B5CF6', bg: '#F5F3FF' },
  { label: 'Giao VC',    action: 'ship',        color: '#6366F1', bg: '#EEF2FF' },
  { label: 'Đang giao',  action: 'delivering',  color: '#06B6D4', bg: '#ECFEFF' },
  { label: 'Đã giao',    action: 'delivered',   color: '#10B981', bg: '#ECFDF5' },
  { label: 'Hủy đơn',   action: 'cancel',      color: '#EF4444', bg: '#FEF2F2' },
];

function fmt(n: number) { return (n ?? 0).toLocaleString('vi-VN') + ' đ'; }

export default function DuyetDonHang({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // RBAC
  const [hasEditPerm, setHasEditPerm] = useState(false);

  const fetch_ = useCallback(async () => {
    try {
      const q = STATUS_QUERY[activeTab];
      const url = q
        ? `${BASE_URL}/api/DatHang/Admin/List?status=${q}`
        : `${BASE_URL}/api/DatHang/Admin/List`;
      const res = await authFetch(url);
      const json = await res.json();
      if (json.statusCode === 200 && json.data) setOrders(json.data);
      else setOrders([]);
      
      // Load permissions
      const perms = await getPermissions();
      if (perms.some((p: any) => p.full)) {
        setHasEditPerm(true);
      } else {
        const dhPerm = findPermission(perms, { exact: ['duyệt đơn hàng', 'quản lý đơn hàng', 'đơn hàng'], matches: ['đơn hàng'] });
        setHasEditPerm(dhPerm ? dhPerm.quyenSua : false);
      }
    } catch { setOrders([]); } finally { setLoading(false); setRefreshing(false); }
  }, [activeTab]);

  useEffect(() => { setLoading(true); fetch_(); }, [fetch_]);

  const updateStatus = async (id: number, action: string, label: string) => {
    if (!hasEditPerm) {
      Alert.alert('Truy cập bị từ chối', 'Bạn không có quyền sửa đơn hàng.');
      return;
    }
    Alert.alert(`Cập nhật trạng thái`, `Chuyển sang "${label}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận', onPress: async () => {
          try {
            const res = await authFetch(`${BASE_URL}/api/DatHang/Admin/UpdateStatus/${id}`, {
              method: 'PATCH',
              body: JSON.stringify({ action }),
            });
            const json = await res.json();
            if (json.statusCode === 200) { Alert.alert('✅ Thành công', json.message); fetch_(); }
            else Alert.alert('Lỗi', json.message);
          } catch { Alert.alert('Lỗi', 'Không thể kết nối máy chủ'); }
        }
      }
    ]);
  };

  const renderOrder = ({ item }: { item: any }) => {
    const cfg = STATUS_MAP[item.trangThaiDonHang] ?? { color: '#9CA3AF', bg: '#F9FAFB', icon: '📋' };
    const isCancelDisabled = [
      'Đã giao cho đơn vị VC',
      'Đang giao đến bạn',
      'Đơn hàng đã giao',
      'Hủy đơn hàng'
    ].includes(item.trangThaiDonHang);

    return (
      <View style={s.card}>
        {/* ── Header card ── */}
        <View style={s.cardHeader}>
          <View>
            <Text style={s.maDon}>#{item.maDonHang}</Text>
            <Text style={s.ngayDat}>
              {item.ngayDat ? new Date(item.ngayDat).toLocaleDateString('vi-VN') : '—'}
            </Text>
          </View>
          <View style={[s.badge, { backgroundColor: cfg.bg, borderColor: cfg.color + '55' }]}>
            <Text style={s.badgeIcon}>{cfg.icon}</Text>
            <Text style={[s.badgeText, { color: cfg.color }]}>{item.trangThaiDonHang}</Text>
          </View>
        </View>

        <View style={s.sep} />

        {/* ── Thông tin khách ── */}
        <View style={s.infoBlock}>
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
        </View>

        <View style={s.sep} />

        {/* ── Tóm tắt tài chính ── */}
        <View style={s.financeRow}>
          <View style={s.financeItem}>
            <Text style={s.financeLabel}>Tiền hàng</Text>
            <Text style={s.financeValue}>{fmt(item.tongTien)}</Text>
          </View>
          {item.phiVanChuyen > 0 && (
            <View style={s.financeItem}>
              <Text style={s.financeLabel}>Phí ship</Text>
              <Text style={s.financeValue}>{fmt(item.phiVanChuyen)}</Text>
            </View>
          )}
          {item.giaTriGiam > 0 && (
            <View style={s.financeItem}>
              <Text style={s.financeLabel}>Giảm giá</Text>
              <Text style={[s.financeValue, { color: '#10B981' }]}>-{fmt(item.giaTriGiam)}</Text>
            </View>
          )}
          <View style={[s.financeItem, { borderLeftWidth: 1, borderLeftColor: '#E5E7EB', paddingLeft: 12 }]}>
            <Text style={s.financeLabel}>Tổng TT</Text>
            <Text style={[s.financeValue, { color: RED, fontWeight: '800', fontSize: 16 }]}>{fmt(item.thanhTien)}</Text>
          </View>
        </View>

        {/* Phương thức */}
        <View style={[s.infoRow, { paddingHorizontal: 14, paddingBottom: 12 }]}>
          <Text style={s.infoIcon}>💳</Text>
          <Text style={s.infoSub}>{item.phuongThucThanhToan || '—'}</Text>
          <View style={s.payStatusBadge}>
            <Text style={s.payStatusText}>{item.tenTrangThaiThanhToan || 'Chưa thanh toán'}</Text>
          </View>
        </View>

        <View style={s.sep} />

        {/* ── Nút hành động ── */}
        <View style={s.actionsWrap}>
          {/* Nút tác vụ tiếp theo (nằm bên trái) */}
          <View style={{ flex: 1, opacity: hasEditPerm ? 1 : 0.5 }}>
            {item.trangThaiDonHang === 'Chờ xác nhận' && (
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#EFF6FF', borderColor: '#3B82F666', alignSelf: 'flex-start' }]} onPress={() => updateStatus(item.id, 'confirm', 'Xác nhận')} disabled={!hasEditPerm}>
                <Text style={[s.actionText, { color: '#3B82F6' }]}>Xác nhận</Text>
              </TouchableOpacity>
            )}
            {item.trangThaiDonHang === 'Đã xác nhận' && (
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#F5F3FF', borderColor: '#8B5CF666', alignSelf: 'flex-start' }]} onPress={() => updateStatus(item.id, 'prepare', 'Chuẩn bị')} disabled={!hasEditPerm}>
                <Text style={[s.actionText, { color: '#8B5CF6' }]}>Chuẩn bị</Text>
              </TouchableOpacity>
            )}
            {item.trangThaiDonHang === 'Đang chuẩn bị' && (
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#EEF2FF', borderColor: '#6366F166', alignSelf: 'flex-start' }]} onPress={() => updateStatus(item.id, 'ship', 'Giao VC')} disabled={!hasEditPerm}>
                <Text style={[s.actionText, { color: '#6366F1' }]}>Giao VC</Text>
              </TouchableOpacity>
            )}
            {item.trangThaiDonHang === 'Đã giao cho đơn vị VC' && (
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#ECFEFF', borderColor: '#06B6D466', alignSelf: 'flex-start' }]} onPress={() => updateStatus(item.id, 'delivering', 'Đang giao')} disabled={!hasEditPerm}>
                <Text style={[s.actionText, { color: '#06B6D4' }]}>Đang giao</Text>
              </TouchableOpacity>
            )}
            {item.trangThaiDonHang === 'Đang giao đến bạn' && (
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#ECFDF5', borderColor: '#10B98166', alignSelf: 'flex-start' }]} onPress={() => updateStatus(item.id, 'delivered', 'Đã giao')} disabled={!hasEditPerm}>
                <Text style={[s.actionText, { color: '#10B981' }]}>Đã giao</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Nút hủy đơn (nằm bên phải) */}
          <TouchableOpacity
            style={[s.actionBtn, {
              backgroundColor: isCancelDisabled ? '#F3F4F6' : '#FEF2F2',
              borderColor: isCancelDisabled ? '#E5E7EB' : '#EF444466',
              opacity: hasEditPerm ? 1 : 0.5
            }]}
            onPress={() => updateStatus(item.id, 'cancel', 'Hủy đơn')}
            disabled={isCancelDisabled || !hasEditPerm}
            activeOpacity={0.75}
          >
            <Text style={[s.actionText, {
              color: isCancelDisabled ? '#9CA3AF' : '#EF4444'
            }]}>Hủy đơn</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Duyệt Đơn Hàng</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsScroll}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t}
              style={[s.tab, activeTab === t && s.tabActive]}
              onPress={() => setActiveTab(t)}
              activeOpacity={0.8}
            >
              <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>
      ) : orders.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📭</Text>
          <Text style={s.emptyText}>Không có đơn hàng nào</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={o => o.id.toString()}
          renderItem={renderOrder}
          contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetch_(); }}
              colors={[RED]}
            />
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '600' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: RED, paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16,
    elevation: 4,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },

  // Tabs
  tabsContainer: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', elevation: 2 },
  tabsScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tab: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
  },
  tabActive: { backgroundColor: RED, borderColor: RED },
  tabText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  // Card
  card: {
    backgroundColor: '#fff', borderRadius: 18,
    elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
  },

  // Card Header
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  maDon: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
  ngayDat: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5, maxWidth: 200,
  },
  badgeIcon: { fontSize: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  sep: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 0 },

  // Info
  infoBlock: { paddingVertical: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 16, paddingVertical: 7 },
  infoIcon: { fontSize: 14, marginTop: 1, width: 18 },
  infoName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  infoSub: { fontSize: 13, color: '#6B7280', marginTop: 1 },

  // Payment status
  payStatusBadge: {
    marginLeft: 'auto', backgroundColor: '#FEF9C3',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: '#FDE047',
  },
  payStatusText: { fontSize: 11, color: '#92400E', fontWeight: '700' },

  // Finance summary
  financeRow: {
    flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12,
    backgroundColor: '#FAFAFA', gap: 0,
  },
  financeItem: { flex: 1, alignItems: 'center', gap: 4 },
  financeLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  financeValue: { fontSize: 13, color: '#374151', fontWeight: '700' },

  // Actions
  actionsWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14,
  },
  actionBtn: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
  },
  actionText: { fontSize: 12, fontWeight: '700' },
});
