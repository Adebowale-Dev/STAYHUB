import React from 'react';
import {
    StyleProp,
    StyleSheet,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { getStudentPalette } from '../../constants/design';

interface StudentHeroProps {
    insetTop: number;
    eyebrow?: string;
    title: string;
    subtitle?: string;
    align?: 'left' | 'center';
    variant?: 'hero' | 'surface';
    containerStyle?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    titleStyle?: StyleProp<TextStyle>;
    subtitleStyle?: StyleProp<TextStyle>;
    leadingAccessory?: React.ReactNode;
    titleAccessory?: React.ReactNode;
    children?: React.ReactNode;
}

export function StudentHero({
    insetTop,
    eyebrow,
    title,
    subtitle,
    align = 'left',
    variant = 'hero',
    containerStyle,
    contentStyle,
    titleStyle,
    subtitleStyle,
    leadingAccessory,
    titleAccessory,
    children,
}: StudentHeroProps) {
    const centered = align === 'center';
    const theme = useTheme();
    const palette = getStudentPalette(theme.dark);
    const isSurface = variant === 'surface';
    const backgroundColor = isSurface ? palette.surface : palette.hero;
    const borderColor = isSurface ? palette.border : 'transparent';
    const titleColor = isSurface ? palette.textPrimary : '#FFFFFF';
    const subtitleColor = isSurface ? palette.textSecondary : 'rgba(255,255,255,0.76)';
    const eyebrowBackground = isSurface ? palette.surfaceMuted : 'rgba(255,255,255,0.08)';
    const eyebrowText = isSurface ? palette.textSecondary : '#FFFFFF';
    const hasTitleRow = Boolean(title) || titleAccessory != null || leadingAccessory != null;

    return (
        <View
            style={[
                styles.container,
                {
                    backgroundColor,
                    borderBottomColor: borderColor,
                },
                containerStyle,
            ]}
        >

            <View
                style={[
                    { paddingTop: insetTop + 14 },
                    contentStyle,
                ]}
                className={centered ? 'items-center px-5 pb-6' : 'px-5 pb-6'}
            >
                {eyebrow ? (
                    <View
                        className={centered ? 'mb-4 self-center rounded-full px-3.5 py-2' : 'mb-4 self-start rounded-full px-3.5 py-2'}
                        style={{
                            backgroundColor: eyebrowBackground,
                            borderWidth: 1,
                            borderColor: isSurface ? borderColor : 'rgba(255,255,255,0.12)',
                        }}
                    >
                        <Text
                            className="text-[11px] font-extrabold uppercase tracking-[1px]"
                            style={{ color: eyebrowText }}
                        >
                            {eyebrow}
                        </Text>
                    </View>
                ) : null}

                {hasTitleRow ? (
                    <View
                        className={centered ? 'mb-2 items-center gap-3' : 'mb-3 flex-row items-start justify-between gap-4'}
                    >
                        <View
                            style={[
                                styles.titleGroup,
                                centered && styles.titleGroupCentered,
                            ]}
                        >
                            {leadingAccessory ? <View style={styles.leadingWrap}>{leadingAccessory}</View> : null}

                            {title ? (
                                <Text
                                    style={[
                                        {
                                            color: titleColor,
                                            fontSize: 26,
                                            lineHeight: 32,
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
                            ) : null}
                        </View>

                        {titleAccessory}
                    </View>
                ) : null}

                {subtitle ? (
                    <Text
                        style={[
                            {
                                color: subtitleColor,
                                fontSize: 13,
                                lineHeight: 20,
                                maxWidth: 360,
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

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomLeftRadius: 34,
        borderBottomRightRadius: 34,
    },
    titleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flexShrink: 1,
    },
    titleGroupCentered: {
        justifyContent: 'center',
    },
    leadingWrap: {
        flexShrink: 0,
    },
});
