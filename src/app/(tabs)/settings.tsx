import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { AppText } from '../../components/AppText';
import { useSettings } from '../../context/SettingsContext';
import { useRouter } from 'expo-router';
import { removeItem, getItem } from '../../utils/storage';
import { decodeJwt, UserClaims } from '../../utils/jwt';

export default function SettingsScreen() {
  const { fontScale, setFontScale } = useSettings();
  const router = useRouter();
  const [claims, setClaims] = useState<UserClaims | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      try {
        const token = await getItem('saas_token');
        if (token) {
          const parsed = decodeJwt(token);
          setClaims(parsed);
        }
      } catch (e) {
        console.warn('Failed to load user token settings:', e);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, []);

  const handleLogout = async () => {
    await removeItem('saas_token');
    await removeItem('saas_refresh_token');
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppText style={styles.title}>Settings</AppText>

      {/* User Information Section */}
      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>User Profile</AppText>
        
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>
              {claims ? `${claims.firstName.charAt(0)}${claims.lastName.charAt(0)}` : 'U'}
            </AppText>
          </View>
          <View style={styles.profileDetails}>
            <AppText style={styles.profileName}>
              {claims ? `${claims.firstName} ${claims.lastName}` : 'Guest User'}
            </AppText>
            <AppText style={styles.profileSub}>{claims?.email || 'N/A'}</AppText>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <AppText style={styles.infoLabel}>Role</AppText>
          <AppText style={styles.infoValue}>{claims?.role || 'N/A'}</AppText>
        </View>

        <View style={styles.infoRow}>
          <AppText style={styles.infoLabel}>User ID</AppText>
          <AppText style={styles.infoValueSub} numberOfLines={1} ellipsizeMode="tail">
            {claims?.userId || 'N/A'}
          </AppText>
        </View>
      </View>

      {/* Office Information Section */}
      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Office Directory</AppText>
        
        <View style={styles.infoRow}>
          <AppText style={styles.infoLabel}>Organization Name</AppText>
          <AppText style={styles.infoValueHighlighted}>{claims?.officeName || 'Office Workspace'}</AppText>
        </View>

        <View style={styles.infoRow}>
          <AppText style={styles.infoLabel}>Office ID</AppText>
          <AppText style={styles.infoValueSub} numberOfLines={1} ellipsizeMode="tail">
            {claims?.officeId || 'N/A'}
          </AppText>
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>Appearance</AppText>
        <AppText style={styles.description}>Adjust the global font size for better readability.</AppText>
        
        <View style={styles.optionsRow}>
          <TouchableOpacity 
            style={[styles.optionBtn, fontScale === 0.8 && styles.optionBtnActive]} 
            onPress={() => setFontScale(0.8)}
          >
            <AppText style={[styles.optionText, fontScale === 0.8 && styles.optionTextActive, { fontSize: 12 }]}>Small</AppText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.optionBtn, fontScale === 1.0 && styles.optionBtnActive]} 
            onPress={() => setFontScale(1.0)}
          >
            <AppText style={[styles.optionText, fontScale === 1.0 && styles.optionTextActive]}>Default</AppText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.optionBtn, fontScale === 1.2 && styles.optionBtnActive]} 
            onPress={() => setFontScale(1.2)}
          >
            <AppText style={[styles.optionText, fontScale === 1.2 && styles.optionTextActive, { fontSize: 18 }]}>Large</AppText>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Account Control */}
      <View style={styles.section}>
        <AppText style={styles.sectionTitle}>System</AppText>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <AppText style={styles.logoutText}>Sign Out</AppText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 32,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  profileDetails: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  profileSub: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  infoValueHighlighted: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
  },
  infoValueSub: {
    fontSize: 12,
    color: '#9CA3AF',
    maxWidth: 180,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  optionBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  optionText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 16,
  },
});
