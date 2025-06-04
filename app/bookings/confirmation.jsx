import {useState, useEffect} from 'react';
import {SafeAreaView} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {CheckCircle2, Calendar, Clock, PawPrint, CreditCard, DollarSign} from 'lucide-react-native';
import {ApiClient} from '@/config/api';
import {formatVietnamCurrency} from '@/utils/formatters';
import {format, parseISO} from 'date-fns';
import {vi} from 'date-fns/locale';

import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";
import {Heading} from "@/components/ui/heading";
import {Button, ButtonText} from "@/components/ui/button";
import {Icon} from "@/components/ui/icon";
import {Spinner} from "@/components/ui/spinner";
import {Divider} from "@/components/ui/divider";

const BookingConfirmationScreen = () => {
    const {id, paymentMethod} = useLocalSearchParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const apiClient = ApiClient();

    useEffect(() => {
        fetchBookingDetails();
    }, []);

    const fetchBookingDetails = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const data = await apiClient.get(`/bookings/${ id }`);
            setBooking(data);
        } catch (error) {
            console.error("Failed to fetch booking details:", error);
        } finally {
            setLoading(false);
        }
    };

    // Format the date
    const formatDate = (dateString) => {
        try {
            const date = parseISO(dateString);
            return format(date, 'EEEE, dd/MM/yyyy', {locale: vi});
        } catch (error) {
            console.error("Date formatting error:", error);
            return 'Ngày không hợp lệ';
        }
    };

    // Get payment method display text
    const getPaymentMethodText = (method) => {
        switch (method) {
            case 'cash':
                return 'Thanh toán trực tiếp';
            case 'credit_card':
                return 'Thanh toán trực tuyến';
            default:
                return 'Chưa xác định';
        }
    };

    if (loading) {
        return (
            <Box className="flex-1 justify-center items-center bg-white">
                <Spinner size="lg" color="blue" />
            </Box>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <VStack className="flex-1 p-6">
                <VStack className="items-center mb-8">
                    <Box className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-4 shadow-md">
                        <Icon as={CheckCircle2} size="xl" color="#10b981" />
                    </Box>
                    <Heading size="lg" className="text-center text-gray-800">Đặt lịch thành công!</Heading>
                    <Text className="text-center text-gray-600 mt-2 px-4">
                        Cảm ơn bạn đã đặt lịch dịch vụ. Chúng tôi sẽ liên hệ xác nhận lịch hẹn của bạn.
                    </Text>
                </VStack>

                {booking && (
                    <VStack className="bg-gray-50 p-5 rounded-xl mb-6 shadow-sm">
                        <HStack className="items-center mb-4">
                            <Icon as={Calendar} size="sm" color="#3B82F6" />
                            <Heading size="sm" className="ml-2 text-gray-800">Thông tin lịch hẹn</Heading>
                        </HStack>
                        <VStack className="space-y-3">
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Mã đặt lịch</Text>
                                <Text className="font-medium text-gray-800">{booking.bookingNumber || booking._id.slice(-8).toUpperCase()}</Text>
                            </HStack>
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Dịch vụ</Text>
                                <Text className="font-medium text-gray-800">
                                    {booking.serviceId?.name || 'Dịch vụ thú cưng'}
                                </Text>
                            </HStack>
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Ngày hẹn</Text>
                                <Text className="font-medium text-gray-800">
                                    {booking.bookingDate ? formatDate(booking.bookingDate) : 'Chưa có thông tin'}
                                </Text>
                            </HStack>
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Thời gian</Text>
                                <Text className="font-medium text-gray-800">
                                    {booking.timeSlot || 'Chưa có thông tin'}
                                </Text>
                            </HStack>
                            {booking.pets && booking.pets.length > 0 && (
                                <HStack className="justify-between">
                                    <Text className="text-gray-600">Thú cưng</Text>
                                    <Text className="font-medium text-gray-800">
                                        {booking.pets.map(pet => pet.name).join(', ')} ({booking.pets.length} thú cưng)
                                    </Text>
                                </HStack>
                            )}
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Phương thức thanh toán</Text>
                                <HStack className="items-center">
                                    <Icon
                                        as={paymentMethod === 'cash' ? DollarSign : CreditCard}
                                        size="xs"
                                        color="#6b7280"
                                        className="mr-1"
                                    />
                                    <Text className="font-medium text-gray-800">
                                        {getPaymentMethodText(paymentMethod || booking.paymentMethod)}
                                    </Text>
                                </HStack>
                            </HStack>
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Trạng thái</Text>
                                <Text className="font-medium text-orange-600">
                                    {booking.status === 'checkout' ? 'Chờ thanh toán' :
                                        booking.status === 'pending' ? 'Chờ xác nhận' :
                                            'Đã xác nhận'}
                                </Text>
                            </HStack>
                            <Divider className="my-2" />
                            <HStack className="justify-between">
                                <Text className="text-gray-600 font-medium">Tổng tiền</Text>
                                <Text className="font-bold text-lg text-blue-600">
                                    {formatVietnamCurrency(booking.totalAmount)}
                                </Text>
                            </HStack>
                        </VStack>
                    </VStack>
                )}

                {/* Payment status message for credit card payments */}
                {paymentMethod === 'credit_card' && (
                    <Box className="bg-blue-50 p-4 rounded-lg mb-4">
                        <Text className="text-blue-700 text-center">
                            {booking?.status === 'checkout'
                                ? 'Vui lòng hoàn tất thanh toán để xác nhận lịch hẹn'
                                : 'Thanh toán đã được xử lý thành công'
                            }
                        </Text>
                    </Box>
                )}

                <Text className="text-center text-gray-600 mb-6">
                    Bạn có thể xem lại thông tin đặt lịch của mình trong phần "Lịch hẹn" trong ứng dụng.
                </Text>

                <VStack className="mt-auto space-y-3">
                    <Button
                        className="bg-blue-600 p-4 rounded-xl active:bg-blue-700 h-fit mb-2"
                        onPress={() => router.replace('/bookings')}
                    >
                        <ButtonText className="font-bold">Xem lịch hẹn của tôi</ButtonText>
                    </Button>
                    <Button
                        variant="outline"
                        className="border-blue-500 p-4 rounded-xl h-fit"
                        onPress={() => router.navigate('/(tabs)/services')}
                    >
                        <ButtonText className="text-blue-600 font-medium">Khám phá thêm dịch vụ</ButtonText>
                    </Button>
                </VStack>
            </VStack>
        </SafeAreaView>
    );
};

export default BookingConfirmationScreen;
