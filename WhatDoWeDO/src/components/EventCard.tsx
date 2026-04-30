import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EventItem } from '../types/event';
import { COLORS, CATEGORY_COLORS, CATEGORY_LABELS } from '../constants';

interface EventCardProps {
  event: EventItem;
  onClose: () => void;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EventCard({ event, onClose }: EventCardProps) {
  const categoryColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.altro;
  const categoryLabel = CATEGORY_LABELS[event.category] || CATEGORY_LABELS.altro;

  const handleOpenSource = () => {
    if (event.source_url) {
      Linking.openURL(event.source_url);
    }
  };

  return (
    <View style={styles.container}>
      {/* Handle bar */}
      <View style={styles.handle} />

      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {/* Category badge */}
      <View style={[styles.badge, { backgroundColor: categoryColor }]}>
        <Text style={styles.badgeText}>{categoryLabel}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

      {/* Venue */}
      {event.venue_name && (
        <View style={styles.row}>
          <Ionicons name="location" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detail}>{event.venue_name}</Text>
        </View>
      )}

      {/* Date/Time */}
      <View style={styles.row}>
        <Ionicons name="calendar" size={16} color={COLORS.textSecondary} />
        <Text style={styles.detail}>{formatDate(event.start_time)}</Text>
      </View>

      {/* Price */}
      {event.price_info && (
        <View style={styles.row}>
          <Ionicons name="pricetag" size={16} color={COLORS.textSecondary} />
          <Text style={styles.detail}>{event.price_info}</Text>
        </View>
      )}

      {/* Distance */}
      <View style={styles.row}>
        <Ionicons name="navigate" size={16} color={COLORS.textSecondary} />
        <Text style={styles.detail}>{event.distance_km} km da te</Text>
      </View>

      {/* Description */}
      {event.description && (
        <Text style={styles.description} numberOfLines={3}>{event.description}</Text>
      )}

      {/* Source link */}
      {event.source_url && (
        <TouchableOpacity style={styles.sourceButton} onPress={handleOpenSource}>
          <Ionicons name="open-outline" size={16} color={COLORS.primary} />
          <Text style={styles.sourceText}>Apri fonte</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    paddingRight: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  description: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginTop: 12,
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  sourceText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
