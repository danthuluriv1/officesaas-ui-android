import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, StyleProp, ViewStyle, Dimensions, TextInput } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface DropdownOption<T = string | number> {
  label: string;
  value: T;
}

export interface DropdownPickerProps<T = string | number> {
  label?: string;
  options: DropdownOption<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
  searchable?: boolean;
}

export function DropdownPicker<T = string | number>({
  label,
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select...',
  containerStyle,
  searchable = false,
}: DropdownPickerProps<T>) {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  const selectedOption = options?.find((o) => o && o.value === selectedValue);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchText) return options;
    return options?.filter(o => o?.label?.toLowerCase().includes(searchText.toLowerCase()));
  }, [options, searchable, searchText]);

  return (
    <View style={[styles.dropdownContainer, containerStyle]}>
      {!!label && <Text style={styles.inputLabel}>{label}</Text>}
      <TouchableOpacity style={styles.dropdownTrigger} onPress={() => { setSearchText(''); setModalVisible(true); }}>
        <Text style={selectedOption ? styles.dropdownText : styles.dropdownPlaceholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.dropdownMenu} onPress={e => e.stopPropagation()}>
            {searchable && (
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search..."
                  value={searchText}
                  onChangeText={setSearchText}
                  autoFocus={true}
                  autoCapitalize="none"
                />
              </View>
            )}
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredOptions?.map((item, index) => {
                if (!item) return null;
                return (
                  <TouchableOpacity
                    key={`dropdown-item-${index}-${item.value}`}
                    style={styles.dropdownItem}
                    onPress={() => {
                      onSelect(item.value);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      selectedValue === item.value ? styles.dropdownItemTextSelected : undefined
                    ]}>
                      {item.label ? String(item.label) : placeholder}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#111827',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: SCREEN_HEIGHT * 0.45,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#374151',
  },
  dropdownItemTextSelected: {
    color: '#2563EB',
    fontWeight: '700',
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
});
