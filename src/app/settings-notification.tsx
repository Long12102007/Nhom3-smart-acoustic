import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const NOTIF_ENABLED_KEY = '@notif_enabled';
const NOTIF_POPUP_KEY = '@notif_popup';

export default function SettingsNotificationScreen() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isPopup, setIsPopup] = useState(true);

  // Tải trạng thái đã lưu khi mở màn hình
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedEnabled = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
        const savedPopup = await AsyncStorage.getItem(NOTIF_POPUP_KEY);

        if (savedEnabled !== null) setIsEnabled(savedEnabled === 'true');
        if (savedPopup !== null) setIsPopup(savedPopup === 'true');
      } catch (e) {
        console.log("Lỗi tải cài đặt thông báo:", e);
      }
    };
    loadSettings();
  }, []);

  // Xử lý thay đổi "Bật thông báo"
  const handleToggleEnabled = async (value: boolean) => {
    setIsEnabled(value);
    await AsyncStorage.setItem(NOTIF_ENABLED_KEY, value.toString());
  };

  // Xử lý thay đổi "Thông báo Popup"
  const handleTogglePopup = async (value: boolean) => {
    setIsPopup(value);
    await AsyncStorage.setItem(NOTIF_POPUP_KEY, value.toString());
    
    if (value) {
      // Hiển thị Popup mẫu ngay lập tức để kiểm tra
      Alert.alert(
        "👶 Cảnh báo từ hệ thống",
        "Tính năng thông báo Popup đã được kích hoạt thành công!",
        [{ text: "Đã hiểu" }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Thanh Header thủ công */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Điều chỉnh thông báo tổng quát</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          
          {/* Mục 1: Bật thông báo */}
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.label}>Bật thông báo</Text>
              <Text style={styles.subLabel}>Nhận cảnh báo khi bé khóc</Text>
            </View>
            <Switch 
              value={isEnabled} 
              onValueChange={handleToggleEnabled} 
              trackColor={{ false: '#d1d1d6', true: '#ffb74d' }}
              thumbColor={'#fff'}
            />
          </View>

          <View style={styles.divider} />

          {/* Mục 2: Thông báo Popup */}
          <View style={[styles.row, !isEnabled && styles.disabledRow]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={[styles.label, !isEnabled && styles.disabledText]}>Thông báo Popup</Text>
              <Text style={[styles.subLabel, !isEnabled && styles.disabledText]}>Hiển thị cửa sổ nổi cảnh báo ngay trên màn hình</Text>
            </View>
            <Switch 
              value={isPopup} 
              onValueChange={handleTogglePopup} 
              disabled={!isEnabled}
              trackColor={{ false: '#d1d1d6', true: '#ffb74d' }}
              thumbColor={'#fff'}
            />
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f4f5f7' },
  customHeader: { 
    backgroundColor: '#21335b', 
    paddingTop: 45, 
    paddingBottom: 16, 
    paddingHorizontal: 16,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    width: '100%'
  },
  backButton: { padding: 4 },
  headerTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1
  },
  content: { padding: 16 },
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 18, 
    paddingHorizontal: 20 
  },
  disabledRow: {
    opacity: 0.4,
  },
  label: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#21335b' 
  },
  subLabel: { 
    fontSize: 13, 
    color: '#666', 
    marginTop: 4 
  },
  disabledText: {
    color: '#999',
  },
  divider: { 
    height: 1, 
    backgroundColor: '#f0f0f0', 
    marginLeft: 20 
  }
});