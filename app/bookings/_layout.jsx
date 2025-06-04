import {Stack, router} from 'expo-router';
import {View, Pressable} from 'react-native';
import {Icon} from "@/components/ui/icon";
import {ChevronLeft} from 'lucide-react-native';

export default function BookingsLayout () {
    return (
        <Stack screenOptions={{
            headerLeft: ({canGoBack}) =>
                canGoBack ? (
                    <Pressable
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full items-center justify-center -ml-1"
                    >
                        <Icon as={ChevronLeft} size="md" color="#374151" />
                    </Pressable>
                ) : (
                    <Pressable
                        onPress={() => router.replace('/profile')}
                        className="w-10 h-10 rounded-full items-center justify-center -ml-1"
                    >
                        <Icon as={ChevronLeft} size="md" color="#374151" />
                    </Pressable>
                )
        }}>
            <Stack.Screen
                name="index"
                options={{
                    title: 'Lịch hẹn của tôi',
                    headerTitleAlign: 'center',
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: 'Chi tiết lịch hẹn',
                    headerTitleAlign: 'center',
                    presentation: 'card',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="confirmation"
                options={{
                    title: 'Xác nhận đặt lịch',
                    headerTitleAlign: 'center',
                    presentation: 'modal',
                }}
            />
        </Stack>
    );
}
