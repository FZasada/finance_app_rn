import { useAuth } from '@/contexts/AuthContext';
import { useHousehold } from '@/contexts/HouseholdContext';
import { supabase } from '@/lib/supabase';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DeleteDataModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function DeleteDataModal({ visible, onClose }: DeleteDataModalProps) {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { household } = useHousehold();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteData = async () => {
    if (!user || !household) return;

    Alert.alert(
      t('settings.deleteData'),
      t('settings.deleteDataConfirmation'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.deleteData'),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              // Delete transactions
              await supabase
                .from('transactions')
                .delete()
                .eq('household_id', household.id);

              // Delete budgets
              await supabase
                .from('budgets')
                .delete()
                .eq('household_id', household.id);

              // Delete categories (if any custom ones)
              await supabase
                .from('categories')
                .delete()
                .eq('household_id', household.id);

              Alert.alert(
                t('common.success'),
                t('settings.dataDeletedSuccess'),
                [{ text: t('common.ok'), onPress: onClose }]
              );
            } catch (error) {
              console.error('Error deleting data:', error);
              Alert.alert(
                t('common.error'),
                t('settings.deleteDataError')
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (!user || !household) return;

    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.deleteAccountConfirmation'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.deleteAccount'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('settings.finalWarning'),
              t('settings.deleteAccountFinalWarning'),
              [
                {
                  text: t('common.cancel'),
                  style: 'cancel',
                },
                {
                  text: t('settings.deleteAccountFinal'),
                  style: 'destructive',
                  onPress: async () => {
                    setIsDeleting(true);
                    try {
                      // Delete all data first
                      await supabase
                        .from('transactions')
                        .delete()
                        .eq('household_id', household.id);

                      await supabase
                        .from('budgets')
                        .delete()
                        .eq('household_id', household.id);

                      await supabase
                        .from('categories')
                        .delete()
                        .eq('household_id', household.id);

                      // Delete push tokens
                      await supabase
                        .from('user_push_tokens')
                        .delete()
                        .eq('user_id', user.id);

                      // Delete household membership
                      await supabase
                        .from('household_members')
                        .delete()
                        .eq('user_id', user.id);

                      // If user is household owner, delete household
                      if (household.owner_id === user.id) {
                        await supabase
                          .from('households')
                          .delete()
                          .eq('id', household.id);
                      }

                      // Delete user profile
                      await supabase
                        .from('users')
                        .delete()
                        .eq('id', user.id);

                      // Sign out (this will also delete the auth user session)
                      await signOut();

                      Alert.alert(
                        t('common.success'),
                        t('settings.accountDeletedSuccess')
                      );
                    } catch (error) {
                      console.error('Error deleting account:', error);
                      Alert.alert(
                        t('common.error'),
                        t('settings.deleteAccountError')
                      );
                      setIsDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{t('settings.dataManagement')}</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.deleteData')}</Text>
            <Text style={styles.description}>
              {t('settings.deleteDataDescription')}
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.deleteDataButton]}
              onPress={handleDeleteData}
              disabled={isDeleting}
            >
              <Text style={styles.buttonText}>
                {isDeleting ? t('common.loading') : t('settings.deleteData')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settings.deleteAccount')}</Text>
            <Text style={styles.description}>
              {t('settings.deleteAccountDescription')}
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.deleteAccountButton]}
              onPress={handleDeleteAccount}
              disabled={isDeleting}
            >
              <Text style={styles.buttonText}>
                {isDeleting ? t('common.loading') : t('settings.deleteAccount')}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={isDeleting}
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteDataButton: {
    backgroundColor: '#FF9500',
  },
  deleteAccountButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});