import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Platform, ActivityIndicator, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText as Text } from '../AppText';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';
import type { LedgerEntry } from '../../types';
import { useSearchDocuments } from '../../api/hooks/useDocuments';
import { AppAlertStatic } from '../ui/AppAlert';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { getItem } from '../../utils/storage';
import axiosClient from '../../api/axiosClient';

interface TransactionDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    transaction: LedgerEntry | null;
}

export function TransactionDetailsModal({ visible, onClose, transaction }: TransactionDetailsModalProps) {
    if (!transaction) return null;

    // Fetch documents linked to this transaction
    // EntityType 5 = Payment, 6 = JournalEntry
    const relatedEntityType = transaction.sourceModule === 'Payment' ? 5 : transaction.sourceModule === 'JournalEntry' ? 6 : undefined;
    
    const { data: documentsData, isLoading: isLoadingDocs } = useSearchDocuments({
        relatedEntityId: transaction.sourceEntityId,
        relatedEntityType: relatedEntityType,
        pageSize: 50
    });

    const documents = documentsData?.items || [];

    const handleOpenDocument = async (entityId: string, fileName: string) => {
        try {
            const token = await getItem('saas_token');
            const url = `${axiosClient.defaults.baseURL}/Documents/${entityId}`;
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

            const contentUri = await FileSystem.getContentUriAsync(downloadResult.uri);
            const mimeType = downloadResult.headers['content-type'] || 'application/octet-stream';

            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                data: contentUri,
                flags: 1,
                type: mimeType,
            });
        } catch (error) {
            console.error('Document action error', error);
            AppAlertStatic.alert('Error', `Failed to open document.`);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                    <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
                        <View style={styles.header}>
                            <Text style={styles.modalTitle}>Transaction Details</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={Theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                            <View style={styles.amountContainer}>
                                <Text style={[styles.amount, transaction.type === 'Credit' ? styles.credit : styles.debit]}>
                                    {transaction.type === 'Credit' ? '+' : '-'}₹{(transaction.amount || 0).toLocaleString()}
                                </Text>
                                <Text style={styles.typeLabel}>{transaction.type}</Text>
                            </View>

                            <View style={styles.infoBox}>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Description</Text>
                                    <Text style={styles.infoValue}>{transaction.description || 'N/A'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Category</Text>
                                    <Text style={styles.infoValue}>{transaction.accountCategory || 'General'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Date</Text>
                                    <Text style={styles.infoValue}>
                                        {transaction.postingDate ? new Date(transaction.postingDate).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A'}
                                    </Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Transaction #</Text>
                                    <Text style={styles.infoValue}>{transaction.transactionNumber || 'N/A'}</Text>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Source</Text>
                                    <Text style={styles.infoValue}>{transaction.sourceModule || 'N/A'}</Text>
                                </View>
                            </View>

                            <Text style={styles.sectionTitle}>Attachments</Text>
                            
                            {isLoadingDocs ? (
                                <ActivityIndicator size="small" color={Theme.colors.primary} style={styles.loader} />
                            ) : documents.length === 0 ? (
                                <View style={styles.emptyBox}>
                                    <Ionicons name="document-outline" size={32} color={Theme.colors.textSecondary} style={{ opacity: 0.5 }} />
                                    <Text style={styles.emptyText}>No attachments found</Text>
                                </View>
                            ) : (
                                documents.map((doc, idx) => (
                                    <TouchableOpacity 
                                        key={doc.entityId || idx.toString()} 
                                        style={styles.documentItem}
                                        onPress={() => handleOpenDocument(doc.entityId, doc.fileName || 'document.file')}
                                    >
                                        <View style={styles.docIcon}>
                                            <Ionicons name="document-text" size={20} color={Theme.colors.primary} />
                                        </View>
                                        <View style={styles.docInfo}>
                                            <Text style={styles.docName} numberOfLines={1}>{doc.fileName || 'Document'}</Text>
                                        </View>
                                        <Ionicons name="download-outline" size={20} color={Theme.colors.textSecondary} />
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Theme.colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: Theme.colors.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.textPrimary },
    closeBtn: { padding: 4 },
    scrollContent: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
    amountContainer: { alignItems: 'center', marginBottom: 24, paddingVertical: 12 },
    amount: { fontSize: 36, fontWeight: '800' },
    typeLabel: { fontSize: 14, color: Theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4, fontWeight: '600' },
    debit: { color: Theme.colors.error },
    credit: { color: Theme.colors.success },
    infoBox: { backgroundColor: Theme.colors.surface, borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
    infoLabel: { fontSize: 14, color: Theme.colors.textSecondary, flex: 1 },
    infoValue: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, flex: 2, textAlign: 'right' },
    divider: { height: 1, backgroundColor: Theme.colors.border },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: Theme.colors.textPrimary, marginBottom: 12 },
    loader: { marginVertical: 20 },
    emptyBox: { alignItems: 'center', padding: 24, backgroundColor: Theme.colors.surface, borderRadius: 12, borderStyle: 'dashed', borderWidth: 1, borderColor: Theme.colors.borderDark },
    emptyText: { color: Theme.colors.textSecondary, marginTop: 8, fontSize: 14 },
    documentItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.colors.surface, padding: 16, borderRadius: 12, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
    docIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: Theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    docInfo: { flex: 1 },
    docName: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary, marginBottom: 4 },
    docSize: { fontSize: 12, color: Theme.colors.textSecondary },
});
