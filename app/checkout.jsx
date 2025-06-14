import {useState, useEffect} from 'react';
import {ScrollView, SafeAreaView} from 'react-native';
import {useLocalSearchParams, router, useGlobalSearchParams} from 'expo-router';
import {ChevronLeft, MapPin, CreditCard, Truck, Shield} from 'lucide-react-native';
import {ApiClient} from '@/config/api';
import {formatImageUrl} from '@/utils/imageUtils';
import {formatVietnamCurrency} from '@/utils/formatters';
import {useCart} from '@/contexts/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import {Radio, RadioGroup, RadioIndicator, RadioIcon, RadioLabel} from "@/components/ui/radio";
import {Spinner} from "@/components/ui/spinner";
import {Input, InputField} from "@/components/ui/input";
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";
import {CircleIcon} from "@/components/ui/icon"

const CheckoutScreen = () => {
    const params = useLocalSearchParams();
    const {cart, getCartTotal, clearCart, removeFromCart} = useCart();
    const apiClient = ApiClient();
    const toast = useToast();

    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [checkoutItems, setCheckoutItems] = useState([]);
    const [note, setNote] = useState('');

    // Check if there are selected cart items from parameters
    const hasSelectedItems = params?.isFromCart !== undefined;

    useEffect(() => {
        const initCheckout = async () => {
            try {
                let items = [];

                // First, try to get items from AsyncStorage
                const storedItems = await AsyncStorage.getItem('items');

                if (storedItems) {
                    // If items exist in AsyncStorage, use them
                    items = JSON.parse(storedItems);
                } else if (hasSelectedItems) {
                    // If no items in storage but selected items from cart exist
                    try {
                        const selectedIds = JSON.parse(params.selectedItems);
                        items = cart.filter(item => selectedIds.includes(item._id));
                    } catch (error) {
                        console.error("Failed to parse selected items:", error);
                    }
                }

                // Set the items for checkout
                setCheckoutItems(items);

                // Fetch addresses
                await fetchAddresses();
            } catch (error) {
                console.error("Error initializing checkout:", error);
            } finally {
                setLoading(false);
            }
        };

        initCheckout();
    }, []);

    const fetchAddresses = async () => {
        try {
            setLoading(true);
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
                            <ToastDescription>Không thể tải địa chỉ giao hàng</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setLoading(false);
        }
    };

    const getOrderItems = () => {
        return checkoutItems.map(item => ({
            productId: item.productId || item._id,
            quantity: item.quantity,
            price: item.onSale ? item.salePrice : item.price
        }));
    };

    const getTotalOrderAmount = () => {
        return checkoutItems.reduce((total, item) => {
            const price = item.onSale ? item.salePrice : item.price;
            return total + (price * item.quantity);
        }, 0);
    };

    // Calculate shipping fee - for example purposes
    const calculateShippingFee = () => {
        const totalAmount = getTotalOrderAmount();
        // Free shipping for orders over 500,000 VND
        return totalAmount >= 500000 ? 0 : 30000;
    };

    // Add a function to handle quantity changes
    const handleQuantityChange = (itemId, newQuantity) => {
        // Don't allow quantity less than 1
        if (newQuantity < 1) return;

        // Don't allow more than 10 items of the same product
        if (newQuantity > 10) return;

        // Update the quantity of the specified item
        const updatedItems = checkoutItems.map(item => {
            if ((item.productId || item._id) === itemId) {
                return {...item, quantity: newQuantity};
            }
            return item;
        });

        // Update the checkout items state
        setCheckoutItems(updatedItems);

        // If items came from AsyncStorage, update them there too
        if (!hasSelectedItems) {
            AsyncStorage.setItem('items', JSON.stringify(updatedItems));
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Vui lòng chọn địa chỉ giao hàng</ToastDescription>
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

            // Format order data according to API requirements
            const orderData = {
                items: checkoutItems.map(item => ({
                    productId: item.productId || item._id,
                    quantity: item.quantity
                })),
                shippingAddress: {
                    fullName: addressDetails.fullName,
                    phone: addressDetails.phone,
                    streetAddress: addressDetails.streetAddress,
                    ward: addressDetails.ward,
                    district: addressDetails.district,
                    city: addressDetails.city,
                },
                paymentMethod: paymentMethod === 'cash' ? 'cash' : 'credit_card',
                notes: note || '',
            };
            // Call the API to create the order
            const response = await apiClient.post('/orders', orderData);

            if (response) {
                // Clear the items from AsyncStorage
                await AsyncStorage.removeItem('items');

                // If from cart selection, remove those items from cart
                if (hasSelectedItems) {
                    for (const item of checkoutItems) {
                        await removeFromCart(item.productId);
                    }
                }

                // For credit card payments, redirect to Stripe payment screen
                if (paymentMethod === 'credit-card' && response.payment && response.payment.clientSecret) {
                    router.replace({
                        pathname: '/payments/stripe',
                        params: {
                            clientSecret: response.payment.clientSecret,
                            orderId: response.order._id,
                            paymentId: response.payment._id,
                            amount: response.order.totalAmount
                        }
                    });
                    return;
                }

                toast.show({
                    render: ({id}) => (
                        <Toast nativeID={id} action="success" variant="solid">
                            <VStack space="xs">
                                <ToastTitle>Thành công</ToastTitle>
                                <ToastDescription>Đơn hàng đã được đặt thành công</ToastDescription>
                            </VStack>
                        </Toast>
                    ),
                });


                // Navigate to order confirmation page
                router.replace({
                    pathname: '/orders/confirmation',
                    params: {id: response.order._id, paymentMethod}
                });
            }
        } catch (error) {
            console.error("Failed to place order:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể đặt hàng. Vui lòng thử lại sau.</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setSubmitting(false);
        }
    };

    const renderProductItems = () => {
        if (checkoutItems.length === 0) {
            return (
                <VStack className="items-center p-4">
                    <Text className="text-gray-500">Không có sản phẩm để thanh toán</Text>
                </VStack>
            );
        }

        return checkoutItems.map((item, index) => (
            <HStack key={index} className="p-4 bg-white rounded-lg mb-2 space-x-3">
                <Image
                    source={{uri: formatImageUrl(item.image)}}
                    alt={item.name}
                    className="w-16 h-16 rounded-md mr-2"
                    resizeMode="cover"
                />
                <VStack className="flex-1 justify-between">
                    <Text className="text-gray-800 font-medium" numberOfLines={1}>{item.name}</Text>
                    <HStack className="justify-between items-center">
                        <HStack className="items-center border border-gray-200 rounded-lg overflow-hidden">
                            <Pressable
                                onPress={() => handleQuantityChange(item.productId || item._id, item.quantity - 1)}
                                className="w-8 h-8 items-center justify-center bg-gray-50"
                            >
                                <Text className="text-gray-600 text-lg font-semibold">-</Text>
                            </Pressable>
                            <Text className="px-3 text-gray-700">{item.quantity}</Text>
                            <Pressable
                                onPress={() => handleQuantityChange(item.productId || item._id, item.quantity + 1)}
                                className="w-8 h-8 items-center justify-center bg-gray-50"
                            >
                                <Text className="text-gray-600 text-lg font-semibold">+</Text>
                            </Pressable>
                        </HStack>
                        <Text className="text-blue-600 font-medium">
                            {formatVietnamCurrency(item.onSale ? item.salePrice : item.price)}
                        </Text>
                    </HStack>
                </VStack>
            </HStack>
        ));
    };

    if (loading) {
        return (
            <Box className="flex-1 justify-center items-center bg-gray-50">
                <Spinner size="lg" color="blue" />
            </Box>
        );
    }

    // Calculate final amounts
    const subtotal = getTotalOrderAmount();
    const shippingFee = calculateShippingFee();
    const totalAmount = subtotal + shippingFee;

    return (
        <SafeAreaView className="flex-1">
            <VStack className="flex-1 bg-gray-50">
                {/* Header */}
                <HStack className="px-4 py-3 bg-white items-center justify-between absolute top-0 left-0 right-0 z-20">
                    <Pressable
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full items-center justify-center"
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    >
                        <Icon as={ChevronLeft} size="md" color="#374151" />
                    </Pressable>
                    <Heading size="md" className="flex-1 text-center">Thanh toán</Heading>
                    <Box className="w-10" />
                </HStack>

                {/* Content */}
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName='pt-16 pb-32'>
                    <VStack className="p-4 space-y-4 gap-4">
                        {/* Shipping Address */}
                        <VStack className="bg-white p-4 rounded-lg">
                            <HStack className="justify-between items-center mb-3">
                                <HStack className="items-center">
                                    <Icon as={MapPin} size="sm" color="#3B82F6" />
                                    <Heading size="sm" className="ml-2">Địa chỉ giao hàng</Heading>
                                </HStack>
                                {/* <Pressable onPress={() => router.push('/profile/addresses')}>
                                    <Text className="text-blue-500">Thay đổi</Text>
                                </Pressable> */}
                            </HStack>

                            {addresses.length > 0 ? (
                                <RadioGroup value={selectedAddress} onChange={setSelectedAddress}>
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
                                </RadioGroup>
                            ) : (
                                <VStack className="items-center py-2">
                                    <Text className="text-gray-500 mb-2">Bạn chưa có địa chỉ giao hàng</Text>
                                    <Button onPress={() => router.push('/profile/add-address')} variant="outline" className="border-blue-500">
                                        <ButtonText ButtonText className="text-blue-500" > Thêm địa chỉ mới</ButtonText>
                                    </Button>
                                </VStack>
                            )}
                        </VStack>

                        {/* Order Items */}
                        <VStack className="bg-white p-4 rounded-lg">
                            <HStack className="items-center mb-3">
                                <Icon as={Truck} size="sm" color="#3B82F6" />
                                <Heading size="sm" className="ml-2">Sản phẩm</Heading>
                            </HStack>
                            <VStack>
                                {renderProductItems()}
                            </VStack>
                        </VStack>

                        {/* Payment Methods */}
                        <VStack className="bg-white p-4 rounded-lg">
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
                                        <Text className="ml-2">Thanh toán khi nhận hàng (COD)</Text>
                                    </RadioLabel>
                                </Radio>
                                <Radio value="credit-card" size="md">
                                    <RadioIndicator>
                                        <RadioIcon as={CircleIcon} />
                                    </RadioIndicator>
                                    <RadioLabel>
                                        <Text className="ml-2">Chuyển khoản ngân hàng</Text>
                                    </RadioLabel>
                                </Radio>
                            </RadioGroup>
                        </VStack>

                        {/* Order note */}
                        <VStack className="bg-white p-4 rounded-lg shadow-sm">
                            <Heading size="sm" className="mb-3 text-gray-800">Ghi chú đơn hàng</Heading>
                            <Input
                                variant="outline"
                                size="md"
                                className="border border-gray-200 rounded-lg bg-gray-50 py-4 px-2 h-fit"
                            >
                                <InputField
                                    value={note}
                                    onChangeText={setNote}
                                    placeholder="Nhập ghi chú cho đơn hàng (không bắt buộc)"
                                    multiline={true}
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    className="text-gray-700 h-fit"
                                />
                            </Input>
                        </VStack>

                        {/* Order Summary */}
                        <VStack className="bg-white p-4 rounded-lg shadow-sm">
                            <Heading size="sm" className="mb-3 text-gray-800">Tổng tiền</Heading>
                            <VStack>
                                <HStack className="justify-between mb-2">
                                    <Text className="text-gray-600">Tiền hàng</Text>
                                    <Text className="font-medium text-gray-800">{formatVietnamCurrency(subtotal)}</Text>
                                </HStack>
                                <HStack className="justify-between mb-2">
                                    <Text className="text-gray-600">Phí vận chuyển</Text>
                                    {shippingFee > 0 ? (
                                        <Text className="font-medium text-gray-800">{formatVietnamCurrency(shippingFee)}</Text>
                                    ) : (
                                        <Text className="text-green-600 font-medium">Miễn phí</Text>
                                    )}
                                </HStack>
                                <Divider className="my-3" />
                                <HStack className="justify-between">
                                    <Text className="font-bold text-gray-700">Tổng cộng</Text>
                                    <Text className="font-bold text-xl text-blue-600">{formatVietnamCurrency(totalAmount)}</Text>
                                </HStack>
                            </VStack>
                        </VStack>

                        {/* Policies */}
                        <HStack className="bg-blue-50 p-4 rounded-lg items-center">
                            <Icon as={Shield} size="md" color="#3B82F6" />
                            <VStack className="ml-2">
                                <Text className="text-gray-800 font-medium">Chính sách vận chuyển</Text>
                                <Text className="text-gray-600 text-sm">
                                    Miễn phí giao hàng cho đơn hàng từ 500.000đ. Thời gian giao hàng 2-5 ngày.
                                </Text>
                            </VStack>
                        </HStack>
                    </VStack>
                </ScrollView >

                {/* Bottom Button */}
                <VStack VStack className="p-4 absolute -bottom-12 left-0 right-0 bg-white border-t border-gray-200 shadow-md pb-12" >
                    <HStack className="justify-between mb-3">
                        <Text className="text-gray-600">Tổng thanh toán</Text>
                        <Text className="text-xl font-bold text-blue-600">{formatVietnamCurrency(totalAmount)}</Text>
                    </HStack>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 p-4 rounded-xl h-14"
                        onPress={handlePlaceOrder}
                        disabled={submitting || addresses.length === 0 || checkoutItems.length === 0}
                    >
                        {submitting ? (
                            <Spinner size="sm" color="white" />
                        ) : (
                            <ButtonText className="font-bold">Đặt hàng ngay</ButtonText>
                        )}
                    </Button>
                </VStack >
            </VStack >
        </SafeAreaView >
    );
};

export default CheckoutScreen;
