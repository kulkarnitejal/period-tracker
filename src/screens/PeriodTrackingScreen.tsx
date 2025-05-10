import React, { useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { format } from 'date-fns';
import { FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/colors';
import { usePeriodContext } from '../context/PeriodContext';

export const PeriodTrackingScreen = () => {
  const {
    selectedDate,
    setSelectedDate,
    periodLength,
    setPeriodLength,
    customPeriodDays,
    setCustomPeriodDays,
    isEditMode,
    setIsEditMode,
    currentPhase,
  } = usePeriodContext();

  const [currentViewDate, setCurrentViewDate] = React.useState(format(new Date(), 'yyyy-MM-dd'));
  const [clickedDate, setClickedDate] = React.useState<string | null>(null);
  const [cycleInfo, setCycleInfo] = React.useState(currentPhase);
  const currentDate = format(new Date(), 'yyyy-MM-dd');

  // Add a utility function for date manipulation without timezone issues
  const addDaysToDateString = (dateString: string, days: number): string => {
    // Parse the date components directly
    const [year, month, day] = dateString.split('-').map(Number);
    
    // Create a date at noon to avoid timezone issues
    const date = new Date(year, month - 1, day, 12, 0, 0);
    date.setDate(date.getDate() + days);
    
    // Format back to YYYY-MM-DD
    return format(date, 'yyyy-MM-dd');
  };

  const markedDates = useMemo(() => {
    const dates: any = {};
    
    // First add all phase colors
    if (!isEditMode && selectedDate) {
      // Helper function to add phase days with connected styling
      const addPhasedays = (startDay: number, endDay: number, color: string, cycleStartDate: string) => {
        for (let i = startDay; i <= endDay; i++) {
          const date = addDaysToDateString(cycleStartDate, i);
          dates[date] = {
            selected: true,
            selectedColor: color,
            customContainerStyle: {
              borderRadius: 0, // Make edges straight to connect days
            }
          };
        }
      };

      // Function to add all phases for a cycle
      const addCyclePhases = (cycleStartDate: string, isPredicted: boolean = false) => {
        // Menstrual Phase
        addPhasedays(0, periodLength - 1, 
          isPredicted ? theme.colors.predictedPeriodDay : theme.colors.periodDay,
          cycleStartDate
        );

        // Follicular Phase (after period until ovulation)
        addPhasedays(periodLength, 13, 
          `${theme.colors.sage}30`, // Subtle sage color
          cycleStartDate
        );

        // Ovulation Phase
        addPhasedays(14, 16, 
          theme.colors.ovulationDay,
          cycleStartDate
        );

        // Luteal Phase
        addPhasedays(17, 27, 
          `${theme.colors.terracotta}20`, // Very subtle terracotta
          cycleStartDate
        );
      };

      // Add current and future cycle phases
      addCyclePhases(selectedDate);
      for (let cycle = 1; cycle <= 24; cycle++) {
        const cycleStartDate = addDaysToDateString(selectedDate, 28 * cycle);
        addCyclePhases(cycleStartDate, true);
      }
    }

    // Add edit mode selections
    if (isEditMode) {
      customPeriodDays.forEach(day => {
        dates[day] = {
          selected: true,
          selectedColor: theme.colors.periodDay,
          customContainerStyle: {
            borderRadius: 0,
          }
        };
      });
    }

    // Always add today's date styling last to ensure it's visible
    dates[currentDate] = {
      ...dates[currentDate],
      selected: true,
      customTextStyle: {
        color: theme.colors.earth,
        fontWeight: '600',
        fontSize: 16,
      },
      customContainerStyle: {
        ...dates[currentDate]?.customContainerStyle,
        borderWidth: 2,
        borderColor: theme.colors.earth,
        backgroundColor: dates[currentDate]?.selectedColor || 'transparent',
      }
    };

    return dates;
  }, [selectedDate, periodLength, isEditMode, customPeriodDays, currentDate]);

  const onDayPress = (day: DateData) => {
    const selectedDateString = day.dateString;
    console.log('Day pressed:', selectedDateString);

    if (isEditMode) {
      const isAlreadySelected = customPeriodDays.includes(selectedDateString);
      
      if (isAlreadySelected) {
        setCustomPeriodDays(customPeriodDays.filter(date => date !== selectedDateString));
      } else {
        setCustomPeriodDays([...customPeriodDays, selectedDateString]);
      }
    } else {
      setClickedDate(selectedDateString);
      setCycleInfo(currentPhase);
    }
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      // Exiting edit mode
      if (customPeriodDays.length > 0) {
        // If there are selected days, update the period data
        const sortedDays = [...customPeriodDays].sort();
        setSelectedDate(sortedDays[0]);
        setPeriodLength(customPeriodDays.length);
      } else {
        // If all days were removed, reset the period data
        setSelectedDate(null);
        setPeriodLength(0);
        setCustomPeriodDays([]);
      }
      setClickedDate(null);
      setCycleInfo(currentPhase);
    } else {
      // Entering edit mode
      setClickedDate(null);
      setCycleInfo(currentPhase);
      
      // Only populate custom days if we have a selected date and no custom days
      if (selectedDate && customPeriodDays.length === 0) {
        const newCustomDays = [];
        for (let i = 0; i < periodLength; i++) {
          newCustomDays.push(addDaysToDateString(selectedDate, i));
        }
        setCustomPeriodDays(newCustomDays);
      }
      
      // Set the current view to the selected date or today
      if (selectedDate) {
        setCurrentViewDate(selectedDate);
      } else {
        const today = format(new Date(), 'yyyy-MM-dd');
        setCurrentViewDate(today);
      }
    }
    
    setIsEditMode(!isEditMode);
  };

  const handleTodayPress = () => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    setCurrentViewDate(todayStr);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Calendar</Text>

        <View style={styles.calendarContainer}>
          {isEditMode ? (
            <View style={styles.editModeInfo}>
              <Text style={styles.editModeText}>
                Tap days to select/unselect your period days
              </Text>
              <Text style={styles.editModeText}>
                Selected: {customPeriodDays.length} days
              </Text>
            </View>
          ) : (
            <View style={styles.calendarHeaderRow}>
              <TouchableOpacity 
                style={styles.todayButton}
                onPress={handleTodayPress}
              >
                <Text style={styles.todayButtonText}>Today</Text>
              </TouchableOpacity>
            </View>
          )}

          <Calendar
            current={currentViewDate}
            initialDate={currentViewDate}
            key={currentViewDate}
            onDayPress={onDayPress}
            onMonthChange={(date: DateData) => setCurrentViewDate(date.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: theme.colors.background,
              calendarBackground: theme.colors.surface,
              textSectionTitleColor: theme.colors.moss,
              textSectionTitleDisabledColor: theme.colors.neutral300,
              selectedDayBackgroundColor: theme.colors.selectedDay,
              selectedDayTextColor: theme.colors.surface,
              todayTextColor: theme.colors.earth,
              todayBackgroundColor: 'transparent',
              dayTextColor: theme.colors.textPrimary,
              textDisabledColor: theme.colors.neutral300,
              monthTextColor: theme.colors.textPrimary,
              indicatorColor: theme.colors.sage,
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '600',
              textDayHeaderFontSize: 13,
              'stylesheet.calendar.header': {
                dayHeader: {
                  color: theme.colors.moss,
                  fontWeight: '600',
                  fontSize: 13,
                }
              },
              'stylesheet.day.basic': {
                base: {
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 18,
                  overflow: 'hidden',
                },
                today: {
                  borderWidth: 3,
                  borderColor: theme.colors.earth,
                },
                todayText: {
                  color: theme.colors.earth,
                  fontWeight: '700',
                  fontSize: 16,
                },
                selected: {

                }
              }
            }}
            enableSwipeMonths={true}
            hideArrows={true}
            maxDate={format(new Date(2025, 11, 31), 'yyyy-MM-dd')}
          />

          <View style={styles.fabSpacing} />

          <FAB
            icon={isEditMode ? "check" : "pencil"}
            onPress={toggleEditMode}
            style={[styles.fab, { backgroundColor: isEditMode ? theme.colors.earth : theme.colors.clay }]}
            color={theme.colors.surface}
            size="small"
          />
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>
            {clickedDate && !isEditMode 
              ? format(new Date(clickedDate), 'MMMM d, yyyy') 
              : 'Cycle Information'}
          </Text>
          
          {cycleInfo && !isEditMode ? (
            <View style={styles.cyclePhaseInfo}>
              <View style={styles.phaseHeader}>
                <View 
                  style={[
                    styles.phaseIndicator, 
                    { backgroundColor: cycleInfo.color || theme.colors.neutral500 }
                  ]} 
                />
                <Text style={styles.phaseName}>
                  {cycleInfo.name}
                </Text>
              </View>
              
              <Text style={styles.phaseDescription}>
                {cycleInfo.description}
              </Text>
              
              {cycleInfo.tips && cycleInfo.tips.length > 0 && (
                <View style={styles.tipsContainer}>
                  <Text style={styles.tipsTitle}>Tips:</Text>
                  {cycleInfo.tips.map((tip: string, index: number) => (
                    <Text key={index} style={styles.tipItem}>
                      • {tip}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ) : (
            !isEditMode && (
              <Text style={styles.instructionText}>
                {selectedDate 
                  ? 'Tap on any date to see detailed cycle information.' 
                  : 'Use the edit button to log your period days.'}
              </Text>
            )
          )}
          
          {isEditMode && selectedDate && (
            <>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: theme.colors.periodDay }]} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Period</Text>
                  <Text style={styles.infoText}>
                    {customPeriodDays.length > 0
                      ? `${format(new Date(customPeriodDays[0]), 'MMMM dd')} - ${format(new Date(customPeriodDays[customPeriodDays.length - 1]), 'MMMM dd, yyyy')}`
                      : 'Select days to update cycle predictions'
                    }
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.periodDay }]} />
            <Text style={styles.legendText}>Current Period</Text>
          </View>
          {!isEditMode && (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.predictedPeriodDay }]} />
                <Text style={styles.legendText}>Predicted Period</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.colors.ovulationDay }]} />
                <Text style={styles.legendText}>Ovulation</Text>
              </View>
            </>
          )}
        </View>
      </View>
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
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  calendarContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    position: 'relative',
    shadowColor: theme.colors.neutral500,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.sage,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  todayButton: {
    backgroundColor: theme.colors.neutral100,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.earth,
  },
  todayButtonText: {
    color: theme.colors.earth,
    fontSize: 14,
    fontWeight: '600',
  },
  fabSpacing: {
    height: 28, // Provides space for the FAB
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  editModeInfo: {
    marginBottom: theme.spacing.sm,
  },
  editModeText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    marginBottom: theme.spacing.xs,
  },
  infoContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  infoTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: theme.spacing.sm,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  infoText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    shadowColor: theme.colors.neutral500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral100,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.xs,
  },
  legendText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  cyclePhaseInfo: {
    marginBottom: theme.spacing.md,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  phaseIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: theme.spacing.sm,
  },
  phaseName: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  phaseDescription: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginVertical: theme.spacing.sm,
  },
  tipsContainer: {
    marginTop: theme.spacing.sm,
  },
  tipsTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  tipItem: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginBottom: theme.spacing.xs,
    paddingLeft: theme.spacing.xs,
  },
  instructionText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: theme.spacing.md,
  },
}); 