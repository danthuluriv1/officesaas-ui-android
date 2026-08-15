import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';

interface SelectorModalProps {
  visible: boolean;
  title: string;
  items: any[];
  onSelect: (item: any) => void;
  onClose: () => void;
  displayKey?: string;
  valKey?: string;
}

export const SelectorModal: React.FC<SelectorModalProps> = ({ 
  visible, 
  title, 
  items, 
  onSelect, 
  onClose, 
  displayKey = 'name', 
  valKey = 'entityId' 
}) => (
  <Modal visible={visible} animationType="fade" transparent>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }}>
    <View style={styles.selectorOverlay}>
      <View style={styles.selectorContent}>
        <View style={styles.selectorHeader}>
          <Text style={styles.selectorTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
        </View>
        <ScrollView style={styles.selectorList}>
          {items.map((item: any, idx: number) => (
            <TouchableOpacity 
              key={item[valKey] || idx} 
              style={styles.selectorItem}
              onPress={() => onSelect(item)}
            >
              <Text style={styles.selectorItemText}>{item[displayKey]}</Text>
            </TouchableOpacity>
          ))}
          {items.length === 0 && <Text style={styles.emptyText}>No items found.</Text>}
        </ScrollView>
      </View>
    </View>
  </SafeAreaView>
    </Modal>
);

const styles = StyleSheet.create({
  selectorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  selectorContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  selectorList: {
    padding: 16,
  },
  selectorItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectorItemText: {
    fontSize: 16,
    color: '#374151',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 20,
    marginBottom: 20,
  }
});
