import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReportReason } from '../services/api';
import { useThemedStyles } from '../hooks/useThemedStyles';

interface ReportReasonModalProps {
  visible: boolean;
  userNickname: string;
  onClose: () => void;
  onConfirm: (reason: ReportReason, content: string) => void;
}

interface ReasonOption {
  value: ReportReason;
  label: string;
  description: string;
  icon: string;
}

const reasonOptions: ReasonOption[] = [
  {
    value: 'ABUSE',
    label: '욕설/괴롭힘',
    description: '폭언 또는 괴롭힘 행위',
    icon: 'warning',
  },
  {
    value: 'INAPPROPRIATE',
    label: '부적절한 행동',
    description: '불쾌감을 주는 언행/콘텐츠',
    icon: 'hand-left',
  },
  {
    value: 'SCAM',
    label: '사기/거짓정보',
    description: '사기 또는 거짓 정보 제공',
    icon: 'alert-circle',
  },
  {
    value: 'POLICY_VIOLATION',
    label: '정책 위반',
    description: '이용 정책 위반',
    icon: 'document-text',
  },
  {
    value: 'OTHER',
    label: '기타',
    description: '기타 사유',
    icon: 'ellipsis-horizontal',
  },
];

const ReportReasonModal: React.FC<ReportReasonModalProps> = ({
  visible,
  userNickname,
  onClose,
  onConfirm,
}) => {
  const { colors, getFontSize } = useThemedStyles();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [content, setContent] = useState('');

  const handleConfirm = () => {
    if (!selectedReason) {
      Alert.alert('알림', '신고 사유를 선택해주세요.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('알림', '신고 내용을 입력해주세요.');
      return;
    }

    onConfirm(selectedReason, content);
    // 초기화
    setSelectedReason(null);
    setContent('');
  };

  const handleClose = () => {
    setSelectedReason(null);
    setContent('');
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.text.light + '20' }]}>
            <View>
              <Text style={[styles.modalTitle, { fontSize: getFontSize(20), color: colors.text.primary }]}>
                사용자 신고
              </Text>
              <Text style={[styles.modalSubtitle, { fontSize: getFontSize(14), color: colors.text.secondary }]}>
                {userNickname}님을 신고하시겠습니까?
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* 신고 사유 선택 */}
            <Text style={[styles.sectionTitle, { fontSize: getFontSize(16), color: colors.text.primary }]}>
              신고 사유
            </Text>
            {reasonOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.reasonOption,
                  { backgroundColor: colors.background },
                  selectedReason === option.value && [
                    styles.reasonOptionSelected,
                    { borderColor: colors.primary },
                  ],
                ]}
                onPress={() => setSelectedReason(option.value)}
              >
                <View style={styles.reasonIconContainer}>
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={selectedReason === option.value ? colors.primary : colors.text.secondary}
                  />
                </View>
                <View style={styles.reasonTextContainer}>
                  <Text
                    style={[
                      styles.reasonLabel,
                      { fontSize: getFontSize(15), color: colors.text.primary },
                      selectedReason === option.value && { color: colors.primary, fontWeight: '600' },
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text style={[styles.reasonDescription, { fontSize: getFontSize(12), color: colors.text.light }]}>
                    {option.description}
                  </Text>
                </View>
                {selectedReason === option.value && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            {/* 상세 내용 입력 */}
            <Text style={[styles.sectionTitle, { fontSize: getFontSize(16), color: colors.text.primary }]}>
              신고 내용 <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.contentInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text.primary,
                  borderColor: colors.text.light + '30',
                  fontSize: getFontSize(14),
                },
              ]}
              placeholder="신고 내용을 자세히 입력해주세요. (최소 10자)"
              placeholderTextColor={colors.text.light}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
            />
            <Text style={[styles.charCount, { fontSize: getFontSize(12), color: colors.text.light }]}>
              {content.length}/200자
            </Text>

            {/* 경고 메시지 */}
            <View style={[styles.warningBox, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="information-circle" size={20} color="#F57C00" />
              <Text style={[styles.warningText, { fontSize: getFontSize(13), color: '#F57C00' }]}>
                허위 신고 시 서비스 이용이 제한될 수 있습니다.
              </Text>
            </View>
          </ScrollView>

          {/* 버튼 영역 */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.background }]}
              onPress={handleClose}
            >
              <Text style={[styles.cancelButtonText, { fontSize: getFontSize(16), color: colors.text.primary }]}>
                취소
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: '#9C27B0' }]}
              onPress={handleConfirm}
            >
              <Text style={[styles.confirmButtonText, { fontSize: getFontSize(16) }]}>신고하기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  modalBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonOptionSelected: {
    backgroundColor: '#F0F8FF',
  },
  reasonIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reasonTextContainer: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  reasonDescription: {
    fontSize: 12,
  },
  contentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    marginBottom: 8,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    marginBottom: 16,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 15,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReportReasonModal;
