import React, {useState, useEffect, useRef} from 'react';
import {View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView, Pressable, SafeAreaView} from 'react-native';
import {useAuth} from "@/contexts/AuthContext";
import {Ionicons} from '@expo/vector-icons';
import {ApiClient} from '@/config/api';
import {router, useLocalSearchParams} from 'expo-router';
import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader
} from "@/components/ui/alert-dialog";
import {Button, ButtonText} from "@/components/ui/button";
import {Heading} from "@/components/ui/heading";
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";
import {VStack} from "@/components/ui/vstack";

const BookingItem = ({booking, onPress, onPayBooking, onRebookService, onCancelBooking}) => {
    // Format the date and time
    const bookingDate = new Date(booking.bookingDate).toLocaleDateString('vi-VN');
    const bookingTime = booking.timeSlot;

    return (
        <Pressable
            className="bg-white mb-3 rounded-xl overflow-hidden shadow-sm"
            onPress={() => onPress(booking._id)}
        >
            <View className="p-3 border-b border-gray-100">
                <View className="flex-row items-center">
                    <Ionicons name="calendar-outline" size={18} color="#555" />
                    <Text className="font-medium ml-1">Lịch hẹn #{booking.bookingNumber}</Text>
                </View>
            </View>

            <View className="p-3">
                <View className="flex-row items-center mb-2">
                    <Ionicons name="business-outline" size={16} color="#777" />
                    <Text className="ml-2 text-gray-800 font-medium">{booking.serviceId?.name || 'Dịch vụ không xác định'}</Text>
                </View>

                <View className="flex-row items-center mb-2">
                    <Ionicons name="time-outline" size={16} color="#777" />
                    <Text className="ml-2 text-gray-600">{bookingDate} - {bookingTime}</Text>
                </View>

                {booking.petName && (
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="paw-outline" size={16} color="#777" />
                        <Text className="ml-2 text-gray-600">Thú cưng: {booking.petName}</Text>
                    </View>
                )}

                {booking.note && (
                    <View className="flex-row mt-1">
                        <Ionicons name="document-text-outline" size={16} color="#777" style={{marginTop: 2}} />
                        <Text className="ml-2 text-gray-500 flex-1">{booking.note}</Text>
                    </View>
                )}

                {booking.totalAmount && (
                    <View className="flex-row justify-end mt-2">
                        <Text className="font-bold">Tổng: {booking.totalAmount?.toLocaleString('vi-VN')}đ</Text>
                    </View>
                )}
            </View>

            {/* Action buttons based on status */}
            <View className="p-3 border-t border-gray-100">
                <View className="flex-row justify-end space-x-2">
                    {booking.status === 'checkout' && (
                        <TouchableOpacity
                            className="bg-blue-500 py-2 px-4 rounded-md"
                            onPress={(e) => {
                                e.stopPropagation();
                                onPayBooking(booking);
                            }}
                        >
                            <Text className="text-white text-center font-medium">Thanh toán</Text>
                        </TouchableOpacity>
                    )}

                    {booking.status === 'booked' && (
                        <TouchableOpacity
                            className="bg-red-500 py-2 px-4 rounded-md"
                            onPress={(e) => {
                                e.stopPropagation();
                                onCancelBooking(booking._id);
                            }}
                        >
                            <Text className="text-white text-center font-medium">Hủy lịch</Text>
                        </TouchableOpacity>
                    )}

                    {(booking.status === 'completed' || booking.status === 'cancelled') && (
                        <TouchableOpacity
                            className="bg-green-500 py-2 px-4 rounded-md"
                            onPress={(e) => {
                                e.stopPropagation();
                                onRebookService(booking);
                            }}
                        >
                            <Text className="text-white text-center font-medium">Đặt lại</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Pressable>
    );
};

const Bookings = () => {
    const {user} = useAuth();
    const params = useLocalSearchParams();
    const [activeTab, setActiveTab] = useState(params.tab || 'checkout');
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const api = ApiClient();
    const toast = useToast();

    // Refs for FlatList
    const flatListRef = useRef(null);
    const cancelRef = useRef(null);

    // Status tabs - only the specified statuses
    const tabs = [
        {id: 'checkout', label: 'Chờ thanh toán'},
        {id: 'booked', label: 'Lịch đã đặt'},
        {id: 'completed', label: 'Đã hoàn thành'},
        {id: 'cancelled', label: 'Lịch đã huỷ'}
    ];

    useEffect(() => {
        fetchBookings();
        // If there's a booking ID in the params, navigate to booking detail
        if (params.id) {
            navigateToBookingDetail(params.id);
        }
    }, [params.id]);

    useEffect(() => {
        fetchBookings();
    }, [activeTab]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const endpoint = `/bookings?status=${ activeTab }`;
            const response = await api.get(endpoint);
            if (response) {
                setBookings(response.results || []);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchBookings();
    };

    const navigateToBookingDetail = (bookingId) => {
        router.push(`/bookings/${ bookingId }`);
    };

    const handlePayBooking = (booking) => {
        // Extract payment information from the booking
        if (booking.paymentId && booking.status === 'checkout') {
            const paymentInfo = booking.paymentId;

            // Navigate to stripe payment page with required parameters
            router.push({
                pathname: '/payments/stripe',
                params: {
                    clientSecret: paymentInfo.clientSecret,
                    bookingId: booking._id,
                    amount: booking.totalAmount,
                    paymentId: paymentInfo._id,
                    type: 'booking'
                }
            });
        }
    };

    const handleRebookService = (booking) => {
        // Navigate to the service detail page to rebook
        if (booking.serviceId && booking.serviceId._id) {
            router.push(`/services/${ booking.serviceId._id }`);
        }
    };

    const handleCancelBooking = (bookingId) => {
        setSelectedBookingId(bookingId);
        setShowCancelDialog(true);
    };

    const confirmCancelBooking = async () => {
        if (!selectedBookingId) return;

        try {
            setShowCancelDialog(false);
            const response = await api.put(`/bookings/${ selectedBookingId }/cancel`);
            if (response) {
                toast.show({
                    render: ({id}) => (
                        <Toast nativeID={id} action="success" variant="solid">
                            <VStack space="xs">
                                <ToastTitle>Thành công</ToastTitle>
                                <ToastDescription>Đã hủy lịch hẹn</ToastDescription>
                            </VStack>
                        </Toast>
                    ),
                });
                fetchBookings();
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể hủy lịch hẹn. Vui lòng thử lại.</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        }
    };

    const renderBookingItem = ({item}) => (
        <BookingItem
            booking={item}
            onPress={navigateToBookingDetail}
            onPayBooking={handlePayBooking}
            onRebookService={handleRebookService}
            onCancelBooking={handleCancelBooking}
        />
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Tab Selector */}
            <View className="bg-white">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="px-2"
                >
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            className={`py-3 px-4 ${ activeTab === tab.id ? 'border-b-2 border-blue-500' : '' }`}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Text
                                className={activeTab === tab.id ? 'text-blue-500 font-medium' : 'text-gray-600'}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Booking List */}
            {loading && !refreshing ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : bookings.length > 0 ? (
                <FlatList
                    ref={flatListRef}
                    data={bookings}
                    renderItem={renderBookingItem}
                    keyExtractor={(item) => item._id}
                    contentContainerClassName="p-3 pb-24"
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
                    <Ionicons name="calendar-outline" size={60} color="#ccc" />
                    <Text className="text-gray-400 mt-3 text-center">
                        Bạn chưa có lịch hẹn nào
                    </Text>
                </View>
            )}

            {/* Cancel Booking Confirmation Dialog */}
            <AlertDialog
                leastDestructiveRef={cancelRef}
                isOpen={showCancelDialog}
                onClose={() => setShowCancelDialog(false)}
            >
                <AlertDialogBackdrop />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Heading size="lg">Xác nhận hủy lịch hẹn</Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        <Text className="text-gray-700">
                            Bạn có chắc chắn muốn hủy lịch hẹn này không? Hành động này không thể hoàn tác.
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onPress={() => setShowCancelDialog(false)}
                            ref={cancelRef}
                        >
                            <ButtonText>Huỷ</ButtonText>
                        </Button>
                        <Button
                            className="bg-red-500 ml-3"
                            onPress={confirmCancelBooking}
                        >
                            <ButtonText>Xác nhận</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SafeAreaView>
    );
};

export default Bookings;
