import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
  Animated,
  Keyboard } from 'react-native';
import { AppText as Text } from '../AppText';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import { AppAlertStatic } from './/AppAlert';

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectLocation: (lat: number, lng: number, addressSnapshot?: string) => void;
  initialLat?: number;
  initialLng?: number;
}

const getMapHtml = (lat: number, lng: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #f0f4f8; }
    #map { width: 100%; height: 100%; }

    /* Hide default Leaflet attribution bar to keep it clean */
    .leaflet-control-attribution { display: none !important; }

    /* Custom zoom controls */
    .leaflet-control-zoom a {
      width: 36px !important;
      height: 36px !important;
      line-height: 36px !important;
      font-size: 18px !important;
      color: #1e293b !important;
      background: rgba(255,255,255,0.95) !important;
      backdrop-filter: blur(12px);
      border: none !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
    }
    .leaflet-control-zoom a:first-child { border-radius: 10px 10px 0 0 !important; }
    .leaflet-control-zoom a:last-child { border-radius: 0 0 10px 10px !important; }
    .leaflet-control-zoom {
      border: none !important;
      border-radius: 10px !important;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.12) !important;
    }

    /* Drop pin marker */
    @keyframes dropIn {
      0%   { transform: translateY(-30px); opacity: 0; }
      60%  { transform: translateY(4px); opacity: 1; }
      80%  { transform: translateY(-2px); }
      100% { transform: translateY(0); }
    }
    .pin-marker {
      position: relative;
      width: 36px; height: 48px;
      animation: dropIn 0.4s ease-out;
    }
    .pin-marker svg {
      width: 36px; height: 48px;
      filter: drop-shadow(0 3px 4px rgba(0,0,0,0.3));
    }
    .pin-shadow {
      position: absolute;
      bottom: -3px; left: 50%;
      transform: translateX(-50%);
      width: 14px; height: 6px;
      background: rgba(0,0,0,0.18);
      border-radius: 50%;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${lat}, ${lng}],
      zoom: 16,
      zoomControl: true,
    });

    // CartoDB Voyager — clean, modern, Google Maps-like style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(map);

    // Custom drop-pin marker
    var markerIcon = L.divIcon({
      className: 'pin-marker',
      html: '<svg viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">'
        + '<path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="#EA4335"/>'
        + '<circle cx="18" cy="18" r="7" fill="#fff"/>'
        + '</svg>'
        + '<div class="pin-shadow"></div>',
      iconSize: [36, 48],
      iconAnchor: [18, 48],
    });

    var marker = L.marker([${lat}, ${lng}], {
      draggable: true,
      icon: markerIcon,
    }).addTo(map);

    function sendCoords(lt, ln) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'coords', lat: lt, lng: ln }));
    }

    marker.on('dragend', function() {
      var pos = marker.getLatLng();
      sendCoords(pos.lat, pos.lng);
    });

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      sendCoords(e.latlng.lat, e.latlng.lng);
    });

    // Listen for messages from React Native
    function handleMessage(event) {
      try {
        var data = JSON.parse(event.data);
        if (data.type === 'moveTo') {
          var ll = L.latLng(data.lat, data.lng);
          map.flyTo(ll, 16, { duration: 1.2 });
          marker.setLatLng(ll);
          sendCoords(data.lat, data.lng);
        }
      } catch(e) {}
    }
    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);

    sendCoords(${lat}, ${lng});
  </script>
</body>
</html>
`;

export const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onSelectLocation,
  initialLat,
  initialLng,
}) => {
  const defaultLat = initialLat || 17.4485;
  const defaultLng = initialLng || 78.3741;

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [currentLat, setCurrentLat] = useState(defaultLat);
  const [currentLng, setCurrentLng] = useState(defaultLng);
  const [addressLabel, setAddressLabel] = useState('');

  const webViewRef = useRef<WebView>(null);
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(bottomSheetAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      bottomSheetAnim.setValue(0);
    }
  }, [visible]);

  const moveMapTo = useCallback((lat: number, lng: number) => {
    webViewRef.current?.postMessage(
      JSON.stringify({ type: 'moveTo', lat, lng })
    );
    setCurrentLat(lat);
    setCurrentLng(lng);
  }, []);

  const handleWebViewMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'coords') {
        setCurrentLat(data.lat);
        setCurrentLng(data.lng);
      }
    } catch {}
  }, []);

  // Reverse geocode to get address label
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'OfficeSaaS-Android-App/1.0' },
      });
      const data = await response.json();
      if (data?.display_name) {
        const parts = data.display_name.split(',');
        setAddressLabel(parts.slice(0, 3).join(',').trim());
      }
    } catch {}
  }, []);

  const handleGetCurrentLocation = async () => {
    setLoadingLocation(true);
    Keyboard.dismiss();
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        AppAlertStatic.alert('Permission Denied', 'Location permissions are required.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;
      moveMapTo(latitude, longitude);
      reverseGeocode(latitude, longitude);
    } catch {
      AppAlertStatic.alert('Error', 'Failed to retrieve current location.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    Keyboard.dismiss();
    try {
      const formattedQuery = encodeURIComponent(searchQuery);
      const url = `https://nominatim.openstreetmap.org/search?q=${formattedQuery}&format=json&limit=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'OfficeSaaS-Android-App/1.0' },
      });
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        moveMapTo(lat, lon);
        const parts = data[0].display_name.split(',');
        setAddressLabel(parts.slice(0, 3).join(',').trim());
      } else {
        AppAlertStatic.alert('No Results', 'Could not find that location. Try different keywords.');
      }
    } catch {
      AppAlertStatic.alert('Error', 'Search failed. Please check your connection.');
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = () => {
    onSelectLocation(currentLat, currentLng, addressLabel || searchQuery || 'Pin Location');
    onClose();
  };

  if (!visible) return null;

  const bottomTranslate = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [200, 0],
  });

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

        {/* Map */}
        <WebView
          ref={webViewRef}
          source={{ html: getMapHtml(defaultLat, defaultLng) }}
          style={styles.webview}
          onMessage={handleWebViewMessage}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Loading map…</Text>
            </View>
          )}
          originWhitelist={['*']}
        />

        {/* Floating search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for a place..."
              placeholderTextColor="#94A3B8"
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.searchActionBtn, searching && styles.searchActionBtnDisabled]}
              onPress={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.searchActionBtnText}>Go</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* GPS floating button */}
        <TouchableOpacity
          style={styles.gpsFab}
          onPress={handleGetCurrentLocation}
          disabled={loadingLocation}
          activeOpacity={0.8}
        >
          {loadingLocation ? (
            <ActivityIndicator color="#2563EB" size="small" />
          ) : (
            <Text style={styles.gpsFabIcon}>◎</Text>
          )}
        </TouchableOpacity>

        {/* Bottom sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: bottomTranslate }] },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.sheetHandle} />

          {/* Coordinates */}
          <View style={styles.coordRow}>
            <View style={styles.coordBadge}>
              <Text style={styles.coordLabel}>LAT</Text>
              <Text style={styles.coordValue}>{currentLat.toFixed(6)}</Text>
            </View>
            <View style={styles.coordBadge}>
              <Text style={styles.coordLabel}>LNG</Text>
              <Text style={styles.coordValue}>{currentLng.toFixed(6)}</Text>
            </View>
          </View>

          {addressLabel ? (
            <Text style={styles.addressText} numberOfLines={2}>
              📍 {addressLabel}
            </Text>
          ) : (
            <Text style={styles.hintText}>Tap the map or search to set a location</Text>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleConfirm} activeOpacity={0.8}>
              <Text style={styles.saveButtonText}>Save Location</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 48;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },

  // Floating search bar
  searchContainer: {
    position: 'absolute',
    top: STATUSBAR_HEIGHT + 12,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 4,
    height: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 8,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    paddingVertical: 0,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  searchActionBtn: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 18,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchActionBtnDisabled: {
    opacity: 0.6,
  },
  searchActionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // GPS floating action button
  gpsFab: {
    position: 'absolute',
    right: 16,
    bottom: 220,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.96)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  gpsFabIcon: {
    fontSize: 22,
    color: '#2563EB',
  },

  // Bottom sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'android' ? 24 : 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  coordRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  coordBadge: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  coordLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 2,
  },
  coordValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    fontVariant: ['tabular-nums'],
  },
  addressText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 16,
    lineHeight: 18,
  },
  hintText: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 2,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
