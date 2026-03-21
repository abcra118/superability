import React, { useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TimeSelectorProps {
  onChange: (selectedDate: Date, isArrival: boolean) => void;
}

export const TimeSelector = ({ onChange }: TimeSelectorProps) => {
  const [isArrival, setIsArrival] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (date) {
      setSelectedDate(date);
      onChange(date, isArrival);
    }
  };

  const toggleMode = (arrival: boolean) => {
    setIsArrival(arrival);
    setTimeout(() => {
      onChange(selectedDate, arrival);
    }, 0);
  };

  const openPicker = (mode: 'date' | 'time') => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <Pressable
          style={[styles.toggleBtn, !isArrival && styles.activeBtn]}
          onPress={() => toggleMode(false)}
        >
          <Text style={[styles.toggleText, !isArrival && styles.activeText]}>Leave At</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, isArrival && styles.activeBtn]}
          onPress={() => toggleMode(true)}
        >
          <Text style={[styles.toggleText, isArrival && styles.activeText]}>Arrive By</Text>
        </Pressable>
      </View>

      <View style={styles.pickersRow}>
        <Pressable style={styles.pickerBtn} onPress={() => openPicker('date')}>
          <Text style={styles.pickerLabel}>Date</Text>
          <Text style={styles.pickerValue} numberOfLines={1}>
            {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </Pressable>

        <Pressable style={styles.pickerBtn} onPress={() => openPicker('time')}>
          <Text style={styles.pickerLabel}>Time</Text>
          <Text style={styles.pickerValue} numberOfLines={1}>
            {selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </Pressable>
      </View>

      {/* ANDROID: Native Dialog */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={selectedDate}
          mode={pickerMode}
          is24Hour={true}
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* IOS: Bottom Sheet Modal */}
      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide">
          <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setShowPicker(false)}>
                  <Text style={styles.modalDoneText}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode={pickerMode}
                is24Hour={true}
                display="spinner"
                onChange={handleDateChange}
                minimumDate={new Date()}
                style={styles.iosPicker}
              />
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeBtn: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  toggleText: {
    fontWeight: '500',
    color: '#6b7280',
  },
  activeText: {
    color: '#111827',
  },
  pickersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerBtn: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 6,
  },
  pickerLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerValue: {
    color: '#111827',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    paddingBottom: 32,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalDoneText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 16,
  },
  iosPicker: {
    alignSelf: 'center',
    width: '100%',
  }
});
