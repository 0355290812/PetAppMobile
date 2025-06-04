import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Image, ScrollView} from 'react-native';
import {useAuth} from "@/contexts/AuthContext";
import {Ionicons} from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {formatImageUrl} from '@/utils/imageUtils';
import {ApiClient} from '@/config/api';
import {Input, InputField} from "@/components/ui/input";
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";
import {VStack} from "@/components/ui/vstack";
import {Spinner} from "@/components/ui/spinner";

const PersonalInfo = () => {
    const {user, refreshUser} = useAuth();
    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.fullname || '');
    const [loadingAvatar, setLoadingAvatar] = useState(false);
    const [loadingName, setLoadingName] = useState(false);
    const api = ApiClient();
    const toast = useToast();

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled) {
                uploadImage(result.assets[0].uri);
            }
        } catch (error) {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể chọn ảnh. Vui lòng thử lại.</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        }
    };

    const uploadImage = async (uri) => {
        setLoadingAvatar(true);
        try {
            const formData = new FormData();
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${ match[1] }` : 'image';

            formData.append('avatar', {
                uri,
                name: filename,
                type,
            });

            const response = await api.patch('/users/me/avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            if (response) {
                await refreshUser();
                toast.show({
                    render: ({id}) => (
                        <Toast nativeID={id} action="success" variant="solid">
                            <VStack space="xs">
                                <ToastTitle>Thành công</ToastTitle>
                                <ToastDescription>Cập nhật ảnh đại diện thành công!</ToastDescription>
                            </VStack>
                        </Toast>
                    ),
                });
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể cập nhật ảnh đại diện. Vui lòng thử lại.</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setLoadingAvatar(false);
        }
    };

    const updateName = async () => {
        if (newName.trim() === '') {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Tên không được để trống</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
            return;
        }

        setLoadingName(true);
        try {
            const response = await api.patch('/users/me', {fullname: newName});

            if (response) {
                await refreshUser();
                setIsEditingName(false);
                toast.show({
                    render: ({id}) => (
                        <Toast nativeID={id} action="success" variant="solid">
                            <VStack space="xs">
                                <ToastTitle>Thành công</ToastTitle>
                                <ToastDescription>Cập nhật tên thành công!</ToastDescription>
                            </VStack>
                        </Toast>
                    ),
                });
            }
        } catch (error) {
            console.error('Error updating name:', error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể cập nhật tên. Vui lòng thử lại.</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setLoadingName(false);
        }
    };

    return (
        <ScrollView className="flex-1 bg-gray-50">
            <View className="items-center pt-6 pb-4 mb-4 bg-white">
                <View className="relative">
                    <Image
                        source={{uri: formatImageUrl(user?.avatar)}}
                        className="w-28 h-28 rounded-full"
                    />
                    <TouchableOpacity
                        onPress={pickImage}
                        className="absolute bottom-0 right-0 bg-blue-500 p-2 rounded-full"
                        disabled={loadingAvatar}
                    >
                        {loadingAvatar ? (
                            <Spinner size="sm" color="white" />
                        ) : (
                            <Ionicons name="camera" size={18} color="white" />
                        )}
                    </TouchableOpacity>
                </View>

                <Text className="mt-4 text-2xl font-bold">{user?.fullname}</Text>
                <Text className="text-gray-500">{user?.email}</Text>
            </View>

            <View className="bg-white rounded-xl mx-4 mb-4 shadow-sm">
                <View className="p-4 border-b border-gray-100">
                    <Text className="text-sm text-gray-500 mb-1">Thông tin cá nhân</Text>
                </View>

                <View className="p-4 border-b border-gray-100 flex-row justify-between items-start">
                    <View className="flex-1">
                        <Text className="text-sm text-gray-500">Họ và tên</Text>
                        {isEditingName ? (
                            <Input
                                variant="outline"
                                size="md"
                                className="mt-2 border border-blue-300 rounded-lg bg-blue-50"
                            >
                                <InputField
                                    value={newName}
                                    onChangeText={setNewName}
                                    placeholder="Nhập họ và tên"
                                    autoFocus
                                    className="text-gray-800"
                                />
                            </Input>
                        ) : (
                            <Text className="text-base mt-1">{user?.fullname}</Text>
                        )}
                    </View>
                    <View className="flex-row ml-3" style={{marginTop: isEditingName ? 8 : 4}}>
                        {isEditingName ? (
                            loadingName ? (
                                <View className="p-1">
                                    <Spinner size="sm" color="#3B82F6" />
                                </View>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setNewName(user?.fullname || '');
                                            setIsEditingName(false);
                                        }}
                                        className="mr-3 p-1"
                                    >
                                        <Ionicons name="close-outline" size={24} color="#FF3B30" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={updateName} className="p-1">
                                        <Ionicons name="checkmark-outline" size={24} color="#34C759" />
                                    </TouchableOpacity>
                                </>
                            )
                        ) : (
                            <TouchableOpacity onPress={() => setIsEditingName(true)} className="p-1">
                                <Ionicons name="create-outline" size={22} color="#007AFF" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <View className="p-4 border-b border-gray-100">
                    <Text className="text-sm text-gray-500">Email</Text>
                    <Text className="text-base mt-1">{user?.email}</Text>
                </View>

                <View className="p-4">
                    <Text className="text-sm text-gray-500">Số điện thoại</Text>
                    <Text className="text-base mt-1">{user?.phone || 'Chưa cập nhật'}</Text>
                </View>
            </View>
        </ScrollView>
    );
};

export default PersonalInfo;
