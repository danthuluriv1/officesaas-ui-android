import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { useSearchDocuments, useDocumentMetadataEnums } from '../../../api/hooks/useDocuments';
import { AppAlertStatic } from '../../../components/ui/AppAlert';
import { DropdownPicker } from '../../../components/ui/DropdownPicker';
import { getItem } from '../../../utils/storage';
import { Theme } from '../../../theme';

import { DocumentCard } from '../../../components/documents/DocumentCard';
import { UploadDocumentModal } from '../../../components/documents/UploadDocumentModal';

export default function DocumentsScreen() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<number | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
    const [uploadModalVisible, setUploadModalVisible] = useState(false);
    
    // Fetch Enums
    const { data: enumsResponse, isLoading: isLoadingEnums } = useDocumentMetadataEnums();
    const categories = enumsResponse?.categories || [];
    const statuses = enumsResponse?.statuses || [];
    
    // Search Documents
    const { data: searchResponse, isLoading, isFetching, refetch } = useSearchDocuments({
        q: searchTerm,
        category: activeTab,
        status: statusFilter,
        pageSize: 50
    });
    
    const documents = searchResponse?.items || [];
    
    const handleDocumentAction = async (entityId: string, fileName: string, action: 'open' | 'download') => {
        try {
            const token = await getItem('saas_token');
            const url = `https://local.office-saas.com/api/v1/Documents/${entityId}`;
            const fileUri = FileSystem.cacheDirectory + fileName;

            const downloadResult = await FileSystem.downloadAsync(url, fileUri, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (downloadResult.status !== 200) {
                AppAlertStatic.alert('Error', 'Failed to download document.');
                return;
            }

            if (action === 'open') {
                // Convert file:// URI to content:// URI so other apps can access it
                const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);
                const mimeType = downloadResult.headers['content-type'] || 'application/octet-stream';

                await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                    data: contentUri,
                    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
                    type: mimeType,
                });
            } else if (action === 'download') {
                const mimeType = downloadResult.headers['content-type'] || 'application/octet-stream';
                
                // Request permission to access a directory (usually Downloads)
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                    // Create the file in the selected directory
                    const savedUri = await FileSystem.StorageAccessFramework.createFileAsync(
                        permissions.directoryUri, 
                        fileName, 
                        mimeType
                    );
                    
                    // Read the downloaded file as base64 and write it to the new location
                    const base64Data = await FileSystem.readAsStringAsync(downloadResult.uri, { 
                        encoding: FileSystem.EncodingType.Base64 
                    });
                    
                    await FileSystem.writeAsStringAsync(savedUri, base64Data, { 
                        encoding: FileSystem.EncodingType.Base64 
                    });
                    
                    AppAlertStatic.alert('Success', `Downloaded ${fileName}`);
                }
            }
        } catch (error) {
            console.error('Document action error', error);
            AppAlertStatic.alert('Error', `Failed to ${action} document.`);
        }
    };

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput 
                    style={styles.searchInput}
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    onSubmitEditing={() => refetch()}
                />
            </View>
            
            {/* Filters */}
            <View style={styles.filtersWrapper}>
                <View style={{ flex: 1 }}>
                    <DropdownPicker 
                        options={[
                            { label: 'All Categories', value: undefined as any },
                            ...categories.map((c: any) => ({ label: c.name, value: c.id }))
                        ]}
                        selectedValue={activeTab}
                        onSelect={setActiveTab}
                        placeholder="Category"
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <DropdownPicker 
                        options={[
                            { label: 'All Statuses', value: undefined as any },
                            ...statuses.map((s: any) => ({ label: s.name, value: s.id }))
                        ]}
                        selectedValue={statusFilter}
                        onSelect={setStatusFilter}
                        placeholder="Status"
                    />
                </View>
            </View>
            
            {/* Document List */}
            {isLoading || isLoadingEnums ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Theme.colors.primary} />
                </View>
            ) : documents.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>No documents found.</Text>
                </View>
            ) : (
                <FlatList 
                    data={documents}
                    keyExtractor={(item) => item.entityId}
                    renderItem={({ item }) => (
                        <DocumentCard 
                            item={item} 
                            categories={categories} 
                            onAction={handleDocumentAction} 
                            isRefreshing={isFetching}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshing={isFetching}
                    onRefresh={refetch}
                />
            )}
            
            {/* Upload FAB */}
            <TouchableOpacity 
                style={styles.fab}
                onPress={() => setUploadModalVisible(true)}
            >
                <Ionicons name="cloud-upload" size={24} color="#FFF" />
            </TouchableOpacity>
            
            {/* Upload Modal component */}
            {uploadModalVisible && (
                <UploadDocumentModal 
                    visible={uploadModalVisible} 
                    onClose={() => setUploadModalVisible(false)} 
                    categories={categories} 
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.colors.background },
    searchContainer: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6 },
    searchInput: { backgroundColor: Theme.colors.surface, borderWidth: 1, borderColor: Theme.colors.borderDark, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
    filtersWrapper: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 8 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { color: Theme.colors.textSecondary, fontSize: 15 },
    listContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 100, gap: 12 },
    fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: Theme.colors.primary, justifyContent: 'center', alignItems: 'center', shadowColor: Theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
});
