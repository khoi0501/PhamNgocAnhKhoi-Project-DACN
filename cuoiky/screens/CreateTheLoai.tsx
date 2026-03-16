import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch, getPermissions, findPermission } from '../services/api';

const RED = '#E85A4F';
type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'CreateTheLoai'> };

export default function CreateTheLoai({ navigation }: Props) {
  const [tenTheLoai, setTenTheLoai] = useState('');
  const [loading, setLoading] = useState(false);
  const [theLoaiList, setTheLoaiList] = useState<{id: number, tenTheLoai: string}[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  
  // RBAC
  const [hasAddPerm, setHasAddPerm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/TheLoai/GetAll`);
        const json = await res.json();
        if (Array.isArray(json)) setTheLoaiList(json);
        
        // Kiểm tra phân quyền
        const perms = await getPermissions();
        if (perms.some((p: any) => p.full)) {
          setHasAddPerm(true);
        } else {
          const theLoaiPerm = findPermission(perms, { exact: ['quản lý thể loại', 'danh mục thể loại', 'thể loại'], matches: ['thể loại'] });
          setHasAddPerm(theLoaiPerm ? theLoaiPerm.quyenThem : false);
        }

      } catch { } finally { setLoadingList(false); }
    })();
  }, []);

  const handleTao = async () => {
    if (!tenTheLoai.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập tên thể loại'); return; }
    setLoading(true);
    try {
      const res = await authFetch(`${BASE_URL}/api/TheLoai/CreateTheLoai`, {
        method: 'POST',
        body: JSON.stringify({ tenTheLoai }),
      });
      const json = await res.json();
      if (json.statusCode === 200) {
        Alert.alert('✅ Thành công', 'Đã tạo thể loại mới');
        setTenTheLoai('');
        // Refresh list
        const res2 = await fetch(`${BASE_URL}/api/TheLoai/GetAll`);
        const json2 = await res2.json();
        if (Array.isArray(json2)) setTheLoaiList(json2);
      } else {
        Alert.alert('Lỗi', json.message || 'Không thể tạo thể loại');
      }
    } catch {
      Alert.alert('Lỗi kết nối', 'Không thể kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F0F2F5' }}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>🏷️ Quản Lý Thể Loại</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Thêm thể loại mới</Text>
          <Text style={s.label}>Tên thể loại</Text>
          <TextInput
            style={[s.input, !hasAddPerm && { backgroundColor: '#E0E0E0', opacity: 0.6 }]} 
            value={tenTheLoai} onChangeText={setTenTheLoai}
            placeholder={hasAddPerm ? "VD: Tiểu thuyết, Khoa học..." : "Bạn không có quyền thêm."}
            placeholderTextColor="#aaa"
            editable={hasAddPerm}
          />
          <TouchableOpacity 
            style={[s.btn, !hasAddPerm && { backgroundColor: '#ccc' }]} 
            onPress={handleTao} 
            disabled={loading || !hasAddPerm} 
            activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>➕ Tạo thể loại</Text>}
          </TouchableOpacity>
        </View>

        <View style={[s.section, { marginTop: 14 }]}>
          <Text style={s.sectionTitle}>Danh sách thể loại ({theLoaiList.length})</Text>
          {loadingList ? <ActivityIndicator color={RED} /> : theLoaiList.map(tl => (
            <View key={tl.id} style={s.theLoaiItem}>
              <Text style={s.tlIcon}>🏷️</Text>
              <Text style={s.tlName}>{tl.tenTheLoai}</Text>
              <Text style={s.tlId}>#{tl.id}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: RED, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 16 },
  backText: { color: '#fff', fontSize: 22 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 14 },
  label: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 15, color: '#222', backgroundColor: '#FAFAFA', marginBottom: 14 },
  btn: { backgroundColor: RED, borderRadius: 30, height: 48, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  theLoaiItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  tlIcon: { fontSize: 20, marginRight: 10 },
  tlName: { flex: 1, fontSize: 14, color: '#333', fontWeight: '600' },
  tlId: { fontSize: 12, color: '#aaa' },
});
