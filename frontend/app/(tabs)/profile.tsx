import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutStore } from '../../store/workoutStore';

export default function ProfileScreen() {
  const { workouts, stats } = useWorkoutStore();

  const InfoCard = ({
    icon,
    label,
    value,
  }: {
    icon: any;
    label: string;
    value: string;
  }) => (
    <View style={styles.infoCard}>
      <Ionicons name={icon} size={24} color="#4CAF50" />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const MenuItem = ({
    icon,
    title,
    onPress,
  }: {
    icon: any;
    title: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={24} color="#fff" />
        <Text style={styles.menuItemText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color="#fff" />
          </View>
          <Text style={styles.userName}>Fitness Enthusiast</Text>
          <Text style={styles.userSubtitle}>Keep pushing your limits!</Text>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsSection}>
          <InfoCard
            icon="barbell"
            label="Total Workouts"
            value={stats?.total_workouts?.toString() || '0'}
          />
          <InfoCard
            icon="time"
            label="Total Minutes"
            value={stats?.total_duration?.toString() || '0'}
          />
          <InfoCard
            icon="calendar"
            label="This Month"
            value={stats?.workouts_this_month?.toString() || '0'}
          />
        </View>

        {/* Menu Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="notifications" title="Notifications" />
            <MenuItem icon="trophy" title="Goals & Targets" />
            <MenuItem icon="analytics" title="Detailed Statistics" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="information-circle" title="About App" />
            <MenuItem icon="help-circle" title="Help & Support" />
            <MenuItem
              icon="star"
              title="Rate Us"
              onPress={() => {
                // Add app store link
              }}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Fitness Tracker v1.0</Text>
          <Text style={styles.appInfoText}>Made with 💪 for fitness enthusiasts</Text>
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
    alignItems: 'center',
    padding: 32,
    paddingTop: 40,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 4,
  },
  statsSection: {
    padding: 16,
    gap: 12,
  },
  infoCard: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 16,
  },
  appInfo: {
    alignItems: 'center',
    padding: 32,
  },
  appInfoText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
});