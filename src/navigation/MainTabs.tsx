import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image, StyleSheet } from 'react-native';

import ProfileScreen from '../screens/ProfileScreen';
import StatisticScreen from '../screens/StatisticScreen';
import SavedScreen from '../screens/SavedScreen';
import DailyRollScreen from '../screens/DailyRollScreen';

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, 
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/button_profile.png')}
              style={[styles.icon, { opacity: focused ? 1 : 0.4 }]}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Statistic"
        component={StatisticScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/button_statistic.png')}
              style={[styles.icon, { opacity: focused ? 1 : 0.4 }]}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/button_saved.png')}
              style={[styles.icon, { opacity: focused ? 1 : 0.4 }]}
            />
          ),
        }}
      />
      <Tab.Screen
        name="DailyRoll"
        component={DailyRollScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../assets/daily_roll.png')}
              style={[styles.icon, { opacity: focused ? 1 : 0.4 }]}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    height: 80,
    paddingBottom: 12,
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
  },
  icon: {
    width: 60,
    height: 60,
  },
});
