import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { PanResponder, type GestureResponderEvent, type PanResponderGestureState } from 'react-native';

export type StudentTabRoute =
    | 'dashboard'
    | 'hostels'
    | 'reservation'
    | 'payment'
    | 'profile';

const TAB_ORDER: StudentTabRoute[] = [
    'dashboard',
    'hostels',
    'reservation',
    'payment',
    'profile',
];

function shouldHandleSwipe(dx: number, dy: number) {
    return Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) * 1.15;
}

function shouldNavigate(dx: number, dy: number) {
    return Math.abs(dx) > 58 && Math.abs(dx) > Math.abs(dy) * 1.2;
}

export function useStudentTabSwipe(routeName: StudentTabRoute) {
    const router = useRouter();

    return useMemo(
        () =>
            PanResponder.create({
                onMoveShouldSetPanResponder: (
                    _event: GestureResponderEvent,
                    gestureState: PanResponderGestureState
                ) => shouldHandleSwipe(gestureState.dx, gestureState.dy),
                onMoveShouldSetPanResponderCapture: (
                    _event: GestureResponderEvent,
                    gestureState: PanResponderGestureState
                ) => shouldHandleSwipe(gestureState.dx, gestureState.dy),
                onPanResponderRelease: (
                    _event: GestureResponderEvent,
                    gestureState: PanResponderGestureState
                ) => {
                    if (!shouldNavigate(gestureState.dx, gestureState.dy)) {
                        return;
                    }

                    const currentIndex = TAB_ORDER.indexOf(routeName);
                    const nextIndex = gestureState.dx < 0 ? currentIndex + 1 : currentIndex - 1;
                    const nextRoute = TAB_ORDER[nextIndex];

                    if (!nextRoute || nextRoute === routeName) {
                        return;
                    }

                    router.replace(`/(student)/${nextRoute}`);
                },
            }).panHandlers,
        [routeName, router]
    );
}

export function useStudentBackSwipe(targetRoute: Href) {
    const router = useRouter();

    return useMemo(
        () =>
            PanResponder.create({
                onMoveShouldSetPanResponder: (
                    _event: GestureResponderEvent,
                    gestureState: PanResponderGestureState
                ) => shouldHandleSwipe(gestureState.dx, gestureState.dy),
                onMoveShouldSetPanResponderCapture: (
                    _event: GestureResponderEvent,
                    gestureState: PanResponderGestureState
                ) => shouldHandleSwipe(gestureState.dx, gestureState.dy),
                onPanResponderRelease: (
                    _event: GestureResponderEvent,
                    gestureState: PanResponderGestureState
                ) => {
                    if (!shouldNavigate(gestureState.dx, gestureState.dy) || gestureState.dx <= 0) {
                        return;
                    }

                    router.replace(targetRoute);
                },
            }).panHandlers,
        [router, targetRoute]
    );
}
