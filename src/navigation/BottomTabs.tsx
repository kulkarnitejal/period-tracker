import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PeriodTrackingScreen } from '../screens/PeriodTrackingScreen';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

export const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.earth,
        tabBarInactiveTintColor: colors.neutral500,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.neutral200,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Tracking"
        component={PeriodTrackingScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}; 