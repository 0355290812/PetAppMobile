import React from 'react';
import {Stack} from 'expo-router';
import {Pressable} from 'react-native';
import {Icon} from "@/components/ui/icon";
import {ChevronLeft} from 'lucide-react-native';
import {router} from 'expo-router';

export default function ProfileLayout () {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                contentStyle: {backgroundColor: 'white'},
                headerBackVisible: false, // Ẩn nút back mặc định
                headerTintColor: '#374151',
                headerStyle: {
                    backgroundColor: 'white',
                },
                headerTitleStyle: {
                    fontSize: 17,
                    fontWeight: '600',
                },
                headerLeft: ({canGoBack}) =>
                    canGoBack ? (
                        <Pressable
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-full items-center justify-center -ml-1"
                        >
                            <Icon as={ChevronLeft} size="md" color="#374151" />
                        </Pressable>
                    ) : null
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: "Tài khoản",
                    headerShown: false
                }}
            />
            <Stack.Screen
                name="personal-info"
                options={{
                    title: "Thông tin cá nhân"
                }}
            />
            <Stack.Screen
                name="account-info"
                options={{
                    title: "Thông tin tài khoản"
                }}
            />
            <Stack.Screen
                name="notifications"
                options={{
                    title: "Thông báo"
                }}
            />
            {/* <Stack.Screen
                name="orders"
                options={{
                    title: "Đơn hàng"
                }}
            />
            <Stack.Screen
                name="bookings"
                options={{
                    title: "Lịch đã đặt"
                }}
            /> */}
            <Stack.Screen
                name="addresses"
                options={{
                    title: "Địa chỉ"
                }}
            />
            <Stack.Screen
                name="add-address"
                options={{
                    title: "Thêm địa chỉ"
                }}
            />
            <Stack.Screen
                name="edit-address"
                options={{
                    title: "Chỉnh sửa địa chỉ"
                }}
            />

        </Stack>
    );
}