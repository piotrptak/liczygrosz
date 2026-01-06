import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useLocalization } from '@/context/LocalizationContext';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useLocalization();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: colors.background,
          elevation: 0,
          height: 80, // Increased height
          paddingBottom: 20, // More bottom padding for Safe Area
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'SpaceMono',
          fontSize: 11,
          fontWeight: '600'
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab_home') || 'Home',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={focused ? '#2f95dc' : color} />, // Always blue when active
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: t('tab_add') || 'Add',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="plus-circle" color={focused ? '#4cd964' : color} />, // Green
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t('tab_stats') || 'Stats',
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="bar-chart" color={focused ? '#5856D6' : color} />, // Purple
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
