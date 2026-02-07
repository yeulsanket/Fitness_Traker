import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { useWorkoutStore } from '../../store/workoutStore';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

export default function ProgressScreen() {
  const { workouts, stats, fetchWorkouts, fetchStats } = useWorkoutStore();
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchWorkouts();
    fetchStats();
  }, []);

  useEffect(() => {
    if (workouts.length > 0) {
      // Prepare data for last 7 days
      const last7Days = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const workoutsOnDay = workouts.filter((w) => w.date === dateStr);
        const totalExercises = workoutsOnDay.reduce(
          (sum, w) => sum + w.exercises.length,
          0
        );

        last7Days.push({
          value: totalExercises,
          label: format(date, 'EEE'),
          date: dateStr,
        });
      }

      setChartData(last7Days);
    }
  }, [workouts]);

  const StatCard = ({
    icon,
    title,
    value,
    color,
  }: {
    icon: any;
    title: string;
    value: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={28} color={color} />
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Progress</Text>
          <Text style={styles.headerSubtitle}>Keep up the great work!</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="barbell"
            title="Total Workouts"
            value={stats?.total_workouts?.toString() || '0'}
            color="#4CAF50"
          />
          <StatCard
            icon="time"
            title="Total Minutes"
            value={stats?.total_duration?.toString() || '0'}
            color="#2196F3"
          />
          <StatCard
            icon="calendar"
            title="This Week"
            value={stats?.workouts_this_week?.toString() || '0'}
            color="#FF9800"
          />
          <StatCard
            icon="footsteps"
            title="Steps Today"
            value={stats?.total_steps_today?.toLocaleString() || '0'}
            color="#9C27B0"
          />
        </View>

        {/* Weekly Activity Chart */}
        {chartData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Weekly Activity</Text>
            <Text style={styles.chartSubtitle}>Exercises completed per day</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={chartData}
                width={screenWidth - 80}
                height={200}
                barWidth={32}
                spacing={16}
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: '#888' }}
                noOfSections={4}
                maxValue={Math.max(...chartData.map((d) => d.value), 10)}
                frontColor="#4CAF50"
                gradientColor="#81C784"
                showGradient
                roundedTop
                roundedBottom
                isAnimated
                animationDuration={500}
                xAxisLabelTextStyle={{
                  color: '#888',
                  fontSize: 12,
                  marginTop: 4,
                }}
              />
            </View>
          </View>
        )}

        {/* Workout Streak */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Ionicons name="flame" size={32} color="#FF5722" />
            <Text style={styles.streakTitle}>Workout Streak</Text>
          </View>
          <Text style={styles.streakValue}>
            {stats?.workouts_this_week || 0} day{stats?.workouts_this_week !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.streakSubtitle}>This week</Text>
        </View>

        {/* Goals Section */}
        <View style={styles.goalsCard}>
          <Text style={styles.goalsTitle}>Weekly Goals</Text>
          <View style={styles.goalItem}>
            <View style={styles.goalInfo}>
              <Ionicons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.goalText}>3 Workouts per week</Text>
            </View>
            <Text
              style={[
                styles.goalStatus,
                (stats?.workouts_this_week || 0) >= 3 && styles.goalCompleted,
              ]}
            >
              {stats?.workouts_this_week || 0}/3
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(((stats?.workouts_this_week || 0) / 3) * 100, 100)}%`,
                },
              ]}
            />
          </View>
        </View>
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
  statsGrid: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  statContent: {
    marginLeft: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statTitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
  },
  streakCard: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  streakValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  streakSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  goalsCard: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 20,
    borderRadius: 12,
  },
  goalsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
  },
  goalStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
  },
  goalCompleted: {
    color: '#4CAF50',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
});