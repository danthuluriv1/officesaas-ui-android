import React, { useRef } from 'react';
import { StyleSheet, ActivityIndicator, View, Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { AppText as Text } from '../AppText';
import * as Haptics from 'expo-haptics';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  disableHaptics?: boolean;
}

export function Button({ 
  children, 
  style, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled,
  disableHaptics = false,
  onPressIn,
  onPressOut,
  onPress,
  ...props 
}: ButtonProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
    if (onPressOut) onPressOut(e);
  };

  const handlePress = (e: any) => {
    if (!disableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) onPress(e);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary': return [styles.bgPrimary, styles.borderPrimary];
      case 'secondary': return [styles.bgSecondary, styles.borderSecondary];
      case 'outline': return [styles.bgTransparent, styles.borderOutline];
      case 'danger': return [styles.bgDanger, styles.borderDanger];
      case 'ghost': return [styles.bgTransparent, styles.borderTransparent];
      default: return [styles.bgPrimary, styles.borderPrimary];
    }
  };

  const getTextColor = () => {
    if (variant === 'outline' || variant === 'ghost') return '#374151';
    return '#fff';
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm': return styles.sizeSm;
      case 'lg': return styles.sizeLg;
      case 'md':
      default: return styles.sizeMd;
    }
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPressIn={isDisabled ? undefined : handlePressIn}
      onPressOut={isDisabled ? undefined : handlePressOut}
      onPress={isDisabled ? undefined : handlePress}
      disabled={isDisabled}
      {...props}
    >
      <Animated.View
        style={[
          styles.base, 
          ...getVariantStyles(), 
          getSizeStyles(), 
          isDisabled && styles.disabled,
          { transform: [{ scale: scaleValue }] },
          style
        ]}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={getTextColor()} size="small" style={{ marginRight: 8 }} />
            <Text style={[styles.text, { color: getTextColor() }]}>{children}</Text>
          </View>
        ) : (
          <Text style={[styles.text, { color: getTextColor() }]}>{children}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sizeSm: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sizeMd: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sizeLg: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  bgPrimary: { backgroundColor: '#2563EB' },
  borderPrimary: { borderColor: '#2563EB' },
  bgSecondary: { backgroundColor: '#4B5563' },
  borderSecondary: { borderColor: '#4B5563' },
  bgDanger: { backgroundColor: '#EF4444' },
  borderDanger: { borderColor: '#EF4444' },
  bgTransparent: { backgroundColor: 'transparent' },
  borderOutline: { borderColor: '#D1D5DB' },
  borderTransparent: { borderColor: 'transparent' },
  disabled: { opacity: 0.6 }
});
