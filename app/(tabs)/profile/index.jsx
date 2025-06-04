import {Text, SafeAreaView, View, Image, TouchableOpacity, ScrollView} from 'react-native'
import React from 'react'
import {useAuth} from "@/contexts/AuthContext";
import {router} from "expo-router";
import {Ionicons} from '@expo/vector-icons';
import {formatImageUrl} from '@/utils/imageUtils';

const Profile = () => {
    const {logout, user} = useAuth()

    const handleLogout = async () => {
        try {
            await logout()
        } catch (error) {
            console.error('Logout failed:', error)
        }
    }

    const navigateTo = (route) => {
        router.push(route);
    }

    const menuItems = [
        {
            title: 'Thông tin cá nhân',
            icon: 'person-outline',
            route: '/profile/personal-info'
        },
        {
            title: 'Thông tin tài khoản',
            icon: 'shield-outline',
            route: '/profile/account-info'
        },
        {
            title: 'Địa chỉ',
            icon: 'location-outline',
            route: '/profile/addresses'
        },
        // {
        //     title: 'Thông báo',
        //     icon: 'notifications-outline',
        //     route: '/profile/notifications'
        // },
        {
            title: 'Đơn hàng',
            icon: 'cart-outline',
            route: '/orders'
        },
        {
            title: 'Lịch đã đặt',
            icon: 'calendar-outline',
            route: '/bookings'
        }
    ]

    return (
        <SafeAreaView className="flex-1">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName=''>
                {/* User Info Header */}
                <View className="flex-row p-5 items-center bg-white rounded-b-3xl mb-5 shadow">
                    <Image
                        source={{uri: formatImageUrl(user?.avatar)}}
                        className="w-20 h-20 rounded-full mr-4"
                    />
                    <View className="flex-1">
                        <Text className="text-xl font-bold mb-1">{user?.fullname || 'Người dùng'}</Text>
                        <Text className="text-sm text-gray-500">{user?.email || 'email@example.com'}</Text>
                    </View>
                </View>

                {/* Navigation Menu */}
                <View className="bg-white rounded-xl mx-4 mb-8 shadow">
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            className="flex-row items-center justify-between py-4 px-5 border-b border-gray-100"
                            onPress={() => navigateTo(item.route)}
                        >
                            <View className="flex-row items-center">
                                <Ionicons name={item.icon} size={24} color="#555" />
                                <Text className="text-base ml-4 text-gray-800">{item.title}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#999" />
                        </TouchableOpacity>
                    ))}

                    {/* Logout Button */}
                    <TouchableOpacity
                        className="flex-row items-center justify-between py-4 px-5"
                        onPress={handleLogout}
                    >
                        <View className="flex-row items-center">
                            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                            <Text className="text-base ml-4 text-red-500">Đăng xuất</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Profile