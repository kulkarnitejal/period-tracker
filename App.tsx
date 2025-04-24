import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { BottomTabs } from './src/navigation/BottomTabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <BottomTabs />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
