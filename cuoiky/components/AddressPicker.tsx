import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, FlatList, ActivityIndicator, SafeAreaView,
} from 'react-native';

const RED = '#E85A4F';

interface AddressPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function AddressPicker({ value, onChange }: AddressPickerProps) {
  const [soNha, setSoNha] = useState('');
  const [phuong, setPhuong] = useState<{ code: number; name: string } | null>(null);
  const [quan, setQuan] = useState<{ code: number; name: string } | null>(null);
  const [tinh, setTinh] = useState<{ code: number; name: string } | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'TINH' | 'QUAN' | 'PHUONG'>('TINH');
  const [listData, setListData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Parse initial value
  useEffect(() => {
    if (value && !soNha && !phuong && !quan && !tinh) {
      const parts = value.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 4) {
        setSoNha(parts.slice(0, parts.length - 3).join(', '));
        setPhuong({ code: -1, name: parts[parts.length - 3] });
        setQuan({ code: -1, name: parts[parts.length - 2] });
        setTinh({ code: -1, name: parts[parts.length - 1] });
      } else {
        setSoNha(value);
      }
    }
  }, [value]);

  // Update parent when parts change
  useEffect(() => {
    if (soNha !== '' || phuong || quan || tinh) {
      const parts = [];
      if (soNha) parts.push(soNha);
      if (phuong) parts.push(phuong.name);
      if (quan) parts.push(quan.name);
      if (tinh) parts.push(tinh.name);
      const newVal = parts.join(', ');
      if (newVal !== value) {
        onChange(newVal);
      }
    }
  }, [soNha, phuong, quan, tinh]);

  const openPicker = async (type: 'TINH' | 'QUAN' | 'PHUONG') => {
    setModalType(type);
    setListData([]);
    setModalVisible(true);
    setLoading(true);

    try {
      let url = '';
      if (type === 'TINH') {
        url = 'https://provinces.open-api.vn/api/p/';
      } else if (type === 'QUAN' && tinh) {
        url = `https://provinces.open-api.vn/api/p/${tinh.code}?depth=2`;
      } else if (type === 'PHUONG' && quan) {
        url = `https://provinces.open-api.vn/api/d/${quan.code}?depth=2`;
      }
      
      if (url) {
        const res = await fetch(url);
        const json = await res.json();
        if (type === 'TINH') setListData(json);
        else if (type === 'QUAN') setListData(json.districts || []);
        else if (type === 'PHUONG') setListData(json.wards || []);
      }
    } catch { } finally { setLoading(false); }
  };

  const selectItem = (item: any) => {
    if (modalType === 'TINH') {
      setTinh({ code: item.code, name: item.name });
      setQuan(null);
      setPhuong(null);
    } else if (modalType === 'QUAN') {
      setQuan({ code: item.code, name: item.name });
      setPhuong(null);
    } else if (modalType === 'PHUONG') {
      setPhuong({ code: item.code, name: item.name });
    }
    setModalVisible(false);
  };

  return (
    <View style={s.container}>
      <Text style={s.label}>Số nhà, Đường</Text>
      <TextInput
        style={s.input} value={soNha} onChangeText={setSoNha}
        placeholder="Nhập số nhà, tên đường..." placeholderTextColor="#aaa"
      />

      <View style={s.row}>
        <View style={s.col}>
          <Text style={s.label}>Tỉnh / Thành phố</Text>
          <TouchableOpacity style={s.selectBtn} onPress={() => openPicker('TINH')}>
            <Text style={[s.selectText, !tinh && { color: '#aaa' }]}>{tinh ? tinh.name : 'Chọn Tỉnh/TP'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.col}>
          <Text style={s.label}>Quận / Huyện</Text>
          <TouchableOpacity style={s.selectBtn} onPress={() => tinh && openPicker('QUAN')} disabled={!tinh}>
            <Text style={[s.selectText, !quan && { color: '#aaa' }]}>{quan ? quan.name : 'Chọn Quận/Huyện'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.row}>
        <View style={s.col}>
          <Text style={s.label}>Phường / Xã</Text>
          <TouchableOpacity style={s.selectBtn} onPress={() => quan && openPicker('PHUONG')} disabled={!quan}>
            <Text style={[s.selectText, !phuong && { color: '#aaa' }]}>{phuong ? phuong.name : 'Chọn Phường/Xã'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <SafeAreaView style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {modalType === 'TINH' ? 'Chọn Tỉnh/Thành phố' : modalType === 'QUAN' ? 'Chọn Quận/Huyện' : 'Chọn Phường/Xã'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={s.closeText}>Đóng</Text>
              </TouchableOpacity>
            </View>
            
            {loading ? <View style={s.center}><ActivityIndicator size="large" color={RED} /></View>
            : listData.length === 0 ? <View style={s.center}><Text>Không có dữ liệu</Text></View>
            : <FlatList 
                data={listData}
                keyExtractor={i => i.code.toString()}
                renderItem={({item}) => (
                  <TouchableOpacity style={s.listItem} onPress={() => selectItem(item)}>
                    <Text style={s.listText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
              />
            }
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 13, color: '#666', marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 14, height: 46, fontSize: 14, color: '#222', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  col: { flex: 1 },
  selectBtn: { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', paddingHorizontal: 14, height: 46, justifyContent: 'center' },
  selectText: { fontSize: 14, color: '#222' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, height: '70%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  closeText: { fontSize: 14, color: RED, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  listText: { fontSize: 15, color: '#333' },
});
