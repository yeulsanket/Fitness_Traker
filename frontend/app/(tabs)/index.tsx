import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pedometer } from 'expo-sensors';
import { useWorkoutStore } from '../../store/workoutStore';
import { format } from 'date-fns';

export default function HomeScreen() {
  const {
    currentWorkout,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    saveWorkout,
    loading,
    steps,
    updateSteps,
    saveSteps,
  } = useWorkoutStore();

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [sets, setSets] = useState([{ reps: 10, weight: 0 }]);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [isPedometerAvailable, setIsPedometerAvailable] = useState(false);
  const [pastStepCount, setPastStepCount] = useState(0);

  const exercises = [
    { name: 'Bench Press', category: 'Chest' },
    { name: 'Squats', category: 'Legs' },
    { name: 'Deadlifts', category: 'Back' },
    { name: 'Overhead Press', category: 'Shoulders' },
    { name: 'Bicep Curls', category: 'Arms' },
    { name: 'Pull Ups', category: 'Back' },
    { name: 'Lunges', category: 'Legs' },
    { name: 'Planks', category: 'Core' },
  ];

  useEffect(() => {
    // Check if pedometer is available and subscribe to step updates
    const subscribe = async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      setIsPedometerAvailable(isAvailable);

      if (isAvailable) {
        // Get steps from past 24 hours
        const end = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const pastStepCountResult = await Pedometer.getStepCountAsync(start, end);
        if (pastStepCountResult) {
          setPastStepCount(pastStepCountResult.steps);
          updateSteps(pastStepCountResult.steps);
        }

        // Subscribe to real-time updates
        return Pedometer.watchStepCount((result) => {
          const totalSteps = pastStepCount + result.steps;
          updateSteps(totalSteps);
        });
      }
    };

    const subscription = subscribe();

    return () => {
      subscription.then((sub) => sub && sub.remove());
    };
  }, [pastStepCount]);

  useEffect(() => {
    // Save steps to backend every time steps update
    if (steps > 0) {
      const today = format(new Date(), 'yyyy-MM-dd');
      saveSteps(today, steps);
    }
  }, [steps]);

  const handleAddExercise = (exercise: any) => {
    setSelectedExercise(exercise);
    setSets([{ reps: 10, weight: 0 }]);
    setShowExerciseModal(true);
  };

  const handleSaveExercise = () => {
    if (selectedExercise) {
      addExerciseToWorkout({
        name: selectedExercise.name,
        category: selectedExercise.category,
        sets: sets.map((s) => ({ ...s, completed: true })),
      });
      setShowExerciseModal(false);
      setSelectedExercise(null);
    }
  };

  const handleSaveWorkout = async () => {
    if (currentWorkout.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      await saveWorkout(today, duration ? parseInt(duration) : undefined, notes);
      Alert.alert('Success', 'Workout saved successfully!');
      setDuration('');
      setNotes('');
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout');
    }
  };

  const addSet = () => {
    setSets([...sets, { reps: 10, weight: 0 }]);
  };

  const updateSet = (index: number, field: string, value: string) => {
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: parseFloat(value) || 0 };
    setSets(newSets);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Steps Card */}
        <View style={styles.stepsCard}>
          <View style={styles.stepsHeader}>
            <Ionicons name="footsteps" size={28} color="#4CAF50" />
            <Text style={styles.stepsTitle}>Today's Steps</Text>
          </View>
          <Text style={styles.stepsCount}>{steps.toLocaleString()}</Text>
          {!isPedometerAvailable && (
            <Text style={styles.stepsSubtext}>Pedometer not available</Text>
          )}
        </View>

        {/* Current Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>

          {currentWorkout.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color="#666" />
              <Text style={styles.emptyText}>No exercises added yet</Text>
            </View>
          ) : (
            currentWorkout.map((exercise, index) => (
              <View key={index} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseCategory}>{exercise.category}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeExerciseFromWorkout(index)}>
                    <Ionicons name="trash-outline" size={24} color="#f44336" />
                  </TouchableOpacity>
                </View>
                <View style={styles.setsInfo}>
                  {exercise.sets.map((set, i) => (
                    <Text key={i} style={styles.setText}>
                      Set {i + 1}: {set.reps} reps × {set.weight}kg
                    </Text>
                  ))}
                </View>
              </View>
            ))
          )}

          {/* Add Exercise Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowExerciseModal(true)}
          >
            <Ionicons name="add-circle" size={24} color="#4CAF50" />
            <Text style={styles.addButtonText}>Add Exercise</Text>
          </TouchableOpacity>

          {/* Duration and Notes */}
          {currentWorkout.length > 0 && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Duration (minutes)"
                placeholderTextColor="#666"
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes (optional)"
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveWorkout}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save Workout'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Exercise Selection Modal */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!selectedExercise ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Exercise</Text>
                  <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {exercises.map((exercise, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.exerciseOption}
                      onPress={() => handleAddExercise(exercise)}
                    >
                      <Text style={styles.exerciseOptionName}>{exercise.name}</Text>
                      <Text style={styles.exerciseOptionCategory}>
                        {exercise.category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedExercise.name}</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedExercise(null);
                      setShowExerciseModal(false);
                    }}
                  >
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {sets.map((set, index) => (
                    <View key={index} style={styles.setInput}>
                      <Text style={styles.setLabel}>Set {index + 1}</Text>
                      <View style={styles.setInputRow}>
                        <TextInput
                          style={styles.setInputField}
                          placeholder="Reps"
                          placeholderTextColor="#666"
                          keyboardType="numeric"
                          value={set.reps.toString()}
                          onChangeText={(val) => updateSet(index, 'reps', val)}
                        />
                        <TextInput
                          style={styles.setInputField}
                          placeholder="Weight (kg)"
                          placeholderTextColor="#666"
                          keyboardType="numeric"
                          value={set.weight.toString()}
                          onChangeText={(val) => updateSet(index, 'weight', val)}
                        />
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addSetButton} onPress={addSet}>
                    <Ionicons name="add" size={20} color="#4CAF50" />
                    <Text style={styles.addSetText}>Add Set</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveExerciseButton}
                    onPress={handleSaveExercise}
                  >
                    <Text style={styles.saveButtonText}>Save Exercise</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollView: {
    flex: 1,
  },
  stepsCard: {
    backgroundColor: '#1E1E1E',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  stepsCount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  stepsSubtext: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  exerciseCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  exerciseCategory: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
  },
  setsInfo: {
    marginTop: 8,
  },
  setText: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  exerciseOption: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  exerciseOptionName: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  exerciseOptionCategory: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
  },
  setInput: {
    padding: 16,
  },
  setLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  setInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  setInputField: {
    flex: 1,
    backgroundColor: '#121212',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
  },
  addSetText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  saveExerciseButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
  },
});