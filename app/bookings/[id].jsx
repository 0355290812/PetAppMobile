import {View, ScrollView, ActivityIndicator, Alert, SafeAreaView, Pressable, Image} from 'react-native';
import {useLocalSearchParams, router} from 'expo-router';
import {useEffect, useState} from 'react';
import {format} from 'date-fns';
import {vi} from 'date-fns/locale';
import {StatusBar} from 'expo-status-bar';
import {ChevronLeft, Calendar, CreditCard, PawPrint, Bell, Info, Clock} from 'lucide-react-native';
import {ApiClient} from '@/config/api';
import {Icon} from "@/components/ui/icon";
import {HStack} from "@/components/ui/hstack";
import {VStack} from "@/components/ui/vstack";
import {Box} from "@/components/ui/box";
import {Heading} from "@/components/ui/heading";
import {Text} from "@/components/ui/text";
import {Badge} from "@/components/ui/badge";
import {Divider} from "@/components/ui/divider";
import {Spinner} from "@/components/ui/spinner";
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";

// Status colors for visual representation
const statusMap = {
    pending: {text: 'Chờ xác nhận', color: 'orange', icon: Clock},
    confirmed: {text: 'Đã xác nhận', color: 'green', icon: Calendar},
    completed: {text: 'Hoàn thành', color: 'blue', icon: Bell},
    cancelled: {text: 'Đã hủy', color: 'red', icon: Info},
};

// Payment status colors
const paymentStatusMap = {
    pending: {text: 'Chưa thanh toán', color: 'orange'},
    paid: {text: 'Đã thanh toán', color: 'green'},
    refunded: {text: 'Đã hoàn tiền', color: 'blue'},
};

// Bản dịch phương thức thanh toán
const paymentMethodTranslations = {
    cash: 'Tiền mặt',
    credit_card: 'Thẻ tín dụng',
    bank_transfer: 'Chuyển khoản'
};

export default function BookingDetailScreen () {
    const {id} = useLocalSearchParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const apiClient = ApiClient();
    const toast = useToast();

    useEffect(() => {
        const fetchBookingDetails = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get(`/bookings/${ id }`);
                setBooking(response);
            } catch (err) {
                console.error('Error fetching booking details:', err);
                setError('Không thể tải thông tin lịch hẹn. Vui lòng thử lại sau.');
                toast.show({
                    render: ({id}) => (
                        <Toast nativeID={id} action="error" variant="solid">
                            <VStack space="xs">
                                <ToastTitle>Lỗi</ToastTitle>
                                <ToastDescription>Không thể tải thông tin lịch hẹn</ToastDescription>
                            </VStack>
                        </Toast>
                    ),
                });
            } finally {
                setLoading(false);
            }
        };

        fetchBookingDetails();
    }, [id]);

    if (loading) {
        return (
            <Box className="flex-1 justify-center items-center bg-white">
                <Spinner size="lg" color="blue" />
            </Box>
        );
    }

    if (error) {
        return (
            <Box className="flex-1 justify-center items-center bg-white p-4">
                <Text className="text-center text-gray-600">{error}</Text>
            </Box>
        );
    }

    if (!booking) {
        return (
            <Box className="flex-1 justify-center items-center bg-white p-4">
                <Text className="text-center text-gray-600">Không tìm thấy lịch hẹn</Text>
            </Box>
        );
    }

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return format(date, 'dd/MM/yyyy', {locale: vi});
        } catch (e) {
            return 'Ngày không hợp lệ';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    const currentStatus = statusMap[booking.status] || {text: 'Không xác định', color: 'gray', icon: Calendar};
    const paymentStatus = paymentStatusMap[booking.paymentStatus] || {text: booking.paymentStatus, color: 'gray'};

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Custom Header with Back Button */}
            <HStack className="px-4 py-3 bg-white items-center justify-between border-b border-gray-200">
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
                >
                    <Icon as={ChevronLeft} size="md" color="#374151" />
                </Pressable>
                <Heading size="md" className="flex-1 text-center">Chi tiết lịch hẹn</Heading>
                <Box className="w-10" />
            </HStack>

            <ScrollView className="flex-1">
                <VStack className="p-4 space-y-6 gap-3">
                    {/* Booking Header */}
                    <VStack className="bg-white rounded-xl p-4 border border-gray-200">
                        <HStack className="justify-between items-center mb-2">
                            <Text className="text-gray-600">Mã lịch hẹn</Text>
                            <Text className="font-medium">{booking.bookingNumber}</Text>
                        </HStack>
                        <HStack className="justify-between items-center mb-2">
                            <Text className="text-gray-600">Ngày tạo</Text>
                            <Text className="font-medium">{new Date(booking.createdAt).toLocaleDateString('vi-VN')}</Text>
                        </HStack>
                        <HStack className="justify-between items-center">
                            <Text className="text-gray-600">Trạng thái</Text>
                            <Badge className={`bg-${ currentStatus.color }-100 rounded-full px-3 py-1`}>
                                <HStack className="items-center space-x-1">
                                    <Icon as={currentStatus.icon} size="xs" color={`${ currentStatus.color }`} />
                                    <Text className={`text-${ currentStatus.color }-700 text-xs font-medium ml-1`}>{currentStatus.text}</Text>
                                </HStack>
                            </Badge>
                        </HStack>
                    </VStack>

                    {/* Service Details */}
                    <VStack className="bg-white rounded-xl p-4 border border-gray-200">
                        <HStack className="items-center mb-4">
                            <Icon as={Bell} size="sm" color="#3B82F6" />
                            <Heading size="sm" className="ml-2 text-gray-800">Thông tin dịch vụ</Heading>
                        </HStack>
                        <VStack className="space-y-2">
                            <Text className="font-medium text-gray-800">{booking.serviceId.name}</Text>
                            <HStack className="justify-between items-center">
                                <Text className="text-gray-600">Giá dịch vụ</Text>
                                <HStack className="items-center">
                                    {booking.serviceId.onSale && (
                                        <Text className="text-gray-500 line-through mr-2">
                                            {formatCurrency(booking.serviceId.price)}
                                        </Text>
                                    )}
                                    <Text className="font-medium text-blue-600">
                                        {formatCurrency(booking.serviceId.onSale ? booking.serviceId.salePrice : booking.serviceId.price)}
                                    </Text>
                                </HStack>
                            </HStack>
                        </VStack>
                    </VStack>

                    {/* Date & Time */}
                    <VStack className="bg-white rounded-xl p-4 border border-gray-200">
                        <HStack className="items-center mb-4">
                            <Icon as={Calendar} size="sm" color="#3B82F6" />
                            <Heading size="sm" className="ml-2 text-gray-800">Thông tin lịch hẹn</Heading>
                        </HStack>
                        <VStack className="space-y-3">
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Ngày hẹn:</Text>
                                <Text className="font-medium">{formatDate(booking.bookingDate)}</Text>
                            </HStack>
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Thời gian:</Text>
                                <Text className="font-medium">{booking.timeSlot}</Text>
                            </HStack>
                        </VStack>
                    </VStack>

                    {/* Pet Information */}
                    <VStack className="bg-white rounded-xl p-4 border border-gray-200">
                        <HStack className="items-center mb-4">
                            <Icon as={PawPrint} size="sm" color="#3B82F6" />
                            <Heading size="sm" className="ml-2 text-gray-800">Thông tin thú cưng</Heading>
                        </HStack>
                        <VStack className="space-y-3">
                            {booking.petsId.map((pet) => (
                                <VStack key={pet._id} className="bg-gray-50 p-3 rounded-lg space-y-2">
                                    <HStack className="justify-between">
                                        <Text className="text-gray-600">Tên:</Text>
                                        <Text className="font-medium">{pet.name}</Text>
                                    </HStack>
                                    <HStack className="justify-between">
                                        <Text className="text-gray-600">Loài:</Text>
                                        <Text className="font-medium">{pet.species}</Text>
                                    </HStack>
                                    <HStack className="justify-between">
                                        <Text className="text-gray-600">Giống:</Text>
                                        <Text className="font-medium">{pet.breed}</Text>
                                    </HStack>
                                    <HStack className="justify-between">
                                        <Text className="text-gray-600">Ngày sinh:</Text>
                                        <Text className="font-medium">{formatDate(pet.birthDate)}</Text>
                                    </HStack>
                                </VStack>
                            ))}
                        </VStack>
                    </VStack>

                    {/* Payment Information */}
                    <VStack className="bg-white rounded-xl p-4 border border-gray-200">
                        <HStack className="items-center mb-4">
                            <Icon as={CreditCard} size="sm" color="#3B82F6" />
                            <Heading size="sm" className="ml-2 text-gray-800">Thông tin thanh toán</Heading>
                        </HStack>
                        <VStack className="space-y-3">
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Phương thức:</Text>
                                <Text className="font-medium">
                                    {paymentMethodTranslations[booking.paymentMethod] || booking.paymentMethod}
                                </Text>
                            </HStack>
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Trạng thái:</Text>
                                <Text className={`font-medium text-${ paymentStatus.color }-600`}>
                                    {paymentStatus.text}
                                </Text>
                            </HStack>
                            <Divider className="my-1" />
                            <HStack className="justify-between pt-2">
                                <Text className="text-gray-800 font-medium">Tổng cộng</Text>
                                <Text className="text-blue-600 font-bold text-lg">{formatCurrency(booking.totalAmount)}</Text>
                            </HStack>
                        </VStack>
                    </VStack>

                    {/* Additional Information */}
                    {booking.status === 'cancelled' && (
                        <VStack className="bg-white rounded-xl p-4 border border-gray-200">
                            <HStack className="items-center mb-4">
                                <Icon as={Info} size="sm" color="#3B82F6" />
                                <Heading size="sm" className="ml-2 text-gray-800">Thông tin hủy lịch</Heading>
                            </HStack>
                            <VStack className="space-y-3">
                                <HStack className="justify-between">
                                    <Text className="text-gray-600">Hủy bởi:</Text>
                                    <Text className="font-medium">{booking.cancelledBy || 'N/A'}</Text>
                                </HStack>
                                <HStack className="justify-between">
                                    <Text className="text-gray-600">Lý do:</Text>
                                    <Text className="font-medium">{booking.cancellationReason || 'Không có lý do'}</Text>
                                </HStack>
                            </VStack>
                        </VStack>
                    )}

                    {/* Booking Timestamps */}
                    <VStack className="items-center space-y-1 mb-4 mt-2">
                        <Text className="text-gray-500 text-xs">Tạo lúc: {new Date(booking.createdAt).toLocaleString('vi-VN')}</Text>
                        {booking.updatedAt !== booking.createdAt && (
                            <Text className="text-gray-500 text-xs">Cập nhật lúc: {new Date(booking.updatedAt).toLocaleString('vi-VN')}</Text>
                        )}
                    </VStack>
                </VStack>
            </ScrollView>
        </SafeAreaView>
    );
}
