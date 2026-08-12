import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Modal, Platform } from 'react-native';
import { AppText as Text } from '../AppText';
import * as DocumentPicker from 'expo-document-picker';
import { AppAlertStatic } from '../ui/AppAlert';
import { DropdownPicker } from '../ui/DropdownPicker';
import { Theme } from '../../theme';
import { useUploadDocument } from '../../api/hooks/useDocuments';

interface UploadDocumentModalProps {
    visible: boolean;
    onClose: () => void;
    categories: any[];
}

export function UploadDocumentModal({ visible, onClose, categories }: UploadDocumentModalProps) {
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [customFileName, setCustomFileName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
    const uploadMutation = useUploadDocument();
    
    const handleSelectFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                copyToCacheDirectory: true
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setSelectedFile(asset);
                setCustomFileName(asset.name); // Default to original name
            }
        } catch (error) {
            console.error("Error picking document", error);
        }
    };

    const handleUpload = () => {
        if (!selectedFile) {
            AppAlertStatic.alert('Error', 'Please select a file to upload.');
            return;
        }
        
        uploadMutation.mutate({
            file: {
                uri: selectedFile.uri,
                type: selectedFile.mimeType || 'application/octet-stream',
                name: selectedFile.name
            },
            category: selectedCategory,
            customFileName: customFileName
        }, {
            onSuccess: () => {
                onClose();
                setSelectedFile(null);
                setCustomFileName('');
                AppAlertStatic.alert('Success', 'Document uploaded successfully.');
            },
            onError: (error: any) => {
                AppAlertStatic.alert('Error', error.response?.data?.message || 'Upload failed.');
            }
        });
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Upload Document</Text>
                    
                    <TouchableOpacity style={styles.selectFileBtn} onPress={handleSelectFile}>
                        <Text style={styles.selectFileBtnText}>
                            {selectedFile ? 'Change File' : 'Select File...'}
                        </Text>
                    </TouchableOpacity>
                    
                    {selectedFile && (
                        <Text style={styles.selectedFileName}>{selectedFile.name}</Text>
                    )}
                    
                    <Text style={styles.label}>File Name (Optional)</Text>
                    <TextInput 
                        style={styles.input}
                        value={customFileName}
                        onChangeText={setCustomFileName}
                        placeholder="Leave blank for original name"
                    />
                    
                    <Text style={styles.label}>Document Type (Optional)</Text>
                    <DropdownPicker 
                        options={categories.map((c: any) => ({ label: c.name, value: c.id }))}
                        selectedValue={selectedCategory}
                        onSelect={setSelectedCategory}
                        placeholder="Select Category"
                        containerStyle={{ marginBottom: 20 }}
                    />
                    
                    <View style={styles.modalActions}>
                        <TouchableOpacity 
                            style={[styles.modalBtn, styles.cancelBtn]} 
                            onPress={onClose}
                        >
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.modalBtn, styles.submitBtn, uploadMutation.isPending && styles.disabledBtn]} 
                            onPress={handleUpload}
                            disabled={uploadMutation.isPending}
                        >
                            {uploadMutation.isPending ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.submitBtnText}>Upload</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Theme.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: Theme.colors.text, marginBottom: 20 },
    selectFileBtn: { backgroundColor: Theme.colors.background, borderWidth: 1, borderColor: Theme.colors.borderDark, borderStyle: 'dashed', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 12 },
    selectFileBtnText: { color: Theme.colors.textSecondary, fontSize: 15, fontWeight: '500' },
    selectedFileName: { fontSize: 13, color: Theme.colors.success, marginBottom: 16, textAlign: 'center', fontWeight: '500' },
    label: { fontSize: 14, fontWeight: '500', color: Theme.colors.textSecondary, marginBottom: 8 },
    input: { backgroundColor: Theme.colors.background, borderWidth: 1, borderColor: Theme.colors.borderDark, borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 20 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    cancelBtn: { backgroundColor: Theme.colors.background },
    cancelBtnText: { color: Theme.colors.textSecondary, fontSize: 16, fontWeight: '600' },
    submitBtn: { backgroundColor: Theme.colors.primary },
    submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    disabledBtn: { opacity: 0.7 }
});
