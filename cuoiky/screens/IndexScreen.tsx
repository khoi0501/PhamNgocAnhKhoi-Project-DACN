import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { SachDTO, getSachList } from '../services/sachGet';
import { BASE_URL, authFetch } from '../services/api';

type IndexNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Index'>;
interface IndexProps { navigation: IndexNavigationProp; }
interface TheLoai { id: number; tenTheLoai: string; }

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const RED = '#E85A4F';
const RED_DARK = '#C0392B';
const BG = '#F5F6FA';

export default function IndexScreen({ navigation }: IndexProps) {
  const [sachList, setSachList] = useState<SachDTO[]>([]);
  const [theLoaiList, setTheLoaiList] = useState<TheLoai[]>([]);
  const [selectedTheLoai, setSelectedTheLoai] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [sachData, theLoaiRes] = await Promise.all([
        getSachList(),
        fetch(`${BASE_URL}/api/TheLoai/GetAll`),
      ]);
      setSachList(sachData);
      const tlJson = await theLoaiRes.json();
      if (Array.isArray(tlJson)) setTheLoaiList(tlJson);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const themVaoGioHang = async (sach: SachDTO) => {
    try {
      const res = await authFetch(`${BASE_URL}/api/CartShop/ThemSanPham`, {
        method: 'POST',
        body: JSON.stringify({ idSach: sach.id, soLuong: 1 }),
      });
      const json = await res.json();
      Alert.alert(json.statusCode === 200 ? '✅ Thành công' : '❌ Lỗi', json.message || '');
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối máy chủ');
    }
  };

  const sachFiltered = sachList.filter((s) => {
    const matchSearch = !search.trim() ||
      (s.tenSach || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.tenTacGia || '').toLowerCase().includes(search.toLowerCase());
    const matchTheLoai = selectedTheLoai === null || s.idTheLoai === selectedTheLoai;
    return matchSearch && matchTheLoai;
  });

  const sachConHang = sachFiltered.filter((s) => (s.soLuong ?? 0) > 0);
  const sachHetHang = sachFiltered.filter((s) => (s.soLuong ?? 0) <= 0);

  const renderBookCard = ({ item }: { item: SachDTO }) => {
    const hetHang = (item.soLuong ?? 0) <= 0;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('ChiTietSach', { sach: item })}
      >
        <View style={styles.cardImgWrapper}>
          {item.hinhAnh ? (
            <Image source={{ uri: item.hinhAnh }} style={styles.cardImg} resizeMode="cover" />
          ) : (
            <View style={styles.cardImgPlaceholder}>
              <Text style={{ fontSize: 13, color: '#bbb' }}>Không có ảnh</Text>
            </View>
          )}
          {hetHang && (
            <View style={styles.hetHangOverlay}>
              <Text style={styles.hetHangText}>Hết hàng</Text>
            </View>
          )}
          {!hetHang && (item.soLuong ?? 0) <= 5 && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>Sắp hết</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.tenSach}</Text>
          {item.tenTacGia ? (
            <Text style={styles.cardAuthor} numberOfLines={1}>{item.tenTacGia}</Text>
          ) : null}
          <Text style={styles.cardPrice}>
            {(item.gia ?? 0).toLocaleString('vi-VN')}₫
          </Text>
          <TouchableOpacity
            style={[styles.addBtn, hetHang && styles.addBtnDisabled]}
            disabled={hetHang}
            onPress={() => themVaoGioHang(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>
              {hetHang ? 'Hết hàng' : '＋ Thêm'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={RED} />
        <Text style={{ marginTop: 12, color: '#888', fontSize: 14 }}>Đang tải sách...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nhà Sách</Text>

      </View>

      {/* ── Search ── */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên sách, tác giả..."
            placeholderTextColor="#aaa"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ fontSize: 16, color: '#bbb', paddingLeft: 8 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[RED]} />}
      >


        {/* ── Thể loại ── */}
        <View style={styles.sectionSpacing}>
          <Text style={styles.sectionLabel}>Thể loại</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillRow}
          >
            <TouchableOpacity
              style={[styles.pill, selectedTheLoai === null && styles.pillActive]}
              onPress={() => setSelectedTheLoai(null)}
            >
              <Text style={[styles.pillText, selectedTheLoai === null && styles.pillTextActive]}>
                Tất cả
              </Text>
            </TouchableOpacity>
            {theLoaiList.map((tl) => (
              <TouchableOpacity
                key={tl.id}
                style={[styles.pill, selectedTheLoai === tl.id && styles.pillActive]}
                onPress={() => setSelectedTheLoai(selectedTheLoai === tl.id ? null : tl.id)}
              >
                <Text style={[styles.pillText, selectedTheLoai === tl.id && styles.pillTextActive]}>
                  {tl.tenTheLoai}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Sách có hàng ── */}
        {sachConHang.length > 0 && (
          <View style={styles.sectionSpacing}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sách có sẵn</Text>
              <Text style={styles.sectionCount}>{sachConHang.length} quyển</Text>
            </View>
            <FlatList
              data={sachConHang}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderBookCard}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.gridPadding}
            />
          </View>
        )}

        {/* ── Sách hết hàng ── */}
        {sachHetHang.length > 0 && (
          <View style={styles.sectionSpacing}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tạm hết hàng</Text>
              <Text style={styles.sectionCount}>{sachHetHang.length} quyển</Text>
            </View>
            <FlatList
              data={sachHetHang}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderBookCard}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.gridPadding}
            />
          </View>
        )}

        {sachFiltered.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>—</Text>
            <Text style={styles.emptyTitle}>Không tìm thấy sách</Text>
            <Text style={styles.emptyHint}>Hãy thử từ khoá khác</Text>
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <View style={styles.navActiveIndicator} />
          <Text style={[styles.navIcon, { color: RED }]}>🏠</Text>
          <Text style={[styles.navLabel, { color: RED, fontWeight: '700' }]}>Trang chủ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('DanhSachPhieuGiamGia')}>
          <Text style={styles.navIcon}>🎁</Text>
          <Text style={styles.navLabel}>Ưu đãi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.navIcon}>🛒</Text>
          <Text style={styles.navLabel}>Giỏ hàng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Thongtin')}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Cá nhân</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: RED,
    paddingTop: 52,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 22 },

  /* Search */
  searchWrapper: { paddingHorizontal: 16, marginTop: -20, marginBottom: 6, zIndex: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },



  /* Section spacing */
  sectionSpacing: { marginTop: 20 },

  /* Section label line */
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#888', paddingHorizontal: 16, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 16, marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#222' },
  sectionCount: { fontSize: 12, color: '#aaa', fontWeight: '500' },

  /* Category Pills */
  pillRow: { paddingHorizontal: 16, paddingBottom: 4, gap: 8, flexDirection: 'row' },
  pill: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 50, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#E8E8E8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  pillActive: { backgroundColor: RED, borderColor: RED },
  pillText: { fontSize: 13, color: '#666', fontWeight: '600' },
  pillTextActive: { color: '#fff' },

  /* Book Grid */
  gridPadding: { paddingHorizontal: 16 },
  row: { justifyContent: 'space-between', marginBottom: 14 },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardImgWrapper: { width: '100%', height: 160, backgroundColor: '#F5F6FA' },
  cardImg: { width: '100%', height: '100%' },
  cardImgPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F5' },
  hetHangOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  hetHangText: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  lowStockBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#FF8C00', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  lowStockText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#222', marginBottom: 2, lineHeight: 17 },
  cardAuthor: { fontSize: 11, color: '#999', marginBottom: 6 },
  cardPrice: { fontSize: 14, fontWeight: '800', color: RED, marginBottom: 8 },
  addBtn: {
    backgroundColor: RED, borderRadius: 20,
    paddingVertical: 7, alignItems: 'center',
  },
  addBtnDisabled: { backgroundColor: '#D0D0D0' },
  addBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  /* Empty */
  emptyBox: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#444', marginBottom: 6 },
  emptyHint: { fontSize: 13, color: '#aaa' },

  /* Bottom Nav */
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingBottom: 22,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  navActiveIndicator: {
    position: 'absolute', top: -10, width: 32, height: 3,
    backgroundColor: RED, borderRadius: 2,
  },
  navIcon: { fontSize: 21, marginBottom: 3, color: '#B0B0B0' },
  navLabel: { fontSize: 10, color: '#B0B0B0', fontWeight: '500' },
});
