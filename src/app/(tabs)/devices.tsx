import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { onValue, ref, remove, set, update } from 'firebase/database';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../firebaseConfig';

export default function DevicesScreen() {
  const [devices, setDevices] = useState<any[]>([]);
  const [rawFirebaseData, setRawFirebaseData] = useState<any>(null);

  // Modal thêm thiết bị (nhập tên hiển thị và Node ID thủ công)
  const [modalVisible, setModalVisible] = useState(false);
  const [deviceNameInput, setDeviceNameInput] = useState('');
  const [nodeIdInput, setNodeIdInput] = useState('');

  // Modal chỉnh sửa tên thiết bị khi bấm giữ
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingDevice, setEditingDevice] = useState<any>(null);
  const [editNameInput, setEditNameInput] = useState('');

  // 1. Lắng nghe dữ liệu từ Firebase
  useEffect(() => {
    const devicesRef = ref(db, 'devices');
    const unsubscribe = onValue(devicesRef, (snapshot) => {
      if (snapshot.exists()) {
        setRawFirebaseData(snapshot.val());
      } else {
        setRawFirebaseData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Vòng lặp kiểm tra trạng thái Online/Offline mỗi giây
  useEffect(() => {
    const timer = setInterval(() => {
      if (rawFirebaseData) {
        const currentTime = Math.floor(Date.now() / 1000);
        
        const loadedDevices = Object.keys(rawFirebaseData).map((key) => {
          const device = rawFirebaseData[key];
          const lastSeenTime = device.lastSeen || 0;
          
          const isReallyOnline = device.status === 'Online' && (currentTime - lastSeenTime <= 8);

          return {
            id: key, // ID này chính là node_01, node_02,... khớp với ESP32
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

  // 3. Hàm lưu thiết bị mới với Node ID do người dùng nhập thủ công
  const handleSaveDevice = async () => {
    const finalName = deviceNameInput && deviceNameInput.trim() !== "" ? deviceNameInput.trim() : "Thiết bị mới";
    const finalNodeId = nodeIdInput && nodeIdInput.trim() !== "" ? nodeIdInput.trim().toLowerCase() : "";

    if (!finalNodeId) {
      Alert.alert("Lỗi", "Vui lòng nhập mã Node ID (Ví dụ: node_01).");
      return;
    }

    // Kiểm tra xem Node ID đã tồn tại chưa
    const exists = devices.some(d => d.id === finalNodeId);
    if (exists) {
      Alert.alert("Lỗi", `Mã Node ID "${finalNodeId}" đã tồn tại trong hệ thống.`);
      return;
    }

    try {
      // Đẩy lên Firebase với Node ID và Tên hiển thị người dùng vừa nhập
      await set(ref(db, `devices/${finalNodeId}`), {
        name: finalName,
        status: 'Offline',
        lastSeen: 0
      });

      Alert.alert("Thành công", `Đã thêm thiết bị "${finalName}" (${finalNodeId}) thành công!`);
      setDeviceNameInput('');
      setNodeIdInput('');
      setModalVisible(false);
    } catch (error) {
      console.log("Lỗi khi thêm thiết bị:", error);
      Alert.alert("Lỗi", "Không thể thêm thiết bị lên cơ sở dữ liệu.");
    }
  };

  // 4. Xóa thiết bị có bảng xác nhận
  const handleDeleteDevice = (deviceId: string, deviceName: string) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa thiết bị "${deviceName}" (${deviceId}) không?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              await remove(ref(db, `devices/${deviceId}`));
              Alert.alert("Đã xóa", `Thiết bị đã được xóa khỏi hệ thống.`);
            } catch (error) {
              console.log("Lỗi khi xóa:", error);
              Alert.alert("Lỗi", "Không thể xóa thiết bị.");
            }
          }
        }
      ]
    );
  };

  // 5. Cập nhật tên hiển thị khi bấm giữ
  const handleUpdateDeviceName = async () => {
    if (!editingDevice) return;
    const updatedName = editNameInput.trim() !== "" ? editNameInput.trim() : editingDevice.name;

    try {
      await update(ref(db, `devices/${editingDevice.id}`), {
        name: updatedName
      });
      Alert.alert("Thành công", "Đã cập nhật tên hiển thị mới!");
      setEditModalVisible(false);
      setEditingDevice(null);
    } catch (error) {
      console.log("Lỗi cập nhật tên:", error);
      Alert.alert("Lỗi", "Không thể cập nhật tên thiết bị.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh sách thiết bị</Text>
      </View>

      <View style={styles.contentContainer}>
        <TouchableOpacity style={styles.addButtonExternal} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
          <Ionicons name="add-circle" size={22} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.addButtonText}>Thêm thiết bị mới</Text>
        </TouchableOpacity>

        <Text style={styles.instructionText}>💡 Bấm giữ vào thiết bị để đổi tên hiển thị, nhấn vào thùng rác để xóa.</Text>

        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const isOnline = item.computedStatus === 'Online';
            
            return (
              <TouchableOpacity 
                style={styles.card}
                activeOpacity={0.9}
                onLongPress={() => {
                  setEditingDevice(item);
                  setEditNameInput(item.name || '');
                  setEditModalVisible(true);
                }}
              >
                <View style={[styles.iconBox, { backgroundColor: isOnline ? '#e8f5e9' : '#ffebee' }]}>
                  <Ionicons 
                    name={isOnline ? "radio" : "power"} 
                    size={24} 
                    color={isOnline ? "#4caf50" : "#e53935"} 
                  />
                </View>

                <View style={styles.infoBox}>
                  {/* Tên hiển thị trên máy */}
                  <Text style={styles.deviceName}>{item.name || item.id}</Text>
                  {/* Device ID khớp với ESP32 */}
                  <Text style={styles.nodeId}>ID: {item.id.toUpperCase()}</Text>
                </View>

                <Text style={[styles.statusText, { color: isOnline ? '#4caf50' : '#e53935', marginRight: 12 }]}>
                  {isOnline ? 'Đang Bật' : 'Offline'}
                </Text>

                <TouchableOpacity 
                  onPress={() => handleDeleteDevice(item.id, item.name || item.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#e53935" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Modal thêm thiết bị: Nhập tên ở trên, nhập Node ID ở dưới */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thêm thiết bị mới</Text>
            
            <Text style={styles.inputLabel}>Tên hiển thị trên máy:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ví dụ: Phòng Ngủ"
              placeholderTextColor="#999"
              value={deviceNameInput}
              onChangeText={setDeviceNameInput}
            />

            <Text style={styles.inputLabel}>Mã Node ID:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ví dụ: node_01"
              placeholderTextColor="#999"
              value={nodeIdInput}
              onChangeText={setNodeIdInput}
              autoCapitalize="none"
            />

            <Text style={styles.hintText}>* Nhập chính xác mã ID đã cấu hình trên phần cứng.</Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleSaveDevice}
              >
                <Text style={styles.confirmButtonText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Chỉnh sửa tên thiết bị */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi tên hiển thị thiết bị</Text>
            
            <Text style={styles.inputLabel}>Tên mới:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập tên mới..."
              placeholderTextColor="#999"
              value={editNameInput}
              onChangeText={setEditNameInput}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleUpdateDeviceName}
              >
                <Text style={styles.confirmButtonText}>Lưu thay đổi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  header: { 
    backgroundColor: '#21335b', 
    paddingVertical: 18, 
    paddingHorizontal: 20,
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold', 
    textAlign: 'center'
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  addButtonExternal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff9800',
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 8,
    elevation: 2,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  instructionText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    alignItems: 'center', 
    elevation: 2 
  },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoBox: { flex: 1 },
  deviceName: { fontSize: 16, fontWeight: 'bold', color: '#21335b', marginBottom: 2 },
  nodeId: { fontSize: 11, color: '#888', fontWeight: '600' },
  statusText: { fontSize: 13, fontWeight: 'bold' },
  deleteButton: {
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#21335b',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  hintText: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: '#21335b',
    marginLeft: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});