import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Hostel } from '../types';
import { getStudentPalette } from '../constants/design';

interface Props {
    hostel: Hostel;
    onPress: () => void;
}

export function HostelCard({ hostel, onPress }: Props) {
    const theme = useTheme();
    const palette = getStudentPalette(theme.dark);
    const isMale = hostel.gender === 'male';
    const isFull = hostel.availableRooms === 0;
    const ratio = hostel.totalRooms > 0 ? hostel.availableRooms / hostel.totalRooms : 0;
    const accentColor = isMale ? palette.primary : palette.primaryStrong;
    const accentSoft = palette.primarySoft;
    const barColor = ratio > 0.5 ? palette.success : ratio > 0 ? palette.warning : palette.danger;
    const footerText = isFull ? 'Currently full' : 'Explore rooms';

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} className="mb-4">
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: palette.surface,
                        borderColor: palette.border,
                        shadowColor: palette.shadow,
                    },
                ]}
            >
                <View className="flex-row justify-between gap-[14px]">
                    <View className="flex-1 flex-row gap-3">
                        <View style={[styles.heroIcon, { backgroundColor: accentSoft }]}>
                            <MaterialCommunityIcons
                                name={isMale ? 'office-building' : 'home-group'}
                                size={20}
                                color={accentColor}
                            />
                        </View>
                        <View className="flex-1">
                            <Text
                                style={[styles.name, { color: palette.textPrimary }]}
                                numberOfLines={1}
                            >
                                {hostel.name}
                            </Text>
                            <Text
                                style={[styles.subtext, { color: palette.textSecondary }]}
                                numberOfLines={2}
                            >
                                {hostel.description || 'Clean accommodation with managed room allocation and student support.'}
                            </Text>
                        </View>
                    </View>

                    <View className="items-end gap-2">
                        {isFull ? (
                            <View style={[styles.fullBadge, { backgroundColor: palette.dangerSoft }]}>
                                <Text style={[styles.fullBadgeText, { color: palette.danger }]}>Full</Text>
                            </View>
                        ) : null}
                        <View style={[styles.genderChip, { backgroundColor: accentSoft }]}>
                            <MaterialCommunityIcons
                                name={isMale ? 'human-male' : 'human-female'}
                                size={12}
                                color={accentColor}
                            />
                            <Text style={[styles.genderChipText, { color: accentColor }]}>
                                {isMale ? 'Male' : 'Female'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.metricRow}>
                    <View
                        style={[
                            styles.metricCard,
                            { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
                        ]}
                    >
                        <Text style={[styles.metricLabel, { color: palette.textMuted }]}>Capacity</Text>
                        <Text style={[styles.metricValue, { color: palette.textPrimary }]}>
                            {hostel.totalRooms} rooms
                        </Text>
                    </View>
                    <View
                        style={[
                            styles.metricCard,
                            { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
                        ]}
                    >
                        <Text style={[styles.metricLabel, { color: palette.textMuted }]}>Availability</Text>
                        <Text style={[styles.metricValue, { color: palette.textPrimary }]}>
                            {hostel.availableRooms} open
                        </Text>
                    </View>
                </View>

                <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: palette.textSecondary }]}>
                        Room availability
                    </Text>
                    <Text style={[styles.progressValue, { color: barColor }]}>
                        {Math.max(Math.round(ratio * 100), 0)}%
                    </Text>
                </View>

                <View style={[styles.barTrack, { backgroundColor: palette.surfaceMuted }]}>
                    <View
                        style={[
                            styles.barFill,
                            { width: `${Math.max(Math.min(ratio * 100, 100), 6)}%`, backgroundColor: barColor },
                        ]}
                    />
                </View>

                {hostel.amenities?.length ? (
                    <View style={styles.amenities}>
                        {hostel.amenities.slice(0, 4).map((amenity) => (
                            <View
                                key={amenity}
                                style={[
                                    styles.amenityTag,
                                    { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
                                ]}
                            >
                                <Text style={[styles.amenityText, { color: palette.textSecondary }]}>
                                    {amenity}
                                </Text>
                            </View>
                        ))}
                        {hostel.amenities.length > 4 ? (
                            <View
                                style={[
                                    styles.amenityTag,
                                    { backgroundColor: palette.primarySoft, borderColor: 'transparent' },
                                ]}
                            >
                                <Text style={[styles.amenityText, { color: palette.primary }]}>
                                    +{hostel.amenities.length - 4}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}

                <View style={[styles.footer, { borderTopColor: palette.divider }]}>
                    <Text style={[styles.footerText, { color: isFull ? palette.danger : palette.primary }]}>
                        {footerText}
                    </Text>
                    <View
                        style={[
                            styles.footerArrow,
                            { backgroundColor: isFull ? palette.dangerSoft : palette.primarySoft },
                        ]}
                    >
                        <MaterialCommunityIcons
                            name={isFull ? 'alert-circle-outline' : 'arrow-right'}
                            size={16}
                            color={isFull ? palette.danger : palette.primary}
                        />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 26,
        borderWidth: 1,
        padding: 18,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 8,
    },
    heroIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 6,
    },
    subtext: {
        fontSize: 13,
        lineHeight: 20,
    },
    fullBadge: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    fullBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    genderChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    genderChipText: {
        fontSize: 11,
        fontWeight: '800',
    },
    metricRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 18,
        marginBottom: 16,
    },
    metricCard: {
        flex: 1,
        borderRadius: 18,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    metricLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    metricValue: {
        fontSize: 15,
        fontWeight: '800',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    progressValue: {
        fontSize: 12,
        fontWeight: '800',
    },
    barTrack: {
        height: 8,
        borderRadius: 999,
        overflow: 'hidden',
        marginBottom: 16,
    },
    barFill: {
        height: '100%',
        borderRadius: 999,
    },
    amenities: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    amenityTag: {
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    amenityText: {
        fontSize: 11,
        fontWeight: '700',
    },
    footer: {
        marginTop: 18,
        paddingTop: 16,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    footerText: {
        fontSize: 14,
        fontWeight: '800',
    },
    footerArrow: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
