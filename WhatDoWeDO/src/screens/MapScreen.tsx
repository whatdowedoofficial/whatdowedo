import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../hooks/useLocation';
import { useEvents } from '../hooks/useEvents';
import { SearchBar } from '../components/SearchBar';
import { RadiusSelector } from '../components/RadiusSelector';
import { EventCard } from '../components/EventCard';
import { COLORS, CATEGORY_COLORS, DEFAULT_RADIUS_KM } from '../constants';
import type { EventItem } from '../types/event';

interface MapScreenProps {
  onSignOut: () => void;
}

export function MapScreen({ onSignOut }: MapScreenProps) {
  const { location, loading: locationLoading, requestGPS, searchLocation } = useLocation();
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const { events, loading: eventsLoading } = useEvents(location, radiusKm);
  const mapRef = useRef<MapView>(null);

  // Animate map when location changes
  const animateToLocation = (lat: number, lng: number) => {
    mapRef.current?.animateToRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: radiusKm / 50,
      longitudeDelta: radiusKm / 50,
    }, 500);
  };

  // React to location changes (GPS or search)
  useEffect(() => {
    animateToLocation(location.latitude, location.longitude);
  }, [location.latitude, location.longitude]);

  const handleSearch = async (query: string) => {
    await searchLocation(query);
    // animateToLocation will be triggered by location change
  };

  const handleGPS = async () => {
    await requestGPS();
  };

  const handleRadiusChange = (radius: number) => {
    setRadiusKm(radius);
    animateToLocation(location.latitude, location.longitude);
  };

  const handleMarkerPress = (event: EventItem) => {
    setSelectedEvent(event);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar */}
      <SearchBar
        onSearch={handleSearch}
        onGPS={handleGPS}
        loading={locationLoading}
      />

      {/* Radius selector + logout */}
      <View style={styles.topRow}>
        <RadiusSelector value={radiusKm} onChange={handleRadiusChange} />
        <TouchableOpacity style={styles.logoutBtn} onPress={onSignOut}>
          <Text style={styles.logoutText}>Esci</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: radiusKm / 50,
            longitudeDelta: radiusKm / 50,
          }}
          onPress={() => setSelectedEvent(null)}
        >
          {/* Event markers */}
          {events.map((event) => (
            <Marker
              key={event.id}
              coordinate={{ latitude: event.lat, longitude: event.lng }}
              pinColor={CATEGORY_COLORS[event.category] || CATEGORY_COLORS.altro}
              onPress={() => handleMarkerPress(event)}
            />
          ))}
        </MapView>

        {/* Loading indicator */}
        {eventsLoading && (
          <View style={styles.loadingBadge}>
            <Text style={styles.loadingText}>Caricamento eventi...</Text>
          </View>
        )}

        {/* Event count badge */}
        {!eventsLoading && events.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{events.length} eventi trovati</Text>
          </View>
        )}
      </View>

      {/* Event detail card */}
      {selectedEvent && (
        <EventCard event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 12,
  },
  logoutText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  loadingBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  countBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  countText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
});
