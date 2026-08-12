import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, PanResponder, Linking } from 'react-native';
import { AppText as Text } from '../AppText';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';

interface VendorBasic {
    entityId: string;
    companyName: string;
    email?: string;
    phone?: string;
    contactPerson1?: string;
    gstin?: string;
}

interface VendorCardProps {
    item: VendorBasic;
    onPress: () => void;
    onAction: (item: VendorBasic, action: 'view' | 'call') => void;
    isRefreshing?: boolean;
}

const ACTION_WIDTH = 80;

export function VendorCard({ item, onPress, onAction, isRefreshing }: VendorCardProps) {
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
                } else if (gestureState.dx > 0 && pan.x._value < 0) {
                    pan.setValue({ x: Math.min(0, -ACTION_WIDTH + gestureState.dx), y: 0 });
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dx < -ACTION_WIDTH / 2 || pan.x._value < -ACTION_WIDTH / 1.5) {
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

    const triggerAction = (type: 'view' | 'call') => {
        Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
        }).start();
        onAction(item, type);
    };

    return (
        <View style={styles.container}>
            <Animated.View 
                style={[styles.animatedWrapper, { transform: [{ translateX: pan.x }] }]} 
                {...panResponder.panHandlers}
            >
                <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.companyName}</Text>
                        <Text style={styles.cardSubtitle} numberOfLines={1}>{item.email}</Text>
                    </View>
                    <View style={styles.cardBody}>
                        <Text style={styles.infoText}>📞 {item.phone}</Text>
                        <Text style={styles.infoText}>👤 {item.contactPerson1}</Text>
                        {item.gstin ? <Text style={styles.infoText}>🧾 GSTIN: {item.gstin}</Text> : null}
                    </View>
                </TouchableOpacity>

                <View style={styles.actionsContainer}>
                    <TouchableOpacity style={[styles.actionButton, styles.viewButton]} onPress={() => triggerAction('view')}>
                        <Ionicons name="eye-outline" size={24} color="#FFF" />
                        <Text style={styles.actionText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={() => triggerAction('call')}>
                        <Ionicons name="call-outline" size={24} color="#FFF" />
                        <Text style={styles.actionText}>Call</Text>
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
    viewButton: {
        backgroundColor: Theme.colors.info,
    },
    callButton: {
        backgroundColor: Theme.colors.success,
    },
    actionText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    card: {
        backgroundColor: Theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Theme.colors.borderDark,
    },
    cardHeader: {
        marginBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Theme.colors.textPrimary,
    },
    cardSubtitle: {
        fontSize: 14,
        color: Theme.colors.textTertiary,
    },
    cardBody: {
        gap: 4,
    },
    infoText: {
        fontSize: 14,
        color: '#374151',
    },
});
