import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { AppText as Text } from '../AppText';

interface BadgeProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({ children, style, variant = 'default', size = 'sm', ...props }: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success': return { bg: styles.bgSuccess, text: styles.textSuccess };
      case 'warning': return { bg: styles.bgWarning, text: styles.textWarning };
      case 'danger': return { bg: styles.bgDanger, text: styles.textDanger };
      case 'info': return { bg: styles.bgInfo, text: styles.textInfo };
      case 'default':
      default: return { bg: styles.bgDefault, text: styles.textDefault };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <View style={[styles.badge, vStyles.bg, size === 'md' && styles.sizeMd, style]} {...props}>
      <Text style={[styles.text, vStyles.text, size === 'md' && styles.textSizeMd]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeMd: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  textSizeMd: {
    fontSize: 12,
  },
  
  // Variants
  bgDefault: { backgroundColor: '#F3F4F6' },
  textDefault: { color: '#4B5563' },
  
  bgSuccess: { backgroundColor: '#ECFDF5' },
  textSuccess: { color: '#059669' },
  
  bgWarning: { backgroundColor: '#FFFBEB' },
  textWarning: { color: '#D97706' },
  
  bgDanger: { backgroundColor: '#FEF2F2' },
  textDanger: { color: '#DC2626' },
  
  bgInfo: { backgroundColor: '#EFF6FF' },
  textInfo: { color: '#2563EB' },
});
