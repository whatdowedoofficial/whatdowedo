import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, RADIUS_OPTIONS } from '../constants';

interface RadiusSelectorProps {
  value: number;
  onChange: (radius: number) => void;
}

export function RadiusSelector({ value, onChange }: RadiusSelectorProps) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {RADIUS_OPTIONS.map((radius) => (
          <TouchableOpacity
            key={radius}
            style={[styles.chip, value === radius && styles.chipActive]}
            onPress={() => onChange(radius)}
          >
            <Text style={[styles.chipText, value === radius && styles.chipTextActive]}>
              {radius} km
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  chipTextActive: {
    color: COLORS.white,
  },
});
