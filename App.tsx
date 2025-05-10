import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { BottomTabs } from './src/navigation/BottomTabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PeriodProvider } from './src/context/PeriodContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <PeriodProvider>
        <NavigationContainer>
          <BottomTabs />
        </NavigationContainer>
      </PeriodProvider>
    </SafeAreaProvider>
  );
}
