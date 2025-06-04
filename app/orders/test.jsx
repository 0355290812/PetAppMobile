import React, {useState, useEffect} from 'react';
import {ScrollView, SafeAreaView, Image} from 'react-native';
import {useLocalSearchParams, router} from 'expo-router';
import {ApiClient} from '@/config/api';
import {formatVietnamCurrency, formatDate} from '@/utils/formatters';
import {Package, Truck, CreditCard, MapPin, FileText, CircleAlert, Clock, ChevronLeft} from 'lucide-react-native';

import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";
import {Heading} from "@/components/ui/heading";
import {Button, ButtonText} from "@/components/ui/button";
import {Icon} from "@/components/ui/icon";
import {Spinner} from "@/components/ui/spinner";
import {Divider} from "@/components/ui/divider";
import {Badge} from "@/components/ui/badge";
import {Pressable} from "@/components/ui/pressable";
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";
import {formatImageUrl} from '@/utils/imageUtils';

const statusMap = {
    pending: {text: 'Chờ xác nhận', color: 'orange', icon: Clock},
    confirmed: {text: 'Đã xác nhận', color: 'blue', icon: FileText},
    processing: {text: 'Đang xử lý', color: 'indigo', icon: Package},
    shipping: {text: 'Đang giao hàng', color: 'purple', icon: Truck},
    completed: {text: 'Hoàn thành', color: 'green', icon: Package},
    cancelled: {text: 'Đã hủy', color: 'red', icon: CircleAlert},
};

const paymentMethodMap = {
    cash: 'Thanh toán khi nhận hàng',
    credit_card: 'Thẻ tín dụng/ghi nợ',
    bank_transfer: 'Chuyển khoản ngân hàng',
};

const OrderDetailScreen = () => {
    const {id} = useLocalSearchParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelLoading, setCancelLoading] = useState(false);
    const apiClient = ApiClient();
    const toast = useToast();

    useEffect(() => {
        fetchOrderDetails();
    }, [id]);

    const fetchOrderDetails = async () => {
        if (!id) return;

        try {
            setLoading(true);
            const data = await apiClient.get(`/orders/${ id }`);
            setOrder(data);
        } catch (error) {
            console.error("Failed to fetch order details:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể tải thông tin đơn hàng</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!id) return;

        try {
            setCancelLoading(true);
            await apiClient.post(`/orders/${ id }/cancel`, {
                reason: 'User requested cancellation'
            });

            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="success" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Thành công</ToastTitle>
                            <ToastDescription>Đơn hàng đã được hủy thành công</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });

            // Refresh order details
            fetchOrderDetails();
        } catch (error) {
            console.error("Failed to cancel order:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể hủy đơn hàng</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setCancelLoading(false);
        }
    };

    if (loading) {
        return (
            <Box className="flex-1 justify-center items-center bg-white">
                <Spinner size="lg" color="blue" />
            </Box>
        );
    }

    if (!order) {
        return (
            <Box className="flex-1 justify-center items-center bg-white p-4">
                <Text className="text-center text-gray-600">Không tìm thấy thông tin đơn hàng</Text>
                <Button
                    className="mt-4 bg-blue-600 rounded-lg"
                    onPress={() => router.back()}
                >
                    <ButtonText>Quay lại</ButtonText>
                </Button>
            </Box>
        );
    }

    const currentStatus = statusMap[order.status] || {text: 'Không xác định', color: 'gray', icon: FileText};
    const canCancel = ['pending', 'confirmed'].includes(order.status);

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
                <Heading size="md" className="flex-1 text-center">Chi tiết đơn hàng</Heading>
                <Box className="w-10" />
            </HStack>

            <ScrollView className="flex-1">
                <VStack className="p-4 space-y-6 gap-3">
                    {/* Order Header */}
                    <VStack className="bg-white rounded-xl p-4 border border-gray-200">
                        <HStack className="justify-between items-center mb-2">
                            <Text className="text-gray-600">Mã đơn hàng</Text>
                            <Text className="font-medium">{order.orderNumber}</Text>
                        </HStack>
                        <HStack className="justify-between items-center mb-2">
                            <Text className="text-gray-600">Ngày đặt</Text>
                            <Text className="font-medium">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</Text>
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

                    {/* Order Items */}
                    <VStack className="bg-white rounded-xl p-4 border border-gray-200">
                        <Heading size="sm" className="mb-4 text-gray-800">Sản phẩm đã đặt</Heading>
                        <VStack className="space-y-4">
                            {order.items.map((item) => (
                                <HStack key={item._id} className="space-x-3">
                                    <Image
                                        source={{uri: formatImageUrl(item.image)}}
                                        className="w-20 h-20 rounded-md bg-gray-100"
                                        resizeMode="cover"
                                    />
                                    <VStack className="flex-1 justify-between py-1">
                                        <Text className="font-medium text-gray-800" numberOfLines={2}>{item.name}</Text>
                                        <HStack className="justify-between mt-2">
                                            <Text className="text-gray-500">SL: {item.quantity}</Text>
                                            <Text className="font-medium text-blue-600">{formatVietnamCurrency(item.price)}</Text>
                                        </HStack>
                                    </VStack>
                                </HStack>
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
                                <Text className="text-gray-600">Phương thức</Text>
                                <Text className="font-medium">{paymentMethodMap[order.paymentMethod] || order.paymentMethod}</Text>
                            </HStack>
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Trạng thái</Text>
                                <Text className={`font-medium ${ order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600' }`}>
                                    {order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                </Text>
                            </HStack>
                            <Divider className="my-1" />
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Tạm tính</Text>
                                <Text className="font-medium">{formatVietnamCurrency(order.subtotal)}</Text>
                            </HStack>
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Phí vận chuyển</Text>
                                <Text className="font-medium">{formatVietnamCurrency(order.shippingFee)}</Text>
                            </HStack>
                            {order.discount > 0 && (
                                <HStack className="justify-between">
                                    <Text className="text-gray-600">Giảm giá</Text>
                                    <Text className="font-medium text-red-500">-{formatVietnamCurrency(order.discount)}</Text>
                                </HStack>
                            )}
                            <HStack className="justify-between pt-2">
                                <Text className="text-gray-800 font-medium">Tổng cộng</Text>
                                <Text className="text-blue-600 font-bold text-lg">{formatVietnamCurrency(order.totalAmount)}</Text>
                            </HStack>
                        </VStack>
                    </VStack>

                    {/* Shipping Information */}
                    <VStack className="bg-white rounded-xl p-4 border border-gray-200">
                        <HStack className="items-center mb-4">
                            <Icon as={MapPin} size="sm" color="#3B82F6" />
                            <Heading size="sm" className="ml-2 text-gray-800">Địa chỉ giao hàng</Heading>
                        </HStack>
                        <VStack className="space-y-2">
                            <Text className="font-medium text-gray-800">{order.shippingAddress.fullName}</Text>
                            <Text className="text-gray-600">{order.shippingAddress.phone}</Text>
                            <Text className="text-gray-600">{order.shippingAddress.streetAddress}</Text>
                            <Text className="text-gray-600">
                                {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}
                            </Text>
                        </VStack>
                    </VStack>

                    {/* Order Timeline */}
                    <VStack className="bg-white rounded-xl p-4 border border-gray-200">
                        <Heading size="sm" className="mb-4 text-gray-800">Lịch sử đơn hàng</Heading>
                        <VStack className="space-y-4 gap-2">
                            {order.statusHistory.map((history, index) => (
                                <HStack key={history._id} className="space-x-3">
                                    <Box className={`w-8 h-8 rounded-full bg-${ statusMap[history.status]?.color || 'gray'
                                        }-100 items-center justify-center`}>
                                        <Icon
                                            as={statusMap[history.status]?.icon || FileText}
                                            size="xs"
                                            color={`${ statusMap[history.status]?.color || 'gray' }`}
                                        />
                                    </Box>
                                    <VStack className="flex-1 ml-2">
                                        <Text className="font-medium text-gray-800">
                                            {statusMap[history.status]?.text || history.status}
                                        </Text>
                                        <Text className="text-gray-500 text-xs">{new Date(history.timestamp).toLocaleString('vi-VN')}</Text>
                                        {history.note && <Text className="text-gray-600 mt-1">{history.note}</Text>}
                                    </VStack>
                                </HStack>
                            ))}
                        </VStack>
                    </VStack>

                    {/* Cancel Button */}
                    {canCancel && (
                        <Button
                            className="bg-red-500 p-4 rounded-xl active:bg-red-600 h-fit mb-4"
                            onPress={handleCancelOrder}
                            disabled={cancelLoading}
                        >
                            {cancelLoading ? (
                                <Spinner size="sm" color="white" />
                            ) : (
                                <ButtonText className="font-bold">Hủy đơn hàng</ButtonText>
                            )}
                        </Button>
                    )}
                </VStack>
            </ScrollView>
        </SafeAreaView>
    );
};

export default OrderDetailScreen;
