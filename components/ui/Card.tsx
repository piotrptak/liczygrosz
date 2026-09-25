import { radius, space, useTheme } from '@/constants/theme';
import React from 'react';
import { View, type ViewProps } from 'react-native';

export default function Card({ style, padded = true, ...props }: ViewProps & { padded?: boolean }) {
    const { colors } = useTheme();
    return (
        <View
            style={[
                {
                    backgroundColor: colors.surface,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: padded ? space.lg : 0,
                    overflow: 'hidden',
                },
                style,
            ]}
            {...props}
        />
    );
}
