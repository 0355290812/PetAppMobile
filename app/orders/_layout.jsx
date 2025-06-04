import {Stack, router} from "expo-router";
import {canGoBack} from "expo-router/build/global-state/routing";
import {View, Pressable} from "react-native";
import {Icon} from "@/components/ui/icon";
import {ChevronLeft} from 'lucide-react-native';

export default function OrderLayout () {
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
                    title: "Đơn hàng",
                    headerShown: true,
                    canGoBack: true,
                }}
            />
            <Stack.Screen
                name="confirmation"
                options={{
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    headerShown: false
                }}
            />
        </Stack>
    );
}
