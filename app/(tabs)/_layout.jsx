import React, {useEffect, useState} from 'react';
import {Tabs, usePathname, useRouter} from "expo-router";
import {Home, PawPrint, ShoppingBag, Scissors, User, MessageCircle} from "lucide-react-native";
import {Icon} from "@/components/ui/icon";
import {TouchableOpacity, View} from 'react-native';

export default function TabLayout () {
    const pathname = usePathname();
    const router = useRouter();
    const [previousPath, setPreviousPath] = useState('');
    const [hideTabBar, setHideTabBar] = useState(false);

    const isProductDetailPage = pathname.match(/^\/products\/[^\/]+$/);
    const isServiceDetailPage = pathname.match(/^\/services\/[^\/]+$/);
    const isProductReviewsPage = pathname.match(/^\/products\/[^\/]+\/reviews$/);
    const isServiceReviewsPage = pathname.match(/^\/services\/[^\/]+\/reviews$/);

    // Sử dụng useEffect để theo dõi sự thay đổi đường dẫn và cập nhật trạng thái ẩn tab
    useEffect(() => {
        // Nếu đang ở trang chi tiết hoặc trang đánh giá, ẩn tab
        if (isProductDetailPage || isServiceDetailPage || isProductReviewsPage || isServiceReviewsPage) {
            setHideTabBar(true);
        }
        // Nếu đang ở trang danh sách sản phẩm, và từng ở trang orders 
        // (nghĩa là đang trong quy trình chuyển từ orders->products->product detail)
        else if (pathname === '/products' && previousPath === '/orders') {
            setHideTabBar(true);
        }
        else {
            setHideTabBar(false);
        }

        // Cập nhật đường dẫn trước đó
        setPreviousPath(pathname);
    }, [pathname]);

    const handleChatPress = () => {
        router.push('/chat');
    };


    return (
        <View className="flex-1 relative">
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: hideTabBar ? {display: "none"} : {
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
            {!hideTabBar && (
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