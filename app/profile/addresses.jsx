import React, {useState, useEffect, useCallback, useRef} from 'react';
import {View, Text, TouchableOpacity, FlatList, ActivityIndicator} from 'react-native';
import {useAuth} from "@/contexts/AuthContext";
import {Ionicons} from '@expo/vector-icons';
import {ApiClient} from '@/config/api';
import {router, useFocusEffect} from 'expo-router';
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";
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
import {VStack} from "@/components/ui/vstack";

const Addresses = () => {
    const {user} = useAuth();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const api = ApiClient();
    const toast = useToast();
    const cancelRef = useRef(null);

    // Replace useEffect with useFocusEffect to refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchAddresses();
            return () => {
                // Optional cleanup when screen loses focus
            };
        }, [])
    );

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users/me/addresses');
            if (response) {
                setAddresses(response || []);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể tải địa chỉ. Vui lòng thử lại sau.</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefault = async (addressId) => {
        try {
            const response = await api.patch(`/users/me/addresses/${ addressId }`, {isDefault: true});
            if (response) {
                fetchAddresses();
                toast.show({
                    render: ({id}) => (
                        <Toast nativeID={id} action="success" variant="solid">
                            <VStack space="xs">
                                <ToastTitle>Thành công</ToastTitle>
                                <ToastDescription>Đã cập nhật địa chỉ mặc định</ToastDescription>
                            </VStack>
                        </Toast>
                    ),
                });
            }
        } catch (error) {
            console.error('Error setting default address:', error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể cập nhật địa chỉ mặc định.</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        }
    };

    const handleDeleteAddress = (addressId) => {
        setSelectedAddressId(addressId);
        setShowDeleteDialog(true);
    };

    const confirmDeleteAddress = async () => {
        if (!selectedAddressId) return;

        try {
            setShowDeleteDialog(false);
            const response = await api.del(`/users/me/addresses/${ selectedAddressId }`);
            fetchAddresses();
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="success" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Thành công</ToastTitle>
                            <ToastDescription>Đã xóa địa chỉ</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } catch (error) {
            console.error('Error deleting address:', error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể xóa địa chỉ.</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        }
    };

    const renderAddressItem = ({item}) => (
        <View className="bg-white p-4 mb-3 rounded-xl shadow-sm">
            <View className="flex-row justify-between items-start">
                <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                        <Text className="font-bold text-base">{item.fullName}</Text>
                        {item.isDefault && (
                            <View className="ml-2 px-2 py-0.5 bg-blue-100 rounded">
                                <Text className="text-xs text-blue-600">Mặc định</Text>
                            </View>
                        )}
                    </View>
                    <Text className="text-gray-600 mb-1">{item.phone}</Text>
                    <Text className="text-gray-600">{item.streetAddress + ", " + item.ward + ", " + item.district + ", " + item.city}</Text>
                    {item.note && <Text className="text-gray-500 italic mt-1">Ghi chú: {item.note}</Text>}
                </View>
            </View>

            <View className="flex-row justify-end mt-3 border-t border-gray-100 pt-3">
                {!item.isDefault && (
                    <TouchableOpacity
                        className="mr-4"
                        onPress={() => handleSetDefault(item._id)}
                    >
                        <Text className="text-blue-500">Đặt làm mặc định</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    className="mr-4"
                    onPress={() => router.push(`/profile/edit-address?id=${ item._id }`)}
                >
                    <Text className="text-gray-500">Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteAddress(item._id)}>
                    <Text className="text-red-500">Xóa</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50 p-4">
            <TouchableOpacity
                className="bg-blue-500 p-3 rounded-lg mb-4 flex-row justify-center items-center"
                onPress={() => router.push('/profile/add-address')}
            >
                <Ionicons name="add-circle-outline" size={20} color="white" />
                <Text className="text-white font-medium ml-1">Thêm địa chỉ mới</Text>
            </TouchableOpacity>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : addresses.length > 0 ? (
                <FlatList
                    data={addresses}
                    renderItem={renderAddressItem}
                    keyExtractor={(item) => item._id}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View className="flex-1 justify-center items-center">
                    <Ionicons name="location-outline" size={60} color="#ccc" />
                    <Text className="text-gray-400 mt-3 text-center">
                        Bạn chưa có địa chỉ nào.{'\n'}Hãy thêm địa chỉ mới!
                    </Text>
                </View>
            )}

            {/* Delete Address Confirmation Dialog */}
            <AlertDialog
                leastDestructiveRef={cancelRef}
                isOpen={showDeleteDialog}
                onClose={() => setShowDeleteDialog(false)}
            >
                <AlertDialogBackdrop />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Heading size="lg">Xác nhận xóa địa chỉ</Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        <Text className="text-gray-700">
                            Bạn có chắc chắn muốn xóa địa chỉ này không? Hành động này không thể hoàn tác.
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onPress={() => setShowDeleteDialog(false)}
                            ref={cancelRef}
                        >
                            <ButtonText>Hủy</ButtonText>
                        </Button>
                        <Button
                            className="bg-red-500 ml-3"
                            onPress={confirmDeleteAddress}
                        >
                            <ButtonText>Xóa địa chỉ</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </View>
    );
};

export default Addresses;
