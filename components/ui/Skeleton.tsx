import { radius, useTheme } from '@/constants/theme';
import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';

type Props = { width?: DimensionValue; height?: number; rounded?: number; style?: StyleProp<ViewStyle> };

/** Placeholder block with a soft pulse (static when reduced motion is on). */
export default function Skeleton({ width = '100%', height = 16, rounded = radius.sm, style }: Props) {
    const { colors } = useTheme();
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let loop: Animated.CompositeAnimation | undefined;
        AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
            if (reduced) return;
            loop = Animated.loop(Animated.sequence([
                Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
            ]));
            loop.start();
        });
        return () => loop?.stop();
    }, [opacity]);

    return <Animated.View style={[{ width, height, borderRadius: rounded, backgroundColor: colors.surfaceMuted, opacity }, style]} />;
}
