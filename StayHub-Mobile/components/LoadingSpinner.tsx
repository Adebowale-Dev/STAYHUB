import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    StatusBar,
    View,
} from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import { getStudentPalette } from '../constants/design';

interface Props {
    title?: string;
    message?: string;
    fullScreen?: boolean;
}

export function LoadingSpinner({
    title = 'Loading your space',
    message = 'Please wait while StayHub prepares the latest details.',
    fullScreen = true,
}: Props) {
    const theme = useTheme();
    const palette = getStudentPalette(theme.dark);
    const rotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.timing(rotate, {
                toValue: 1,
                duration: 1200,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        );

        animation.start();

        return () => {
            animation.stop();
            rotate.stopAnimation();
        };
    }, [rotate]);

    const spin = rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View
            style={[
                fullScreen && { flex: 1, backgroundColor: palette.pageBackground },
            ]}
            className="items-center justify-center px-6"
        >
            <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={palette.hero} />
            <View className="absolute top-[30%] h-[220px] w-[220px] rounded-full" style={{ backgroundColor: palette.primarySoft }} />
            <View className="absolute bottom-[24%] right-6 h-[140px] w-[140px] rounded-full opacity-80" style={{ backgroundColor: palette.primarySoft }} />

            <View
                className="w-full max-w-[320px] items-center rounded-[30px] border px-6 py-7"
                style={{
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                    shadowColor: palette.shadow,
                    shadowOffset: { width: 0, height: 18 },
                    shadowOpacity: 0.18,
                    shadowRadius: 32,
                    elevation: 12,
                }}
            >
                <View className="mb-[22px] h-[90px] w-[90px] items-center justify-center">
                    <View className="absolute h-[86px] w-[86px] rounded-full border-[6px]" style={{ borderColor: palette.border }} />
                    <Animated.View
                        style={[
                            {
                                position: 'absolute',
                                width: 86,
                                height: 86,
                                borderRadius: 43,
                                borderWidth: 6,
                                borderTopColor: palette.primary,
                                borderRightColor: 'rgba(12, 74, 140, 0.22)',
                                borderBottomColor: 'transparent',
                                borderLeftColor: 'transparent',
                                transform: [{ rotate: spin }],
                            },
                        ]}
                    />
                    <View
                        className="h-[52px] w-[52px] items-center justify-center rounded-full border"
                        style={{ backgroundColor: palette.surfaceRaised, borderColor: palette.border }}
                    >
                        <ActivityIndicator size="small" color={palette.primary} />
                    </View>
                </View>

                <Text className="mb-2 text-center text-lg font-extrabold" style={{ color: palette.textPrimary }}>
                    {title}
                </Text>
                <Text className="text-center text-[13px] leading-5" style={{ color: palette.textSecondary }}>
                    {message}
                </Text>
            </View>
        </View>
    );
}
