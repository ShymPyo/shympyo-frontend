import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';

const visitedPlaces = [
  { id: '1', name: '카페 빈스', date: '2025-07-15 10:30', sent: false },
  { id: '2', name: '관동 카페', date: '2025-07-14 10:30', sent: false },
  { id: '3', name: 'CU 인하대점', date: '2025-07-13 10:30', sent: false },
  { id: '4', name: '탄포포', date: '2025-07-12 10:30', sent: true },
  { id: '5', name: '알케미스타', date: '2025-07-11 10:30', sent: true },
];

const LetterScreen: React.FC = () => {
  const [places, setPlaces] = useState(visitedPlaces);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{ id: string; name: string } | null>(null);
  const [letterText, setLetterText] = useState('');

  const handleWriteLetter = (place: { id: string; name: string }) => {
    setSelectedPlace(place);
    setModalVisible(true);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleSendLetter = () => {
    if (!selectedPlace) return;

    const updatedPlaces = places.map((p) =>
      p.id === selectedPlace.id ? { ...p, sent: true } : p
    );
    setPlaces(updatedPlaces);

    setLetterText('');
    setModalVisible(false);
    setSelectedPlace(null);
  };

  const renderItem = ({ item }: { item: typeof visitedPlaces[0] }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.date}>{item.date}</Text>
        <Text style={styles.placeName}>{item.name}</Text>
      </View>
      <TouchableOpacity
        style={[styles.button, item.sent && styles.sentButton]}
        onPress={() => !item.sent && handleWriteLetter(item)}
        disabled={item.sent}
      >
        <Ionicons 
          name={item.sent ? 'checkmark-done' : 'pencil'} 
          size={20} 
          color={item.sent ? Colors.text.secondary : Colors.text.white} 
        />
        <Text style={[styles.buttonText, item.sent && styles.sentButtonText]}>
          {item.sent ? '전송 완료' : '감사 편지 작성'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>방문한 민간 개방 시설 목록</Text>
        <Text style={styles.subtitle}>감사 편지를 보내 마음을 전하세요.</Text>
      </View>

      <FlatList
        data={places}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
            keyboardVerticalOffset={-50}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>감사 편지 작성</Text>
              <Text style={styles.modalRecipient}>To. {selectedPlace?.name} 사장님</Text>
              <TextInput
                style={styles.textInput}
                value={letterText}
                onChangeText={setLetterText}
                placeholder="감사한 마음을 담아 편지를 작성해보세요..."
                multiline
              />
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>취소</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.sendButton]} 
                  onPress={handleSendLetter}
                >
                  <Text style={styles.sendButtonText}>전송</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    marginBottom: 15,
  },
  date: {
    fontSize: 12,
    color: Colors.text.light,
    marginBottom: 5,
  },
  placeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonText: {
    color: Colors.text.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  sentButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  sentButtonText: {
    color: Colors.text.secondary,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalRecipient: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 15,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    height: 150,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    borderRadius: 8,
    padding: 15,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  sendButton: {
    backgroundColor: Colors.primary,
  },
  sendButtonText: {
    color: Colors.text.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LetterScreen;
