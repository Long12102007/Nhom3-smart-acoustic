import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer } from 'expo-audio';
import { Stack, useFocusEffect } from 'expo-router';
import { onValue, ref } from 'firebase/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

// Khai báo danh sách file âm thanh mặc định
const ringtoneFiles: { [key: string]: any } = {
  default: require('../../../assets/coihukhancap.mp3'),
  kids_cry: require('../../../assets/treconkhocre.mp3'),
  gentle: require('../../../assets/chuongbaonhenhang.mp3'),
  electronic: require('../../../assets/dientuchoitai.mp3'),
};

const STORAGE_KEY = '@selected_ringtone_key';

export default function HomeScreen() {
  const [babyStatus, setBabyStatus] = useState('YÊN BÌNH');
  const [statusMessage, setStatusMessage] = useState('Bé đang ngủ ngoan');
  const [nodeCount, setNodeCount] = useState(0);
  const [displayName, setDisplayName] = useState('Chiến');

  // Danh sách thiết bị ngầm để lấy tên phòng khi báo động
  const [devices, setDevices] = useState<any[]>([]);
  const [rawFirebaseData, setRawFirebaseData] = useState<any>(null);

  const playerRef = useRef<any>(null);
  const isAlertActiveRef = useRef(false);

  // Hàm kích hoạt cảnh báo khi bé khóc, kèm theo tên thiết bị/phòng cụ thể
  const triggerAlarm = useCallback(async (deviceName = "Hệ thống giám sát") => {
    if (isAlertActiveRef.current) return;
    isAlertActiveRef.current = true;

    try {
      const savedRingtone = await AsyncStorage.getItem(STORAGE_KEY) || 'kids_cry';
      const customUri = await AsyncStorage.getItem('@custom_file_uri_key');

      let sourceToPlay = ringtoneFiles['kids_cry'];

      if (savedRingtone === 'custom' && customUri) {
        sourceToPlay = customUri;
      } else if (ringtoneFiles[savedRingtone]) {
        sourceToPlay = ringtoneFiles[savedRingtone];
      }

      if (playerRef.current) {
        try {
          playerRef.current.pause();
          playerRef.current.remove();
        } catch (e) {}
        playerRef.current = null;
      }

      const newPlayer = createAudioPlayer(sourceToPlay);
      newPlayer.loop = true;
      newPlayer.play();
      playerRef.current = newPlayer;

      Alert.alert(
        "🚨 CẢNH BÁO KHẨN CẤP!",
        `Phát hiện tiếng bé đang khóc tại: ${deviceName}! Vui lòng kiểm tra ngay.`,
        [
          { 
            text: "Đã hiểu", 
            onPress: () => {
              if (playerRef.current) {
                try {
                  playerRef.current.pause();
                } catch (e) {}
              }
              isAlertActiveRef.current = false;
            } 
          }
        ],
        { cancelable: false }
      );
    } catch (error) {
      isAlertActiveRef.current = false;
      console.log('Lỗi phát âm thanh báo động:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (auth.currentUser) {
        const name = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Chiến';
        setDisplayName(name);
      }
    }, [])
  );

  // Lắng nghe nhánh devices để tính tổng số Node đang có
  useEffect(() => {
    const devicesRef = ref(db, 'devices');
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setRawFirebaseData(data);
        setNodeCount(Object.keys(data).length);
      } else {
        setRawFirebaseData(null);
        setNodeCount(0);
        setDevices([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Vòng lặp tính toán thiết bị Online
  useEffect(() => {
    const timer = setInterval(() => {
      if (rawFirebaseData) {
        const currentTime = Math.floor(Date.now() / 1000);
        const loadedDevices = Object.keys(rawFirebaseData).map((key) => {
          const device = rawFirebaseData[key];
          const lastSeenTime = device.lastSeen || 0;
          const isReallyOnline = device.status === 'Online' && (currentTime - lastSeenTime <= 8);
          return {
            id: key,
            ...device,
            computedStatus: isReallyOnline ? 'Online' : 'Offline'
          };
        });
        setDevices(loadedDevices);
      } else {
        setDevices([]);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [rawFirebaseData]);

  // Lắng nghe trạng thái bé từ Firebase
  useEffect(() => {
    const statusRef = ref(db, 'system_status/baby_state');
    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        const state = snapshot.val(); 
        
        if (state === 'ĐANG KHÓC!' && babyStatus !== 'ĐANG KHÓC!') {
          const activeDevice = devices.find(d => d.computedStatus === 'Online') || devices[0];
          const deviceName = activeDevice ? (activeDevice.name || activeDevice.id) : "Phòng của bé";
          triggerAlarm(deviceName);
        }

        setBabyStatus(state);
        if (state === 'ĐANG KHÓC!') {
          setStatusMessage('Bé đang khóc, cần kiểm tra ngay!');
        } else {
          setStatusMessage('Bé đang ngủ ngoan');
        }
      }
    });

    return () => unsubscribeStatus();
  }, [babyStatus, triggerAlarm, devices]);

  const isCrying = babyStatus === 'ĐANG KHÓC!';

  return (
    <View style={styles.mainContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header trang trí mới với chữ tiêu đề to rõ */}
      <View style={styles.customHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>Hệ thống giám sát</Text>
          <Text style={styles.headerTitle}>Bé Yêu</Text>
        </View>
        <View style={styles.headerIconBadge}>
          <Ionicons name="shield-checkmark" size={26} color="#4caf50" />
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Phần lời chào */}
        <View style={styles.welcomeBox}>
          <Text style={styles.greeting}>Xin chào, {displayName}! 👋</Text>
          <Text style={styles.greetingSub}>Hôm nay hệ thống hoạt động ổn định và sẵn sàng bảo vệ bé.</Text>
        </View>
        
        {/* Thẻ Trạng thái bé trung tâm */}
        <View style={[styles.statusCard, { borderColor: isCrying ? '#e53935' : '#81c784' }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.statusBadgeRow}>
              <View style={[styles.dotIndicator, { backgroundColor: isCrying ? '#e53935' : '#4caf50' }]} />
              <Text style={styles.label}>Trạng Thái Bé Hiện Tại</Text>
            </View>
            <Text style={[styles.statusValue, { color: isCrying ? '#e53935' : '#2e7d32' }]}>
              {babyStatus}
            </Text>
            <Text style={styles.subText}>{statusMessage}</Text>
          </View>
          <View style={[styles.iconContainer, { backgroundColor: isCrying ? '#ffebee' : '#e8f5e9' }]}>
            <Ionicons name={isCrying ? "alert-circle" : "happy"} size={45} color={isCrying ? "#e53935" : "#4caf50"} />
          </View>
        </View>

        {/* Khung Node báo */}
        <View style={styles.nodeCard}>
          <View style={styles.nodeCardLeft}>
            <View style={styles.nodeIconBg}>
              <Ionicons name="radio-outline" size={26} color="#21335b" />
            </View>
            <View style={{ marginLeft: 14 }}>
              <Text style={styles.nodeTitle}>Thiết bị Node Báo</Text>
              <Text style={styles.nodeSub}>Thiết bị đang hoạt động</Text>
            </View>
          </View>
          <View style={styles.nodeCountBadge}>
            <Text style={styles.nodeCountText}>{nodeCount}</Text>
          </View>
        </View>

        {/* Khung hướng dẫn / mẹo nhỏ */}
        <View style={styles.tipsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="bulb-outline" size={20} color="#ff9800" style={{ marginRight: 8 }} />
            <Text style={styles.tipsTitle}>Gợi ý sử dụng</Text>
          </View>
          <Text style={styles.tipsContent}>
            • Đảm bảo thiết bị luôn được cắm nguồn và kết nối Wi-Fi ổn định.{'\n'}
            • Bạn có thể tùy chỉnh âm thanh báo động riêng tại mục cài đặt nhạc chuông.{'\n'}
            • Vuốt hoặc quản lý các node thiết bị nhanh chóng tại tab Quản lý thiết bị.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f8f9fa' },
  customHeader: { 
    backgroundColor: '#21335b', 
    paddingTop: 50, 
    paddingBottom: 20, 
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
  },
  // Đã tăng kích thước chữ hệ thống giám sát to lên rõ rệt
  headerSubtitle: { 
    color: '#b0bec5', 
    fontSize: 15, 
    fontWeight: '700', 
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  headerIconBadge: { backgroundColor: '#fff', padding: 8, borderRadius: 12 },
  
  container: { flex: 1, padding: 20 },
  
  welcomeBox: { marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1a237e' },
  greetingSub: { fontSize: 13, color: '#616161', marginTop: 2 },

  statusCard: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    borderWidth: 2, 
    marginBottom: 16, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  dotIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  label: { fontSize: 13, color: '#757575', fontWeight: '600' },
  statusValue: { fontSize: 24, fontWeight: 'bold', marginVertical: 2 },
  subText: { fontSize: 13, color: '#9e9e9e' },
  iconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },

  nodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  nodeCardLeft: { flexDirection: 'row', alignItems: 'center' },
  nodeIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' },
  nodeTitle: { fontSize: 15, fontWeight: 'bold', color: '#21335b' },
  nodeSub: { fontSize: 12, color: '#757575', marginTop: 2 },
  nodeCountBadge: { backgroundColor: '#21335b', paddingVertical: 6, paddingHorizontal: 14, borderRadius: 12 },
  nodeCountText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  tipsCard: {
    backgroundColor: '#fff8e1',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  tipsTitle: { fontSize: 14, fontWeight: 'bold', color: '#e65100' },
  tipsContent: { fontSize: 13, color: '#5d4037', lineHeight: 20 },
});