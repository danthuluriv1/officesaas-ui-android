import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { useSettings } from '../context/SettingsContext';

export function AppText(props: TextProps) {
  const { fontScale } = useSettings();
  
  // Flatten styles safely to extract font sizing constraints
  const flatStyle = StyleSheet.flatten(props.style || {}) as TextStyle;
  const customStyle: TextStyle = {};
  
  if (flatStyle.fontSize) {
    customStyle.fontSize = flatStyle.fontSize * fontScale;
  }
  if (flatStyle.lineHeight) {
    customStyle.lineHeight = flatStyle.lineHeight * fontScale;
  }

  return (
    <Text {...props} style={[props.style, customStyle]}>
      {props.children}
    </Text>
  );
}
