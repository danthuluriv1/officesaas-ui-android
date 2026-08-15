import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../AppText';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import { FilePickerOptionsModal } from './FilePickerOptionsModal';
import { SelectedFilesList, FileAttachment } from './SelectedFilesList';

interface AttachmentFieldProps {
  label?: string;
  files: FileAttachment[];
  onChange: (files: FileAttachment[]) => void;
  allowMultiple?: boolean;
}

export function AttachmentField({ label = "Attachments", files, onChange, allowMultiple = true }: AttachmentFieldProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleFilesSelected = (newFiles: FileAttachment[]) => {
    if (allowMultiple) {
      // Append new files
      onChange([...files, ...newFiles]);
    } else {
      // Replace with first selected
      onChange([newFiles[0]]);
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(files.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <TouchableOpacity 
        style={styles.attachButton} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="cloud-upload-outline" size={24} color={Theme.colors.primary} />
        <View style={styles.btnTextContainer}>
          <Text style={styles.btnTitle}>Attach Files or Photos</Text>
          <Text style={styles.btnSubtitle}>Tap to select from device</Text>
        </View>
      </TouchableOpacity>

      <SelectedFilesList files={files} onRemove={handleRemove} />

      <FilePickerOptionsModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        onFilesSelected={handleFilesSelected}
        allowMultiple={allowMultiple}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
    marginBottom: 8,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Theme.colors.primary + '50',
    backgroundColor: Theme.colors.primary + '0A',
    borderRadius: 12,
    padding: 16,
  },
  btnTextContainer: {
    marginLeft: 12,
  },
  btnTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.primary,
    marginBottom: 2,
  },
  btnSubtitle: {
    fontSize: 13,
    color: Theme.colors.textTertiary,
  },
});
