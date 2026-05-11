import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStudentPalette } from '../constants/design';
import { useThemeStore } from '../store/themeStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TAB_META: Record<string, { focused: IconName; unfocused: IconName; label: string }> = {
    dashboard: { focused: 'home', unfocused: 'home-outline', label: 'Home' },
    hostels: { focused: 'business', unfocused: 'business-outline', label: 'Hostels' },
    reservation: { focused: 'calendar', unfocused: 'calendar-outline', label: 'Reserve' },
    payment: { focused: 'card', unfocused: 'card-outline', label: 'Payment' },
    profile: { focused: 'person', unfocused: 'person-outline', label: 'Profile' },
};

export function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const isDark = useThemeStore((s) => s.isDark);
    const palette = getStudentPalette(isDark);
    const tabWidth = (SCREEN_WIDTH - 28) / Math.max(state.routes.length, 1);
    const slideAnim = useSharedValue(0);

    useEffect(() => {
        slideAnim.value = withSpring(state.index * tabWidth, {
            damping: 18,
            stiffness: 185,
            mass: 0.55,
            overshootClamping: false,
        });
    }, [slideAnim, state.index, tabWidth]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: slideAnim.value }],
    }));

    return (
        <SafeAreaView edges={['bottom']} className="bg-transparent">
            <View className="bg-transparent px-3 pb-1 pt-2">
                <View
                    className="overflow-hidden rounded-[28px] border bg-surface/95 px-1.5 pb-1.5 pt-2"
                    style={[
                        styles.shell,
                        {
                            borderColor: palette.border,
                            shadowColor: palette.shadow,
                            backgroundColor: palette.surface,
                        },
                    ]}
                >
                    <Animated.View
                        className="absolute top-0 rounded-full bg-primary"
                        style={[
                            {
                                height: 3,
                                width: tabWidth * 0.34,
                                marginLeft: tabWidth * 0.33,
                            },
                            animatedStyle,
                        ]}
                    />

                    <View className="flex-row items-center justify-around">
                        {state.routes.map((route, index) => {
                            const meta = TAB_META[route.name];
                            if (!meta) {
                                return null;
                            }

                            const { options } = descriptors[route.key];
                            const isFocused = state.index === index;

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
                                    accessibilityLabel={options.tabBarAccessibilityLabel}
                                    onPress={onPress}
                                    onLongPress={onLongPress}
                                    className="flex-1 items-center justify-center"
                                >
                                    <View
                                        className="min-h-[52px] w-[92%] items-center justify-center rounded-2xl border px-1 py-2"
                                        style={{
                                            borderColor: isFocused
                                                ? isDark
                                                    ? 'rgba(148,163,184,0.16)'
                                                    : 'rgba(12,74,140,0.1)'
                                                : 'transparent',
                                            backgroundColor: isFocused ? palette.primarySoft : 'transparent',
                                        }}
                                    >
                                        <Ionicons
                                            name={isFocused ? meta.focused : meta.unfocused}
                                            size={21}
                                            color={isFocused ? palette.primary : palette.textMuted}
                                        />
                                        <Text
                                            className="mt-1 text-[10px] font-extrabold"
                                            style={{ color: isFocused ? palette.primary : palette.textMuted }}
                                            numberOfLines={1}
                                        >
                                            {meta.label}
                                        </Text>
                                    </View>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    shell: {
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.14,
        shadowRadius: 22,
        elevation: 16,
    },
});
