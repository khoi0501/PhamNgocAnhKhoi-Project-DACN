import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, StatusBar, ScrollView, Image
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { BASE_URL, authFetch } from '../services/api';

const RED = '#E85A4F';

type Props = NativeStackScreenProps<RootStackParamList, 'VietDanhGia'>;

export default function VietDanhGia({ route, navigation }: Props) {
  const { orderId, products, maDonHang } = route.params;
  const [reviews, setReviews] = useState<Record<number, { soSao: number, noiDung: string }>>({});
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [successItems, setSuccessItems] = useState<number[]>([]);

  useEffect(() => {
    // Check if there are any products to review, just in case
    if (!products || products.length === 0) {
      Alert.alert('Lỗi', 'Không có sản phẩm nào để đánh giá.');
      navigation.goBack();
    }
    
    // Initialize state structure
    const initialReviews: Record<number, { soSao: number, noiDung: string }> = {};
    products.forEach((p: any) => {
      initialReviews[p.idSach] = { soSao: 5, noiDung: '' };
    });
    setReviews(initialReviews);
  }, [products]);

  const handleStarPress = (idSach: number, star: number) => {
    setReviews(prev => ({
      ...prev,
      [idSach]: { ...prev[idSach], soSao: star }
    }));
  };

  const handleTextChange = (idSach: number, text: string) => {
    setReviews(prev => ({
      ...prev,
      [idSach]: { ...prev[idSach], noiDung: text }
    }));
  };

  const submitReview = async (idSach: number) => {
    const reviewData = reviews[idSach];
    if (!reviewData.soSao) {
      Alert.alert('Chưa chọn sao', 'Vui lòng chọn số sao để đánh giá.');
      return;
    }

    setSubmitting(idSach);

    try {
      const payload = {
        idSach,
        idDonHang: orderId,
        soSao: reviewData.soSao,
        noiDung: reviewData.noiDung
      };

      const res = await authFetch(`${BASE_URL}/api/DanhGia/TaoDanhGia`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.statusCode === 200) {
        Alert.alert('✅ Cảm ơn bạn!', 'Đánh giá đã được ghi nhận.', [
          {
            text: 'OK',
            onPress: () => {
              const updatedSuccess = [...successItems, idSach];
              setSuccessItems(updatedSuccess);
              // Nếu đã đánh giá hết các sản phẩm trong đơn, quay về trang chủ
              if (updatedSuccess.length === products.length) {
                navigation.replace('Index');
              }
            }
          }
        ]);
      } else {
        Alert.alert('Thông báo', json.message || 'Có lỗi xảy ra.');
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể gửi đánh giá lúc này.');
    } finally {
      setSubmitting(null);
    }
  };

  const StarsSelector = ({ idSach, currentStars }: { idSach: number, currentStars: number }) => {
    return (
      <View style={s.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <TouchableOpacity 
            key={star} 
            onPress={() => handleStarPress(idSach, star)}
            style={s.starBtn}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 32, color: star <= currentStars ? '#F59E0B' : '#E5E7EB' }}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={RED} />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Viết Đánh Giá</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent}>
        <Text style={s.pageTitle}>Đánh giá sản phẩm</Text>
        <Text style={s.pageSub}>Đơn hàng: {maDonHang || `#${orderId}`}</Text>

        {products?.map((item: any, index: number) => {
          const idSach = item.idSach;
          const reviewData = reviews[idSach] || { soSao: 5, noiDung: '' };
          const isSuccess = successItems.includes(idSach);
          const isSubmittingThis = submitting === idSach;

          return (
            <View key={idSach} style={s.productCard}>
              {/* Product Info */}
              <View style={s.productInfoRow}>
                {item.hinhAnh ? (
                  <Image source={{ uri: item.hinhAnh }} style={s.productImg} resizeMode="contain" />
                ) : (
                  <View style={s.imgPlaceholder}><Text style={{fontSize: 24}}>📖</Text></View>
                )}
                <View style={s.productDetails}>
                  <Text style={s.productName}>{item.tenSach || 'Sách'}</Text>
                  {item.tenTacGia ? <Text style={s.productAuthor}>{item.tenTacGia}</Text> : null}
                </View>
              </View>

              <View style={s.divider} />

              {isSuccess ? (
                <View style={s.successBox}>
                  <Text style={s.successIcon}>🎉</Text>
                  <Text style={s.successText}>Bạn đã đánh giá sản phẩm này!</Text>
                </View>
              ) : (
                <>
                  {/* Rating Selector */}
                  <Text style={s.label}>Chất lượng sản phẩm</Text>
                  <StarsSelector idSach={idSach} currentStars={reviewData.soSao} />
                  <Text style={s.ratingText}>
                   {reviewData.soSao === 5 ? 'Tuyệt vời' :
                    reviewData.soSao === 4 ? 'Hài lòng' : 
                    reviewData.soSao === 3 ? 'Bình thường' : 
                    reviewData.soSao === 2 ? 'Không hài lòng' : 'Tệ'}
                  </Text>

                  {/* Review Text Input */}
                  <TextInput
                    style={s.textInput}
                    placeholder="Hãy chia sẻ những điều bạn thích về sản phẩm này với những người mua khác nhé."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    value={reviewData.noiDung}
                    onChangeText={(txt) => handleTextChange(idSach, txt)}
                    textAlignVertical="top"
                  />

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[s.submitBtn, isSubmittingThis && s.submitBtnDisabled]}
                    onPress={() => submitReview(idSach)}
                    disabled={isSubmittingThis}
                    activeOpacity={0.8}
                  >
                    {isSubmittingThis ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={s.submitText}>Gửi Đánh Giá</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  
  // Header
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    backgroundColor: RED, paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16,
    elevation: 4
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },

  scrollContent: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  pageSub: { fontSize: 14, color: '#6B7280', marginBottom: 20, marginTop: 4 },

  productCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  productInfoRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  productImg: { width: 60, height: 80, borderRadius: 8, backgroundColor: '#F9FAFB' },
  imgPlaceholder: { width: 60, height: 80, borderRadius: 8, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  productDetails: { flex: 1, justifyContent: 'center' },
  productName: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  productAuthor: { fontSize: 13, color: '#6B7280' },
  
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 },

  label: { fontSize: 14, fontWeight: '700', color: '#374151', textAlign: 'center', marginBottom: 8 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 4 },
  starBtn: { paddingHorizontal: 4 },
  ratingText: { textAlign: 'center', fontSize: 13, color: '#F59E0B', fontWeight: '600', marginBottom: 16 },

  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 100,
    marginBottom: 16
  },
  
  submitBtn: {
    backgroundColor: RED,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#FCA5A5'
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700'
  },

  successBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  successIcon: { fontSize: 32, marginBottom: 8 },
  successText: { color: '#059669', fontSize: 15, fontWeight: '700', textAlign: 'center' },
});
