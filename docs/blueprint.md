# **App Name**: HeartBeat Hub

## Core Features:

- Record Entry: Allow users to input and store systolic, diastolic blood pressure, and heart rate readings, along with a timestamp, in local storage.
- Record Display: Display the history of blood pressure and heart rate readings in a clear, sortable, and filterable list.
- Threshold Setting: Enable users to set custom thresholds for systolic, diastolic blood pressure, and heart rate, and visually highlight readings that exceed these thresholds.

## Style Guidelines:

- Primary color: A calm teal (#4DB6AC) for the background to promote a sense of well-being.
- Secondary color: Light gray (#EEEEEE) for input fields and card backgrounds to ensure readability.
- Accent: A soft coral (#FFAB91) for buttons and interactive elements, providing a gentle call to action.
- Use a clean, card-based layout for displaying records, making it easy to scan and digest information.
- Incorporate simple, health-related icons to visually represent different data points (e.g., a heart for heart rate).

## Original User Request:
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function App() {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [filterEnabled, setFilterEnabled] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [currentPicker, setCurrentPicker] = useState(null);
  const [thresholds, setThresholds] = useState({
    systolic: 130,
    diastolic: 80,
    heartRate: 100,
  });

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    const jsonValue = await AsyncStorage.getItem('@bp_records');
    if (jsonValue != null) {
      const loadedRecords = JSON.parse(jsonValue);
      setRecords(loadedRecords);
      setFilteredRecords(loadedRecords);
    }
  };

  const saveRecord = async () => {
    if (!systolic || !diastolic || !heartRate) {
      Alert.alert("All fields are required.");
      return;
    }

    const newRecord = {
      id: Date.now().toString(),
      systolic,
      diastolic,
      heartRate,
      timestamp: date.toISOString(),
    };

    const newRecords = [newRecord, ...records];
    await AsyncStorage.setItem('@bp_records', JSON.stringify(newRecords));
    setRecords(newRecords);
    setFilteredRecords(newRecords);
    setSystolic('');
    setDiastolic('');
    setHeartRate('');
    setDate(new Date());
  };

  const handleDateChange = (event, selectedDate) => {
    if (event.type === 'set' && selectedDate) {
      if (currentPicker === 'start') {
        setStartTime(selectedDate);
      } else if (currentPicker === 'end') {
        setEndTime(selectedDate);
      } else {
        setDate(selectedDate);
      }
    }
    setShowPicker(false);
    setCurrentPicker(null);
  };

  const openPicker = (pickerType) => {
    setCurrentPicker(pickerType);
    setShowPicker(true);
  };

  const toggleFilter = () => {
    setFilterEnabled(!filterEnabled);

    if (!filterEnabled) {
      const filtered = records.filter((item) => {
        const itemDate = new Date(item.timestamp);
        const inDateRange = (!startTime || itemDate >= startTime) && (!endTime || itemDate <= endTime);
        return (
          (parseInt(item.systolic) > thresholds.systolic ||
          parseInt(item.diastolic) > thresholds.diastolic ||
          parseInt(item.heartRate) > thresholds.heartRate) &&
          inDateRange
        );
      });
      setFilteredRecords(filtered);
    } else {
      setFilteredRecords(records);
    }
  };

  const deleteRecord = (id) => {
    const newRecords = records.filter((record) => record.id !== id);
    setRecords(newRecords);
    setFilteredRecords(newRecords);
    AsyncStorage.setItem('@bp_records', JSON.stringify(newRecords));
  };

  const clearFilters = () => {
    setStartTime(null);
    setEndTime(null);
    setFilteredRecords(records); // Reset to show all records
  };

  const updateThresholds = () => {
    const updatedThresholds = {
      systolic: parseInt(systolic) || thresholds.systolic,
      diastolic: parseInt(diastolic) || thresholds.diastolic,
      heartRate: parseInt(heartRate) || thresholds.heartRate,
    };
    setThresholds(updatedThresholds);
    Alert.alert("Thresholds updated successfully!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Blood Pressure Tracker</Text>

      <TextInput
        placeholder="Systolic"
        keyboardType="numeric"
        style={styles.input}
        value={systolic}
        onChangeText={setSystolic}
      />
      <TextInput
        placeholder="Diastolic"
        keyboardType="numeric"
        style={styles.input}
        value={diastolic}
        onChangeText={setDiastolic}
      />
      <TextInput
        placeholder="Heart Rate"
        keyboardType="numeric"
        style={styles.input}
        value={heartRate}
        onChangeText={setHeartRate}
      />

      <View style={styles.datetimeSection}>
        <Button title="Choose Date & Time" onPress={() => openPicker('record')} />
        <Text style={styles.datetimeText}>Selected: {date.toLocaleString()}</Text>
      </View>

      <View style={styles.datetimeSection}>
        <Button title="Pick Start Time" onPress={() => openPicker('start')} />
        {startTime && <Text>Start: {startTime.toLocaleString()}</Text>}
      </View>

      <View style={styles.datetimeSection}>
        <Button title="Pick End Time" onPress={() => openPicker('end')} />
        {endTime && <Text>End: {endTime.toLocaleString()}</Text>}
      </View>

      {showPicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={date}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      <View style={styles.saveButtonContainer}>
        <Button title="Save Record" onPress={saveRecord} />
      </View>

      <View style={styles.filterButtonContainer}>
        <Button
          title={filterEnabled ? "Show All Records" : "Show Over Threshold Records"}
          onPress={toggleFilter}
        />
      </View>

      <View style={styles.filterButtonContainer}>
        <Button title="Clear Filters" onPress={clearFilters} />
      </View>

      <View style={styles.filterButtonContainer}>
        <Button title="Update Thresholds" onPress={updateThresholds} />
      </View>

      <FlatList
        data={filteredRecords}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <View style={styles.record}>
            <View style={styles.recordRow}>
              <View style={styles.recordText}>
                <Text>{new Date(item.timestamp).toLocaleString()}</Text>
                <Text
                  style={
                    (parseInt(item.systolic) > thresholds.systolic ||
                    parseInt(item.diastolic) > thresholds.diastolic ||
                    parseInt(item.heartRate) > thresholds.heartRate)
                      ? { color: 'red' }
                      : { color: 'black' }
                  }
                >
                  {item.systolic}/{item.diastolic} mmHg - HR: {item.heartRate}
                </Text>
              </View>
              <View style={styles.deleteButtonContainer}>
                <Button title="Delete" color="blue" onPress={() => deleteRecord(item.id)} />
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, marginBottom: 10, padding: 8, borderRadius: 5 },
  datetimeSection: { marginBottom: 10 },
  datetimeText: { marginTop: 8, marginBottom: 8, fontSize: 16 },
  list: { marginTop: 20 },
  record: { marginBottom: 10, padding: 10, backgroundColor: '#eee', borderRadius: 5 },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recordText: { flex: 1 },
  saveButtonContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10 },
  filterButtonContainer: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 },
  deleteButtonContainer: { marginLeft: 10 },
});
  