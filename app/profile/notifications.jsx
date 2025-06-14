import React, {useState, useEffect} from 'react';
import {FlatList, RefreshControl} from 'react-native';
import {router} from 'expo-router';
import {useAuth} from "@/contexts/AuthContext";
import {subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead} from '@/services/notificationService';
import {formatDistanceToNow} from 'date-fns';
import {vi} from 'date-fns/locale';

// GlueStack UI Components
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";
import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {Heading} from "@/components/ui/heading";
import {Avatar, AvatarFallbackText} from "@/components/ui/avatar";
import {Button, ButtonText} from "@/components/ui/button";
import {Icon} from "@/components/ui/icon";
import {Spinner} from "@/components/ui/spinner";
import {Badge, BadgeText} from "@/components/ui/badge";
import {Pressable} from '@/components/ui/pressable';
import {Divider} from "@/components/ui/divider";
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast
} from '@/components/ui/toast';
import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogCloseButton
} from "@/components/ui/alert-dialog";

// Icons
import {
    Bell,
    BellOff,
    ShoppingCart,
    Calendar,
    Info,
    Heart,
    Gift,
    ArrowLeft,
    MoreVertical,
    CheckCheck
} from 'lucide-react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

const NotificationsScreen = () => {
    const {user} = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showMarkAllDialog, setShowMarkAllDialog] = useState(false);
    const toast = useToast();

    useEffect(() => {
        if (!user?._id) return;

        const unsubscribe = subscribeToNotifications(user._id, (notificationsData) => {
            setNotifications(notificationsData);
            setLoading(false);
            setRefreshing(false);
        });

        return () => unsubscribe();
    }, [user?.id]);

    const handleNotificationPress = async (notification) => {
        if (!notification.isRead) {
            await markNotificationAsRead(notification.id);
        }

        // Navigate using the link field
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const handleMarkAllAsRead = async () => {
        const success = await markAllNotificationsAsRead(user.id);

        if (success) {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="success" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Thành công</ToastTitle>
                            <ToastDescription>Đã đánh dấu tất cả thông báo là đã đọc</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } else {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể đánh dấu thông báo</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        }

        setShowMarkAllDialog(false);
    };

    const getNotificationIcon = (title) => {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('đơn hàng')) return ShoppingCart;
        if (titleLower.includes('lịch hẹn') || titleLower.includes('appointment')) return Calendar;
        if (titleLower.includes('sản phẩm') || titleLower.includes('product')) return Gift;
        if (titleLower.includes('dịch vụ') || titleLower.includes('service')) return Heart;
        return Info;
    };

    const getNotificationColor = (title) => {
        const titleLower = title.toLowerCase();
        if (titleLower.includes('đơn hàng')) return 'text-blue-500';
        if (titleLower.includes('lịch hẹn') || titleLower.includes('appointment')) return 'text-green-500';
        if (titleLower.includes('sản phẩm') || titleLower.includes('product')) return 'text-purple-500';
        if (titleLower.includes('dịch vụ') || titleLower.includes('service')) return 'text-pink-500';
        return 'text-gray-500';
    };

    const onRefresh = () => {
        setRefreshing(true);
        // The real-time listener will handle updating the data
    };

    const renderNotificationItem = ({item}) => {
        const timeText = formatDistanceToNow(new Date(item.createdAt), {
            addSuffix: true,
            locale: vi
        });

        const IconComponent = getNotificationIcon(item.title);
        const iconColorClass = getNotificationColor(item.title);

        return (
            <Pressable
                onPress={() => handleNotificationPress(item)}
                className={`mx-4 mb-3 p-4 rounded-2xl shadow-sm ${ item.isRead ? 'bg-white' : 'bg-blue-50' }`}
            >
                <HStack space="md" alignItems="flex-start">
                    <Box className={`p-2.5 rounded-full ${ item.isRead ? 'bg-gray-100' : 'bg-white' }`}>
                        <Icon
                            as={IconComponent}
                            size="md"
                            className={item.isRead ? 'text-gray-500' : iconColorClass}
                        />
                    </Box>

                    <VStack flex={1} space="xs">
                        <HStack justifyContent="space-between" alignItems="flex-start">
                            <VStack flex={1} space="xs">
                                <Text
                                    className={`font-medium ${ item.isRead ? 'text-gray-800' : 'text-gray-900' }`}
                                    numberOfLines={2}
                                >
                                    {item.title}
                                </Text>
                                <Text
                                    className={`text-sm ${ item.isRead ? 'text-gray-600' : 'text-gray-700' }`}
                                    numberOfLines={3}
                                >
                                    {item.body}
                                </Text>
                            </VStack>

                            <VStack alignItems="flex-end" space="xs">
                                <Text className="text-xs text-gray-500">
                                    {timeText}
                                </Text>
                                {!item.isRead && (
                                    <Box className="w-2 h-2 bg-blue-500 rounded-full" />
                                )}
                            </VStack>
                        </HStack>
                    </VStack>
                </HStack>
            </Pressable>
        );
    };

    const renderEmptyState = () => (
        <VStack className="flex-1 justify-center items-center p-8">
            <Box className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Icon as={BellOff} size="xl" className="text-gray-400" />
            </Box>
            <Heading size="md" className="text-gray-800 mb-2">
                Chưa có thông báo
            </Heading>
            <Text className="text-gray-500 text-center">
                Bạn sẽ nhận được thông báo về đơn hàng, lịch hẹn và các cập nhật khác tại đây.
            </Text>
        </VStack>
    );

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <Box className="flex-1 bg-gray-50">
            {/* Content */}
            {loading ? (
                <VStack className="flex-1 justify-center items-center">
                    <Spinner size="lg" className="text-blue-500" />
                    <Text className="mt-3 text-gray-500">Đang tải thông báo...</Text>
                </VStack>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotificationItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{paddingTop: 16, paddingBottom: 32}}
                    ListEmptyComponent={renderEmptyState}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#3b82f6']}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Mark All As Read Dialog */}
            <AlertDialog
                isOpen={showMarkAllDialog}
                onClose={() => setShowMarkAllDialog(false)}
            >
                <AlertDialogBackdrop />
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <Heading size="md">Đánh dấu tất cả đã đọc</Heading>
                        <AlertDialogCloseButton />
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        <Text>
                            Bạn có muốn đánh dấu tất cả {unreadCount} thông báo chưa đọc là đã đọc không?
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            className="mr-3"
                            onPress={() => setShowMarkAllDialog(false)}
                        >
                            <ButtonText>Hủy</ButtonText>
                        </Button>
                        <Button
                            className="bg-blue-500"
                            onPress={handleMarkAllAsRead}
                        >
                            <ButtonText>Đồng ý</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Box>
    );
};

export default NotificationsScreen;
