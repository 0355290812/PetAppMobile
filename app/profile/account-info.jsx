import React, {useState} from 'react';
import {View, Text, TouchableOpacity, TextInput, ScrollView} from 'react-native';
import {useAuth} from "@/contexts/AuthContext";
import {Ionicons} from '@expo/vector-icons';
import {ApiClient} from '@/config/api';
import {Spinner} from '@/components/ui/spinner';
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";
import {VStack} from "@/components/ui/vstack";

const AccountInfo = () => {
    const {user} = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const api = ApiClient();
    const toast = useToast();

    const handlePasswordChange = async () => {
        // Basic validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Vui lòng điền đầy đủ thông tin</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Mật khẩu mới không khớp</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
            return;
        }

        if (newPassword.length < 6) {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Mật khẩu mới phải có ít nhất 6 ký tự</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
            return;
        }

        setLoading(true);
        try {
            const response = await api.patch(
                '/users/me/password',
                {
                    currentPassword,
                    newPassword
                }
            );
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="success" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Thành công</ToastTitle>
                            <ToastDescription>Mật khẩu đã được thay đổi</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
            // Clear form
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.log('Error changing password:', error.response.data);

            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>
                                {error.response?.data?.message || 'Đã xảy ra lỗi khi thay đổi mật khẩu. Vui lòng thử lại sau.'}
                            </ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-gray-50 flex-col h-full">
            <View className="bg-white rounded-xl mx-4 my-4 shadow-sm">
                <View className="p-4 border-b border-gray-100">
                    <Text className="text-lg font-medium">Thay đổi mật khẩu</Text>
                </View>

                <View className="p-4">
                    <Text className="text-sm text-gray-500 mb-2">Mật khẩu hiện tại</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2 mb-4">
                        <TextInput
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry={!showCurrentPassword}
                            className="flex-1"
                            placeholder="Nhập mật khẩu hiện tại"
                        />
                        <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                            <Ionicons name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#777" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-sm text-gray-500 mb-2">Mật khẩu mới</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2 mb-4">
                        <TextInput
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={!showNewPassword}
                            className="flex-1"
                            placeholder="Nhập mật khẩu mới"
                        />
                        <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                            <Ionicons name={showNewPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#777" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-sm text-gray-500 mb-2">Xác nhận mật khẩu mới</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-lg px-3 py-2 mb-6">
                        <TextInput
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            className="flex-1"
                            placeholder="Nhập lại mật khẩu mới"
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#777" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        className="bg-blue-500 rounded-lg py-3 items-center"
                        onPress={handlePasswordChange}
                        disabled={loading}
                    >
                        {loading ? (
                            <View className="flex-row items-center space-x-2 gap-2">
                                <Spinner size="sm" color="white" className='mr-4' />
                                <Text className="text-white font-medium">Đang xử lý...</Text>
                            </View>
                        ) : (
                            <Text className="text-white font-medium">Cập nhật mật khẩu</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <View className="bg-white rounded-xl mx-4 mb-4 shadow-sm">
                <View className="p-4 border-b border-gray-100">
                    <Text className="text-lg font-medium">Thông tin tài khoản</Text>
                </View>

                <View className="p-4 border-b border-gray-100">
                    <Text className="text-sm text-gray-500">Email</Text>
                    <Text className="text-base mt-1">{user?.email}</Text>
                </View>

                <View className="p-4">
                    <Text className="text-sm text-gray-500">Ngày tạo tài khoản</Text>
                    <Text className="text-base mt-1">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Không có thông tin'}</Text>
                </View>
            </View>
        </View>
    );
};

export default AccountInfo;