import React, {useState, useEffect} from 'react';
import {View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl} from 'react-native';
import {useAuth} from "@/contexts/AuthContext";
import {Ionicons} from '@expo/vector-icons';
import {ApiClient} from '@/config/api';
import {router} from 'expo-router';

const Notifications = () => {
    const {user} = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const api = ApiClient();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        if (refreshing) return;

        setLoading(true);
        try {
            const response = await api.get('/notifications');
            if (response) {
                setNotifications(response.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchNotifications();
    };

    const markAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${ notificationId }/read`, {});

            // Update local state
            setNotifications(notifications.map(notification =>
                notification._id === notificationId
                    ? {...notification, isRead: true}
                    : notification
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleNotificationPress = (notification) => {
        if (!notification.isRead) {
            markAsRead(notification._id);
        }

        // Navigate based on notification type
        if (notification.type === 'order') {
            router.push(`/profile/orders?id=${ notification.referenceId }`);
        } else if (notification.type === 'appointment') {
            router.push(`/profile/appointments?id=${ notification.referenceId }`);
        }
    };

    const renderNotificationItem = ({item}) => {
        const notificationDate = new Date(item.createdAt);
        const now = new Date();

        let timeText;
        const diffMs = now - notificationDate;
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 60) {
            timeText = `${ diffMins } phút trước`;
        } else if (diffMins < 1440) {
            timeText = `${ Math.floor(diffMins / 60) } giờ trước`;
        } else {
            timeText = `${ Math.floor(diffMins / 1440) } ngày trước`;
        }

        let iconName = 'notifications-outline';
        if (item.type === 'order') iconName = 'cart-outline';
        if (item.type === 'appointment') iconName = 'calendar-outline';
        if (item.type === 'system') iconName = 'information-circle-outline';

        return (
            <TouchableOpacity
                className={`p-4 border-b border-gray-100 ${ item.isRead ? 'bg-white' : 'bg-blue-50' }`}
                onPress={() => handleNotificationPress(item)}
            >
                <View className="flex-row">
                    <View className={`w-10 h-10 rounded-full ${ !item.isRead ? 'bg-blue-100' : 'bg-gray-100' } items-center justify-center mr-3`}>
                        <Ionicons name={iconName} size={20} color={!item.isRead ? '#007AFF' : '#777'} />
                    </View>
                    <View className="flex-1">
                        <View className="flex-row justify-between items-center mb-1">
                            <Text className={`font-medium ${ !item.isRead ? 'text-blue-500' : 'text-gray-800' }`}>{item.title}</Text>
                            <Text className="text-xs text-gray-500">{timeText}</Text>
                        </View>
                        <Text className="text-gray-600">{item.message}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="flex-1 bg-white">
            {loading && !refreshing ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : notifications.length > 0 ? (
                <FlatList
                    data={notifications}
                    renderItem={renderNotificationItem}
                    keyExtractor={(item) => item._id}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#007AFF']}
                        />
                    }
                />
            ) : (
                <View className="flex-1 justify-center items-center p-4">
                    <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
                    <Text className="text-gray-400 mt-3 text-center">
                        Bạn chưa có thông báo nào
                    </Text>
                </View>
            )}
        </View>
    );
};

export default Notifications;
