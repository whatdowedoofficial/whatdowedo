import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface DateFilterProps {
  value: string | null; // 'YYYY-MM-DD' or null
  onChange: (date: string | null) => void;
}

export function DateFilter({ value, onChange }: DateFilterProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const getToday = () => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  };

  const getTomorrow = () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (dateStr: string | null) => {
    if (!dateStr) return 'Tutti i giorni';
    
    const today = getToday();
    const tomorrow = getTomorrow();

    if (dateStr === today) return 'Oggi';
    if (dateStr === tomorrow) return 'Domani';
    
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      onChange(dateStr);
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Today */}
        <TouchableOpacity
          style={[styles.chip, value === getToday() && styles.chipActive]}
          onPress={() => onChange(getToday())}
        >
          <Text style={[styles.chipText, value === getToday() && styles.chipTextActive]}>
            Oggi
          </Text>
        </TouchableOpacity>

        {/* Tomorrow */}
        <TouchableOpacity
          style={[styles.chip, value === getTomorrow() && styles.chipActive]}
          onPress={() => onChange(getTomorrow())}
        >
          <Text style={[styles.chipText, value === getTomorrow() && styles.chipTextActive]}>
            Domani
          </Text>
        </TouchableOpacity>

        {/* Pick Date */}
        <TouchableOpacity
          style={[styles.chip, value && value !== getToday() && value !== getTomorrow() && styles.chipActive]}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={16} color={value && value !== getToday() && value !== getTomorrow() ? COLORS.white : COLORS.text} />
          <Text style={[styles.chipText, value && value !== getToday() && value !== getTomorrow() && styles.chipTextActive]}>
            {value && value !== getToday() && value !== getTomorrow()
              ? formatDateDisplay(value)
              : 'Scegli data'}
          </Text>
        </TouchableOpacity>

        {/* Clear */}
        {value && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
          >
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* iOS Modal */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal
          transparent
          animationType="slide"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalCancel}>Annulla</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Seleziona data</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalDone}>Fatto</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={value ? new Date(value) : new Date()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },
  chipTextActive: {
    color: COLORS.white,
  },
  clearButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalCancel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
