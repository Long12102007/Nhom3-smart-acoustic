import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { signOut, updatePassword, updateProfile } from 'firebase/auth';
import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../../firebaseConfig';

export default function SettingsScreen() {
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [passModalVisible, setPassModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/' as any);
    } catch (error: any) {
      Alert.alert("Lỗi", error.message);
    }
  };

  const handleUpdateName = async () => {
    if (!newName) {
      Alert.alert("Lỗi", "Vui lòng nhập tên mới!");
      return;
    }
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: newName });
        Alert.alert("Thành công", "Đã cập nhật tên hiển thị!");
        setNewName('');
        setNameModalVisible(false);
      }
    } catch (error: any) {
      Alert.alert("Lỗi", error.message);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        Alert.alert("Thành công", "Đổi mật khẩu thành công!");
        setNewPassword('');
        setPassModalVisible(false);
      }
    } catch (error: any) {
      Alert.alert("Lỗi", "Vui lòng đăng nhập lại trước khi đổi mật khẩu.");
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* 1. Tắt header mặc định */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* 2. Thanh Header đồng bộ chuẩn với các trang khác */}
      <View style={styles.customHeader}>
        <Text style={styles.headerTitle}>Cài đặt thiết bị</Text>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>TÀI KHOẢN</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.item} onPress={() => setNameModalVisible(true)} activeOpacity={0.7}>
            <View style={styles.iconBox}>
              <Ionicons name="person-outline" size={20} color="#21335b" />
            </View>
            <Text style={styles.itemText}>Đổi tên đăng nhập</Text>
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={() => setPassModalVisible(true)} activeOpacity={0.7}>
            <View style={styles.iconBox}>
              <Ionicons name="lock-closed-outline" size={20} color="#21335b" />
            </View>
            <Text style={styles.itemText}>Đổi mật khẩu</Text>
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>THÔNG BÁO CHUNG</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.item} onPress={() => router.push('/settings-notification' as any)} activeOpacity={0.7}>
            <View style={styles.iconBox}>
              <Ionicons name="notifications-outline" size={20} color="#21335b" />
            </View>
            <Text style={styles.itemText}>Điều chỉnh thông báo tổng quát</Text>
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={() => router.push('/settings-ringtone' as any)} activeOpacity={0.7}>
            <View style={styles.iconBox}>
              <Ionicons name="musical-notes-outline" size={20} color="#21335b" />
            </View>
            <Text style={styles.itemText}>Nhạc chuông báo động</Text>
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>TRỢ GIÚP</Text>
        <View style={styles.group}>
          <TouchableOpacity style={styles.item} onPress={() => router.push('/settings-guide' as any)} activeOpacity={0.7}>
            <View style={styles.iconBox}>
              <Ionicons name="book-outline" size={20} color="#21335b" />
            </View>
            <Text style={styles.itemText}>Tài liệu hướng dẫn</Text>
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={() => router.push('/settings-feedback' as any)} activeOpacity={0.7}>
            <View style={styles.iconBox}>
              <Ionicons name="headset-outline" size={20} color="#21335b" />
            </View>
            <Text style={styles.itemText}>Liên hệ hỗ trợ & Feedback</Text>
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>ĐĂNG XUẤT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- MODAL ĐỔI TÊN --- */}
      <Modal visible={nameModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi tên hiển thị</Text>
            <TextInput 
              placeholder="Nhập tên mới của bạn" 
              placeholderTextColor="#888" 
              style={styles.modalInput} 
              value={newName} 
              onChangeText={setNewName} 
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity onPress={() => setNameModalVisible(false)}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateName}>
                <Text style={styles.saveText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL ĐỔI MẬT KHẨU --- */}
      <Modal visible={passModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Đổi mật khẩu mới</Text>
            <TextInput 
              placeholder="Nhập mật khẩu mới (ít nhất 6...)" 
              placeholderTextColor="#888" 
              secureTextEntry 
              style={styles.modalInput} 
              value={newPassword} 
              onChangeText={setNewPassword} 
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity onPress={() => setPassModalVisible(false)}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdatePassword}>
                <Text style={styles.saveText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f4f5f7' },
  // Thanh header đồng bộ chuẩn khoảng cách vùng trắng phía trên
  customHeader: { 
    backgroundColor: '#21335b', 
    paddingTop: 55, 
    paddingBottom: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    width: '100%'
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold',
    textAlign: 'center'
  },
  container: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#888', marginBottom: 8, marginTop: 12, marginLeft: 4 },
  group: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    marginBottom: 10, 
    overflow: 'hidden', 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f4f5f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: { flex: 1, fontSize: 15, color: '#333', marginLeft: 14, fontWeight: '500' },
  logoutBtn: { backgroundColor: '#e53935', borderRadius: 16, height: 50, justifyContent: 'center', alignItems: 'center', marginVertical: 24, elevation: 2 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 24, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#21335b', marginBottom: 20, textAlign: 'center' },
  modalInput: { borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 10, fontSize: 16, color: '#333', marginBottom: 24 },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  cancelText: { color: '#666', fontSize: 16, marginRight: 24, fontWeight: '500' },
  saveBtn: { backgroundColor: '#21335b', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});