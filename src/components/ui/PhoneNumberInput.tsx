import React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native';

interface PhoneNumberInputProps extends Omit<TextInputProps, 'onChangeText'> {
  value: string;
  onChangeText: (text: string) => void;
}

export function PhoneNumberInput({ value, onChangeText, style, ...props }: PhoneNumberInputProps) {
  // Strip '+91 ' for display in the actual input box so user only sees the 10 digits
  const displayValue = value ? value.replace('+91 ', '').replace('+91', '') : '';

  React.useEffect(() => {
    // If the component mounts with a value that doesn't have the prefix, auto-format it
    if (value && !value.startsWith('+91')) {
      const cleaned = value.replace(/[^0-9]/g, '');
      if (cleaned.length > 0) {
        onChangeText(`+91 ${cleaned}`);
      }
    }
  }, []);

  const handleTextChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 10) {
      if (cleaned.length === 0) {
        onChangeText('');
      } else {
        onChangeText(`+91 ${cleaned}`);
      }
    }
  };

  const isEditable = props.editable !== false && !(props as any).disabled;

  return (
    <View style={[styles.container, !isEditable && styles.containerDisabled, style]}>
      <View style={[styles.prefixContainer, !isEditable && styles.prefixContainerDisabled]}>
        <Text style={[styles.prefixText, !isEditable && styles.textDisabled]}>+91</Text>
      </View>
      <TextInput
        style={[styles.input, !isEditable && styles.inputDisabled]}
        value={displayValue}
        onChangeText={handleTextChange}
        keyboardType="phone-pad"
        maxLength={10}
        editable={isEditable}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB', // Standard border color from forms
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  prefixContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefixText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  containerDisabled: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  prefixContainerDisabled: {
    borderRightWidth: 0,
    backgroundColor: 'transparent',
    paddingLeft: 0,
    paddingRight: 4,
    paddingVertical: 4,
  },
  textDisabled: {
    color: '#4B5563',
  },
  inputDisabled: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 4,
    color: '#4B5563',
  },
});
