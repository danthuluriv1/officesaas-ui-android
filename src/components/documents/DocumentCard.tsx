import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { AppText as Text } from '../AppText';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';

interface DocumentCardProps {
    item: any;
    categories: any[];
    onAction: (entityId: string, fileName: string, action: 'open' | 'download') => void;
    isRefreshing?: boolean;
}

const ACTION_WIDTH = 80;

export function DocumentCard({ item, categories, onAction, isRefreshing }: DocumentCardProps) {
    const pan = useRef(new Animated.ValueXY()).current;
    
    useEffect(() => {
        if (isRefreshing) {
            Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: true,
            }).start();
        }
    }, [isRefreshing, pan]);
    
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
            },
            onPanResponderMove: (evt, gestureState) => {
                if (gestureState.dx < 0) { 
                    pan.setValue({ x: Math.max(gestureState.dx, -ACTION_WIDTH * 1.5), y: 0 });
                } else if (gestureState.dx > 0 && (pan.x as any)._value < 0) {
                    pan.setValue({ x: Math.min(0, -ACTION_WIDTH + gestureState.dx), y: 0 });
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dx < -ACTION_WIDTH / 2 || (pan.x as any)._value < -ACTION_WIDTH / 1.5) {
                    Animated.spring(pan, {
                        toValue: { x: -ACTION_WIDTH, y: 0 },
                        useNativeDriver: true,
                    }).start();
                } else {
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const triggerAction = (type: 'open' | 'download') => {
        Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
        }).start();
        onAction(item.entityId, item.fileName, type);
    };

    return (
        <View style={styles.container}>
            <Animated.View 
                style={[styles.animatedWrapper, { transform: [{ translateX: pan.x }] }]} 
                {...panResponder.panHandlers}
            >
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.fileName}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {categories.find((c: any) => c.id === item.category || c.name === item.category)?.name || item.category || 'Unknown'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.cardFooter}>
                        <View>
                            <Text style={styles.dateText}>
                                {new Date(item.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                            </Text>
                            <Text style={styles.sizeText}>
                                {item.createdByName || 'System'} • {(item.originalSizeBytes / 1024).toFixed(1)} KB
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={[styles.actionButton, styles.openButton]} onPress={() => triggerAction('open')}>
                        <Ionicons name="share-outline" size={24} color="#FFF" />
                        <Text style={styles.actionText}>Open</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.downloadButton]} onPress={() => triggerAction('download')}>
                        <Ionicons name="cloud-download-outline" size={24} color="#FFF" />
                        <Text style={styles.actionText}>Download</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 12,
        overflow: 'hidden',
        borderRadius: 12,
    },
    animatedWrapper: {
        position: 'relative',
    },
    actionsContainer: {
        position: 'absolute',
        right: -ACTION_WIDTH,
        top: 0,
        bottom: 0,
        width: ACTION_WIDTH,
        flexDirection: 'column',
        paddingLeft: 12,
        gap: 8,
    },
    actionButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    openButton: {
        backgroundColor: Theme.colors.info,
    },
    downloadButton: {
        backgroundColor: Theme.colors.primary,
    },
    actionText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    card: { 
        backgroundColor: Theme.colors.surface, 
        borderRadius: 12, 
        padding: 16, 
        borderWidth: 1, 
        borderColor: Theme.colors.borderDark, 
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 15, fontWeight: '600', color: Theme.colors.textPrimary, flex: 1, marginRight: 12 },
    badge: { backgroundColor: Theme.colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 11, fontWeight: '500', color: Theme.colors.textSecondary },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: 12 },
    dateText: { fontSize: 12, color: Theme.colors.textSecondary },
    sizeText: { fontSize: 12, color: Theme.colors.textSecondary },
});
