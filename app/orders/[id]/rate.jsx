import React, {useState, useEffect} from 'react';
import {ScrollView, SafeAreaView, Image, TextInput, Alert} from 'react-native';
import {useLocalSearchParams, router} from 'expo-router';
import {ApiClient} from '@/config/api';
import {formatImageUrl} from '@/utils/imageUtils';
import {ChevronLeft, Star, Camera, X} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";
import {Heading} from "@/components/ui/heading";
import {Button, ButtonText, ButtonIcon} from "@/components/ui/button";
import {Icon} from "@/components/ui/icon";
import {Spinner} from "@/components/ui/spinner";
import {Pressable} from "@/components/ui/pressable";
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";

const RatingScreen = () => {
    const {id, productId} = useLocalSearchParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [photos, setPhotos] = useState([]);
    const [product, setProduct] = useState(null);
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

            if (productId) {
                const selectedProduct = data.items.find(item => item._id === productId || item.productId === productId);
                setProduct(selectedProduct);
            } else if (data.items.length > 0) {
                setProduct(data.items[0]);
            }
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

    const pickImage = async () => {
        // Check if we already have the maximum number of photos
        if (photos.length >= 5) {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Giới hạn ảnh</ToastTitle>
                            <ToastDescription>Bạn chỉ có thể tải lên tối đa 5 ảnh</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
            return;
        }

        // Request permission
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Cần cấp quyền', 'Bạn cần cấp quyền truy cập thư viện ảnh để chọn ảnh.');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false, // Disable editing to allow multiple selection
                aspect: [4, 3],
                quality: 0.8,
                allowsMultipleSelection: true, // Enable multiple selection
                selectionLimit: 5 - photos.length, // Limit selection to how many more photos we can add
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                // If adding these would exceed 5 photos, only take what we can
                const availableSlots = 5 - photos.length;
                const newPhotos = result.assets.slice(0, availableSlots);

                setPhotos([...photos, ...newPhotos]);

                // If we had to limit the selection, show a toast
                if (result.assets.length > availableSlots) {
                    toast.show({
                        render: ({id}) => (
                            <Toast nativeID={id} action="warning" variant="solid">
                                <VStack space="xs">
                                    <ToastTitle>Giới hạn ảnh</ToastTitle>
                                    <ToastDescription>
                                        Chỉ {availableSlots} ảnh được thêm vào. Giới hạn tối đa là 5 ảnh.
                                    </ToastDescription>
                                </VStack>
                            </Toast>
                        ),
                    });
                }
            }
        } catch (error) {
            console.error("Error picking image:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể chọn ảnh</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        }
    };

    const removePhoto = (index) => {
        const updatedPhotos = [...photos];
        updatedPhotos.splice(index, 1);
        setPhotos(updatedPhotos);
    };

    const handleSubmitRating = async () => {
        if (!product) return;

        try {
            setSubmitting(true);

            // Create FormData object
            const formData = new FormData();
            formData.append('rating', rating);
            formData.append('content', comment);
            formData.append('sourceId', id);

            // Append each photo to the FormData
            photos.forEach((photo, index) => {
                // Get the file extension from URI
                const uriParts = photo.uri.split('.');
                const fileExtension = uriParts[uriParts.length - 1];

                formData.append('photos', {
                    uri: photo.uri,
                    name: `photo_${ index }.${ fileExtension }`,
                    type: `image/${ fileExtension === 'jpg' ? 'jpeg' : fileExtension }`
                });
            });

            // Use ApiClient to send FormData
            await apiClient.post(`/products/${ product.productId || product._id }/reviews`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="success" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Thành công</ToastTitle>
                            <ToastDescription>Đánh giá của bạn đã được gửi thành công</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });

            // Navigate back to the order details
            router.push(`/orders?status=delivered`);
        } catch (error) {
            console.error("Failed to submit review:", error);
            // Log more details about the error
            if (error.response) {
                console.error("Error response:", error.response.data);
            }

            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể gửi đánh giá: {error.message}</ToastDescription>
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
            <Box className="flex-1 justify-center items-center bg-white">
                <Spinner size="lg" color="blue" />
            </Box>
        );
    }

    if (!product) {
        return (
            <Box className="flex-1 justify-center items-center bg-white p-4">
                <Text className="text-center text-gray-600">Không tìm thấy thông tin sản phẩm</Text>
                <Button
                    className="mt-4 bg-blue-600 rounded-lg"
                    onPress={() => router.back()}
                >
                    <ButtonText>Quay lại</ButtonText>
                </Button>
            </Box>
        );
    }

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
                <Heading size="md" className="flex-1 text-center">Đánh giá sản phẩm</Heading>
                <Box className="w-10" />
            </HStack>

            <ScrollView className="flex-1">
                <VStack className="p-4 space-y-6 gap-4">
                    {/* Product Information */}
                    <HStack className="space-x-4 p-4 bg-white rounded-xl border border-gray-200">
                        <Image
                            source={{uri: formatImageUrl(product.image)}}
                            className="w-20 h-20 rounded-md bg-gray-100"
                            resizeMode="cover"
                        />
                        <VStack className="flex-1">
                            <Text className="font-medium text-gray-800" numberOfLines={2}>{product.name}</Text>
                            <Text className="text-gray-500 text-sm mt-1">Số lượng: {product.quantity}</Text>
                        </VStack>
                    </HStack>

                    {/* Rating Stars */}
                    <VStack className="bg-white p-4 rounded-xl border border-gray-200">
                        <Text className="text-gray-800 font-medium mb-3">Đánh giá của bạn</Text>
                        <HStack className="justify-center space-x-2 py-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Pressable key={star} onPress={() => setRating(star)}>
                                    <Icon
                                        as={Star}
                                        size="lg"
                                        color={star <= rating ? "#FFD700" : "#D1D5DB"}
                                        fill={star <= rating ? "#FFD700" : "none"}
                                    />
                                </Pressable>
                            ))}
                        </HStack>
                        <Text className="text-center text-gray-600 mt-2">
                            {rating === 1 && "Không hài lòng"}
                            {rating === 2 && "Tạm được"}
                            {rating === 3 && "Bình thường"}
                            {rating === 4 && "Tốt"}
                            {rating === 5 && "Tuyệt vời"}
                        </Text>
                    </VStack>

                    {/* Comment - Replace the Textarea with a native TextInput */}
                    <VStack className="bg-white p-4 rounded-xl border border-gray-200">
                        <Text className="text-gray-800 font-medium mb-3">Nhận xét</Text>
                        <TextInput
                            value={comment}
                            onChangeText={(text) => setComment(text)}
                            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                            style={{
                                height: 120,
                                padding: 12,
                                borderWidth: 1,
                                borderColor: '#D1D5DB',
                                borderRadius: 6,
                                textAlignVertical: 'top',
                                fontSize: 16,
                            }}
                            multiline={true}
                            numberOfLines={4}
                        />
                    </VStack>

                    {/* Photo Upload Section */}
                    <VStack className="bg-white p-4 rounded-xl border border-gray-200">
                        <Text className="text-gray-800 font-medium mb-3">Hình ảnh đánh giá (tối đa 5 ảnh)</Text>
                        <VStack>
                            {/* Photo Preview Section */}
                            {photos.length > 0 && (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                                    <HStack className="space-x-2">
                                        {photos.map((photo, index) => (
                                            <Box key={index} className="relative">
                                                <Image
                                                    source={{uri: photo.uri}}
                                                    className="w-24 h-24 rounded-md"
                                                />
                                                <Pressable
                                                    onPress={() => removePhoto(index)}
                                                    className="absolute top-1 right-1 bg-black/50 rounded-full w-6 h-6 items-center justify-center"
                                                >
                                                    <Icon as={X} size="xs" color="white" />
                                                </Pressable>
                                            </Box>
                                        ))}
                                    </HStack>
                                </ScrollView>
                            )}

                            {/* Upload Button */}
                            <Button
                                variant="outline"
                                onPress={pickImage}
                                className="border-dashed border-gray-300 h-12"
                                disabled={photos.length >= 5}
                            >
                                <ButtonIcon as={Camera} size="sm" className="text-gray-500 mr-2" />
                                <ButtonText className="text-gray-500">Thêm ảnh</ButtonText>
                            </Button>
                        </VStack>
                    </VStack>

                    {/* Submit Button */}
                    <Button
                        className="bg-blue-600 p-4 rounded-xl active:bg-blue-700 h-14"
                        onPress={handleSubmitRating}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <Spinner size="sm" color="white" />
                        ) : (
                            <ButtonText className="font-bold">Gửi đánh giá</ButtonText>
                        )}
                    </Button>
                </VStack>
            </ScrollView>
        </SafeAreaView>
    );
};

export default RatingScreen;
