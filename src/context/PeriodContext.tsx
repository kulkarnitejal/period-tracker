import React, { createContext, useContext, useState, useEffect } from 'react';
import { format, differenceInDays, addDays } from 'date-fns';
import { theme } from '../theme/colors';

interface PeriodContextType {
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  periodLength: number;
  setPeriodLength: (length: number) => void;
  customPeriodDays: string[];
  setCustomPeriodDays: (days: string[]) => void;
  currentPhase: PhaseInfo;
  cycleDay: number;
  nextPeriodDate: string | null;
  ovulationDates: string | null;
  isEditMode: boolean;
  setIsEditMode: (isEdit: boolean) => void;
}

export interface PhaseInfo {
  name: string;
  color: string;
  description: string;
  tips: string[];
}

const CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 7;

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export const PeriodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [periodLength, setPeriodLength] = useState(DEFAULT_PERIOD_LENGTH);
  const [customPeriodDays, setCustomPeriodDays] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);

  // Calculate current cycle day and phase
  const calculateCycleInfo = () => {
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    
    if (!selectedDate) {
      return {
        cycleDay: 0,
        phase: {
          name: 'No Cycle Data',
          color: theme.colors.neutral500,
          description: 'Please set your period start date to see cycle information.',
          tips: []
        }
      };
    }

    const dayDiff = differenceInDays(new Date(currentDate), new Date(selectedDate));
    const cycleDay = dayDiff >= 0 
      ? (dayDiff % CYCLE_LENGTH) + 1 
      : CYCLE_LENGTH - (Math.abs(dayDiff) % CYCLE_LENGTH);

    let phase: PhaseInfo;

    if (cycleDay <= periodLength) {
      phase = {
        name: 'Menstrual Phase',
        color: theme.colors.periodDay,
        description: 'Your period is active.',
        tips: [
          'Get plenty of rest',
          'Stay hydrated',
          'Consider iron-rich foods',
          'Apply heat to reduce cramping'
        ]
      };
    } else if (cycleDay <= 14) {
      phase = {
        name: 'Follicular Phase',
        color: theme.colors.sage,
        description: 'Your body is preparing for ovulation.',
        tips: [
          'Energy levels typically increase',
          'Good time for starting new projects',
          'Skin typically improves',
          'Consider strength training'
        ]
      };
    } else if (cycleDay <= 17) {
      phase = {
        name: 'Ovulatory Phase',
        color: theme.colors.ovulationDay,
        description: cycleDay === 14 ? 'You are ovulating today!' : 'You are in your fertility window.',
        tips: [
          'Peak fertility window',
          'May experience increased energy',
          'Good time for high-intensity workouts',
          'May notice changes in cervical mucus'
        ]
      };
    } else {
      phase = {
        name: 'Luteal Phase',
        color: theme.colors.terracotta,
        description: 'Your body is preparing for your next period.',
        tips: [
          'May experience PMS symptoms',
          'Focus on self-care',
          'Consider gentle exercise',
          'Healthy fats and complex carbs may help with cravings'
        ]
      };
    }

    return { cycleDay, phase };
  };

  const { cycleDay, phase: currentPhase } = calculateCycleInfo();

  // Calculate next period date
  const getNextPeriodDate = () => {
    if (!selectedDate) return null;
    const daysUntilNextPeriod = CYCLE_LENGTH - cycleDay;
    const nextDate = addDays(new Date(), daysUntilNextPeriod);
    return format(nextDate, 'yyyy-MM-dd');
  };

  // Calculate ovulation dates
  const getOvulationDates = () => {
    if (!selectedDate) return null;
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    const dayDiff = differenceInDays(new Date(currentDate), new Date(selectedDate));
    const currentCycleStart = addDays(new Date(selectedDate), 
      Math.floor(dayDiff / CYCLE_LENGTH) * CYCLE_LENGTH);
    const ovulationStart = addDays(currentCycleStart, 14);
    const ovulationEnd = addDays(ovulationStart, 2);
    return `${format(ovulationStart, 'MMMM dd')} - ${format(ovulationEnd, 'MMMM dd, yyyy')}`;
  };

  const value = {
    selectedDate,
    setSelectedDate,
    periodLength,
    setPeriodLength,
    customPeriodDays,
    setCustomPeriodDays,
    currentPhase,
    cycleDay,
    nextPeriodDate: getNextPeriodDate(),
    ovulationDates: getOvulationDates(),
    isEditMode,
    setIsEditMode,
  };

  return (
    <PeriodContext.Provider value={value}>
      {children}
    </PeriodContext.Provider>
  );
};

export const usePeriodContext = () => {
  const context = useContext(PeriodContext);
  if (context === undefined) {
    throw new Error('usePeriodContext must be used within a PeriodProvider');
  }
  return context;
}; 