import { fonts, layout, useTheme } from '@/constants/theme';
import { useLocalization } from '@/context/LocalizationContext';
import { Tabs } from 'expo-router';
import { ChartColumn, CirclePlus, LayoutDashboard, User, type LucideIcon } from '@/components/ui/icons';
import React from 'react';
import { useWindowDimensions } from 'react-native';

const icon = (Icon: LucideIcon) => ({ color, focused }: { color: string; focused: boolean }) => (
  <Icon size={22} color={color} strokeWidth={focused ? 2.4 : 2} />
);

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useLocalization();
  const { width } = useWindowDimensions();
  // Wide screens get a side rail instead of a bottom bar.
  const desktop = width >= layout.desktop;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarPosition: desktop ? 'left' : 'bottom',
        tabBarVariant: desktop ? 'material' : 'uikit',
        tabBarLabelPosition: desktop ? 'beside-icon' : 'below-icon',
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveBackgroundColor: desktop ? colors.primarySoft : undefined,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderRightColor: colors.border,
          ...(desktop ? { width: 240, minWidth: 240, paddingTop: 24, paddingHorizontal: 12 } : { height: 68, paddingTop: 6, paddingBottom: 10 }),
        },
        tabBarItemStyle: desktop ? { borderRadius: 12, marginBottom: 4, height: 44, justifyContent: 'flex-start', paddingHorizontal: 12 } : undefined,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: desktop ? 14 : 11, lineHeight: desktop ? 20 : 15 },
      }}>
      <Tabs.Screen name="index" options={{ title: t('tab_home'), tabBarIcon: icon(LayoutDashboard) }} />
      <Tabs.Screen name="add" options={{ title: t('tab_add'), tabBarIcon: icon(CirclePlus) }} />
      <Tabs.Screen name="stats" options={{ title: t('tab_stats'), tabBarIcon: icon(ChartColumn) }} />
      <Tabs.Screen name="profile" options={{ title: t('profile'), tabBarIcon: icon(User) }} />
    </Tabs>
  );
}
