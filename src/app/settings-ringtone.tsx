import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Khai báo sẵn các file âm thanh mặc định từ thư mục assets
const ringtoneFiles: { [key: string]: any } = {
  default: require('../../assets/coihukhancap.mp3'),
  kids_cry: require('../../assets/treconkhocre.mp3'),
  gentle: require('../../assets/chuongbaonhenhang.mp3'),
  electronic: require('../../assets/dientuchoitai.mp3'),
};

const STORAGE_KEY = '@selected_ringtone_key';
const STORAGE_FILE_KEY = '@custom_file_name_key';
const STORAGE_URI_KEY = '@custom_file_uri_key'; // Thêm key lưu URI file tùy chỉnh

export default function RingtoneSettingsScreen() {
  const [selectedRingtone, setSelectedRingtone] = useState('kids_cry');
  const [customFileName, setCustomFileName] = useState('Chưa chọn file MP3 nào');
  const [customFileUri, setCustomFileUri] = useState<string | null>(null);

  // Xác định nguồn phát hiện tại
  const currentSource = selectedRingtone === 'custom' && customFileUri 
    ? customFileUri 
    : ringtoneFiles[selectedRingtone] || ringtoneFiles['kids_cry'];

  // Khởi tạo audio player với expo-audio
  const player = useAudioPlayer(currentSource);

  // Tải lại lựa chọn và URI đã lưu từ bộ nhớ khi mở màn hình
  useEffect(() => {
    const loadSavedRingtone = async () => {
      try {
        const savedRingtone = await AsyncStorage.getItem(STORAGE_KEY);
        const savedFileName = await AsyncStorage.getItem(STORAGE_FILE_KEY);
        const savedFileUri = await AsyncStorage.getItem(STORAGE_URI_KEY); // Đọc lại URI đã lưu
        
        if (savedRingtone) {
          setSelectedRingtone(savedRingtone);
        }
        if (savedFileName) {
          setCustomFileName(savedFileName);
        }
        if (savedFileUri) {
          setCustomFileUri(savedFileUri);
        }
      } catch (error) {
        console.log("Lỗi khi tải cài đặt đã lưu:", error);
      }
    };
    loadSavedRingtone();
  }, []);

  // Tự động dừng nhạc khi rời khỏi màn hình hoặc đổi mục
  useEffect(() => {
    return () => {
      try {
        player.pause();
      } catch (e) {}
    };
  }, [selectedRingtone]);

  // Hàm xử lý chọn và phát nghe thử nhạc chuông
  const handleSelectRingtone = async (id: string) => {
    try {
      player.pause();
      setSelectedRingtone(id);
      await AsyncStorage.setItem(STORAGE_KEY, id);

      // Phát lại từ đầu an toàn bằng expo-audio
      setTimeout(() => {
        try {
          player.play();
        } catch (err) {
          console.log("Không thể phát:", err);
        }
      }, 100);
    } catch (error) {
      console.log("Lỗi lưu hoặc phát âm thanh:", error);
    }
  };

  // Hàm mở chọn file MP3 từ thiết bị
  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/mpeg',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedFile = result.assets[0];
        
        player.pause();

        setCustomFileName(pickedFile.name);
        setCustomFileUri(pickedFile.uri);
        setSelectedRingtone('custom');

        // Lưu thông tin vào AsyncStorage để trang chủ (home.tsx) có thể đọc được
        await AsyncStorage.setItem(STORAGE_KEY, 'custom');
        await AsyncStorage.setItem(STORAGE_FILE_KEY, pickedFile.name);
        await AsyncStorage.setItem(STORAGE_URI_KEY, pickedFile.uri); // Lưu URI thực tế của file MP3

        Alert.alert("Thành công", `Đã lưu file: ${pickedFile.name}`);
        
        setTimeout(() => {
          try {
            player.play();
          } catch (e) {}
        }, 100);
      }
    } catch (error) {
      console.log("Lỗi khi chọn file:", error);
      Alert.alert("Lỗi", "Không thể chọn file âm thanh này.");
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Thanh Header thủ công chuẩn đồng bộ */}
      <View style={styles.customHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Nhạc chuông báo động</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Tiêu đề phần 1 */}
        <Text style={styles.sectionLabel}>Chọn nhạc chuông mặc định (Nhấn để nghe thử):</Text>

        {/* Item 1 */}
        <TouchableOpacity 
          style={styles.optionCard} 
          onPress={() => handleSelectRingtone('default')}
          activeOpacity={0.8}
        >
          <Text style={styles.optionText}>Tiếng còi hú khẩn cấp (Mặc định)</Text>
          <Ionicons 
            name={selectedRingtone === 'default' ? "radio-button-on" : "radio-button-off"} 
            size={22} 
            color={selectedRingtone === 'default' ? "#ffb74d" : "#7f8c8d"} 
          />
        </TouchableOpacity>

        {/* Item 2 */}
        <TouchableOpacity 
          style={styles.optionCard} 
          onPress={() => handleSelectRingtone('kids_cry')}
          activeOpacity={0.8}
        >
          <Text style={styles.optionText}>Tiếng trẻ con khóc ré</Text>
          <Ionicons 
            name={selectedRingtone === 'kids_cry' ? "radio-button-on" : "radio-button-off"} 
            size={22} 
            color={selectedRingtone === 'kids_cry' ? "#ffb74d" : "#7f8c8d"} 
          />
        </TouchableOpacity>

        {/* Item 3 */}
        <TouchableOpacity 
          style={styles.optionCard} 
          onPress={() => handleSelectRingtone('gentle')}
          activeOpacity={0.8}
        >
          <Text style={styles.optionText}>Chuông báo nhẹ nhàng</Text>
          <Ionicons 
            name={selectedRingtone === 'gentle' ? "radio-button-on" : "radio-button-off"} 
            size={22} 
            color={selectedRingtone === 'gentle' ? "#ffb74d" : "#7f8c8d"} 
          />
        </TouchableOpacity>

        {/* Item 4 */}
        <TouchableOpacity 
          style={styles.optionCard} 
          onPress={() => handleSelectRingtone('electronic')}
          activeOpacity={0.8}
        >
          <Text style={styles.optionText}>Chuông điện tử chói tai</Text>
          <Ionicons 
            name={selectedRingtone === 'electronic' ? "radio-button-on" : "radio-button-off"} 
            size={22} 
            color={selectedRingtone === 'electronic' ? "#ffb74d" : "#7f8c8d"} 
          />
        </TouchableOpacity>

        {/* Tiêu đề phần 2 */}
        <Text style={[styles.sectionLabel, { marginTop: 15 }]}>Tùy chỉnh riêng:</Text>

        {/* Khung tùy chỉnh file MP3 */}
        <View style={styles.customCard}>
          <TouchableOpacity 
            style={styles.customRowTop}
            onPress={async () => {
              setSelectedRingtone('custom');
              await AsyncStorage.setItem(STORAGE_KEY, 'custom');
              if (customFileUri) {
                try {
                  player.play();
                } catch (e) {}
              } else {
                handleSelectFile();
              }
            }}
            activeOpacity={0.8}
          >
            <View style={styles.iconFileBox}>
              <Ionicons name="musical-notes" size={24} color="#ffb74d" />
            </View>
            <Text style={styles.customTitle}>Tự cài nhạc chuông qua file MP3</Text>
            
            <Ionicons 
              name={selectedRingtone === 'custom' ? "radio-button-on" : "radio-button-off"} 
              size={22} 
              color={selectedRingtone === 'custom' ? "#ffb74d" : "#7f8c8d"} 
            />
          </TouchableOpacity>

          <View style={styles.customRowBottom}>
            <Text style={styles.fileNameText} numberOfLines={2}>
              📁 {customFileName}
            </Text>
            <TouchableOpacity style={styles.chooseFileBtn} onPress={handleSelectFile}>
              <Text style={styles.chooseFileText}>Chọn file</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
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
  content: { padding: 16, paddingBottom: 30 },
  sectionLabel: { fontSize: 15, fontWeight: 'bold', color: '#555', marginBottom: 12 },
  optionCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#ffffff', 
    borderRadius: 16, 
    paddingVertical: 18, 
    paddingHorizontal: 16, 
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionText: { fontSize: 16, color: '#333', flex: 1, fontWeight: '500' },
  customCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  customRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconFileBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  customRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  fileNameText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    marginRight: 10,
    fontStyle: 'italic',
  },
  chooseFileBtn: {
    backgroundColor: '#21335b',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  chooseFileText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});