import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const ROUTE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const getRouteMapHtml = (routeResult: any, depotCoords: { latitude: number; longitude: number; name: string }) => {
  const routesJson = JSON.stringify(routeResult?.routes || []);
  const colorsJson = JSON.stringify(ROUTE_COLORS);
  const depotLat = depotCoords.latitude;
  const depotLng = depotCoords.longitude;
  const depotName = depotCoords.name;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; overflow: hidden; }
    .leaflet-control-attribution { display: none !important; }
    
    /* Numbered stop icon */
    .stop-label {
      width: 24px;
      height: 24px;
      line-height: 24px;
      border-radius: 12px;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      text-align: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      border: 2px solid #ffffff;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${depotLat}, ${depotLng}],
      zoom: 12,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd'
    }).addTo(map);

    // Office Depot Marker
    L.marker([${depotLat}, ${depotLng}], {
      icon: L.divIcon({
        className: 'depot-marker',
        html: '<div style="width:16px;height:16px;background:#EA4335;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      })
    }).addTo(map).bindPopup('<b>' + ${JSON.stringify(depotName)} + '</b><br/>Depot Center');

    var routes = ${routesJson};
    var colors = ${colorsJson};
    var allCoords = [[${depotLat}, ${depotLng}]];

    // Helper to fetch and draw road route for a vehicle
    function drawRoadRoute(route, color) {
      var coordsString = ${depotLng} + ',' + ${depotLat};
      
      route.stops.forEach(function(stop) {
        coordsString += ';' + stop.longitude + ',' + stop.latitude;
        allCoords.push([stop.latitude, stop.longitude]);
      });
      
      coordsString += ';' + ${depotLng} + ',' + ${depotLat};

      var url = 'https://router.project-osrm.org/route/v1/driving/' + coordsString + '?overview=full&geometries=geojson';
      
      fetch(url)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.routes && data.routes.length > 0) {
            var routeGeoJSON = data.routes[0].geometry;
            
            // Draw driving path following roads
            L.geoJSON(routeGeoJSON, {
              style: {
                color: color,
                weight: 4,
                opacity: 0.85,
                lineJoin: 'round'
              }
            }).addTo(map);
          } else {
            // Fallback to straight polyline if OSRM request fails
            var fallbackCoords = [[${depotLat}, ${depotLng}]];
            route.stops.forEach(function(s) { fallbackCoords.push([s.latitude, s.longitude]); });
            fallbackCoords.push([${depotLat}, ${depotLng}]);
            L.polyline(fallbackCoords, { color: color, weight: 4, opacity: 0.7 }).addTo(map);
          }
        })
        .catch(function() {
          var fallbackCoords = [[${depotLat}, ${depotLng}]];
          route.stops.forEach(function(s) { fallbackCoords.push([s.latitude, s.longitude]); });
          fallbackCoords.push([${depotLat}, ${depotLng}]);
          L.polyline(fallbackCoords, { color: color, weight: 4, opacity: 0.7 }).addTo(map);
        });
    }

    // Process all routes
    routes.forEach(function(route, idx) {
      var color = colors[idx % colors.length];
      
      // Place numbered stop markers
      route.stops.forEach(function(stop) {
        L.marker([stop.latitude, stop.longitude], {
          icon: L.divIcon({
            className: 'stop-icon',
            html: '<div class="stop-label" style="background:' + color + ';">' + stop.sequenceNumber + '</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map).bindPopup('<b>' + stop.stopName + '</b><br/>Stop #' + stop.sequenceNumber + '<br/>' + stop.addressText);
      });

      drawRoadRoute(route, color);
    });

    setTimeout(function() {
      if (allCoords.length > 1) {
        map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
      }
    }, 800);
  </script>
</body>
</html>
  `;
};

interface MapViewerProps {
  routeResult: any;
  depotCoords: { latitude: number; longitude: number; name: string };
  height?: number;
}

export function MapViewer({ routeResult, depotCoords, height = 400 }: MapViewerProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.mapContainer, { height }]}>
        <iframe
          srcDoc={getRouteMapHtml(routeResult, depotCoords)}
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: 16 }}
          sandbox="allow-scripts allow-same-origin"
        />
      </View>
    );
  }

  return (
    <View style={[styles.mapContainer, { height }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: getRouteMapHtml(routeResult, depotCoords) }}
        style={{ flex: 1 }}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
});
