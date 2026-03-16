import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch, getPermissions, findPermission } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'QuanLyNhanVien'> };

export default function QuanLyNhanVien({ navigation }: Props) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [adminDetail, setAdminDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [chucNangList, setChucNangList] = useState<any[]>([]);

  // RBAC
  const [hasAddPerm, setHasAddPerm] = useState(false);
  const [hasEditPerm, setHasEditPerm] = useState(false);
  const [hasDeletePerm, setHasDeletePerm] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const resAdmin = await authFetch(`${BASE_URL}/api/Admin/LayDanhSachAdmin`);
      const jsonAdmin = await resAdmin.json();
      if (jsonAdmin.statusCode === 200 && jsonAdmin.data) setList(jsonAdmin.data);

      const resCN = await authFetch(`${BASE_URL}/api/Admin/LayDanhSachChucNang`);
      const jsonCN = await resCN.json();
      if (jsonCN.statusCode === 200 && jsonCN.data) setChucNangList(jsonCN.data);
      
      // Load permissions
      const perms = await getPermissions();
      if (perms.some((p: any) => p.full)) {
        setHasAddPerm(true);
        setHasEditPerm(true);
        setHasDeletePerm(true);
      } else {
        const nvPerm = findPermission(perms, { exact: ['nhân viên', 'tài khoản', 'quản lý nhân viên'], matches: ['nhân viên', 'tài khoản'] });
        setHasAddPerm(nvPerm ? nvPerm.quyenThem : false);
        setHasEditPerm(nvPerm ? nvPerm.quyenSua : false);
        setHasDeletePerm(nvPerm ? nvPerm.quyenXoa : false);
      }
    } catch { } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchList();
    }, [fetchList])
  );

  const xoa = async (id: number, ten: string) => {
    Alert.alert('Xóa tài khoản', `Xóa tài khoản "${ten}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            const res = await authFetch(`${BASE_URL}/api/Admin/XoaAdmin/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.statusCode === 200) { Alert.alert('✅', 'Đã xóa'); fetchList(); }
            else Alert.alert('Lỗi', json.message);
          } catch { Alert.alert('Lỗi', 'Không thể kết nối'); }
        }
      }
    ]);
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setAdminDetail(null);
    } else {
      setExpandedId(id);
      setAdminDetail(null);
      setDetailLoading(true);
      try {
        const res = await authFetch(`${BASE_URL}/api/Admin/LayChiTietAdmin/${id}`);
        const json = await res.json();
        if (json.statusCode === 200) {
          setAdminDetail(json.data);
        }
      } catch (e) {
        console.log('Lỗi lấy chi tiết:', e);
      } finally {
        setDetailLoading(false);
      }
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isExpanded = expandedId === item.id;
    return (
      <TouchableOpacity 
        style={[s.card, isExpanded && s.cardExpanded]} 
        activeOpacity={0.8} 
        onPress={() => toggleExpand(item.id)}
      >
        <View style={s.cardTop}>
          <View style={s.avatar}><Text style={{ fontSize: 24 }}>👤</Text></View>
          <View style={s.cardInfo}>
            <Text style={s.name}>{item.hovaTen || 'Chưa cập nhật'}</Text>
            <Text style={s.email}>{item.email}</Text>
          </View>
          <View style={s.actionBtns}>
            <TouchableOpacity 
              style={[s.actionBtn, !hasEditPerm && { opacity: 0.3 }]} 
              onPress={() => navigation.navigate('FormEditNhanVien', { adminId: item.id })}
              disabled={!hasEditPerm}
            >
              <Text style={{ fontSize: 18 }}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[s.actionBtn, !hasDeletePerm && { opacity: 0.3 }]} 
              onPress={() => xoa(item.id, item.hovaTen || item.email)}
              disabled={!hasDeletePerm}
            >
              <Text style={{ fontSize: 20 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isExpanded && (
          <View style={s.expandedArea}>
            <View style={s.divider} />
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>📞 Điện thoại:</Text>
              <Text style={s.detailValue}>{item.soDienThoai || <Text style={s.emptyText}>Không có</Text>}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>📍 Địa chỉ:</Text>
              <Text style={s.detailValue}>{item.diaChi || <Text style={s.emptyText}>Không có</Text>}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>🪪 CCCD:</Text>
              <Text style={s.detailValue}>{item.soCCCD || <Text style={s.emptyText}>Không có</Text>}</Text>
            </View>
            
            {detailLoading ? (
              <ActivityIndicator size="small" color={RED} style={{ marginTop: 10 }} />
            ) : adminDetail ? (
              <>
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>💼 Chức vụ:</Text>
                  <Text style={[s.detailValue, { fontWeight: '700', color: RED }]}>
                    {adminDetail.tenChucVu || <Text style={s.emptyText}>Chưa phân chức vụ</Text>}
                  </Text>
                </View>
                
                {adminDetail.phanQuyens && adminDetail.phanQuyens.length > 0 ? (
                  <View style={{ marginTop: 8 }}>
                    <Text style={[s.detailLabel, { width: '100%', marginBottom: 6 }]}>🛡️ Quyền hạn:</Text>
                    {adminDetail.phanQuyens.map((pq: any, idx: number) => {
                      const rights = [];
                      if (pq.quyenXem) rights.push('Xem');
                      if (pq.quyenThem) rights.push('Thêm');
                      if (pq.quyenSua) rights.push('Sửa');
                      if (pq.quyenXoa) rights.push('Xóa');
                      const cn = chucNangList.find(c => c.id === pq.idChucNang);
                      const tenCN = cn ? cn.tenChucNang : `CN ${pq.idChucNang}`;
                      return (
                         <View key={idx} style={s.pqRow}>
                           <Text style={s.pqId}>{tenCN}:</Text>
                           <View style={s.pqTags}>
                             {rights.map(r => (
                               <View key={r} style={s.pqTag}><Text style={s.pqTagText}>{r}</Text></View>
                             ))}
                           </View>
                         </View>
                      )
                    })}
                  </View>
                ) : (
                  <View style={s.detailRow}>
                    <Text style={s.detailLabel}>🛡️ Quyền hạn:</Text>
                    <Text style={s.emptyText}>Chưa có phân quyền</Text>
                  </View>
                )}
              </>
            ) : null}
          </View>
        )}
        
        <View style={s.expandIconWrap}>
           <Text style={s.expandIcon}>{isExpanded ? '▴' : '▾'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F2F5' }}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>👥 Nhân Viên ({list.length})</Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('FormCreateNhanVien')}
          style={!hasAddPerm ? { opacity: 0.3 } : undefined}
          disabled={!hasAddPerm}
        >
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: '300' }}>＋</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={list}
        keyExtractor={i => i.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchList(); }} colors={[RED]} />}
        ListEmptyComponent={<View style={s.center}><Text style={{ color: '#999' }}>Chưa có nhân viên</Text></View>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: RED, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 14, elevation: 2, overflow: 'hidden' },
  cardExpanded: { borderWidth: 1, borderColor: '#FFCDD2' },
  cardTop: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF3F2', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#222' },
  email: { fontSize: 13, color: '#888', marginTop: 2 },
  actionBtns: { flexDirection: 'row', alignItems: 'center', gap: 6, zIndex: 10 },
  actionBtn: { padding: 6 },
  expandIconWrap: { alignItems: 'center', paddingBottom: 6, marginTop: -6 },
  expandIcon: { color: '#ccc', fontSize: 20 },
  
  // Chi tiết mở rộng
  expandedArea: { paddingHorizontal: 16, paddingBottom: 12 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginBottom: 12 },
  detailRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-start' },
  detailLabel: { width: 90, fontSize: 13, color: '#666', fontWeight: '600' },
  detailValue: { flex: 1, fontSize: 13, color: '#333' },
  emptyText: { color: '#aaa', fontStyle: 'italic', fontWeight: '400' },
  
  // Tag phân quyền
  pqRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, paddingLeft: 8 },
  pqId: { fontSize: 13, color: '#444', minWidth: 80, fontWeight: '700' },
  pqTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  pqTag: { backgroundColor: '#FFF0EE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#FFCDD2' },
  pqTagText: { fontSize: 11, color: RED, fontWeight: '700' },
});
