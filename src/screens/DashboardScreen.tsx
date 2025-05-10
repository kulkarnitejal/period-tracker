import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../theme/colors';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { usePeriodContext } from '../context/PeriodContext';

const { width } = Dimensions.get('window');

// Define valid FontAwesome5 icon types
type FontAwesome5IconName = 
  | 'tint'
  | 'bed'
  | 'running'
  | 'utensils'
  | 'bolt'
  | 'spa'
  | 'apple-alt'
  | 'temperature-high'
  | 'dumbbell'
  | 'smile-beam'
  | 'heartbeat'
  | 'notes-medical'
  | 'info-circle';

export const DashboardScreen = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const {
    cycleDay,
    currentPhase,
    nextPeriodDate,
    ovulationDates,
  } = usePeriodContext();

  const progress = React.useRef(new Animated.Value(0)).current;

  // Animate progress when cycle day changes
  React.useEffect(() => {
    Animated.timing(progress, {
      toValue: cycleDay / 28,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [cycleDay]);

  const progressInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Helper function to determine icon based on tip content
  const getTipIcon = (tip: string): FontAwesome5IconName => {
    const tipLower = tip.toLowerCase();
    if (tipLower.includes('hydrated') || tipLower.includes('water')) return 'tint';
    if (tipLower.includes('rest') || tipLower.includes('sleep')) return 'bed';
    if (tipLower.includes('exercise') || tipLower.includes('workout')) return 'running';
    if (tipLower.includes('food') || tipLower.includes('eat')) return 'utensils';
    if (tipLower.includes('energy')) return 'bolt';
    if (tipLower.includes('meditation') || tipLower.includes('self-care')) return 'spa';
    if (tipLower.includes('iron') || tipLower.includes('nutrition')) return 'apple-alt';
    if (tipLower.includes('heat') || tipLower.includes('warm')) return 'temperature-high';
    if (tipLower.includes('strength') || tipLower.includes('training')) return 'dumbbell';
    if (tipLower.includes('skin') || tipLower.includes('beauty')) return 'smile-beam';
    if (tipLower.includes('fertility')) return 'heartbeat';
    if (tipLower.includes('pms') || tipLower.includes('symptoms')) return 'notes-medical';
    return 'info-circle';
  };

  const tips = React.useMemo(() => {
    return currentPhase.tips.slice(0, 4).map(tip => ({
      text: tip,
      icon: getTipIcon(tip),
      color: currentPhase.color,
    }));
  }, [currentPhase]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cycle Dashboard</Text>
          <TouchableOpacity 
            style={styles.calendarButton}
            onPress={() => navigation.navigate('Calendar')}
          >
            <Ionicons name="calendar" size={24} color={theme.colors.earth} />
          </TouchableOpacity>
        </View>

        {/* Current Phase Card */}
        <View style={[styles.phaseCard, { borderLeftColor: currentPhase.color }]}>
          <View style={styles.phaseCardContent}>
            <View style={styles.phaseTextContainer}>
              <Text style={styles.phaseTitle}>{currentPhase.name}</Text>
              <Text style={styles.phaseDescription}>{currentPhase.description}</Text>
            </View>
            <View 
              style={[
                styles.phaseIconContainer, 
                { backgroundColor: currentPhase.color }
              ]}
            >
              <Ionicons 
                name={getPhaseIcon(currentPhase.name)}
                size={32} 
                color={theme.colors.surface} 
              />
            </View>
          </View>
        </View>

        {/* Cycle Progress */}
        <View style={styles.cycleProgressCard}>
          <Text style={styles.cycleProgressTitle}>
            Cycle Day {cycleDay} of 28
          </Text>
          
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar, 
                { 
                  width: progressInterpolate,
                  backgroundColor: currentPhase.color 
                }
              ]} 
            />
          </View>

          <View style={styles.cycleMilestones}>
            <View style={styles.milestoneDot}>
              <View style={[styles.dot, { backgroundColor: theme.colors.periodDay }]} />
              <Text style={styles.milestoneText}>Period</Text>
            </View>
            <View style={styles.milestoneDot}>
              <View style={[styles.dot, { backgroundColor: theme.colors.ovulationDay }]} />
              <Text style={styles.milestoneText}>Ovulation</Text>
            </View>
            <View style={styles.milestoneDot}>
              <View style={[styles.dot, { backgroundColor: theme.colors.predictedPeriodDay }]} />
              <Text style={styles.milestoneText}>Next Period</Text>
            </View>
          </View>
        </View>

        {/* Next Event Card */}
        <View style={styles.upcomingEventCard}>
          <View style={styles.upcomingEventHeader}>
            <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.upcomingEventHeaderText}>Coming Up</Text>
          </View>

          <View style={styles.upcomingEventContent}>
            {nextPeriodDate ? (
              <>
                <Text style={styles.upcomingEventTitle}>
                  Period in {Math.max(28 - cycleDay, 0)} days
                </Text>
                <Text style={styles.upcomingEventDate}>
                  Expected on {format(new Date(nextPeriodDate), 'MMMM dd, yyyy')}
                </Text>
              </>
            ) : (
              <Text style={styles.upcomingEventTitle}>
                Set your period start date in Calendar
              </Text>
            )}
          </View>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Calendar')}
          >
            <Text style={styles.actionButtonText}>Update Calendar</Text>
          </TouchableOpacity>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Text style={styles.tipsHeaderText}>Tips for Today</Text>
          </View>

          <View style={styles.tipsContainer}>
            {tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={[styles.tipIconContainer, { backgroundColor: tip.color }]}>
                  <FontAwesome5 name={tip.icon} size={16} color={theme.colors.surface} />
                </View>
                <Text style={styles.tipText}>{tip.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Mood Tracking */}
        <View style={styles.moodTrackingCard}>
          <Text style={styles.moodTrackingTitle}>How are you feeling today?</Text>
          
          <View style={styles.moodOptions}>
            <TouchableOpacity style={styles.moodOption}>
              <Ionicons name="happy-outline" size={28} color={theme.colors.earth} />
              <Text style={styles.moodText}>Happy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moodOption}>
              <Ionicons name="sad-outline" size={28} color={theme.colors.clay} />
              <Text style={styles.moodText}>Sad</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moodOption}>
              <Ionicons name="flash-outline" size={28} color={theme.colors.terracotta} />
              <Text style={styles.moodText}>Energetic</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.moodOption}>
              <Ionicons name="bed-outline" size={28} color={theme.colors.sage} />
              <Text style={styles.moodText}>Tired</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function to get phase icon
const getPhaseIcon = (phaseName: string): keyof typeof Ionicons.glyphMap => {
  switch (phaseName) {
    case 'Menstrual Phase':
      return 'water-outline';
    case 'Follicular Phase':
      return 'leaf-outline';
    case 'Ovulatory Phase':
      return 'sunny-outline';
    case 'Luteal Phase':
      return 'moon-outline';
    default:
      return 'information-circle-outline';
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  calendarButton: {
    padding: theme.spacing.sm,
  },
  phaseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.neutral500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
  },
  phaseCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  phaseTextContainer: {
    flex: 1,
  },
  greetingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  phaseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  phaseDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  phaseIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  cycleProgressCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.neutral500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cycleProgressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: theme.colors.neutral200,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  cycleMilestones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneDot: {
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  milestoneText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  upcomingEventCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.neutral500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  upcomingEventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  upcomingEventHeaderText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  upcomingEventContent: {
    marginBottom: theme.spacing.md,
  },
  upcomingEventTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  upcomingEventDate: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  actionButton: {
    backgroundColor: theme.colors.earth,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
  },
  actionButtonText: {
    color: theme.colors.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  tipsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.neutral500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsHeader: {
    marginBottom: theme.spacing.md,
  },
  tipsHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  tipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  tipIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  moodTrackingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.neutral500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodTrackingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  moodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    alignItems: 'center',
  },
  moodText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
}); 