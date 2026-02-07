import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ExerciseSet {
  reps: number;
  weight: number;
  completed: boolean;
}

interface Exercise {
  name: string;
  category: string;
  sets: ExerciseSet[];
}

interface Workout {
  _id?: string;
  date: string;
  exercises: Exercise[];
  duration?: number;
  notes?: string;
  created_at?: string;
}

interface WorkoutStore {
  workouts: Workout[];
  currentWorkout: Exercise[];
  loading: boolean;
  error: string | null;
  stats: any;
  steps: number;
  
  // Workout actions
  addExerciseToWorkout: (exercise: Exercise) => void;
  removeExerciseFromWorkout: (index: number) => void;
  updateExerciseInWorkout: (index: number, exercise: Exercise) => void;
  clearCurrentWorkout: () => void;
  
  // API actions
  fetchWorkouts: () => Promise<void>;
  saveWorkout: (date: string, duration?: number, notes?: string) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  updateSteps: (steps: number) => void;
  saveSteps: (date: string, steps: number) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  workouts: [],
  currentWorkout: [],
  loading: false,
  error: null,
  stats: null,
  steps: 0,

  addExerciseToWorkout: (exercise) => {
    set((state) => ({
      currentWorkout: [...state.currentWorkout, exercise],
    }));
  },

  removeExerciseFromWorkout: (index) => {
    set((state) => ({
      currentWorkout: state.currentWorkout.filter((_, i) => i !== index),
    }));
  },

  updateExerciseInWorkout: (index, exercise) => {
    set((state) => ({
      currentWorkout: state.currentWorkout.map((ex, i) =>
        i === index ? exercise : ex
      ),
    }));
  },

  clearCurrentWorkout: () => {
    set({ currentWorkout: [] });
  },

  fetchWorkouts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/api/workouts`);
      set({ workouts: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  saveWorkout: async (date, duration, notes) => {
    set({ loading: true, error: null });
    try {
      const workout = {
        date,
        exercises: get().currentWorkout,
        duration,
        notes,
      };
      await axios.post(`${API_URL}/api/workouts`, workout);
      set({ currentWorkout: [], loading: false });
      await get().fetchWorkouts();
      await get().fetchStats();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteWorkout: async (id) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${API_URL}/api/workouts/${id}`);
      set({ loading: false });
      await get().fetchWorkouts();
      await get().fetchStats();
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/api/workouts/stats/summary`);
      set({ stats: response.data });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  },

  updateSteps: (steps) => {
    set({ steps });
  },

  saveSteps: async (date, steps) => {
    try {
      await axios.post(`${API_URL}/api/steps`, { date, steps });
      await get().fetchStats();
    } catch (error: any) {
      console.error('Error saving steps:', error);
    }
  },
}));