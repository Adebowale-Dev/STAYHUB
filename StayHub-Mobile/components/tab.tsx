import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getStudentPalette } from '../constants/design';
import { useThemeStore } from '../store/themeStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type TabConfig = {
    label: string;
    focusedIcon: IconName;
    unfocusedIcon: IconName;
};

const TAB_CONFIG: Record<string, TabConfig> = {
    dashboard: {
        label: 'Home',
        focusedIcon: 'home',
        unfocusedIcon: 'home-outline',
    },
    hostels: {
        label: 'Hostels',
        focusedIcon: 'business',
        unfocusedIcon: 'business-outline',
    },
    reservation: {
        label: 'Reserve',
        focusedIcon: 'calendar',
        unfocusedIcon: 'calendar-outline',
    },
    payment: {
        label: 'Payment',
        focusedIcon: 'card',
        unfocusedIcon: 'card-outline',
    },
    profile: {
        label: 'Profile',
        focusedIcon: 'person',
        unfocusedIcon: 'person-outline',
    },
};

const INDICATOR_WIDTH = 26;
const HORIZONTAL_PADDING = 14;
const { width: screenWidth } = Dimensions.get('window');

type VisibleRoute = BottomTabBarProps['state']['routes'][number] & {
    visibleIndex: number;
    config: TabConfig;
};

function isVisibleTab(routeName: string): routeName is keyof typeof TAB_CONFIG {
    return routeName in TAB_CONFIG;
}

export function AnimatedTabBar({
    state,
    descriptors,
    navigation,
}: BottomTabBarProps) {
    const isDark = useThemeStore((store) => store.isDark);
    const palette = getStudentPalette(isDark);
    const insets = useSafeAreaInsets();
    const indicatorX = useRef(new Animated.Value(0)).current;
    const glassSurface = isDark ? 'rgba(16,28,45,0.86)' : 'rgba(255,255,255,0.82)';
    const glassBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.65)';
    const activePlate = isDark ? 'rgba(66,165,245,0.14)' : 'rgba(12,74,140,0.08)';

    const visibleRoutes = useMemo<VisibleRoute[]>(
        () =>
            state.routes
                .filter((route) => isVisibleTab(route.name))
                .map((route, visibleIndex) => ({
                    ...route,
                    visibleIndex,
                    config: TAB_CONFIG[route.name],
                })),
        [state.routes]
    );

    const currentVisibleIndex = useMemo(() => {
        const activeKey = state.routes[state.index]?.key;
        const visibleIndex = visibleRoutes.findIndex((route) => route.key === activeKey);
        return visibleIndex >= 0 ? visibleIndex : 0;
    }, [state.index, state.routes, visibleRoutes]);

    const tabWidth = useMemo(() => {
        const availableWidth = screenWidth - HORIZONTAL_PADDING * 2;
        return availableWidth / Math.max(visibleRoutes.length, 1);
    }, [visibleRoutes.length]);

    useEffect(() => {
        indicatorX.setValue(currentVisibleIndex * tabWidth);
    }, [currentVisibleIndex, indicatorX, tabWidth]);

    useEffect(() => {
        Animated.spring(indicatorX, {
            toValue: currentVisibleIndex * tabWidth,
            damping: 20,
            stiffness: 220,
            mass: 0.7,
            useNativeDriver: true,
        }).start();
    }, [currentVisibleIndex, indicatorX, tabWidth]);

    return (
        <View style={styles.safeArea}>
            <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                <View
                    style={[
                        styles.inner,
                        {
                            backgroundColor: glassSurface,
                            borderColor: glassBorder,
                            shadowColor: palette.shadow,
                        },
                    ]}
                >
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.indicator,
                        {
                            backgroundColor: palette.primary,
                            marginLeft: (tabWidth - INDICATOR_WIDTH) / 2,
                            transform: [{ translateX: indicatorX }],
                        },
                    ]}
                />

                <View style={styles.row}>
                    {visibleRoutes.map((route) => {
                        const descriptor = descriptors[route.key];
                        const isFocused = state.index === state.routes.findIndex((item) => item.key === route.key);
                        const iconName = isFocused
                            ? route.config.focusedIcon
                            : route.config.unfocusedIcon;
                        const iconColor = isFocused ? palette.primary : palette.textMuted;
                        const labelColor = isFocused ? palette.primary : palette.textSecondary;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        const onLongPress = () => {
                            navigation.emit({
                                type: 'tabLongPress',
                                target: route.key,
                            });
                        };

                        return (
                            <Pressable
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={descriptor.options.tabBarAccessibilityLabel}
                                hitSlop={8}
                                onLongPress={onLongPress}
                                onPress={onPress}
                                style={styles.pressable}
                            >
                                <View
                                    style={[
                                        styles.tabContent,
                                        isFocused && {
                                            backgroundColor: activePlate,
                                            borderColor: isDark
                                                ? 'rgba(255,255,255,0.08)'
                                                : 'rgba(12,74,140,0.08)',
                                        },
                                    ]}
                                >
                                    <Ionicons name={iconName} size={20} color={iconColor} />
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.label,
                                            {
                                                color: labelColor,
                                                fontFamily: undefined,
                                                fontWeight: isFocused ? '700' : '600',
                                            },
                                        ]}
                                    >
                                        {route.config.label}
                                    </Text>
                                </View>
                            </Pressable>
                        );
                    })}
                </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: 'transparent',
    },
    outer: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingTop: 6,
    },
    inner: {
        borderWidth: 1,
        borderRadius: 26,
        paddingHorizontal: 6,
        paddingTop: 8,
        paddingBottom: 6,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 24,
        elevation: 10,
    },
    indicator: {
        position: 'absolute',
        top: 0,
        left: 6,
        width: INDICATOR_WIDTH,
        height: 2.5,
        borderRadius: 999,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'stretch',
        justifyContent: 'space-between',
    },
    pressable: {
        flex: 1,
    },
    tabContent: {
        minHeight: 56,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    label: {
        fontSize: 11,
        letterSpacing: 0.15,
    },
});
