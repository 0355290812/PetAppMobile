import React, {useState, useEffect} from 'react';
import {ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert} from 'react-native';
import {router} from 'expo-router';
import {ChevronLeft, Calendar, Clock, PawPrint, CreditCard, DollarSign, Check, ChevronRight, AlertCircle, ShieldCheck, MapPin} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ApiClient} from '@/config/api';
import {formatVietnamCurrency} from '@/utils/formatters';
import {formatImageUrl} from '@/utils/imageUtils';
import {format, parseISO} from 'date-fns';
import {vi} from 'date-fns/locale';
import {useAuth} from '@/contexts/AuthContext';

import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";
import {Heading} from "@/components/ui/heading";
import {Image} from "@/components/ui/image";
import {Pressable} from "@/components/ui/pressable";
import {Button, ButtonText, ButtonIcon} from "@/components/ui/button";
import {Icon} from "@/components/ui/icon";
import {Divider} from "@/components/ui/divider";
import {Input, InputField} from "@/components/ui/input";
import {FormControl, FormControlLabel, FormControlLabelText, FormControlError, FormControlErrorIcon, FormControlErrorText} from "@/components/ui/form-control";
import {Textarea, TextareaInput} from "@/components/ui/textarea";
import {Radio, RadioGroup, RadioIcon, RadioIndicator, RadioLabel} from "@/components/ui/radio";
import {Checkbox, CheckboxIndicator, CheckboxIcon, CheckboxLabel} from "@/components/ui/checkbox";
import {Spinner} from "@/components/ui/spinner";
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";
import {CircleIcon} from "@/components/ui/icon";

const BookingScreen = () => {
    const [bookingData, setBookingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [loadingAddresses, setLoadingAddresses] = useState(false);

    // Form states
    const [notes, setNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Form validation
    const [errors, setErrors] = useState({});

    const apiClient = ApiClient();
    const toast = useToast();
    const {user} = useAuth(); // Get user from auth context

    // Load booking data and user addresses
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // Load booking data from AsyncStorage
                const bookingJson = await AsyncStorage.getItem('serviceBooking');
                if (bookingJson) {
                    const parsedBooking = JSON.parse(bookingJson);
                    setBookingData(parsedBooking);
                } else {
                    throw new Error('No booking data found');
                }

                // Load user addresses
                await fetchAddresses();
            } catch (error) {
                console.error("Failed to load booking data:", error);
                toast.show({
                    render: ({id}) => (
                        <Toast nativeID={id} action="error" variant="solid">
                            <VStack space="xs">
                                <ToastTitle>Lỗi</ToastTitle>
                                <ToastDescription>Không thể tải thông tin đặt lịch</ToastDescription>
                            </VStack>
                        </Toast>
                    ),
                });
                router.back();
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]);

    // Fetch user addresses
    const fetchAddresses = async () => {
        try {
            setLoadingAddresses(true);
            // Fetch addresses from the API
            const userAddresses = await apiClient.get('/users/me/addresses');
            setAddresses(userAddresses || []);

            if (userAddresses && userAddresses.length > 0) {
                // Select the address marked as default, or the first one if none is default
                const defaultAddress = userAddresses.find(addr => addr.isDefault) || userAddresses[0];
                setSelectedAddress(defaultAddress._id);
            }
        } catch (error) {
            console.error("Failed to fetch addresses:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể tải địa chỉ</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setLoadingAddresses(false);
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

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!selectedAddress) {
            newErrors.address = 'Vui lòng chọn địa chỉ liên hệ';
        }

        if (!termsAccepted) {
            newErrors.terms = 'Vui lòng đồng ý với điều khoản dịch vụ';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle booking submission
    const handleSubmit = async () => {
        // if (!validateForm()) {
        //     // Scroll to the first error
        //     return;
        // }

        if (!bookingData) {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không có thông tin đặt lịch</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
            return;
        }

        try {
            setSubmitting(true);

            // Find the selected address object
            const addressDetails = addresses.find(addr => addr._id === selectedAddress);

            if (!addressDetails) {
                throw new Error("Địa chỉ không hợp lệ");
            }

            // Prepare booking data for API
            const bookingPayload = {
                serviceId: bookingData.serviceId,
                bookingDate: bookingData.date,
                timeSlot: bookingData.startTime + '-' + bookingData.endTime,
                petsId: bookingData.pets.map(pet => pet.id),
                notes: notes || undefined,
                paymentMethod,
            };

            // Send booking request to API
            const response = await apiClient.post('/bookings', bookingPayload);

            // Clear the temp storage
            await AsyncStorage.removeItem('serviceBooking');

            // If payment method is card, redirect to Stripe payment page
            if (paymentMethod === 'credit_card' && response.payment && response.payment.clientSecret) {
                router.replace({
                    pathname: '/payments/stripe',
                    params: {
                        clientSecret: response.payment.clientSecret,
                        bookingId: response.booking._id,
                        paymentId: response.payment._id,
                        amount: bookingData.totalPrice,
                        type: 'booking'
                    }
                });
                return;
            }

            // Show success message for cash payments
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="success" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Thành công</ToastTitle>
                            <ToastDescription>Đặt lịch thành công! Mã đặt lịch: {response.bookingNumber || 'N/A'}</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
            console.log("Booking successful:", response);


            // Navigate to booking confirmation with booking ID
            setTimeout(() => {
                router.replace({
                    pathname: '/bookings/confirmation',
                    params: {
                        id: response._id,
                        paymentMethod: paymentMethod
                    }
                });
            }, 1500);

        } catch (error) {
            console.error("Failed to submit booking:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>
                                {error.response?.data?.message || 'Không thể hoàn tất đặt lịch. Vui lòng thử lại.'}
                            </ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box className="flex-1 justify-center items-center">
                <Spinner size="lg" color="blue" />
            </Box>
        );
    }

    if (!bookingData) {
        return (
            <Box className="flex-1 justify-center items-center px-6">
                <Text className="text-gray-500 text-center mb-4">
                    Không tìm thấy thông tin đặt lịch
                </Text>
                <Button onPress={() => router.back()} className="bg-blue-500">
                    <ButtonText>Quay lại</ButtonText>
                </Button>
            </Box>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                contentContainerClassName=''
            >
                <VStack className="flex-1">
                    {/* Header */}
                    <HStack className="px-4 py-3 bg-white items-center border-b border-gray-200">
                        <Pressable
                            onPress={() => router.back()}
                            className="mr-3"
                        >
                            <Icon as={ChevronLeft} size="md" color="#374151" />
                        </Pressable>
                        <Heading size="md">Xác nhận đặt lịch</Heading>
                    </HStack>

                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName='pb-16'>
                        <VStack className="p-4 gap-6">
                            {/* Service Info Section */}
                            <Box className="bg-blue-50 rounded-xl p-4">
                                <HStack className="mb-3">
                                    <Box className="w-16 h-16 rounded-lg overflow-hidden mr-3">
                                        <Image
                                            source={{uri: formatImageUrl(bookingData.serviceImage)}}
                                            alt={bookingData.serviceName}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    </Box>
                                    <VStack className="flex-1">
                                        <Heading size="sm" className="mb-1">{bookingData.serviceName}</Heading>
                                        <Text className="text-blue-600 font-medium">
                                            {formatVietnamCurrency(bookingData.price)} / thú cưng
                                        </Text>
                                    </VStack>
                                </HStack>

                                {/* Date & Time */}
                                <VStack className="bg-white rounded-lg p-3 mb-2">
                                    <HStack className="items-center mb-2">
                                        <Icon as={Calendar} size="sm" color="#3B82F6" className="mr-2" />
                                        <Text className="font-medium text-gray-800">
                                            {formatDate(bookingData.date)}
                                        </Text>
                                    </HStack>
                                    <HStack className="items-center">
                                        <Icon as={Clock} size="sm" color="#3B82F6" className="mr-2" />
                                        <Text className="font-medium text-gray-800">
                                            {bookingData.startTime} - {bookingData.endTime}
                                        </Text>
                                    </HStack>
                                </VStack>

                                {/* Selected Pets */}
                                <VStack className="bg-white rounded-lg p-3">
                                    <HStack className="items-center mb-2">
                                        <Icon as={PawPrint} size="sm" color="#3B82F6" className="mr-2" />
                                        <Text className="font-medium text-gray-800">
                                            Thú cưng đã chọn ({bookingData.pets.length})
                                        </Text>
                                    </HStack>

                                    <VStack className="gap-2">
                                        {bookingData.pets.map((pet, index) => (
                                            <HStack key={pet.id} className="items-center">
                                                <Box className="w-8 h-8 rounded-full overflow-hidden mr-2">
                                                    <Image
                                                        source={{uri: formatImageUrl(pet.image)}}
                                                        alt={pet.name}
                                                        className="w-full h-full"
                                                        resizeMode="cover"
                                                        fallbackSource={require('@/assets/images/pet-placeholder.png')}
                                                    />
                                                </Box>
                                                <VStack className="flex-1">
                                                    <Text className="text-gray-800">{pet.name}</Text>
                                                    <Text className="text-gray-500 text-xs">{pet.breed} • {pet.petType === 'dog' ? 'Chó' : pet.petType === 'cat' ? 'Mèo' : pet.petType}</Text>
                                                </VStack>
                                            </HStack>
                                        ))}
                                    </VStack>
                                </VStack>
                            </Box>

                            {/* Contact Information / Address Section */}
                            <VStack className="bg-white p-4 rounded-lg border border-gray-200">
                                <HStack className="justify-between items-center mb-3">
                                    <HStack className="items-center">
                                        <Icon as={MapPin} size="sm" color="#3B82F6" />
                                        <Heading size="sm" className="ml-2">Địa chỉ liên hệ</Heading>
                                    </HStack>
                                    {/* <Pressable onPress={() => router.push('/profile/addresses')}>
                                        <Text className="text-blue-500">Thay đổi</Text>
                                    </Pressable> */}
                                </HStack>

                                {loadingAddresses ? (
                                    <Box className="items-center py-4">
                                        <Spinner size="sm" color="blue" />
                                    </Box>
                                ) : addresses.length > 0 ? (
                                    <RadioGroup value={selectedAddress} onChange={setSelectedAddress}>
                                        <VStack space="sm">
                                            {addresses.map((address) => (
                                                <Radio key={address._id} value={address._id} size="md" className="mb-2">
                                                    <RadioIndicator>
                                                        <RadioIcon as={CircleIcon} />
                                                    </RadioIndicator>
                                                    <RadioLabel>
                                                        <VStack className="ml-2">
                                                            <HStack className="space-x-2">
                                                                <Text className="font-bold mr-2">{address.fullName}</Text>
                                                                <Text>{address.phone}</Text>
                                                                {address.isDefault && (
                                                                    <Text className="text-blue-600 text-xs bg-blue-50 px-2 py-0.5 rounded-full ml-2">Mặc định</Text>
                                                                )}
                                                            </HStack>
                                                            <Text className="text-gray-600 text-sm">
                                                                {address.streetAddress}, {address.ward}, {address.district}, {address.city}
                                                            </Text>
                                                        </VStack>
                                                    </RadioLabel>
                                                </Radio>
                                            ))}
                                        </VStack>
                                    </RadioGroup>
                                ) : (
                                    <VStack className="items-center py-2">
                                        <Text className="text-gray-500 mb-2">Bạn chưa có địa chỉ liên hệ</Text>
                                        <Button onPress={() => router.push('/profile/add-address')} variant="outline" className="border-blue-500">
                                            <ButtonText className="text-blue-500">Thêm địa chỉ mới</ButtonText>
                                        </Button>
                                    </VStack>
                                )}

                                {errors.address && (
                                    <Text className="text-red-500 text-sm mt-1">{errors.address}</Text>
                                )}
                            </VStack>

                            {/* Special Notes */}
                            <VStack className="gap-4">
                                <FormControl>
                                    <FormControlLabel>
                                        <FormControlLabelText>Ghi chú đặc biệt (tùy chọn)</FormControlLabelText>
                                    </FormControlLabel>
                                    <Textarea>
                                        <TextareaInput
                                            placeholder="Nhập yêu cầu đặc biệt, tình trạng sức khỏe thú cưng hoặc các lưu ý khác..."
                                            value={notes}
                                            onChangeText={setNotes}
                                            autoCompleteType={undefined}
                                        />
                                    </Textarea>
                                </FormControl>
                            </VStack>

                            {/* Payment Method Section */}
                            <VStack className="bg-white p-4 rounded-lg border border-gray-200">
                                <HStack className="items-center mb-3">
                                    <Icon as={CreditCard} size="sm" color="#3B82F6" />
                                    <Heading size="sm" className="ml-2">Phương thức thanh toán</Heading>
                                </HStack>
                                <RadioGroup value={paymentMethod} onChange={setPaymentMethod}>
                                    <Radio value="cash" size="md" className="mb-2">
                                        <RadioIndicator>
                                            <RadioIcon as={CircleIcon} />
                                        </RadioIndicator>
                                        <RadioLabel>
                                            <Text className="ml-2">Thanh toán trực tiếp</Text>
                                        </RadioLabel>
                                    </Radio>
                                    <Radio value="credit_card" size="md">
                                        <RadioIndicator>
                                            <RadioIcon as={CircleIcon} />
                                        </RadioIndicator>
                                        <RadioLabel>
                                            <Text className="ml-2">Thanh toán trực tuyến</Text>
                                        </RadioLabel>
                                    </Radio>
                                </RadioGroup>

                                {paymentMethod === 'credit_card' && (
                                    <Box className="bg-yellow-50 rounded-lg p-3 mt-3">
                                        <Text className="text-yellow-700">
                                            Bạn sẽ được chuyển hướng đến trang thanh toán an toàn sau khi xác nhận đặt lịch.
                                        </Text>
                                    </Box>
                                )}
                            </VStack>

                            {/* Service Policy & Terms */}
                            <VStack className="gap-4">
                                <Divider className="my-2" />

                                <HStack className="space-x-2 items-start">
                                    <Icon as={ShieldCheck} size="sm" color="#10b981" className="mt-1 mr-2" />
                                    <VStack>
                                        <Text className="text-gray-800 font-medium">Chính sách dịch vụ</Text>
                                        <Text className="text-gray-600 text-sm">Hoàn tiền 100% nếu không hài lòng về chất lượng dịch vụ</Text>
                                    </VStack>
                                </HStack>

                                {/* <Checkbox
                                    value="terms"
                                    isChecked={termsAccepted}
                                    onChange={setTermsAccepted}
                                    aria-label="Agree to terms"
                                >
                                    <CheckboxIndicator>
                                        <CheckboxIcon as={CircleIcon} />
                                    </CheckboxIndicator>
                                    <VStack className="ml-2">
                                        <CheckboxLabel>
                                            Tôi đồng ý với điều khoản dịch vụ và chính sách bảo mật
                                        </CheckboxLabel>
                                        {errors.terms && (
                                            <Text className="text-red-500 text-xs mt-1">{errors.terms}</Text>
                                        )}
                                    </VStack>
                                </Checkbox> */}
                            </VStack>

                            {/* Order Summary */}
                            <VStack className="gap-4 bg-gray-50 rounded-xl p-4">
                                <Heading size="sm">Tóm tắt đơn hàng</Heading>

                                <VStack className="gap-2">
                                    <HStack className="justify-between">
                                        <Text className="text-gray-600">Giá dịch vụ</Text>
                                        <Text className="text-gray-800">{formatVietnamCurrency(bookingData.price)}</Text>
                                    </HStack>

                                    <HStack className="justify-between">
                                        <Text className="text-gray-600">Số lượng thú cưng</Text>
                                        <Text className="text-gray-800">x{bookingData.pets.length}</Text>
                                    </HStack>

                                    <Divider className="my-2" />

                                    <HStack className="justify-between">
                                        <Text className="text-gray-800 font-bold">Tổng cộng</Text>
                                        <Text className="text-blue-600 font-bold">
                                            {formatVietnamCurrency(bookingData.totalPrice)}
                                        </Text>
                                    </HStack>
                                </VStack>
                            </VStack>

                            {/* Submit Button */}
                            <Button
                                className="bg-blue-500 p-4 h-14"
                                onPress={handleSubmit}
                                disabled={submitting || addresses.length === 0}
                            >
                                {submitting ? (
                                    <Spinner color="white" size="sm" />
                                ) : (
                                    <>
                                        <ButtonText>Xác nhận đặt lịch</ButtonText>
                                        <ButtonIcon as={ChevronRight} className="text-white" />
                                    </>
                                )}
                            </Button>
                        </VStack>
                    </ScrollView>
                </VStack>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default BookingScreen;