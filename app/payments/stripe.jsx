import React, {useState, useEffect} from 'react';
import {SafeAreaView, StatusBar, StyleSheet} from 'react-native';
import {useLocalSearchParams, router} from 'expo-router';
import {StripeProvider, useStripe} from '@stripe/stripe-react-native';
import {ApiClient} from '@/config/api';
import {ChevronLeft} from 'lucide-react-native';
import {formatVietnamCurrency} from '@/utils/formatters';

import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";
import {Heading} from "@/components/ui/heading";
import {Pressable} from "@/components/ui/pressable";
import {Button, ButtonText} from "@/components/ui/button";
import {Icon} from "@/components/ui/icon";
import {Spinner} from "@/components/ui/spinner";
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";
import {CreditCard} from 'lucide-react-native';

// Replace with your Stripe publishable key
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51RCax3LqccovWeveNBfn32P5bL1RL6sjK7u0b8vLE472mXg1PeRBWTesv2qI5OAvYkBTuZ29HjAOB8YNikwvyYfS00NV0oFr2d';

const StripeScreen = () => {
    const params = useLocalSearchParams();
    const {clientSecret, orderId, bookingId, amount, paymentId, type} = params;
    const {initPaymentSheet, presentPaymentSheet} = useStripe();
    const [loading, setLoading] = useState(true);
    const [paymentInProgress, setPaymentInProgress] = useState(false);
    const toast = useToast();
    const apiClient = ApiClient();

    // Determine if this is for an order or booking
    const isBooking = type === 'booking';
    const id = isBooking ? bookingId : orderId;
    const cancelEndpoint = isBooking ? `/bookings?status=checkout` : `/orders?status=checkout`;
    const confirmationPath = isBooking ? '/bookings/confirmation' : '/orders/confirmation';

    useEffect(() => {
        if (!clientSecret) {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Thông tin thanh toán không hợp lệ</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
            router.back();
            return;
        }

        initializePaymentSheet();
    }, [clientSecret]);

    const initializePaymentSheet = async () => {
        try {
            setLoading(true);

            const {error} = await initPaymentSheet({
                paymentIntentClientSecret: clientSecret,
                merchantDisplayName: 'PetApp',
                allowsDelayedPaymentMethods: false,
                style: 'alwaysLight',
            });

            if (error) {
                console.error('Error initializing payment sheet:', error);
                toast.show({
                    render: ({id}) => (
                        <Toast nativeID={id} action="error" variant="solid">
                            <VStack space="xs">
                                <ToastTitle>Lỗi</ToastTitle>
                                <ToastDescription>Không thể khởi tạo phương thức thanh toán</ToastDescription>
                            </VStack>
                        </Toast>
                    ),
                });
                router.back();
                return;
            }
        } catch (error) {
            console.error('Error in initialize payment:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        try {
            setPaymentInProgress(true);

            // Present the payment sheet to the user
            const {error, paymentOption} = await presentPaymentSheet();

            // If there was an error in presenting the payment sheet or processing payment
            if (error) {
                console.log('Payment error:', error);
                toast.show({
                    render: ({id}) => (
                        <Toast nativeID={id} action="error" variant="solid">
                            <VStack space="xs">
                                <ToastTitle>Thanh toán thất bại</ToastTitle>
                                <ToastDescription>{error.message || 'Đã xảy ra lỗi khi thanh toán'}</ToastDescription>
                            </VStack>
                        </Toast>
                    ),
                });
                if (type === 'booking') {
                    router.replace(`/bookings/${ id }`);
                }
                else {
                    router.replace(`/orders/${ id }`);
                }
                return;
            }

            // Show success toast
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="success" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Thành công</ToastTitle>
                            <ToastDescription>Thanh toán đã được xử lý thành công</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });

            const responseConfirmation = await apiClient.post(`/payments/confirm`, {
                clientSecret: clientSecret,
            });

            // Navigate to the appropriate confirmation page
            router.replace({
                pathname: confirmationPath,
                params: {id}
            });
        } catch (error) {
            console.error('Error in handle payment:', error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Đã xảy ra lỗi không mong muốn</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setPaymentInProgress(false);
        }
    };

    const handleCancel = async () => {
        try {
            // Cancel the order or booking
            // await apiClient.put(cancelEndpoint, {
            // });
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="info" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Thông báo</ToastTitle>
                            <ToastDescription>{isBooking ? 'Lịch hẹn' : 'Đơn hàng'} đã huỷ thanh toán</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
            router.replace(cancelEndpoint);
        } catch (error) {
            console.error(`Error cancelling ${ isBooking ? 'booking' : 'order' }:`, error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể hủy {isBooking ? 'lịch hẹn' : 'đơn hàng'}</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <HStack className="px-4 py-3 bg-white items-center justify-between">
                {/* <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full items-center justify-center"
                >
                    <Icon as={ChevronLeft} size="md" color="#374151" />
                </Pressable> */}
                <Heading size="md" className="flex-1 text-center">Thanh toán an toàn</Heading>
                <Box className="w-10" />
            </HStack>

            <VStack className="flex-1 p-4 justify-between">
                <VStack className="items-center mt-10">
                    <Box className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
                        <Icon as={CreditCard} size="xl" color="#3B82F6" />
                    </Box>
                    <Heading size="lg" className="mb-2">
                        {isBooking ? 'Thanh toán dịch vụ' : 'Thanh toán đơn hàng'}
                    </Heading>
                    <Text className="text-gray-600 text-center mb-2">
                        Bạn sắp thanh toán {isBooking ? 'dịch vụ' : 'đơn hàng'} của mình bằng thẻ tín dụng/ghi nợ quốc tế
                    </Text>
                    <Text className="font-bold text-blue-600 text-xl mb-6">
                        {formatVietnamCurrency(parseInt(amount) || 0)}
                    </Text>

                    <VStack className="w-full bg-gray-50 p-4 rounded-lg">
                        <Text className="text-gray-600 mb-2">
                            Bạn sẽ được chuyển đến cổng thanh toán bảo mật của Stripe để hoàn tất giao dịch.
                        </Text>
                        <Text className="text-gray-600">
                            Thông tin thanh toán của bạn sẽ được bảo vệ theo tiêu chuẩn bảo mật quốc tế.
                        </Text>
                    </VStack>
                </VStack>

                <VStack className="space-y-3 w-full">
                    <Button
                        className="bg-blue-600 p-4 rounded-xl h-14 mb-2"
                        onPress={handlePayment}
                        disabled={loading || paymentInProgress}
                    >
                        {loading || paymentInProgress ? (
                            <Spinner size="sm" color="white" />
                        ) : (
                            <ButtonText className="font-bold">Tiến hành thanh toán</ButtonText>
                        )}
                    </Button>

                    <Button
                        variant="outline"
                        className="border-gray-300 p-4 rounded-xl h-14"
                        onPress={handleCancel}
                        disabled={loading || paymentInProgress}
                    >
                        <ButtonText className="text-gray-700">Hủy thanh toán</ButtonText>
                    </Button>
                </VStack>
            </VStack>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
});

export default function StripePayment () {
    return (
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
            <StripeScreen />
        </StripeProvider>
    );
}
