import React from 'react';
import {
    ImageBackground,
    Platform,
    StyleProp,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { Text } from 'react-native-paper';
import { STUDENT_HERO_FALLBACK, STUDENT_HERO_IMAGE } from '../../constants/design';

interface StudentHeroProps {
    insetTop: number;
    eyebrow?: string;
    title: string;
    subtitle?: string;
    align?: 'left' | 'center';
    contentStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    subtitleStyle?: StyleProp<TextStyle>;
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
    children,
}: StudentHeroProps) {
    const centered = align === 'center';

    return (
        <ImageBackground
            source={STUDENT_HERO_FALLBACK}
            className="overflow-hidden rounded-b-[34px] bg-hero"
            resizeMode="cover"
        >
            <ImageBackground
                source={STUDENT_HERO_IMAGE}
                className="overflow-hidden rounded-b-[34px]"
                resizeMode="cover"
                imageStyle={{ transform: [{ scale: 1.04 }] }}
            >
                <View className="absolute inset-0 bg-hero/70" />
                <View className="absolute -right-5 -top-28 h-[260px] w-[260px] rounded-full bg-[#2F80ED]/30" />
                <View className="absolute -bottom-32 -left-8 h-[220px] w-[220px] rounded-full bg-[#0F52BA]/25" />

                <View
                    style={[
                        { paddingTop: (Platform.OS === 'ios' ? insetTop : 0) + 22 },
                        contentStyle,
                    ]}
                    className={centered ? 'items-center px-5 pb-7' : 'px-5 pb-7'}
                >
                    {eyebrow ? (
                        <View className={centered ? 'mb-4 self-center rounded-full border border-white/15 bg-white/15 px-3 py-2' : 'mb-4 self-start rounded-full border border-white/15 bg-white/15 px-3 py-2'}>
                            <Text className="text-[11px] font-extrabold uppercase tracking-[1.1px] text-white">
                                {eyebrow}
                            </Text>
                        </View>
                    ) : null}

                    <Text
                        style={[
                            {
                                color: '#FFFFFF',
                                fontSize: 31,
                                lineHeight: 37,
                                fontWeight: '800',
                                letterSpacing: -0.7,
                                marginBottom: 10,
                                textAlign: centered ? 'center' : 'left',
                            },
                            titleStyle,
                        ]}
                    >
                        {title}
                    </Text>

                    {subtitle ? (
                        <Text
                            style={[
                                {
                                    color: 'rgba(255,255,255,0.78)',
                                    fontSize: 14,
                                    lineHeight: 22,
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
            </ImageBackground>
        </ImageBackground>
    );
}
