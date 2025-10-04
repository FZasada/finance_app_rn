import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HouseholdScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { 
    household, 
    members, 
    loading, 
    createHousehold, 
    joinHousehold, 
    leaveHousehold,
    deleteHousehold 
  } = useHousehold();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      Alert.alert(t('common.error'), 'Please enter a household name');
      return;
    }

    setActionLoading(true);
    try {
      await createHousehold(householdName);
      setShowCreateModal(false);
      setHouseholdName('');
      Alert.alert(t('common.success'), t('household.householdCreated'));
    } catch (_error) {
      Alert.alert(t('common.error'), 'Failed to create household');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      Alert.alert(t('common.error'), 'Please enter an invite code');
      return;
    }

    setActionLoading(true);
    try {
      await joinHousehold(inviteCode);
      setShowJoinModal(false);
      setInviteCode('');
      Alert.alert(t('common.success'), t('household.joinedHousehold'));
    } catch (_error) {
      Alert.alert(t('common.error'), 'Failed to join household. Please check the invite code.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveHousehold = () => {
    Alert.alert(
      'Leave Household',
      'Are you sure you want to leave this household?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveHousehold();
              Alert.alert(t('common.success'), t('household.leftHousehold'));
            } catch (_error) {
              Alert.alert(t('common.error'), 'Failed to leave household');
            }
          },
        },
      ]
    );
  };

  const handleDeleteHousehold = () => {
    Alert.alert(
      'Delete Household',
      'Are you sure you want to delete this household? This action cannot be undone.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHousehold();
              Alert.alert(t('common.success'), 'Household deleted successfully');
            } catch (_error) {
              Alert.alert(t('common.error'), 'Failed to delete household');
            }
          },
        },
      ]
    );
  };

  const isUserAdmin = () => {
    return members.find(m => m.user_id === user?.id)?.role === 'admin';
  };

  const CreateHouseholdModal = () => (
    <Modal
      visible={showCreateModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('household.createHousehold')}</Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder={t('household.householdName')}
            value={householdName}
            onChangeText={setHouseholdName}
            autoFocus
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => {
                setShowCreateModal(false);
                setHouseholdName('');
              }}
            >
              <Text style={styles.modalButtonTextSecondary}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleCreateHousehold}
              disabled={actionLoading}
            >
              <Text style={styles.modalButtonTextPrimary}>
                {actionLoading ? t('common.loading') : t('common.save')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const JoinHouseholdModal = () => (
    <Modal
      visible={showJoinModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowJoinModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('household.joinHousehold')}</Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder={t('household.inviteCode')}
            value={inviteCode}
            onChangeText={setInviteCode}
            autoFocus
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => {
                setShowJoinModal(false);
                setInviteCode('');
              }}
            >
              <Text style={styles.modalButtonTextSecondary}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={handleJoinHousehold}
              disabled={actionLoading}
            >
              <Text style={styles.modalButtonTextPrimary}>
                {actionLoading ? t('common.loading') : 'Join'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const NoHouseholdView = () => (
    <View style={styles.emptyState}>
      <Ionicons name="home-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>{t('household.noHousehold')}</Text>
      <Text style={styles.emptyText}>
        Create a new household or join an existing one to start managing your finances together.
      </Text>
      
      <View style={styles.emptyActions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.primaryButtonText}>{t('household.createHousehold')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setShowJoinModal(true)}
        >
          <Ionicons name="enter" size={20} color="#007AFF" />
          <Text style={styles.secondaryButtonText}>{t('household.joinHousehold')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!household) {
    return (
      <SafeAreaView style={styles.container}>
        <NoHouseholdView />
        <CreateHouseholdModal />
        <JoinHouseholdModal />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('household.title')}</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {/* Household Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="home" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>{household.name}</Text>
          </View>
          
          <View style={styles.inviteSection}>
            <Text style={styles.sectionLabel}>Invite Code</Text>
            <View style={styles.inviteCodeContainer}>
              <Text style={styles.inviteCode}>{household.id}</Text>
              <TouchableOpacity style={styles.copyButton}>
                <Ionicons name="copy" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.inviteHint}>
              {t('household.codeShareText')}
            </Text>
          </View>
        </View>

        {/* Members */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('household.members')} ({members.length})</Text>
          
          {members.map((member) => (
            <View key={member.id} style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <Ionicons name="person-circle" size={32} color="#007AFF" />
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>
                    {member.user_id === user?.id ? 'You' : 'Member'}
                  </Text>
                  <Text style={styles.memberRole}>
                    {t(`household.${member.role}`)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleLeaveHousehold}
          >
            <Ionicons name="exit" size={20} color="white" />
            <Text style={styles.dangerButtonText}>{t('household.leaveHousehold')}</Text>
          </TouchableOpacity>
          
          {isUserAdmin() && (
            <TouchableOpacity
              style={[styles.dangerButton, { backgroundColor: '#DC3545' }]}
              onPress={handleDeleteHousehold}
            >
              <Ionicons name="trash" size={20} color="white" />
              <Text style={styles.dangerButtonText}>{t('household.deleteHousehold')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      
      <CreateHouseholdModal />
      <JoinHouseholdModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  emptyActions: {
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  inviteSection: {
    marginTop: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  inviteCode: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#333',
  },
  copyButton: {
    padding: 4,
  },
  inviteHint: {
    fontSize: 12,
    color: '#666',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberDetails: {
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actions: {
    marginTop: 20,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  modalButtonSecondary: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modalButtonTextPrimary: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonTextSecondary: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});