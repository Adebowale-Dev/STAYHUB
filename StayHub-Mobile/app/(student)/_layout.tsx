import React from 'react';
import { Tabs } from 'expo-router';
import { AnimatedTabBar } from '../../components/tab';

export default function StudentLayout() {
    return (
        <Tabs
            tabBar={(props) => <AnimatedTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen name="dashboard" options={{ title: 'Home' }} />
            <Tabs.Screen name="hostels" options={{ title: 'Hostels' }} />
            <Tabs.Screen name="reservation" options={{ title: 'Reserve' }} />
            <Tabs.Screen name="payment" options={{ title: 'Payment' }} />
            <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
            <Tabs.Screen name="notifications" options={{ href: null, title: 'Notifications' }} />
            <Tabs.Screen name="rooms/[id]" options={{ href: null, title: 'Room', headerShown: true }} />
        </Tabs>
    );
}
