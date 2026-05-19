import React from 'react';
import {
    Platform,
    StyleProp,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { Text } from 'react-native-paper';

interface StudentHeroProps {
    insetTop: number;
    eyebrow?: string;
    title: string;
    subtitle?: string;
    align?: 'left' | 'center';
    contentStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    subtitleStyle?: StyleProp<TextStyle>;
    titleAccessory?: React.ReactNode;
    children?: React.ReactNode;
}

export function StudentHero({
    insetTop,
    eyebrow,
    title,
    subtitle,
    align = 'left',
    contentStyle,
    titleStyle,
    subtitleStyle,
    titleAccessory,
    children,
}: StudentHeroProps) {
    const centered = align === 'center';

    return (
        <View className="overflow-hidden rounded-b-[34px] bg-hero">
            <View className="absolute inset-0 bg-hero/92" />
            <View className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/6" />
            <View className="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-white/5" />
            <View className="absolute inset-x-0 bottom-0 h-24 bg-black/10" />

            <View
                style={[
                    { paddingTop: (Platform.OS === 'ios' ? insetTop : 0) + 20 },
                    contentStyle,
                ]}
                className={centered ? 'items-center px-5 pb-6' : 'px-5 pb-6'}
            >
                {eyebrow ? (
                    <View className={centered ? 'mb-4 self-center rounded-full border border-white/12 bg-white/10 px-3 py-1.5' : 'mb-4 self-start rounded-full border border-white/12 bg-white/10 px-3 py-1.5'}>
                        <Text className="text-[10px] font-extrabold uppercase tracking-[1.1px] text-white/90">
                            {eyebrow}
                        </Text>
                    </View>
                ) : null}

                <View
                    className={centered ? 'mb-[8px] items-center gap-3' : 'mb-[8px] flex-row items-center justify-between gap-4'}
                >
                    <Text
                        style={[
                            {
                                color: '#FFFFFF',
                                fontSize: 28,
                                lineHeight: 34,
                                fontWeight: '800',
                                letterSpacing: -0.5,
                                textAlign: centered ? 'center' : 'left',
                                flexShrink: 1,
                            },
                            titleStyle,
                        ]}
                    >
                        {title}
                    </Text>

                    {titleAccessory}
                </View>

                {subtitle ? (
                    <Text
                        style={[
                            {
                                color: 'rgba(255,255,255,0.76)',
                                fontSize: 13,
                                lineHeight: 20,
                                maxWidth: 420,
                                textAlign: centered ? 'center' : 'left',
                            },
                            subtitleStyle,
                        ]}
                    >
                        {subtitle}
                    </Text>
                ) : null}

                {children}
            </View>
        </View>
    );
}
