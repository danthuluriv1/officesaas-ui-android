import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Alert, Platform } from 'react-native';
import { AppText as Text } from '../AppText';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

interface FilePickerOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  onFilesSelected: (files: { uri: string; name: string; type: 'document' | 'image', mimeType?: string }[]) => void;
  allowMultiple?: boolean;
}

export function FilePickerOptionsModal({ visible, onClose, onFilesSelected, allowMultiple = true }: FilePickerOptionsModalProps) {
  
  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: allowMultiple,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const files = result.assets.map(asset => ({
          uri: asset.uri,
          name: asset.name,
          type: 'document' as const,
          mimeType: asset.mimeType,
        }));
        onFilesSelected(files);
      }
    } catch (err) {
      console.error("Error picking document:", err);
    } finally {
      onClose();
    }
  };


  const launchCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Required", "Camera permission is required to take photos.");
        onClose();
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const files = result.assets.map(asset => {
          const fileName = asset.fileName || asset.uri.split('/').pop() || 'photo.jpg';
          return {
            uri: asset.uri,
            name: fileName,
            type: 'image' as const,
            mimeType: asset.mimeType || 'image/jpeg',
          };
        });
        onFilesSelected(files);
      }
    } catch (err) {
      console.error("Error launching camera:", err);
    } finally {
      onClose();
    }
  };

  const launchImageLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Required", "Photo library permission is required to select photos.");
        onClose();
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: allowMultiple,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const files = result.assets.map(asset => {
          const fileName = asset.fileName || asset.uri.split('/').pop() || 'photo.jpg';
          return {
            uri: asset.uri,
            name: fileName,
            type: 'image' as const,
            mimeType: asset.mimeType || 'image/jpeg',
          };
        });
        onFilesSelected(files);
      }
    } catch (err) {
      console.error("Error launching image library:", err);
    } finally {
      onClose();
    }
  };


  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.bottomSheet}>
              <View style={styles.handle} />
              <Text style={styles.title}>Attach File</Text>
              
              <TouchableOpacity style={styles.optionButton} onPress={handleDocumentPick}>
                <View style={[styles.iconContainer, { backgroundColor: Theme.colors.info + '15' }]}>
                  <Ionicons name="document-text-outline" size={24} color={Theme.colors.info} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Pick a Document</Text>
                  <Text style={styles.optionSubtitle}>PDFs, Docs, Spreadsheets</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Theme.colors.textTertiary} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.optionButton} onPress={launchCamera}>
                <View style={[styles.iconContainer, { backgroundColor: Theme.colors.success + '15' }]}>
                  <Ionicons name="camera-outline" size={24} color={Theme.colors.success} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Take a Photo</Text>
                  <Text style={styles.optionSubtitle}>Use camera to snap a picture</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Theme.colors.textTertiary} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.optionButton} onPress={launchImageLibrary}>
                <View style={[styles.iconContainer, { backgroundColor: Theme.colors.primary + '15' }]}>
                  <Ionicons name="images-outline" size={24} color={Theme.colors.primary} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionTitle}>Choose from Gallery</Text>
                  <Text style={styles.optionSubtitle}>Select existing photos</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Theme.colors.textTertiary} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Theme.colors.borderDark,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: Theme.colors.textTertiary,
  },
  cancelButton: {
    marginTop: 24,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
});
