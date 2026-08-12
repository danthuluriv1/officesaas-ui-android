import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet, Dimensions, Platform, ScrollView } from 'react-native';
import { AppText as Text } from '../AppText';
import * as Haptics from 'expo-haptics';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AppAlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

export interface AppAlertRef {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => void;
  close: () => void;
}

export const appAlertRef = React.createRef<AppAlertRef>();

export const AppAlertStatic = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    appAlertRef.current?.alert(title, message, buttons);
  },
  close: () => {
    appAlertRef.current?.close();
  }
};

export const AppAlert = forwardRef<AppAlertRef>((props, ref) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AppAlertConfig>({ title: '' });

  useImperativeHandle(ref, () => ({
    alert: (title, message, buttons) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setConfig({
        title,
        message,
        buttons: buttons || [{ text: 'OK', onPress: () => setVisible(false) }],
      });
      setVisible(true);
    },
    close: () => setVisible(false)
  }));

  const handlePress = (btn: AlertButton) => {
    setVisible(false);
    if (btn.onPress) {
      setTimeout(() => {
        btn.onPress!();
      }, 100);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Text style={styles.title}>{config.title}</Text>
          
          {!!config.message && (
            <ScrollView style={styles.messageScroll}>
              <Text style={styles.message}>{config.message}</Text>
            </ScrollView>
          )}

          <View style={[styles.buttonContainer, config.buttons && config.buttons.length > 2 && styles.buttonContainerVertical]}>
            {config.buttons?.map((btn, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.button,
                  config.buttons && config.buttons.length <= 2 && styles.buttonHorizontal,
                  config.buttons && config.buttons.length > 2 && styles.buttonVertical,
                  btn.style === 'destructive' && styles.buttonDestructive,
                  btn.style === 'cancel' && styles.buttonCancel
                ]}
                onPress={() => handlePress(btn)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.buttonText,
                  btn.style === 'destructive' && styles.buttonTextDestructive,
                  btn.style === 'cancel' && styles.buttonTextCancel
                ]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
});

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: Math.min(width * 0.85, 340),
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  messageScroll: {
    maxHeight: 150,
    width: '100%',
    marginBottom: 20,
  },
  message: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonContainerVertical: {
    flexDirection: 'column',
  },
  button: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
  },
  buttonHorizontal: {
    flex: 1,
  },
  buttonVertical: {
    width: '100%',
  },
  buttonDestructive: {
    backgroundColor: '#EF4444',
  },
  buttonCancel: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  buttonTextDestructive: {
    color: '#fff',
  },
  buttonTextCancel: {
    color: '#374151',
  },
});
