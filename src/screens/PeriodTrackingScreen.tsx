import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { addDays, format, differenceInDays, isBefore, isAfter } from 'date-fns';
import { Button, IconButton, TextInput } from 'react-native-paper';
import { theme, colors } from '../theme/colors';

const CYCLE_LENGTH = 28;
const OVULATION_START = 12; // Days after period start
const OVULATION_LENGTH = 3;
const DEFAULT_PERIOD_LENGTH = 7;
const PREDICTION_CYCLES = 24; // Show predictions for 2 years (24 cycles)

export const PeriodTrackingScreen = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [periodLength, setPeriodLength] = useState(DEFAULT_PERIOD_LENGTH);
  const [isEditMode, setIsEditMode] = useState(false);
  const [customPeriodDays, setCustomPeriodDays] = useState<string[]>([]);

  const markedDates = useMemo(() => {
    if (!selectedDate) return {};

    const dates: any = {};
    const startDate = new Date(selectedDate);
    const today = new Date();

    if (isEditMode) {
      // In edit mode, show only manually selected days
      customPeriodDays.forEach(day => {
        dates[day] = {
          selected: true,
          selectedColor: colors.periodDay,
          marked: true,
        };
      });
    } else {
      // Mark current period days
      for (let i = 0; i < periodLength; i++) {
        const currentDate = format(addDays(startDate, i), 'yyyy-MM-dd');
        dates[currentDate] = {
          selected: true,
          selectedColor: colors.periodDay,
          marked: true,
        };
      }

      // Mark predicted future period days
      for (let cycle = 1; cycle <= PREDICTION_CYCLES; cycle++) {
        const cycleStartDate = addDays(startDate, CYCLE_LENGTH * cycle);
        
        // Add period days for this cycle
        for (let i = 0; i < periodLength; i++) {
          const predictedDate = format(addDays(cycleStartDate, i), 'yyyy-MM-dd');
          dates[predictedDate] = {
            selected: true,
            selectedColor: colors.predictedPeriodDay,
            marked: true,
          };
        }

        // Add ovulation days only for the next cycle
        if (cycle === 1) {
          for (let i = 0; i < OVULATION_LENGTH; i++) {
            const ovulationDate = format(
              addDays(cycleStartDate, OVULATION_START + i),
              'yyyy-MM-dd'
            );
            dates[ovulationDate] = {
              selected: true,
              selectedColor: colors.ovulationDay,
              marked: true,
            };
          }
        }
      }

      // Mark current cycle ovulation days
      for (let i = 0; i < OVULATION_LENGTH; i++) {
        const ovulationDate = format(
          addDays(startDate, OVULATION_START + i),
          'yyyy-MM-dd'
        );
        dates[ovulationDate] = {
          selected: true,
          selectedColor: colors.ovulationDay,
          marked: true,
        };
      }
    }

    return dates;
  }, [selectedDate, periodLength, isEditMode, customPeriodDays]);

  const handleDayPress = (day: DateData) => {
    if (isEditMode) {
      // In edit mode, toggle the selected day
      setCustomPeriodDays(prev => {
        const exists = prev.includes(day.dateString);
        if (exists) {
          return prev.filter(d => d !== day.dateString);
        } else {
          return [...prev, day.dateString].sort();
        }
      });
    } else {
      // In normal mode, set the start date
      setSelectedDate(day.dateString);
      // Initialize custom period days when selecting a new start date
      const newCustomDays = [];
      for (let i = 0; i < periodLength; i++) {
        newCustomDays.push(format(addDays(new Date(day.dateString), i), 'yyyy-MM-dd'));
      }
      setCustomPeriodDays(newCustomDays);
    }
  };

  const toggleEditMode = () => {
    if (isEditMode) {
      // When exiting edit mode, update the period length based on selected days
      if (customPeriodDays.length > 0) {
        setPeriodLength(customPeriodDays.length);
        // Update the start date to the earliest selected day
        setSelectedDate(customPeriodDays[0]);
      }
    }
    setIsEditMode(!isEditMode);
  };

  const getNextPeriodDate = () => {
    if (!selectedDate) return null;
    const nextDate = addDays(new Date(selectedDate), CYCLE_LENGTH);
    return format(nextDate, 'MMMM dd, yyyy');
  };

  const getOvulationDates = () => {
    if (!selectedDate) return null;
    const ovulationStart = addDays(new Date(selectedDate), OVULATION_START);
    const ovulationEnd = addDays(ovulationStart, OVULATION_LENGTH - 1);
    return `${format(ovulationStart, 'MMMM dd')} - ${format(ovulationEnd, 'MMMM dd, yyyy')}`;
  };

  const getPeriodDates = () => {
    if (!selectedDate) return null;
    if (isEditMode || customPeriodDays.length === 0) {
      return 'Select days on the calendar';
    }
    const sortedDays = [...customPeriodDays].sort();
    return `${format(new Date(sortedDays[0]), 'MMMM dd')} - ${
      format(new Date(sortedDays[sortedDays.length - 1]), 'MMMM dd, yyyy')
    }`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Period Tracker</Text>
        <Button
          mode="contained"
          onPress={toggleEditMode}
          style={styles.editButton}
          buttonColor={isEditMode ? colors.earth : colors.clay}
        >
          {isEditMode ? 'Save Changes' : 'Edit Period Days'}
        </Button>
      </View>

      {!isEditMode && (
        <View style={styles.periodLengthContainer}>
          <Text style={styles.periodLengthLabel}>Period Duration: {periodLength} days</Text>
        </View>
      )}

      {isEditMode && (
        <View style={styles.editModeInfo}>
          <Text style={styles.editModeText}>
            Tap days to select/unselect your period days
          </Text>
          <Text style={styles.editModeText}>
            Selected: {customPeriodDays.length} days
          </Text>
        </View>
      )}

      <Calendar
        onDayPress={handleDayPress}
        markedDates={markedDates}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.surface,
          textSectionTitleColor: colors.textPrimary,
          selectedDayBackgroundColor: colors.selectedDay,
          selectedDayTextColor: colors.surface,
          todayTextColor: colors.earth,
          dayTextColor: colors.textPrimary,
          textDisabledColor: colors.neutral300,
          arrowColor: colors.earth,
          monthTextColor: colors.textPrimary,
        }}
        // Enable future months scrolling
        enableSwipeMonths={true}
        // Show 24 months in advance
        maxDate={format(addDays(new Date(), 730), 'yyyy-MM-dd')}
      />
      
      <View style={styles.infoContainer}>
        {selectedDate && (
          <>
            <Text style={styles.infoText}>
              Period: {getPeriodDates()}
            </Text>
            {!isEditMode && (
              <>
                <Text style={styles.infoText}>
                  Ovulation Window: {getOvulationDates()}
                </Text>
                <Text style={styles.infoText}>
                  Next Period Expected: {getNextPeriodDate()}
                </Text>
              </>
            )}
          </>
        )}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.periodDay }]} />
          <Text style={styles.legendText}>Current Period</Text>
        </View>
        {!isEditMode && (
          <>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.predictedPeriodDay }]} />
              <Text style={styles.legendText}>Predicted Period</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.ovulationDay }]} />
              <Text style={styles.legendText}>Ovulation</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  editButton: {
    borderRadius: theme.borderRadius.md,
  },
  periodLengthContainer: {
    backgroundColor: colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  periodLengthLabel: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  editModeInfo: {
    backgroundColor: colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  editModeText: {
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: theme.spacing.xs,
  },
  infoContainer: {
    backgroundColor: colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
  },
  infoText: {
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: theme.spacing.sm,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: colors.surface,
    borderRadius: theme.borderRadius.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.xs,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
}); 