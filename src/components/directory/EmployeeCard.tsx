import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { AppText as Text } from '../AppText';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../theme';

interface Employee {
  entityId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  department: string;
  isActive: boolean;
  phone?: string;
}

interface EmployeeCardProps {
    item: Employee;
    onPress: () => void;
    onAction: (item: Employee, action: 'view' | 'call') => void;
    isRefreshing?: boolean;
}

const ACTION_WIDTH = 80;

export function EmployeeCard({ item, onPress, onAction, isRefreshing }: EmployeeCardProps) {
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
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{item.firstName.charAt(0)}{item.lastName?.charAt(0) || ''}</Text>
                            </View>
                            {item.isActive !== false && (
                                <View style={[styles.statusDot, { backgroundColor: Theme.colors.success }]} />
                            )}
                        </View>
                        <View style={styles.info}>
                            <View style={styles.nameRow}>
                                <Text style={styles.name} numberOfLines={1}>{item.firstName} {item.lastName}</Text>
                                <View style={styles.empCodeBadge}>
                                    <Text style={styles.empCodeText}>{item.employeeCode}</Text>
                                </View>
                            </View>
                            <Text style={styles.designation} numberOfLines={1}>{item.designation} • {item.department}</Text>
                            <View style={styles.emailRow}>
                                <Ionicons name="mail-outline" size={14} color={Theme.colors.textSecondary} />
                                <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
                            </View>
                        </View>
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
        borderRadius: 16,
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
        borderRadius: 16,
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
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Theme.colors.borderLight || '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Theme.colors.primary + '15', // 15% opacity primary color
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.colors.primary + '30',
    },
    avatarText: {
        color: Theme.colors.primary,
        fontSize: 20,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    statusDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: Theme.colors.surface,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        flex: 1,
        fontSize: 17,
        fontWeight: '700',
        color: Theme.colors.textPrimary,
        marginRight: 8,
    },
    empCodeBadge: {
        backgroundColor: Theme.colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Theme.colors.borderDark,
    },
    empCodeText: {
        fontSize: 11,
        fontWeight: '700',
        color: Theme.colors.textSecondary,
    },
    designation: {
        fontSize: 14,
        color: Theme.colors.textSecondary,
        fontWeight: '500',
        marginBottom: 6,
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    email: {
        fontSize: 13,
        color: Theme.colors.textTertiary,
    },
});
