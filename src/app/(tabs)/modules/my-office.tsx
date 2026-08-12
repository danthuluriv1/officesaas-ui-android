import React, { useState, useCallback, useEffect } from 'react';
import { Theme } from '../../../theme';
import { View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
  LayoutAnimation } from 'react-native';
import { AppText as Text } from '../../../components/AppText';
import { useFocusEffect } from 'expo-router';
import { OfficeService, OfficeProfile } from '../../../api/officeService';
import { LocationPicker } from '../../../components/ui/LocationPicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

import { GeneralTab } from '../../../components/my-office/GeneralTab';
import { ComplianceTab } from '../../../components/my-office/ComplianceTab';
import { OrgTab } from '../../../components/my-office/OrgTab';
import { BankTab } from '../../../components/my-office/BankTab';
import { AppAlertStatic } from '../../../components/ui/AppAlert';

import { useOfficeStore } from '../../../store/officeStore';

import { useOfficeProfile } from '../../../api/hooks/useOfficeQueries';

type SectionTab = 'general' | 'compliance' | 'org' | 'bank';

export default function MyOfficeScreen() {
  const { 
    officeProfile: profile, setOfficeProfile: setProfile, 
    isEditing, setIsEditing 
  } = useOfficeStore();

  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SectionTab>('general');
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width);

  const { data: fetchedProfile, isLoading: loading, isRefetching: refreshing, refetch: fetchProfile } = useOfficeProfile();

  const tabs: { id: SectionTab; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: '🏢' },
    { id: 'compliance', label: 'Compliance', icon: '🛡️' },
    { id: 'org', label: 'Org', icon: '👥' },
    { id: 'bank', label: 'Bank', icon: '🏦' },
  ];

  const tabScrollRef = React.useRef<ScrollView>(null);
  const contentScrollRef = React.useRef<ScrollView>(null);

  const handleSetTab = (newTabId: SectionTab) => {
    const index = tabs.findIndex(t => t.id === newTabId);
    if (index >= 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setActiveTab(newTabId);
      tabScrollRef.current?.scrollTo({ x: index * 90 - 40, animated: true });
      contentScrollRef.current?.scrollTo({ x: index * containerWidth, animated: true });
    }
  };

  useEffect(() => {
    if (fetchedProfile) {
      setProfile(fetchedProfile);
    }
  }, [fetchedProfile]);

  const onRefresh = useCallback(() => {
    
    fetchProfile();
  }, []);

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchProfile();
    setIsEditing(false);
  };

  const handleToggleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isEditing) {
      handleCancel();
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const updated = await OfficeService.updateProfile(profile);
      setProfile(updated);
      setIsEditing(false);
      AppAlertStatic.alert('Success', 'Office profile updated successfully!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      AppAlertStatic.alert('Error', err.message || 'Failed to save office profile');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof OfficeProfile, value: any) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const updateAddress = (field: string, value: any) => {
    if (!profile) return;
    setProfile({
      ...profile,
      address: { ...profile.address, [field]: value },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading office profile…</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.centered} edges={['top', 'left', 'right']}>
        <Text style={styles.errorText}>Could not load office profile.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchProfile()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <View style={styles.container}>
        <View 
          style={styles.maxWidthWrapper}
          onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        >
          
          {/* Scrollable Tab bar */}
          <View style={styles.tabBarWrapper}>
            <ScrollView 
              ref={tabScrollRef}
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabBarScrollContent}
            >
              {tabs.map(tab => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                  onPress={() => handleSetTab(tab.id)}
                >
                  <Text style={styles.tabIcon}>{tab.icon}</Text>
                  <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            keyboardShouldPersistTaps="handled"
          >
            <ScrollView
              ref={contentScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / containerWidth);
                if (index >= 0 && index < tabs.length) {
                  const newTab = tabs[index].id;
                  if (newTab !== activeTab) {
                    setActiveTab(newTab);
                    tabScrollRef.current?.scrollTo({ x: index * 90 - 40, animated: true });
                  }
                }
              }}
            >
              <View pointerEvents={isEditing ? 'auto' : 'none'} style={[isEditing ? styles.editingOverlayActive : null, { width: containerWidth, paddingHorizontal: containerWidth * 0.04 }]}>
                <GeneralTab 
                  profile={profile} 
                  isEditing={isEditing}
                  updateField={updateField} 
                  updateAddress={updateAddress} 
                  onOpenLocationPicker={() => setLocationPickerVisible(true)}
                />
              </View>
              <View pointerEvents={isEditing ? 'auto' : 'none'} style={[isEditing ? styles.editingOverlayActive : null, { width: containerWidth, paddingHorizontal: containerWidth * 0.04 }]}>
                <ComplianceTab 
                  profile={profile} 
                  isEditing={isEditing}
                  updateField={updateField} 
                />
              </View>
              <View pointerEvents={isEditing ? 'auto' : 'none'} style={[isEditing ? styles.editingOverlayActive : null, { width: containerWidth, paddingHorizontal: containerWidth * 0.04 }]}>
                <OrgTab 
                  profile={profile} 
                  isEditing={isEditing}
                  setProfile={setProfile} 
                />
              </View>
              <View pointerEvents={isEditing ? 'auto' : 'none'} style={[isEditing ? styles.editingOverlayActive : null, { width: containerWidth, paddingHorizontal: containerWidth * 0.04 }]}>
                <BankTab 
                  profile={profile} 
                  isEditing={isEditing}
                  setProfile={setProfile} 
                />
              </View>
            </ScrollView>

            {/* Save Button */}
            {isEditing && (
              <View style={{ paddingHorizontal: containerWidth * 0.04 }}>
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 100 }} /> 
          </ScrollView>
        </View>

        {/* Floating Action Button for Edit/Cancel */}
        <TouchableOpacity 
          style={[styles.fab, isEditing ? styles.fabCancel : styles.fabEdit]} 
          onPress={handleToggleEdit}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={isEditing ? "close" : "pencil"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>

        {/* Location Picker Modal */}
        <LocationPicker
          visible={locationPickerVisible}
          onClose={() => setLocationPickerVisible(false)}
          initialLat={profile.address?.latitude}
          initialLng={profile.address?.longitude}
          onSelectLocation={(lat, lng) => {
            setProfile({
              ...profile,
              address: { ...profile.address, latitude: lat, longitude: lng },
            });
            setLocationPickerVisible(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  maxWidthWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  tabBarWrapper: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabBarScrollContent: {
    paddingHorizontal: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: Platform.OS === 'ios' ? 100 : 110,
  },
  tabActive: {
    borderBottomColor: '#2563EB',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabLabelActive: {
    color: '#2563EB',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  editingOverlayActive: {
    opacity: 1,
  },

  saveBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  fabEdit: {
    backgroundColor: '#4F46E5', // Indigo primary
  },
  fabCancel: {
    backgroundColor: '#EF4444', // Red for cancel
  }
});
