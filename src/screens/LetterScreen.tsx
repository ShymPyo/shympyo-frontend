import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/colors';

const letters = [
  {
    id: 1,
    sender: '서울시청',
    title: '폭염 대비 안전수칙 안내',
    preview: '무더운 날씨가 계속되고 있습니다. 건강을 위해 다음 사항을 준수해 주세요...',
    date: '2025-08-17',
    isRead: false,
  },
  {
    id: 2,
    sender: '동작구청',
    title: '신규 쉼터 개방 안내',
    preview: '동작구에 새로운 무더위 쉼터가 개방되었습니다. 많은 이용 부탁드립니다...',
    date: '2025-08-15',
    isRead: true,
  },
  {
    id: 3,
    sender: '쉼표 운영팀',
    title: '이용해 주셔서 감사합니다',
    preview: '지난 주 쉼터 이용에 감사드립니다. 앞으로도 안전하고 시원한...',
    date: '2025-08-10',
    isRead: true,
  },
];

const LetterScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>편지함</Text>
        <Text style={styles.subtitle}>받은 편지를 확인하세요</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {letters.map((letter) => (
          <TouchableOpacity key={letter.id} style={styles.letterCard}>
            <View style={styles.letterHeader}>
              <View style={styles.senderInfo}>
                <Text style={styles.sender}>{letter.sender}</Text>
                <Text style={styles.date}>{letter.date}</Text>
              </View>
              {!letter.isRead && <View style={styles.unreadDot} />}
            </View>
            
            <Text style={[styles.letterTitle, !letter.isRead && styles.unreadTitle]}>
              {letter.title}
            </Text>
            
            <Text style={styles.letterPreview} numberOfLines={2}>
              {letter.preview}
            </Text>
            
            <View style={styles.letterFooter}>
              <Ionicons name="mail-outline" size={16} color={Colors.text.light} />
              <Text style={styles.readMore}>자세히 보기</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.text.light} />
            </View>
          </TouchableOpacity>
        ))}

        {letters.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={64} color={Colors.text.light} />
            <Text style={styles.emptyTitle}>받은 편지가 없습니다</Text>
            <Text style={styles.emptyText}>
              쉼터를 이용하시면 유용한 정보가 담긴 편지를 받으실 수 있습니다.
            </Text>
          </View>
        )}
      </ScrollView>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  letterCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  letterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderInfo: {
    flex: 1,
  },
  sender: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  date: {
    fontSize: 12,
    color: Colors.text.light,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  letterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  letterPreview: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  letterFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  readMore: {
    flex: 1,
    fontSize: 12,
    color: Colors.text.light,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});

export default LetterScreen;