import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AppText as Text } from '../AppText';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';

export interface FileAttachment {
  uri: string;
  name: string;
  type: 'document' | 'image';
  mimeType?: string;
}

interface SelectedFilesListProps {
  files: FileAttachment[];
  onRemove: (index: number) => void;
}

export function SelectedFilesList({ files, onRemove }: SelectedFilesListProps) {
  if (!files || files.length === 0) return null;

  return (
    <View style={styles.container}>
      {files.map((file, index) => (
        <View key={`${file.uri}-${index}`} style={styles.fileCard}>
          <View style={styles.fileIconContainer}>
            {file.type === 'image' ? (
              <Image source={{ uri: file.uri }} style={styles.thumbnail} />
            ) : (
              <Ionicons name="document-text" size={24} color={Theme.colors.primary} />
            )}
          </View>
          
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
            <Text style={styles.fileType}>{file.type === 'image' ? 'Image' : 'Document'}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.removeButton} 
            onPress={() => onRemove(index)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="close-circle" size={22} color={Theme.colors.error} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginTop: 8,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: Theme.colors.textPrimary,
    marginBottom: 2,
  },
  fileType: {
    fontSize: 12,
    color: Theme.colors.textTertiary,
  },
  removeButton: {
    padding: 4,
  },
});
