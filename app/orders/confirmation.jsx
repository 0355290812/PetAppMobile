import {useState, useEffect} from 'react';
import {SafeAreaView} from 'react-native';
import {router, useLocalSearchParams} from 'expo-router';
import {CheckCircle2, Package} from 'lucide-react-native';
import {ApiClient} from '@/config/api';
import {formatVietnamCurrency} from '@/utils/formatters';

import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";
import {Heading} from "@/components/ui/heading";
import {Button, ButtonText} from "@/components/ui/button";
import {Icon} from "@/components/ui/icon";
import {Spinner} from "@/components/ui/spinner";
import {Divider} from "@/components/ui/divider";

const OrderConfirmationScreen = () => {
    const {id, paymentMethod} = useLocalSearchParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const apiClient = ApiClient();

    useEffect(() => {
        fetchOrderDetails();
    }, []);

    const fetchOrderDetails = async () => {
        if (!id) return;

        try {
            setLoading(true);
            console.log(id);

            const data = await apiClient.get(`/orders/${ id }`);
            setOrder(data);
        } catch (error) {
            console.error("Failed to fetch order details:", error);
        } finally {
            setLoading(false);
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
                    <Heading size="lg" className="text-center text-gray-800">Đặt hàng thành công!</Heading>
                    <Text className="text-center text-gray-600 mt-2 px-4">
                        Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.
                    </Text>
                </VStack>

                {order && (
                    <VStack className="bg-gray-50 p-5 rounded-xl mb-6 shadow-sm">
                        <HStack className="items-center mb-4">
                            <Icon as={Package} size="sm" color="#3B82F6" />
                            <Heading size="sm" className="ml-2 text-gray-800">Thông tin đơn hàng</Heading>
                        </HStack>
                        <VStack className="space-y-3">
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Mã đơn hàng</Text>
                                <Text className="font-medium text-gray-800">{order.orderNumber || order._id}</Text>
                            </HStack>
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Ngày đặt</Text>
                                <Text className="font-medium text-gray-800">
                                    {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                </Text>
                            </HStack>
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Phương thức thanh toán</Text>
                                <Text className="font-medium text-gray-800">
                                    {order.paymentMethod === 'cash' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản ngân hàng'}
                                </Text>
                            </HStack>
                            <HStack className="justify-between">
                                <Text className="text-gray-600">Tổng tiền</Text>
                                <Text className="font-medium text-blue-600">
                                    {formatVietnamCurrency(order.totalAmount)}
                                </Text>
                            </HStack>
                        </VStack>
                    </VStack>
                )}

                <Divider className="my-4" />

                <Text className="text-center text-gray-600 mb-6">
                    Bạn sẽ nhận được thông báo khi đơn hàng được giao đến.
                </Text>

                <VStack className="mt-auto space-y-3">
                    <Button
                        className="bg-blue-600 p-4 rounded-xl active:bg-blue-700 h-fit mb-2"
                        onPress={() => router.replace('/orders')}
                    >
                        <ButtonText className="font-bold">Xem đơn hàng của tôi</ButtonText>
                    </Button>
                    <Button
                        variant="outline"
                        className="border-blue-500 p-4 rounded-xl h-fit"
                        onPress={() => router.navigate('/products')}
                    >
                        <ButtonText className="text-blue-600 font-medium">Tiếp tục mua sắm</ButtonText>
                    </Button>
                </VStack>
            </VStack>
        </SafeAreaView>
    );
};

export default OrderConfirmationScreen;
