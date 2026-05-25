import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Divider, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { studentAPI } from '../../../services/api';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { getStudentPalette } from '../../../constants/design';
import type { ReservationInvitePreview, Room } from '../../../types';

type RoomTone = {
    label: string;
    color: string;
    backgroundColor: string;
    accentColor: string;
};

const getRoomStatusMeta = (palette: ReturnType<typeof getStudentPalette>): Record<string, RoomTone> => ({
    available: {
        label: 'Available',
        color: palette.success,
        backgroundColor: palette.successSoft,
        accentColor: palette.success,
    },
    partially_occupied: {
        label: 'Available',
        color: palette.success,
        backgroundColor: palette.successSoft,
        accentColor: palette.success,
    },
    full: {
        label: 'Full',
        color: palette.danger,
        backgroundColor: palette.dangerSoft,
        accentColor: palette.danger,
    },
    maintenance: {
        label: 'Maintenance',
        color: palette.warning,
        backgroundColor: palette.warningSoft,
        accentColor: palette.warning,
    },
});

export default function RoomsScreen() {
    const { id: hostelId } = useLocalSearchParams<{ id: string }>();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(false);
    const [reserving, setReserving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [groupMatrics, setGroupMatrics] = useState<string[]>([]);
    const [invitePreviews, setInvitePreviews] = useState<ReservationInvitePreview[]>([]);
    const [validatingFriends, setValidatingFriends] = useState(false);
    const router = useRouter();
    const theme = useTheme();
    const palette = getStudentPalette(theme.dark);
    const insets = useSafeAreaInsets();
    const roomStatusMeta = useMemo(() => getRoomStatusMeta(palette), [palette]);
    const bottomContentPadding = Math.max(insets.bottom + 96, 116);
    const headerTop = insets.top + 18;
    const headerHeight = 74;
    const bedTone = useMemo(() => ({
        empty: palette.divider,
        occupied: palette.danger,
        you: palette.primaryStrong,
        friends: palette.primary,
    }), [palette]);

    const loadRooms = async () => {
        if (!hostelId) {
            return;
        }

        setError(false);
        try {
            const response = await studentAPI.getRooms(hostelId);
            const data: Room[] = (response.data as any).data ?? response.data ?? [];
            setRooms(data);
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
        loadRooms();
    }, [hostelId]);

    const onRefresh = () => {
        setRefreshing(true);
        loadRooms();
    };

    const openReservation = (room: Room) => {
        setSelectedRoom(room);
        setGroupMatrics([]);
        setInvitePreviews([]);
        setModalVisible(true);
    };

    const availableRoomCount = useMemo(
        () => rooms.filter((room) => room.availableSpaces > 0 && room.status !== 'maintenance').length,
        [rooms],
    );

    const totalAvailableBeds = useMemo(
        () => rooms.reduce((sum, room) => sum + Math.max(room.availableSpaces, 0), 0),
        [rooms],
    );

    const fullRoomCount = useMemo(
        () => rooms.filter((room) => room.availableSpaces === 0 || room.status === 'full').length,
        [rooms],
    );

    const maxFriends = Math.max((selectedRoom?.availableSpaces ?? 1) - 1, 0);
    const filledMatrics = groupMatrics.map((matric) => matric.trim()).filter(Boolean);
    const totalReserving = 1 + filledMatrics.length;

    const addFriend = () => {
        if (groupMatrics.length < maxFriends) {
            setGroupMatrics([...groupMatrics, '']);
            setInvitePreviews([]);
        }
    };

    const updateFriend = (index: number, value: string) => {
        const updated = [...groupMatrics];
        updated[index] = value.toUpperCase();
        setGroupMatrics(updated);
        setInvitePreviews([]);
    };

    const removeFriend = (index: number) => {
        setGroupMatrics(groupMatrics.filter((_, currentIndex) => currentIndex !== index));
        setInvitePreviews([]);
    };
    const validateInvitePreviews = async () => {
        if (!selectedRoom || filledMatrics.length === 0) {
            setInvitePreviews([]);
            return [];
        }
        setValidatingFriends(true);
        try {
            const previews = await Promise.all(filledMatrics.map(async (matricNo) => {
                const response = await studentAPI.previewReservationInvite({
                    roomId: selectedRoom._id,
                    hostelId: typeof hostelId === 'string' ? hostelId : undefined,
                    matricNo,
                });
                return response.data.data;
            }));
            setInvitePreviews(previews);
            return previews;
        }
        finally {
            setValidatingFriends(false);
        }
    };
    const getDepartmentLabel = (preview: ReservationInvitePreview) => {
        const department = preview.friend.department;
        if (!department) {
            return null;
        }
        if (typeof department === 'string') {
            return department;
        }
        return department.name || department.code || null;
    };
    const getInviteChannelsLabel = (preview: ReservationInvitePreview) => {
        const channels: string[] = [];
        if (preview.invitation.notificationChannels.email.willSend) {
            channels.push('email');
        }
        if (preview.invitation.notificationChannels.inApp.willSend) {
            channels.push('in-app');
        }
        if (preview.invitation.notificationChannels.push.willSend) {
            channels.push('push');
        }
        return channels.length > 0 ? channels.join(', ') : 'StayHub notifications';
    };

    const handleReserve = async () => {
        if (!selectedRoom) {
            return;
        }

        const uniqueCheck = new Set(filledMatrics);
        if (uniqueCheck.size !== filledMatrics.length) {
            Alert.alert('Duplicate entry', 'Each friend must have a unique matric number.');
            return;
        }

        const payload: any = { roomId: selectedRoom._id, hostelId };
        if (filledMatrics.length > 0) {
            payload.groupMembers = filledMatrics;
        }

        setReserving(true);
        try {
            if (filledMatrics.length > 0) {
                await validateInvitePreviews();
            }
            await studentAPI.reserveRoom(payload);
            setModalVisible(false);
            Alert.alert('Success', filledMatrics.length > 0
                ? 'Room reserved successfully. Your friends will receive email and StayHub notifications to approve within 24 hours.'
                : 'Room reserved successfully.', [
                { text: 'View reservation', onPress: () => router.push('/(student)/reservation') },
                { text: 'Done' },
            ]);
            loadRooms();
        }
        catch (errorResponse: any) {
            Alert.alert('Error', errorResponse.response?.data?.message ?? 'Reservation failed. Please try again.');
        }
        finally {
            setReserving(false);
        }
    };

    if (loading) {
        return (
            <LoadingSpinner
                title="Loading rooms"
                message="We are preparing live room availability, bed counts, and reservation options."
            />
        );
    }

    const listHeader = (
        <>
            <View style={styles.headerBody}>
                <View className="flex-row gap-2.5">
                    <View
                        style={[
                            styles.heroStatCard,
                            {
                                backgroundColor: palette.surfaceMuted,
                                borderColor: palette.border,
                            },
                        ]}
                    >
                        <Text className="text-2xl font-extrabold" style={{ color: palette.textPrimary }}>{availableRoomCount}</Text>
                        <Text className="text-[12px] font-bold leading-[18px]" style={{ color: palette.textSecondary }}>Open rooms</Text>
                    </View>
                    <View
                        style={[
                            styles.heroStatCard,
                            {
                                backgroundColor: palette.surfaceMuted,
                                borderColor: palette.border,
                            },
                        ]}
                    >
                        <Text className="text-2xl font-extrabold" style={{ color: palette.textPrimary }}>{totalAvailableBeds}</Text>
                        <Text className="text-[12px] font-bold leading-[18px]" style={{ color: palette.textSecondary }}>Beds left</Text>
                    </View>
                    <View
                        style={[
                            styles.heroStatCard,
                            {
                                backgroundColor: palette.surfaceMuted,
                                borderColor: palette.border,
                            },
                        ]}
                    >
                        <Text className="text-2xl font-extrabold" style={{ color: palette.textPrimary }}>{fullRoomCount}</Text>
                        <Text className="text-[12px] font-bold leading-[18px]" style={{ color: palette.textSecondary }}>Full rooms</Text>
                    </View>
                </View>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: palette.textMuted }]}>Available options</Text>
                <Text style={[styles.sectionCount, { color: palette.textSecondary }]}>
                    {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
                </Text>
            </View>
        </>
    );

    if (error) {
        return (
            <View style={[styles.screen, { backgroundColor: palette.pageBackground }]}>
                <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={palette.surface} />
                <View style={[styles.fixedHeaderShell, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
                    <View style={[styles.fixedHeader, { paddingTop: headerTop }]}>
                        <View style={styles.fixedHeaderRow}>
                            <TouchableOpacity
                                onPress={() => router.replace('/(student)/hostels')}
                                style={[styles.fixedBackButton, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}
                                activeOpacity={0.85}
                            >
                                <MaterialCommunityIcons name="arrow-left" size={20} color={palette.textPrimary} />
                            </TouchableOpacity>
                            <Text style={[styles.fixedTitle, { color: palette.textPrimary }]}>Available rooms</Text>
                        </View>
                    </View>
                </View>
                <View style={[styles.section, { paddingTop: headerTop + headerHeight }]}>
                    {listHeader}
                    <View
                        style={[
                            styles.errorPanel,
                            {
                                backgroundColor: palette.surface,
                                borderColor: palette.border,
                                shadowColor: palette.shadow,
                            },
                        ]}
                    >
                        <View style={[styles.errorIconWrap, { backgroundColor: palette.primarySoft }]}>
                            <MaterialCommunityIcons name="wifi-off" size={32} color={palette.primary} />
                        </View>
                        <Text style={[styles.errorTitle, { color: palette.textPrimary }]}>Could not load rooms</Text>
                        <Text style={[styles.errorCopy, { color: palette.textSecondary }]}>
                            Check your connection and try again.
                        </Text>
                        <TouchableOpacity
                            style={[styles.retryButton, { backgroundColor: palette.primary }]}
                            activeOpacity={0.85}
                            onPress={() => {
                                setLoading(true);
                                loadRooms();
                            }}
                        >
                            <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.screen, { backgroundColor: palette.pageBackground }]}>
            <StatusBar barStyle={theme.dark ? 'light-content' : 'dark-content'} backgroundColor={palette.surface} />

            <View style={[styles.fixedHeaderShell, { backgroundColor: palette.surface, borderBottomColor: palette.border }]}>
                <View style={[styles.fixedHeader, { paddingTop: headerTop }]}>
                    <View style={styles.fixedHeaderRow}>
                        <TouchableOpacity
                            onPress={() => router.replace('/(student)/hostels')}
                            style={[styles.fixedBackButton, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}
                            activeOpacity={0.85}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={20} color={palette.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[styles.fixedTitle, { color: palette.textPrimary }]}>Available rooms</Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={rooms}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{
                    paddingTop: headerTop + headerHeight,
                    paddingBottom: bottomContentPadding,
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={palette.primary}
                        colors={[palette.primary]}
                    />
                }
                ListHeaderComponent={listHeader}
                ListEmptyComponent={
                    <View
                        style={[
                            styles.emptyPanel,
                            {
                                backgroundColor: palette.surface,
                                borderColor: palette.border,
                                shadowColor: palette.shadow,
                            },
                        ]}
                    >
                        <View style={[styles.emptyIconWrap, { backgroundColor: palette.primarySoft }]}>
                            <MaterialCommunityIcons name="bed-empty" size={34} color={palette.primary} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>No rooms available</Text>
                        <Text style={[styles.emptyCopy, { color: palette.textSecondary }]}>
                            There are no room options for this hostel right now.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const available = item.availableSpaces > 0 && item.status !== 'maintenance' && item.status !== 'full';
                    const tone = roomStatusMeta[item.status] ?? (available ? roomStatusMeta.available : roomStatusMeta.full);
                    const occupancyRatio = item.capacity > 0 ? item.currentOccupancy / item.capacity : 0;

                    return (
                        <View
                            style={[
                                styles.roomCard,
                                {
                                    backgroundColor: palette.surface,
                                    borderColor: palette.border,
                                    shadowColor: palette.shadow,
                                },
                            ]}
                        >
                            <View style={[styles.roomAccent, { backgroundColor: tone.accentColor }]} />

                            <View style={styles.roomBody}>
                                <View style={styles.roomHeader}>
                                    <View style={styles.roomHeaderCopy}>
                                        <Text style={[styles.roomTitle, { color: palette.textPrimary }]}>Room {item.roomNumber}</Text>
                                        <Text style={[styles.roomSubtitle, { color: palette.textSecondary }]}>
                                            {item.currentOccupancy} of {item.capacity} beds occupied
                                        </Text>
                                    </View>

                                    <View style={[styles.statusPill, { backgroundColor: tone.backgroundColor }]}>
                                        <Text style={[styles.statusPillText, { color: tone.color }]}>{tone.label}</Text>
                                    </View>
                                </View>

                                <View style={styles.metricGrid}>
                                    <View style={[styles.metricCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                                        <Text style={[styles.metricLabel, { color: palette.textMuted }]}>Open beds</Text>
                                        <Text style={[styles.metricValue, { color: palette.textPrimary }]}>{item.availableSpaces}</Text>
                                    </View>

                                    <View style={[styles.metricCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                                        <Text style={[styles.metricLabel, { color: palette.textMuted }]}>Capacity</Text>
                                        <Text style={[styles.metricValue, { color: palette.textPrimary }]}>{item.capacity}</Text>
                                    </View>

                                    <View style={[styles.metricCardWide, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                                        <View style={styles.progressHeader}>
                                            <Text style={[styles.metricLabel, { color: palette.textMuted }]}>Occupancy</Text>
                                            <Text style={[styles.progressValue, { color: tone.color }]}>
                                                {Math.round(occupancyRatio * 100)}%
                                            </Text>
                                        </View>
                                        <View style={[styles.progressTrack, { backgroundColor: palette.divider }]}>
                                            <View
                                                style={[
                                                    styles.progressFill,
                                                    {
                                                        width: `${Math.min(Math.max(occupancyRatio * 100, 0), 100)}%`,
                                                        backgroundColor: tone.accentColor,
                                                    },
                                                ]}
                                            />
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.bedLegendRow}>
                                    {Array.from({ length: item.capacity }).map((_, index) => {
                                        let backgroundColor = bedTone.empty;
                                        if (index < item.currentOccupancy) {
                                            backgroundColor = bedTone.occupied;
                                        }
                                        else if (index < item.currentOccupancy + item.availableSpaces) {
                                            backgroundColor = tone.accentColor;
                                        }

                                        return <View key={index} style={[styles.bedDot, { backgroundColor }]} />;
                                    })}
                                </View>

                                <TouchableOpacity
                                    style={[
                                        styles.reserveButton,
                                        { backgroundColor: palette.primarySoft },
                                        !available && styles.reserveButtonDisabled,
                                        !available && { backgroundColor: palette.surfaceMuted },
                                    ]}
                                    activeOpacity={0.85}
                                    onPress={() => openReservation(item)}
                                    disabled={!available}
                                >
                                    <Text style={[styles.reserveButtonText, !available && styles.reserveButtonTextDisabled]}>
                                        {available ? 'Reserve this room' : tone.label}
                                    </Text>
                                    <MaterialCommunityIcons
                                        name={available ? 'arrow-right' : 'lock-outline'}
                                        size={18}
                                        color={available ? palette.primary : palette.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                }}
            />

            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalWrap}>
                        <View style={[styles.modalSheet, { backgroundColor: palette.surface }]}>
                            <View style={[styles.modalHandle, { backgroundColor: palette.border }]} />

                            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                                <View style={styles.modalHero}>
                                    <View style={[styles.modalHeroIcon, { backgroundColor: palette.primarySoft }]}>
                                        <MaterialCommunityIcons name="bed-outline" size={22} color={palette.primary} />
                                    </View>
                                    <View style={styles.modalHeroCopy}>
                                        <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                                            Reserve Room {selectedRoom?.roomNumber}
                                        </Text>
                                        <Text style={[styles.modalSubtitle, { color: palette.textSecondary }]}>
                                            {selectedRoom?.capacity}-person room | {selectedRoom?.availableSpaces} bed{selectedRoom?.availableSpaces !== 1 ? 's' : ''} available
                                        </Text>
                                    </View>
                                </View>

                                <Divider style={{ backgroundColor: palette.divider, marginBottom: 18 }} />

                                <Text style={[styles.modalLabel, { color: palette.textMuted }]}>Bed layout</Text>

                                <View style={styles.bedSlots}>
                                    {Array.from({ length: selectedRoom?.capacity ?? 0 }).map((_, index) => {
                                        const occupied = selectedRoom?.currentOccupancy ?? 0;
                                        let backgroundColor = bedTone.empty;
                                        let iconName: React.ComponentProps<typeof MaterialCommunityIcons>['name'] | null = null;

                                        if (index < occupied) {
                                            backgroundColor = bedTone.occupied;
                                            iconName = 'account';
                                        }
                                        else if (index === occupied) {
                                            backgroundColor = bedTone.you;
                                            iconName = 'account-star';
                                        }
                                        else if (index < occupied + totalReserving) {
                                            backgroundColor = bedTone.friends;
                                            iconName = 'account-plus';
                                        }

                                        return (
                                            <View key={index} style={[styles.bedSlot, { backgroundColor }]}>
                                                {iconName ? <MaterialCommunityIcons name={iconName} size={12} color="#FFFFFF" /> : null}
                                            </View>
                                        );
                                    })}
                                </View>

                                <View style={styles.legend}>
                                    {[
                                        { label: 'Occupied', color: bedTone.occupied },
                                        { label: 'You', color: bedTone.you },
                                        { label: 'Friends', color: bedTone.friends },
                                        { label: 'Empty', color: bedTone.empty },
                                    ].map((item) => (
                                        <View key={item.label} style={styles.legendItem}>
                                            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                                            <Text style={[styles.legendText, { color: palette.textSecondary }]}>{item.label}</Text>
                                        </View>
                                    ))}
                                </View>

                                <Divider style={{ backgroundColor: palette.divider, marginVertical: 18 }} />

                                <View style={styles.modalSectionHeader}>
                                    <Text style={[styles.modalLabel, { color: palette.textMuted }]}>Friends sharing this room</Text>
                                    <Text style={[styles.modalMetaText, { color: palette.textSecondary }]}>
                                        Optional | up to {maxFriends}
                                    </Text>
                                </View>

                                {maxFriends === 0 ? (
                                    <Text style={[styles.noSpaceHint, { color: palette.danger }]}>Only 1 space left - no room for friends.</Text>
                                ) : (
                                    <>
                                        <Text style={[styles.groupHint, { color: palette.textSecondary }]}>
                                            Add matric numbers for friends who should share the same room with you.
                                        </Text>

                                        {groupMatrics.map((matric, index) => (
                                            <View key={index} style={styles.groupRow}>
                                                <TextInput
                                                    mode="outlined"
                                                    value={matric}
                                                    onChangeText={(value) => updateFriend(index, value)}
                                                    placeholder={`Friend ${index + 1} matric number`}
                                                    autoCapitalize="characters"
                                                    autoCorrect={false}
                                                    style={styles.groupInput}
                                                    outlineColor={palette.border}
                                                    activeOutlineColor={palette.primary}
                                                    left={<TextInput.Icon icon="account-outline" />}
                                                />
                                                <IconButton icon="close-circle" iconColor={palette.danger} size={22} onPress={() => removeFriend(index)} />
                                            </View>
                                        ))}

                                        {groupMatrics.length < maxFriends ? (
                                            <TouchableOpacity style={[styles.addFriendButton, { backgroundColor: palette.primarySoft }]} activeOpacity={0.85} onPress={addFriend}>
                                                <MaterialCommunityIcons name="plus-circle-outline" size={18} color={palette.primary} />
                                                <Text style={[styles.addFriendButtonText, { color: palette.primary }]}>Add a friend</Text>
                                            </TouchableOpacity>
                                        ) : null}

                                        {filledMatrics.length > 0 ? (
                                            <TouchableOpacity
                                                style={[
                                                    styles.validateInviteButton,
                                                    {
                                                        borderColor: palette.border,
                                                        backgroundColor: palette.surfaceRaised,
                                                    },
                                                    validatingFriends && styles.disabledButton,
                                                ]}
                                                activeOpacity={0.85}
                                                onPress={() => { validateInvitePreviews().catch((errorResponse: any) => {
                                                    Alert.alert('Invite check failed', errorResponse.response?.data?.message ?? 'Could not verify this matric number.');
                                                }); }}
                                                disabled={validatingFriends}
                                            >
                                                {validatingFriends ? (
                                                    <ActivityIndicator size="small" color={palette.primary} />
                                                ) : (
                                                    <>
                                                        <MaterialCommunityIcons name="email-check-outline" size={18} color={palette.primary} />
                                                        <Text style={[styles.validateInviteButtonText, { color: palette.primary }]}>Check invite delivery</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        ) : null}

                                        {invitePreviews.length > 0 ? (
                                            <View style={styles.previewList}>
                                                {invitePreviews.map((preview) => (
                                                    <View key={preview.friend._id} style={[styles.previewCard, { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}>
                                                        <View style={styles.previewCardHeader}>
                                                            <View>
                                                                <Text style={[styles.previewName, { color: palette.textPrimary }]}>
                                                                    {preview.friend.firstName} {preview.friend.lastName}
                                                                </Text>
                                                                <Text style={[styles.previewMeta, { color: palette.textSecondary }]}>
                                                                    {preview.friend.matricNo}
                                                                    {getDepartmentLabel(preview) ? ` • ${getDepartmentLabel(preview)}` : ''}
                                                                    {preview.friend.level ? ` • ${preview.friend.level} level` : ''}
                                                                </Text>
                                                            </View>
                                                            <View style={[styles.previewStatusPill, { backgroundColor: palette.successSoft }]}>
                                                                <Text style={[styles.previewStatusPillText, { color: palette.success }]}>Ready</Text>
                                                            </View>
                                                        </View>

                                                        <Text style={[styles.previewCopy, { color: palette.textSecondary }]}>
                                                            Invite will go out by {getInviteChannelsLabel(preview)}
                                                            {preview.invitation.notificationChannels.email.addressMasked
                                                                ? ` to ${preview.invitation.notificationChannels.email.addressMasked}`
                                                                : ''}
                                                            . Approval closes in {preview.invitation.approvalWindowHours} hours.
                                                        </Text>

                                                        {preview.invitation.requiresPaymentBeforeApproval ? (
                                                            <View style={[styles.previewWarningRow, { backgroundColor: palette.warningSoft }]}>
                                                                <MaterialCommunityIcons name="credit-card-clock-outline" size={16} color={palette.warning} />
                                                                <Text style={[styles.previewWarningText, { color: palette.warning }]}>Payment is still pending for this friend, so they will need to pay before approval.</Text>
                                                            </View>
                                                        ) : null}
                                                    </View>
                                                ))}
                                            </View>
                                        ) : null}
                                    </>
                                )}

                                <View style={[styles.summaryBanner, { backgroundColor: palette.surfaceMuted }]}>
                                    <View style={[styles.summaryIcon, { backgroundColor: palette.surface }]}>
                                        <MaterialCommunityIcons name="information-outline" size={16} color={palette.primary} />
                                    </View>
                                    <Text style={[styles.summaryText, { color: palette.textSecondary }]}>
                                        {filledMatrics.length === 0
                                            ? 'You are reserving 1 bed for yourself.'
                                            : `You are reserving ${totalReserving} beds - you plus ${filledMatrics.length} friend${
                                                  filledMatrics.length > 1 ? 's' : ''
                                              } in the same room. StayHub will email them and also notify them inside the app.`}
                                    </Text>
                                </View>
                            </ScrollView>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalCancelButton, { borderColor: palette.border, backgroundColor: palette.surface }, (reserving || validatingFriends) && styles.disabledButton]}
                                    activeOpacity={0.85}
                                    onPress={() => setModalVisible(false)}
                                    disabled={reserving || validatingFriends}
                                >
                                    <Text style={[styles.modalCancelButtonText, { color: palette.textSecondary }]}>Cancel</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalPrimaryButton, { backgroundColor: palette.primary }, (reserving || validatingFriends) && styles.disabledButton]}
                                    activeOpacity={0.85}
                                    onPress={handleReserve}
                                    disabled={reserving || validatingFriends}
                                >
                                    {reserving ? (
                                        <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : (
                                        <>
                                            <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFFFFF" />
                                            <Text style={styles.modalPrimaryButtonText}>Confirm reservation</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
    },
    fixedHeaderShell: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        borderBottomWidth: 1,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    fixedHeader: {
        paddingHorizontal: 18,
        paddingBottom: 20,
    },
    fixedHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    fixedBackButton: {
        width: 38,
        height: 38,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fixedTitle: {
        fontSize: 28,
        lineHeight: 34,
        fontWeight: '800',
        letterSpacing: -0.6,
        flexShrink: 1,
    },
    headerBody: {
        paddingHorizontal: 18,
        paddingTop: 18,
    },
    heroStatCard: {
        flex: 1,
        minHeight: 88,
        borderRadius: 22,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    sectionHeader: {
        paddingHorizontal: 18,
        paddingTop: 22,
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.1,
    },
    sectionCount: {
        fontSize: 12,
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: 18,
        paddingTop: 22,
    },
    roomCard: {
        marginHorizontal: 18,
        marginBottom: 16,
        borderRadius: 22,
        overflow: 'hidden',
        flexDirection: 'row',
        borderWidth: 1,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.07,
        shadowRadius: 18,
        elevation: 4,
    },
    roomAccent: {
        width: 5,
    },
    roomBody: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    roomHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 14,
    },
    roomHeaderCopy: {
        flex: 1,
    },
    roomTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 4,
    },
    roomSubtitle: {
        fontSize: 13,
        lineHeight: 18,
    },
    statusPill: {
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    metricGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    metricCard: {
        width: '48%',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
    },
    metricCardWide: {
        width: '100%',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
    },
    metricLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 8,
    },
    metricValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressValue: {
        fontSize: 12,
        fontWeight: '800',
    },
    progressTrack: {
        height: 8,
        borderRadius: 999,
        overflow: 'hidden',
    },
    progressFill: {
        height: 8,
        borderRadius: 999,
    },
    bedLegendRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 16,
        marginBottom: 16,
    },
    bedDot: {
        width: 18,
        height: 18,
        borderRadius: 6,
    },
    reserveButton: {
        minHeight: 46,
        borderRadius: 16,
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    reserveButtonDisabled: {
        backgroundColor: 'transparent',
    },
    reserveButtonText: {
        color: '#0C4A8C',
        fontSize: 14,
        fontWeight: '800',
    },
    reserveButtonTextDisabled: {
        color: '#94A3B8',
    },
    emptyPanel: {
        marginHorizontal: 18,
        marginTop: 12,
        borderRadius: 22,
        borderWidth: 1,
        paddingHorizontal: 24,
        paddingVertical: 28,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.07,
        shadowRadius: 18,
        elevation: 4,
    },
    emptyIconWrap: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
    },
    emptyCopy: {
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
    },
    errorPanel: {
        borderRadius: 22,
        borderWidth: 1,
        paddingHorizontal: 24,
        paddingVertical: 28,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.07,
        shadowRadius: 18,
        elevation: 4,
    },
    errorIconWrap: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
    },
    errorCopy: {
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
        marginBottom: 18,
    },
    retryButton: {
        minHeight: 46,
        borderRadius: 16,
        backgroundColor: '#0C4A8C',
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(9, 21, 38, 0.48)',
        justifyContent: 'flex-end',
    },
    modalWrap: {
        width: '100%',
    },
    modalSheet: {
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 22,
        paddingTop: 12,
        paddingBottom: 28,
        maxHeight: '88%',
    },
    modalHandle: {
        alignSelf: 'center',
        width: 46,
        height: 5,
        borderRadius: 999,
        backgroundColor: 'transparent',
        marginBottom: 18,
    },
    modalHero: {
        flexDirection: 'row',
        gap: 14,
        marginBottom: 16,
    },
    modalHeroIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalHeroCopy: {
        flex: 1,
        gap: 4,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        lineHeight: 26,
    },
    modalSubtitle: {
        fontSize: 13,
        lineHeight: 19,
    },
    modalLabel: {
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 10,
    },
    bedSlots: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 14,
    },
    bedSlot: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 11,
        fontWeight: '600',
    },
    modalSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        marginBottom: 4,
    },
    modalMetaText: {
        fontSize: 12,
        fontWeight: '600',
    },
    noSpaceHint: {
        color: '#B91C1C',
        fontSize: 13,
        lineHeight: 19,
    },
    groupHint: {
        fontSize: 13,
        lineHeight: 19,
        marginBottom: 12,
    },
    groupRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    groupInput: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    addFriendButton: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: 'transparent',
    },
    addFriendButtonText: {
        color: '#0C4A8C',
        fontSize: 13,
        fontWeight: '700',
    },
    validateInviteButton: {
        marginTop: 14,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
    },
    validateInviteButtonText: {
        color: '#0C4A8C',
        fontSize: 13,
        fontWeight: '700',
    },
    previewList: {
        marginTop: 14,
        gap: 10,
    },
    previewCard: {
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 10,
    },
    previewCardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
    },
    previewName: {
        fontSize: 15,
        fontWeight: '800',
    },
    previewMeta: {
        fontSize: 12,
        lineHeight: 18,
        marginTop: 4,
    },
    previewStatusPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: 'transparent',
    },
    previewStatusPillText: {
        color: '#15803D',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    previewCopy: {
        fontSize: 13,
        lineHeight: 19,
    },
    previewWarningRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        borderRadius: 14,
        backgroundColor: 'transparent',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    previewWarningText: {
        flex: 1,
        color: '#B45309',
        fontSize: 12,
        lineHeight: 18,
    },
    summaryBanner: {
        marginTop: 18,
        borderRadius: 18,
        backgroundColor: 'transparent',
        paddingHorizontal: 14,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    summaryIcon: {
        width: 28,
        height: 28,
        borderRadius: 10,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 19,
        color: '#667085',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    modalCancelButton: {
        flex: 1,
        minHeight: 50,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelButtonText: {
        color: '#667085',
        fontSize: 14,
        fontWeight: '800',
    },
    modalPrimaryButton: {
        flex: 1,
        minHeight: 50,
        borderRadius: 16,
        backgroundColor: '#0C4A8C',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    modalPrimaryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    disabledButton: {
        opacity: 0.7,
    },
});
