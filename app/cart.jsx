import {useState, useEffect} from 'react';
import {ScrollView, SafeAreaView} from 'react-native';
import {router} from 'expo-router';
import {ShoppingCart, ChevronLeft, Trash2, MinusCircle, PlusCircle} from 'lucide-react-native';
import {useCart} from '@/contexts/CartContext';
import {formatImageUrl} from '@/utils/imageUtils';
import {formatVietnamCurrency} from '@/utils/formatters';
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
import {Checkbox, CheckboxIcon, CheckboxIndicator} from "@/components/ui/checkbox";
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";
import {CheckIcon} from "@/components/ui/icon"

const CartScreen = () => {
    const {cart, updateCartItemQuantity, removeFromCart, getTotalPrice} = useCart();
    const toast = useToast();
    const [selectedItems, setSelectedItems] = useState({});
    const [isAllSelected, setIsAllSelected] = useState(false);

    useEffect(() => {
        // Update isAllSelected state when cart or selections change
        if (cart.length > 0) {
            const allSelected = cart.every(item => selectedItems[item._id]);
            setIsAllSelected(allSelected);
        } else {
            setIsAllSelected(false);
        }
    }, [cart, selectedItems]);

    const handleSelectItem = (itemId, isSelected) => {
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: isSelected
        }));
    };

    const handleSelectAll = (value) => {
        const newSelectedItems = {};
        if (value) {
            cart.forEach(item => {
                newSelectedItems[item._id] = true;
            });
        }
        console.log("New selected items:", newSelectedItems);

        setSelectedItems(newSelectedItems);
        setIsAllSelected(value);
    };

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        try {
            if (newQuantity < 1) return;
            await updateCartItemQuantity(itemId, newQuantity);
        } catch (error) {
            console.error("Failed to update quantity:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể cập nhật số lượng</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        }
    };

    const handleRemoveItem = async (itemId) => {
        try {
            await removeFromCart(itemId);
            // Also remove from selected items
            const {[itemId]: removed, ...rest} = selectedItems;
            setSelectedItems(rest);
        } catch (error) {
            console.error("Failed to remove item:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể xóa sản phẩm</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        }
    };

    const getSelectedItemsCount = () => {
        return Object.values(selectedItems).filter(Boolean).length;
    };

    const getSelectedItemsTotal = () => {
        return cart
            .filter(item => selectedItems[item._id])
            .reduce((total, item) => {
                // Use the correct price field - either regular price or sale price if on sale
                const price = item.price || 0;
                return total + (price * item.quantity);
            }, 0);
    };

    const handleCheckout = async () => {
        const selectedCount = getSelectedItemsCount();
        if (selectedCount === 0) {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Chưa chọn sản phẩm</ToastTitle>
                            <ToastDescription>Vui lòng chọn ít nhất một sản phẩm để thanh toán</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
            return;
        }

        try {
            // Get all selected items
            const selectedCartItems = cart.filter(item => selectedItems[item._id]);

            // Transform items to the required format
            const formattedItems = selectedCartItems.map(item => ({
                productId: item._id,
                name: item.name,
                image: item.image,
                price: item.price,
                salePrice: item.price,
                quantity: item.quantity,
                onSale: item.onSale,
                stock: item.stock,
            }));

            // Save selected items to AsyncStorage
            await AsyncStorage.setItem('items', JSON.stringify(formattedItems));

            console.log("Formatted items for checkout:", formattedItems);

            // Navigate to checkout page
            router.push({
                pathname: '/checkout',
                params: {
                    isFromCart: true,
                },
            });
        } catch (error) {
            console.error("Error preparing checkout:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể xử lý yêu cầu thanh toán</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        }
    };

    if (cart.length === 0) {
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
                        <Heading size="md" className="flex-1 text-center">Giỏ hàng</Heading>
                        <Box className="w-10" />
                    </HStack>
                    <VStack className="flex-1 items-center justify-center p-6 pt-16">
                        <Icon as={ShoppingCart} size="xl" color="#9CA3AF" />
                        <Heading size="md" className="mt-4 mb-2 text-center">Giỏ hàng trống</Heading>
                        <Text className="text-gray-500 text-center mb-6">
                            Bạn chưa có sản phẩm nào trong giỏ hàng
                        </Text>
                        <Button
                            className="bg-blue-500"
                            onPress={() => router.navigate('/products')}
                        >
                            <ButtonText>Mua sắm ngay</ButtonText>
                        </Button>
                    </VStack>
                </VStack>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1">
            <VStack className="flex-1 bg-gray-50">
                <HStack className="px-4 py-3 bg-white items-center justify-between absolute top-0 left-0 right-0 z-20">
                    <Pressable
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full items-center justify-center"
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    >
                        <Icon as={ChevronLeft} size="md" color="#374151" />
                    </Pressable>
                    <Heading size="md" className="flex-1 text-center">Giỏ hàng</Heading>
                    <Box className="w-10" />
                </HStack>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="pt-16 pb-32">
                    <VStack className="p-4">
                        {/* Select all checkbox */}
                        <HStack className="p-4 bg-white rounded-lg mb-3 items-center shadow-sm">
                            <Checkbox
                                isChecked={isAllSelected}
                                onChange={handleSelectAll}
                                aria-label="Chọn tất cả"
                                className="border-gray-300"
                            >
                                <CheckboxIndicator>
                                    <CheckboxIcon as={CheckIcon} size="sm" />
                                </CheckboxIndicator>
                            </Checkbox>
                            <Text className="ml-3 font-medium text-gray-700">Chọn tất cả ({cart.length})</Text>
                        </HStack>

                        {cart.map((item) => {
                            const price = item.onSale ? item.price : item.originalPrice;
                            const isSelected = !!selectedItems[item._id];

                            return (
                                <HStack key={item._id} className="p-4 bg-white rounded-lg mb-3 items-center shadow-sm">
                                    <Checkbox
                                        value={isSelected}
                                        isChecked={isSelected}
                                        onChange={(value) => handleSelectItem(item._id, value)}
                                        aria-label={`Chọn ${ item.name }`}
                                        className="border-gray-300"
                                    >
                                        <CheckboxIndicator className="bg-white">
                                            <CheckboxIcon as={CheckIcon} size="sm" />
                                        </CheckboxIndicator>
                                    </Checkbox>
                                    <HStack className="flex-1 ml-3 space-x-3">
                                        <Image
                                            source={{uri: formatImageUrl(item.image)}}
                                            alt={item.name}
                                            className="w-16 h-16 rounded-md mr-2"
                                            resizeMode="cover"
                                        />
                                        <VStack className="flex-1 justify-between">
                                            <Text className="text-gray-800 font-medium" numberOfLines={1}>
                                                {item.name}
                                            </Text>

                                            {item.onSale && (
                                                <HStack className="items-baseline">
                                                    <Text className="text-blue-600 font-bold">
                                                        {formatVietnamCurrency(item.price)}
                                                    </Text>
                                                    <Text className="text-gray-400 text-xs line-through ml-1">
                                                        {formatVietnamCurrency(item.originalPrice)}
                                                    </Text>
                                                </HStack>
                                            )}

                                            {!item.onSale && (
                                                <Text className="text-blue-600 font-bold">
                                                    {formatVietnamCurrency(item.price)}
                                                </Text>
                                            )}

                                            <HStack className="items-center justify-between mt-1">
                                                <HStack className="items-center">
                                                    <Pressable
                                                        onPress={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                                                        disabled={item.quantity <= 1}
                                                        className="p-1"
                                                    >
                                                        <Icon
                                                            as={MinusCircle}
                                                            size="sm"
                                                            color={item.quantity <= 1 ? "#D1D5DB" : "#4B5563"}
                                                        />
                                                    </Pressable>
                                                    <Box className="px-3">
                                                        <Text className="text-gray-800">{item.quantity}</Text>
                                                    </Box>
                                                    <Pressable
                                                        onPress={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                                                        disabled={item.quantity >= item.stock}
                                                        className="p-1"
                                                    >
                                                        <Icon
                                                            as={PlusCircle}
                                                            size="sm"
                                                            color={item.quantity >= item.stock ? "#D1D5DB" : "#4B5563"}
                                                        />
                                                    </Pressable>
                                                </HStack>

                                                <Pressable
                                                    onPress={() => handleRemoveItem(item._id)}
                                                    className="p-2"
                                                >
                                                    <Icon as={Trash2} size="sm" color="#EF4444" />
                                                </Pressable>
                                            </HStack>
                                        </VStack>
                                    </HStack>
                                </HStack>
                            );
                        })}
                    </VStack>
                </ScrollView>

                <VStack className="p-4 absolute -bottom-12 left-0 right-0 bg-white border-t border-gray-200 shadow-md pb-12">
                    <HStack className="justify-between mb-3">
                        <Text className="text-gray-600">Tổng thanh toán (<Text className="text-blue-600 font-medium">{getSelectedItemsCount()}</Text> sản phẩm)</Text>
                        <Text className="text-xl font-bold text-blue-600">{formatVietnamCurrency(getSelectedItemsTotal())}</Text>
                    </HStack>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 p-4 h-fit rounded-xl"
                        onPress={handleCheckout}
                        disabled={getSelectedItemsCount() === 0}
                    >
                        <ButtonText className="font-bold">Thanh toán</ButtonText>
                    </Button>
                </VStack>
            </VStack>
        </SafeAreaView>
    );
};

export default CartScreen;
