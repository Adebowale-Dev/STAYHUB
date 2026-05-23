import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
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

const HIDDEN_ROUTE_OWNER: Partial<Record<string, keyof typeof TAB_CONFIG>> = {
    settings: 'profile',
    notifications: 'profile',
    'rooms/[id]': 'hostels',
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
    const blurTint = isDark ? 'dark' : 'light';
    const blurOverlay = isDark ? 'rgba(12,20,32,0.3)' : 'rgba(255,255,255,0.28)';
    const glassBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.56)';
    const activePlate = isDark ? 'rgba(66,165,245,0.12)' : 'rgba(12,74,140,0.06)';

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

        if (visibleIndex >= 0) {
            return visibleIndex;
        }

        const activeRouteName = state.routes[state.index]?.name;
        const fallbackRouteName = activeRouteName
            ? HIDDEN_ROUTE_OWNER[activeRouteName]
            : undefined;

        if (!fallbackRouteName) {
            return 0;
        }

        const fallbackVisibleIndex = visibleRoutes.findIndex(
            (route) => route.name === fallbackRouteName
        );

        return fallbackVisibleIndex >= 0 ? fallbackVisibleIndex : 0;
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
            <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom - 10, 2) }]}>
                <View
                    style={[
                        styles.inner,
                        {
                            borderColor: glassBorder,
                            shadowColor: palette.shadow,
                            shadowOpacity: isDark ? 0.1 : 0.08,
                        },
                    ]}
                >
                <BlurView
                    tint={blurTint}
                    intensity={60}
                    style={StyleSheet.absoluteFillObject}
                />
                <View
                    pointerEvents="none"
                    style={[
                        StyleSheet.absoluteFillObject,
                        { backgroundColor: blurOverlay },
                    ]}
                />
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
                        const activeRouteName = state.routes[state.index]?.name;
                        const fallbackRouteName = activeRouteName
                            ? HIDDEN_ROUTE_OWNER[activeRouteName]
                            : undefined;
                        const isFocused =
                            state.index === state.routes.findIndex((item) => item.key === route.key) ||
                            (fallbackRouteName != null && route.name === fallbackRouteName);
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
                                                ? 'rgba(255,255,255,0.07)'
                                                : 'rgba(12,74,140,0.06)',
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
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
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
        shadowRadius: 24,
        elevation: 7,
        overflow: 'hidden',
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
