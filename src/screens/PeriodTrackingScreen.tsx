import React, { useState, useMemo, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { addDays, format, differenceInDays, isBefore, isAfter } from 'date-fns';
import { FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme/colors';

const CYCLE_LENGTH = 28;
const OVULATION_LENGTH = 3;
const DEFAULT_PERIOD_LENGTH = 7;
const PREDICTION_CYCLES = 24; // Show predictions for 2 years (24 cycles)

export const PeriodTrackingScreen = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [periodLength, setPeriodLength] = useState(DEFAULT_PERIOD_LENGTH);
  const [isEditMode, setIsEditMode] = useState(false);
  const [customPeriodDays, setCustomPeriodDays] = useState<string[]>([]);
  const [currentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentViewDate, setCurrentViewDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Calculate ovulation start (5 days after period ends)
  const getOvulationStart = (periodStartDate: Date, periodDuration: number) => {
    return addDays(periodStartDate, periodDuration + 5);
  };

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
    
    // Add today's date marker
    dates[currentDate] = {
      marked: true,
      dotColor: theme.colors.earth,
    };

    if (isEditMode) {
      // In edit mode, show only manually selected days
      customPeriodDays.forEach(day => {
        dates[day] = {
          selected: true,
          selectedColor: theme.colors.periodDay,
          marked: true,
        };
      });
    } else if (selectedDate) {
      // In normal mode, use the exact same custom period days for current period
      customPeriodDays.forEach(day => {
        dates[day] = {
          selected: true,
          selectedColor: theme.colors.periodDay,
          marked: true,
        };
      });

      // Mark predicted future period days
      for (let cycle = 1; cycle <= PREDICTION_CYCLES; cycle++) {
        const cycleStartDateStr = addDaysToDateString(selectedDate, CYCLE_LENGTH * cycle);
        
        // Add period days for this cycle
        for (let i = 0; i < periodLength; i++) {
          const predictedDate = addDaysToDateString(cycleStartDateStr, i);
          dates[predictedDate] = {
            selected: true,
            selectedColor: theme.colors.predictedPeriodDay,
            marked: true,
          };
        }

        // Add ovulation days only for the next cycle
        if (cycle === 1) {
          // Calculate ovulation start
          const ovulationStartStr = addDaysToDateString(cycleStartDateStr, periodLength + 5);
          for (let i = 0; i < OVULATION_LENGTH; i++) {
            const ovulationDate = addDaysToDateString(ovulationStartStr, i);
            dates[ovulationDate] = {
              selected: true,
              selectedColor: theme.colors.ovulationDay,
              marked: true,
            };
          }
        }
      }

      // Mark current cycle ovulation days
      const currentOvulationStartStr = addDaysToDateString(selectedDate, periodLength + 5);
      for (let i = 0; i < OVULATION_LENGTH; i++) {
        const ovulationDate = addDaysToDateString(currentOvulationStartStr, i);
        dates[ovulationDate] = {
          selected: true,
          selectedColor: theme.colors.ovulationDay,
          marked: true,
        };
      }
    }

    return dates;
  }, [selectedDate, periodLength, isEditMode, customPeriodDays, currentDate]);

  const onDayPress = (day: DateData) => {
    // Use the date string directly from the calendar to avoid any timezone issues
    const selectedDateString = day.dateString;
    console.log('Day pressed:', selectedDateString);

    if (isEditMode) {
      // In edit mode, toggle the selected dates in customPeriodDays
      const isAlreadySelected = customPeriodDays.includes(selectedDateString);
      
      if (isAlreadySelected) {
        // Remove the date if already selected
        setCustomPeriodDays(customPeriodDays.filter(date => date !== selectedDateString));
      } else {
        // Add the date if not already selected
        setCustomPeriodDays([...customPeriodDays, selectedDateString]);
      }
    }
  };

  /**
   * Toggles between edit mode and normal mode
   * - When entering edit mode: Preserves any existing custom period days
   * - When exiting edit mode: Updates the selected date based on custom days if any were selected
   */
  const toggleEditMode = () => {
    if (isEditMode) {
      // Exiting edit mode
      if (customPeriodDays.length > 0) {
        // If days were selected in edit mode, update the selected date to the earliest day
        const sortedDays = [...customPeriodDays].sort();
        setSelectedDate(sortedDays[0]);
        
        // Update period length to match the number of selected days
        setPeriodLength(customPeriodDays.length);
        
        // Ensure we're preserving the exact days that were selected in edit mode
        setCustomPeriodDays([...customPeriodDays]);
      } else {
        // If no days were selected, keep the previous state
        // This allows users to cancel their edit by removing all selections
      }
    } else {
      // Entering edit mode
      // Keep the current date selections if any exist
      if (selectedDate && customPeriodDays.length === 0) {
        // If we have a selected date but no custom days (first-time edit),
        // generate default period days based on the selected date
        const newCustomDays = [];
        for (let i = 0; i < periodLength; i++) {
          newCustomDays.push(addDaysToDateString(selectedDate, i));
        }
        setCustomPeriodDays(newCustomDays);
      }
      
      // Make sure we're looking at the right month when entering edit mode
      if (selectedDate) {
        setCurrentViewDate(selectedDate);
      } else if (!currentViewDate) {
        setCurrentViewDate(format(new Date(), 'yyyy-MM-dd'));
      }
    }
    
    // Toggle the edit mode state
    setIsEditMode(!isEditMode);
  };

  const getNextPeriodDate = () => {
    if (!selectedDate) return null;
    // Create a date object from the next period start date string
    const [year, month, day] = addDaysToDateString(selectedDate, CYCLE_LENGTH).split('-').map(Number);
    return format(new Date(year, month - 1, day, 12, 0, 0), 'MMMM dd, yyyy');
  };

  const getOvulationDates = () => {
    if (!selectedDate) return null;
    
    // Calculate ovulation start and end
    const ovulationStartStr = addDaysToDateString(selectedDate, periodLength + 5);
    const ovulationEndStr = addDaysToDateString(ovulationStartStr, OVULATION_LENGTH - 1);
    
    // Create Date objects from the strings with noon time
    const [startYear, startMonth, startDay] = ovulationStartStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = ovulationEndStr.split('-').map(Number);
    
    const startDate = new Date(startYear, startMonth - 1, startDay, 12, 0, 0);
    const endDate = new Date(endYear, endMonth - 1, endDay, 12, 0, 0);
    
    return `${format(startDate, 'MMMM dd')} - ${format(endDate, 'MMMM dd, yyyy')}`;
  };

  const getPeriodDates = () => {
    if (!selectedDate) return null;
    if (isEditMode || customPeriodDays.length === 0) {
      return 'Select days to update cycle predictions';
    }
    
    const sortedDays = [...customPeriodDays].sort();
    const firstDay = sortedDays[0];
    const lastDay = sortedDays[sortedDays.length - 1];
    
    // Parse the date components directly to avoid timezone issues
    const [firstYear, firstMonth, firstDay_] = firstDay.split('-').map(Number);
    const [lastYear, lastMonth, lastDay_] = lastDay.split('-').map(Number);
    
    // Create date objects with noon time to avoid timezone issues
    const firstDate = new Date(firstYear, firstMonth - 1, firstDay_, 12, 0, 0);
    const lastDate = new Date(lastYear, lastMonth - 1, lastDay_, 12, 0, 0);
    
    return `${format(firstDate, 'MMMM dd')} - ${format(lastDate, 'MMMM dd, yyyy')}`;
  };

  const handleTodayPress = () => {
    // Format today's date directly for consistency
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    setCurrentViewDate(todayStr);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.title}>Calendar</Text>

        <View style={styles.calendarContainer}>
    

          <Calendar
            current={currentViewDate}
            initialDate={currentViewDate}
            key={currentViewDate}
            onDayPress={isEditMode ? onDayPress : undefined}
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
              todayBackgroundColor: theme.colors.neutral100,
              dayTextColor: theme.colors.textPrimary,
              textDisabledColor: theme.colors.neutral300,
              monthTextColor: theme.colors.textPrimary,
              indicatorColor: theme.colors.sage,
              // Add day name styling
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '600',
              textDayHeaderFontSize: 13,
              // Remove special styling for Sunday and Saturday to make all days of week uniform
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
                  borderWidth: 1,
                  borderColor: theme.colors.earth,
                },
                selected: {
                  borderRadius: 18,
                }
              }
            }}
            enableSwipeMonths={true}
            hideArrows={true}
            renderHeader={(date: Date) => {
              const monthYear = format(date, 'MMMM yyyy');
              return (
                <View style={styles.calendarHeaderRow}>
                  <View style={styles.monthContainer}>
                    <Text style={styles.monthText}>{monthYear}</Text>
                  </View>
                  <View style={styles.todayButtonContainer}>
                    <TouchableOpacity
                      style={styles.todayButton}
                      onPress={handleTodayPress}
                    >
                      <Text style={styles.todayButtonText}>Today</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            maxDate={format(addDays(new Date(), 730), 'yyyy-MM-dd')}
          />

          <View style={styles.fabSpacing} />

          <FAB
            icon={isEditMode ? "check" : "pencil"}
            onPress={toggleEditMode}
            style={[styles.fab, { backgroundColor: isEditMode ? theme.colors.earth : theme.colors.clay }]}
            color={theme.colors.surface}
            size="small"
            label={isEditMode? "":""}
          />
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Cycle Information</Text>
          {selectedDate && (
            <>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: theme.colors.periodDay }]} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Period</Text>
                  <Text style={styles.infoText}>{getPeriodDates()}</Text>
                </View>
              </View>
              {!isEditMode && (
                <>
                  <View style={styles.infoRow}>
                    <View style={[styles.infoIcon, { backgroundColor: theme.colors.ovulationDay }]} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Ovulation Window</Text>
                      <Text style={styles.infoText}>{getOvulationDates()}</Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <View style={[styles.infoIcon, { backgroundColor: theme.colors.predictedPeriodDay }]} />
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Next Period Expected</Text>
                      <Text style={styles.infoText}>{getNextPeriodDate()}</Text>
                    </View>
                  </View>
                </>
              )}
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
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    marginHorizontal: -theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral200,
    paddingBottom: theme.spacing.sm,
  },
  monthContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    color: theme.colors.earth,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  todayButtonContainer: {
    position: 'absolute',
    right: theme.spacing.md,
  },
  todayButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.earth,
  },
  todayButtonText: {
    color: theme.colors.earth,
    fontSize: 14,
    fontWeight: '500',
  },
}); 