import React, { useState, useEffect } from 'react';
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
import { format, addDays, differenceInDays } from 'date-fns';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { theme } from '../theme/colors';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export const DashboardScreen = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  
  // Mockup data - in a real app, this would come from the same state as PeriodTrackingScreen
  const [cycleLength] = useState(28);
  const [periodLength] = useState(7);
  const [lastPeriodStartDate] = useState(new Date(2023, 3, 10)); // April 10, 2023
  const [currentDate] = useState(new Date());
  const [progress] = useState(new Animated.Value(0));
  const [tips] = useState([
    { icon: 'water', text: 'Stay hydrated', color: theme.colors.clay },
    { icon: 'bed', text: 'Get extra rest', color: theme.colors.sage },
    { icon: 'spa', text: 'Try meditation', color: theme.colors.earth },
    { icon: 'utensils', text: 'Eat iron-rich foods', color: theme.colors.terracotta },
  ]);

  // Calculate cycle day
  const daysSinceLastPeriod = differenceInDays(currentDate, lastPeriodStartDate);
  const cycleDay = (daysSinceLastPeriod % cycleLength) + 1;
  
  // Calculate next period
  const daysUntilNextPeriod = cycleLength - cycleDay;
  const nextPeriodDate = addDays(currentDate, daysUntilNextPeriod);
  
  // Calculate fertility window (approximately days 11-17 of cycle)
  const isFertileWindow = cycleDay >= 11 && cycleDay <= 17;
  const isOvulationDay = cycleDay === 14;
  const isPeriodActive = cycleDay <= periodLength;

  // Calculate phase
  const getCyclePhase = () => {
    if (cycleDay <= periodLength) {
      return {
        name: 'Menstrual Phase',
        color: theme.colors.periodDay,
        description: 'Your period is active.'
      };
    } else if (cycleDay <= 10) {
      return {
        name: 'Follicular Phase',
        color: theme.colors.sand,
        description: 'Your body is preparing for ovulation.'
      };
    } else if (cycleDay <= 17) {
      return {
        name: 'Ovulatory Phase',
        color: theme.colors.ovulationDay,
        description: isOvulationDay ? 'You are ovulating today!' : 'You are in your fertility window.'
      };
    } else {
      return {
        name: 'Luteal Phase',
        color: theme.colors.clay,
        description: 'Your body is preparing for your next period.'
      };
    }
  };

  const phase = getCyclePhase();

  // Animate progress
  useEffect(() => {
    Animated.timing(progress, {
      toValue: cycleDay / cycleLength,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, []);

  const progressInterpolate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

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
        <View style={[styles.phaseCard, { borderLeftColor: phase.color }]}>
          <View style={styles.phaseCardContent}>
            <View style={styles.phaseTextContainer}>
              <Text style={styles.greetingText}>
                Hi there, today is cycle day {cycleDay}
              </Text>
              <Text style={styles.phaseTitle}>{phase.name}</Text>
              <Text style={styles.phaseDescription}>{phase.description}</Text>
            </View>
            <View 
              style={[
                styles.phaseIconContainer, 
                { backgroundColor: phase.color }
              ]}
            >
              <Ionicons 
                name={isPeriodActive ? "water" : isFertileWindow ? "flower" : "leaf"} 
                size={32} 
                color={theme.colors.surface} 
              />
            </View>
          </View>
        </View>

        {/* Cycle Progress */}
        <View style={styles.cycleProgressCard}>
          <Text style={styles.cycleProgressTitle}>
            Cycle Day {cycleDay} of {cycleLength}
          </Text>
          
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar, 
                { width: progressInterpolate, backgroundColor: phase.color }
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
            {daysUntilNextPeriod <= 7 ? (
              <>
                <Text style={styles.upcomingEventTitle}>Period in {daysUntilNextPeriod} days</Text>
                <Text style={styles.upcomingEventDate}>
                  Expected on {format(nextPeriodDate, 'MMMM dd, yyyy')}
                </Text>
              </>
            ) : isOvulationDay ? (
              <>
                <Text style={styles.upcomingEventTitle}>You are ovulating today</Text>
                <Text style={styles.upcomingEventDate}>
                  Your fertility is at its peak
                </Text>
              </>
            ) : isFertileWindow ? (
              <>
                <Text style={styles.upcomingEventTitle}>Fertile Window</Text>
                <Text style={styles.upcomingEventDate}>
                  You're in your fertility window
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.upcomingEventTitle}>Period in {daysUntilNextPeriod} days</Text>
                <Text style={styles.upcomingEventDate}>
                  Expected on {format(nextPeriodDate, 'MMMM dd, yyyy')}
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Log Symptoms</Text>
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