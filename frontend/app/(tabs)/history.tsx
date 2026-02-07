import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '../../store/workoutStore';
import { format, parseISO } from 'date-fns';

export default function HistoryScreen() {
  const { workouts, fetchWorkouts, deleteWorkout, loading } = useWorkoutStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorkouts();
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWorkout(id),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4CAF50"
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Workout History</Text>
          <Text style={styles.headerSubtitle}>
            {workouts.length} workout{workouts.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No workouts recorded yet</Text>
            <Text style={styles.emptySubtext}>
              Start logging your workouts to see them here
            </Text>
          </View>
        ) : (
          workouts.map((workout) => (
            <View key={workout._id} style={styles.workoutCard}>
              <View style={styles.workoutHeader}>
                <View>
                  <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
                  {workout.duration && (
                    <View style={styles.durationBadge}>
                      <Ionicons name="time-outline" size={14} color="#4CAF50" />
                      <Text style={styles.durationText}>
                        {workout.duration} min
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(workout._id!)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={22} color="#f44336" />
                </TouchableOpacity>
              </View>

              <View style={styles.exercisesList}>
                {workout.exercises.map((exercise, index) => (
                  <View key={index} style={styles.exerciseItem}>
                    <View style={styles.exerciseIcon}>
                      <Ionicons name="barbell" size={18} color="#4CAF50" />
                    </View>
                    <View style={styles.exerciseDetails}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseInfo}>
                        {exercise.sets.length} set{exercise.sets.length > 1 ? 's' : ''}
                        {' • '}
                        {exercise.category}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {workout.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{workout.notes}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
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
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  workoutCard: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  workoutDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  durationText: {
    color: '#4CAF50',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 4,
  },
  exercisesList: {
    gap: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  exerciseInfo: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  notesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
});