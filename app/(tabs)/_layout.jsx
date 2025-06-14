import React, {useEffect, useState} from 'react';
import {Tabs, usePathname, useRouter} from "expo-router";
import {Home, PawPrint, ShoppingBag, Scissors, User, MessageCircle} from "lucide-react-native";
import {Icon} from "@/components/ui/icon";
import {TouchableOpacity, View} from 'react-native';

export default function TabLayout () {
    const router = useRouter();

    const handleChatPress = () => {
        router.push('/chat');
    };


    return (
        <View className="flex-1 relative">
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: 'white',
                        borderTopWidth: 0,
                        borderTopColor: '#e2e8f0', // slate-200
                        elevation: 24,
                        shadowColor: '#64748b', // slate-600
                        shadowOffset: {width: 0, height: -3},
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        paddingBottom: 20,
                        paddingTop: 7,
                        marginTop: 5,
                        marginBottom: 0,
                        height: 'fit-content',
                        position: 'absolute',
                    },
                    tabBarActiveTintColor: '#60a5fa', // blue-400
                    tabBarInactiveTintColor: '#94a3b8', // slate-400
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '500',
                    },
                }}
                initialRouteName="index"
                backBehavior="history"
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Trang chủ',
                        tabBarIcon: ({color, size}) => (
                            <Icon as={Home} size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="pets"
                    options={{
                        title: 'Thú cưng',
                        tabBarIcon: ({color, size}) => (
                            <Icon as={PawPrint} size={size} color={color} />
                        ),
                    }}
                    initialRouteName="index"
                    backBehavior="history"
                />
                <Tabs.Screen
                    name="products"
                    options={{
                        title: 'Sản phẩm',
                        tabBarIcon: ({color, size}) => (
                            <Icon as={ShoppingBag} size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="services"
                    options={{
                        title: 'Dịch vụ',
                        tabBarIcon: ({color, size}) => (
                            <Icon as={Scissors} size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Hồ sơ',
                        tabBarIcon: ({color, size}) => (
                            <Icon as={User} size={size} color={color} />
                        ),
                    }}
                />
            </Tabs>

            {/* Floating Action Button với NativeWind */}
            {(
                <TouchableOpacity
                    className="absolute w-14 h-14 bg-blue-300 rounded-full flex items-center justify-center right-5 bottom-28 shadow-md z-50 active:opacity-80"
                    onPress={handleChatPress}
                >
                    <Icon as={MessageCircle} size={24} color="white" />
                </TouchableOpacity>
            )}
        </View>
    );
}