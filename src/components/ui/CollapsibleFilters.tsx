import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { AppText as Text } from '../AppText';
import { Ionicons } from '@expo/vector-icons';
import { DatePickerField } from './DatePickerField';
import { DropdownPicker, DropdownOption } from './DropdownPicker';



export interface FilterConfig {
  id: string;
  label: string;
  type: 'date' | 'dropdown';
  value: any;
  onChange: (val: any) => void;
  options?: DropdownOption<any>[];
  placeholder?: string;
}

export interface CollapsibleFiltersProps {
  title?: string;
  filters: FilterConfig[];
  initialExpanded?: boolean;
}

export const CollapsibleFilters: React.FC<CollapsibleFiltersProps> = ({
  title = "Filters",
  filters,
  initialExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(initialExpanded);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const activeCount = useMemo(() => {
    return filters.filter(f => f.value !== null && f.value !== undefined && f.value !== '').length;
  }, [filters]);

  const handleClearAll = (e: any) => {
    e.stopPropagation(); // don't toggle expand
    filters.forEach(f => {
      f.onChange(f.type === 'date' ? null : '');
    });
  };

  // Helper to chunk filters into rows of 2
  const rows = [];
  for (let i = 0; i < filters.length; i += 2) {
    rows.push(filters.slice(i, i + 2));
  }

  const renderField = (filter: FilterConfig) => {
    if (filter.type === 'date') {
      return (
        <DatePickerField
          label={filter.label}
          date={filter.value ? new Date(filter.value) : null}
          placeholder={filter.placeholder || "Any"}
          onChange={(date) => {
            if (date) {
              filter.onChange(date.toISOString().split('T')[0]);
            } else {
              filter.onChange(null);
            }
          }}
        />
      );
    }

    if (filter.type === 'dropdown') {
      return (
        <DropdownPicker
          label={filter.label}
          options={filter.options || []}
          selectedValue={filter.value}
          onSelect={filter.onChange}
          placeholder={filter.placeholder || "Any"}
        />
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.headerRow, isExpanded && styles.headerRowExpanded]}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="filter" size={18} color="#4B5563" style={styles.filterIcon} />
          <Text style={styles.title}>{title}</Text>
          {activeCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          {activeCount > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
          <View style={styles.iconContainer}>
            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
          </View>
        </View>
      </TouchableOpacity>
      
      {isExpanded && (
        <View style={styles.contentContainer}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              <View style={styles.fieldCol}>
                {renderField(row[0])}
              </View>
              {row.length > 1 ? (
                <>
                  <View style={styles.spacer} />
                  <View style={styles.fieldCol}>
                    {renderField(row[1])}
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.spacer} />
                  <View style={styles.fieldCol} />
                </>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16,
    borderRadius: 12,
  },
  headerRowExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  badge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearBtn: {
    marginRight: 12,
  },
  clearText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  iconContainer: {
    backgroundColor: '#F3F4F6',
    padding: 4,
    borderRadius: 20,
  },
  contentContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12
  },
  fieldCol: {
    flex: 1
  },
  spacer: {
    width: 12
  }
});

