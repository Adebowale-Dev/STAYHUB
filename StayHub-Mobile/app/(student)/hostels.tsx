import React, { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    StatusBar,
    StyleSheet,
    TextInput as RNTextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { studentAPI } from '../../services/api';
import { HostelCard } from '../../components/HostelCard';
import { useAuthStore } from '../../store/authStore';
import type { Hostel } from '../../types';
import { getStudentPalette } from '../../constants/design';
import { StudentHero } from '../../components/ui/StudentHero';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useStudentTabSwipe } from '../../components/ui/StudentTabSwipe';

export default function HostelsScreen() {
    const [hostels, setHostels] = useState<Hostel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const router = useRouter();
    const theme = useTheme();
    const palette = getStudentPalette(theme.dark);
    const insets = useSafeAreaInsets();
    const searchRef = useRef<RNTextInput>(null);
    const user = useAuthStore((s) => s.user);
    const studentGender = (user?.gender ?? 'male') as 'male' | 'female';
    const swipeHandlers = useStudentTabSwipe('hostels');

    const loadHostels = async () => {
        setError(false);
        try {
            const res = await studentAPI.getHostels();
            const data: Hostel[] = (res.data as any).data ?? res.data ?? [];
            setHostels(data);
        }
        catch {
            setError(true);
        }
        finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadHostels();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadHostels();
    };

    const filtered = hostels.filter((hostel) => {
        const matchGender = hostel.gender === studentGender;
        const matchSearch =
            !search.trim() || hostel.name.toLowerCase().includes(search.toLowerCase());
        return matchGender && matchSearch;
    });

    const totalAvailable = filtered.reduce((sum, hostel) => sum + hostel.availableRooms, 0);

    if (loading) {
        return (
            <LoadingSpinner
                title="Checking hostel availability"
                message="We are gathering the latest room openings and accommodation details for you."
            />
        );
    }

    const listHeader = (
        <>
            <StudentHero
                insetTop={insets.top}
                eyebrow="Accommodation"
                title="Available hostels"
                // subtitle="Browse approved hostels, compare room availability, and move into the right option for your session."
            >
                <View className="mt-6 flex-row gap-2.5">
                    <View
                        style={[
                            styles.heroStatCard,
                            {
                                backgroundColor: palette.heroGlass,
                                borderColor: palette.heroBorder,
                            },
                        ]}
                    >
                        <Text className="text-2xl font-extrabold text-white">{filtered.length}</Text>
                        <Text className="text-[12px] font-bold leading-[18px] text-white/80">Hostels</Text>
                    </View>
                    <View
                        style={[
                            styles.heroStatCard,
                            {
                                backgroundColor: palette.heroGlass,
                                borderColor: palette.heroBorder,
                            },
                        ]}
                    >
                        <Text className="text-2xl font-extrabold text-white">{totalAvailable}</Text>
                        <Text className="text-[12px] font-bold leading-[18px] text-white/80">Beds open</Text>
                    </View>
                    <View
                        style={[
                            styles.heroStatCard,
                            {
                                backgroundColor: palette.heroGlass,
                                borderColor: palette.heroBorder,
                            },
                        ]}
                    >
                        <MaterialCommunityIcons
                            name={studentGender === 'male' ? 'human-male' : 'human-female'}
                            size={18}
                            color="#FFFFFF"
                        />
                        <Text className="text-[12px] font-bold leading-[18px] text-white/80">
                            {studentGender === 'male' ? 'Male hostels' : 'Female hostels'}
                        </Text>
                    </View>
                </View>
            </StudentHero>

            <View className="-mt-[22px] px-[18px]">
                <View
                    style={[
                        styles.searchPanel,
                        {
                            backgroundColor: palette.surface,
                            borderColor: palette.border,
                            shadowColor: palette.shadow,
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.searchBar,
                            {
                                backgroundColor: palette.surfaceMuted,
                                borderColor: palette.border,
                            },
                        ]}
                    >
                        <MaterialCommunityIcons name="magnify" size={18} color={palette.textSecondary} />
                        <RNTextInput
                            ref={searchRef}
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Search hostels by name"
                            placeholderTextColor={palette.textMuted}
                            style={[styles.searchInput, { color: palette.textPrimary }]}
                            returnKeyType="search"
                        />
                        {search.length > 0 ? (
                            <TouchableOpacity
                                onPress={() => setSearch('')}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <MaterialCommunityIcons
                                    name="close-circle"
                                    size={16}
                                    color={palette.textSecondary}
                                />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    <View className="mt-[14px] flex-row items-center justify-between gap-[10px]">
                        <View style={[styles.genderPill, { backgroundColor: palette.primarySoft }]}>
                            <MaterialCommunityIcons
                                name={studentGender === 'male' ? 'human-male' : 'human-female'}
                                size={14}
                                color={palette.primary}
                            />
                            <Text style={[styles.genderPillText, { color: palette.primary }]}>
                                {studentGender === 'male' ? 'Male accommodation' : 'Female accommodation'}
                            </Text>
                        </View>

                        <Text style={[styles.resultMeta, { color: palette.textSecondary }]}>
                            {filtered.length} result{filtered.length === 1 ? '' : 's'}
                        </Text>
                    </View>
                </View>

                <View className="mb-[14px] mt-[22px] flex-row items-end justify-between gap-3">
                    <View>
                        <Text className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[1px]" style={{ color: palette.textMuted }}>
                            Matching options
                        </Text>
                        <Text className="text-[22px] font-extrabold tracking-[-0.5px]" style={{ color: palette.textPrimary }}>
                            {search ? `Results for "${search}"` : 'Hostels ready to explore'}
                        </Text>
                    </View>
                    <Text className="text-right text-[12px] font-bold" style={{ color: palette.textSecondary }}>
                        {totalAvailable} bed{totalAvailable === 1 ? '' : 's'} open
                    </Text>
                </View>
            </View>
        </>
    );

    if (error) {
        return (
            <View className="flex-1" style={{ backgroundColor: palette.pageBackground }}>
                <StatusBar barStyle="light-content" backgroundColor={palette.hero} />
                <FlatList
                    data={[]}
                    {...swipeHandlers}
                    renderItem={null}
                    ListHeaderComponent={listHeader}
                    ListFooterComponent={
                        <View className="px-[18px] pb-36 pt-2">
                            <View
                                style={[
                                    styles.stateCard,
                                    {
                                        backgroundColor: palette.surface,
                                        borderColor: palette.border,
                                        shadowColor: palette.shadow,
                                    },
                                ]}
                            >
                                <View style={[styles.stateIcon, { backgroundColor: palette.dangerSoft }]}>
                                    <MaterialCommunityIcons name="wifi-off" size={24} color={palette.danger} />
                                </View>
                                <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>
                                    Could not load hostels
                                </Text>
                                <Text style={[styles.stateCopy, { color: palette.textSecondary }]}>
                                    Check your connection and try again to refresh accommodation availability.
                                </Text>
                                <TouchableOpacity
                                    style={[styles.primaryButton, { backgroundColor: palette.primary }]}
                                    onPress={() => {
                                        setLoading(true);
                                        loadHostels();
                                    }}
                                    activeOpacity={0.9}
                                >
                                    <MaterialCommunityIcons name="refresh" size={16} color="#FFFFFF" />
                                    <Text style={styles.primaryButtonText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    }
                    keyExtractor={(_, index) => `empty-${index}`}
                />
            </View>
        );
    }

    return (
        <View className="flex-1" style={{ backgroundColor: palette.pageBackground }}>
            <StatusBar barStyle="light-content" backgroundColor={palette.hero} />

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <FlatList
                    data={filtered}
                    {...swipeHandlers}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ paddingBottom: 144 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={palette.primary}
                            colors={[palette.primary]}
                        />
                    }
                    ListHeaderComponent={listHeader}
                    renderItem={({ item }) => (
                        <View className="px-[18px]">
                            <HostelCard
                                hostel={item}
                                onPress={() => router.push(`/(student)/rooms/${item._id}`)}
                            />
                        </View>
                    )}
                    ListEmptyComponent={
                        <View className="px-[18px] pt-1.5">
                            <View
                                style={[
                                    styles.stateCard,
                                    {
                                        backgroundColor: palette.surface,
                                        borderColor: palette.border,
                                        shadowColor: palette.shadow,
                                    },
                                ]}
                            >
                                <View style={[styles.stateIcon, { backgroundColor: palette.primarySoft }]}>
                                    <MaterialCommunityIcons name="home-search" size={24} color={palette.primary} />
                                </View>
                                <Text style={[styles.stateTitle, { color: palette.textPrimary }]}>
                                    No hostels found
                                </Text>
                                <Text style={[styles.stateCopy, { color: palette.textSecondary }]}>
                                    {search
                                        ? `No hostels match "${search}" right now. Try a different keyword.`
                                        : 'There are no hostels available for your profile at the moment.'}
                                </Text>
                                {search.length > 0 ? (
                                    <TouchableOpacity
                                        style={[styles.secondaryButton, { backgroundColor: palette.primarySoft }]}
                                        onPress={() => setSearch('')}
                                        activeOpacity={0.9}
                                    >
                                        <Text style={[styles.secondaryButtonText, { color: palette.primary }]}>
                                            Clear search
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>
                    }
                />
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    heroStatCard: {
        flex: 1,
        minHeight: 88,
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: 14,
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.16)',
    },
    searchPanel: {
        borderRadius: 28,
        borderWidth: 1,
        padding: 18,
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        padding: 0,
    },
    genderPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        paddingHorizontal: 11,
        paddingVertical: 8,
    },
    genderPillText: {
        fontSize: 12,
        fontWeight: '800',
    },
    resultMeta: {
        fontSize: 12,
        fontWeight: '700',
    },
    stateCard: {
        borderRadius: 28,
        borderWidth: 1,
        paddingHorizontal: 24,
        paddingVertical: 28,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.14,
        shadowRadius: 24,
        elevation: 10,
    },
    stateIcon: {
        width: 54,
        height: 54,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    stateTitle: {
        fontSize: 20,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
    },
    stateCopy: {
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
        marginBottom: 18,
    },
    primaryButton: {
        minHeight: 50,
        borderRadius: 18,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    secondaryButton: {
        minHeight: 48,
        borderRadius: 18,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '800',
    },
});
