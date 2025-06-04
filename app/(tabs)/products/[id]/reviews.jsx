import {useState, useEffect} from 'react';
import {ScrollView, SafeAreaView, RefreshControl, Modal, Dimensions} from 'react-native';
import {useLocalSearchParams, router} from 'expo-router';
import {ChevronLeft, Star, ArrowUp, ArrowDown, MessageSquare, X} from 'lucide-react-native';
import {ApiClient} from '@/config/api';
import {formatImageUrl} from '@/utils/imageUtils';

import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";
import {Heading} from "@/components/ui/heading";
import {Image} from "@/components/ui/image";
import {Pressable} from "@/components/ui/pressable";
import {Button, ButtonText} from "@/components/ui/button";
import {Icon} from "@/components/ui/icon";
import {Divider} from "@/components/ui/divider";
import {Spinner} from "@/components/ui/spinner";
import {Toast, ToastTitle, ToastDescription, useToast} from "@/components/ui/toast";

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const ProductReviewsScreen = () => {
    const {id} = useLocalSearchParams();
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'highest', 'lowest'
    const [filterRating, setFilterRating] = useState(0); // 0 means all ratings
    const [selectedImage, setSelectedImage] = useState(null);
    const [imageViewVisible, setImageViewVisible] = useState(false);
    const apiClient = ApiClient();
    const toast = useToast();

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            const data = await apiClient.get(`/products/${ id }`);
            setProduct(data);
        } catch (error) {
            console.error("Failed to fetch product details:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể tải thông tin sản phẩm</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const data = await apiClient.get(`/products/${ id }/reviews`);
            setReviews(data.results || []);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể tải đánh giá</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProductDetails();
        fetchReviews();
    }, [id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProductDetails();
        fetchReviews();
    };

    const handleSortChange = (sort) => {
        setSortBy(sort);
    };

    const handleFilterChange = (rating) => {
        setFilterRating(rating === filterRating ? 0 : rating);
    };

    const getSortedAndFilteredReviews = () => {
        let filteredReviews = reviews;

        // Apply rating filter
        if (filterRating > 0) {
            filteredReviews = filteredReviews.filter(review => review.rating === filterRating);
        }

        // Apply sorting
        let sortedReviews = [...filteredReviews];
        if (sortBy === 'newest') {
            sortedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'highest') {
            sortedReviews.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === 'lowest') {
            sortedReviews.sort((a, b) => a.rating - b.rating);
        }

        return sortedReviews;
    };

    const openImageViewer = (imageUrl) => {
        setSelectedImage(imageUrl);
        setImageViewVisible(true);
    };

    const closeImageViewer = () => {
        setImageViewVisible(false);
        setSelectedImage(null);
    };

    const displayReviews = getSortedAndFilteredReviews();

    if (loading && !product) {
        return (
            <Box className="flex-1 justify-center items-center">
                <Spinner size="lg" color="blue" />
            </Box>
        );
    }

    const renderRatingStats = () => {
        if (!product || !product.ratings) return null;

        const ratingCounts = product.ratings.distribution || {
            5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        };

        for (let review of reviews) {
            if (review.rating && !ratingCounts[review.rating]) {
                ratingCounts[review.rating] = 0;
            }
            if (review.rating) {
                ratingCounts[review.rating] += 1;
            }
        }

        const totalRatings = product.ratings.count || 0;

        return (
            <VStack className="mb-6 bg-white p-4 rounded-lg">
                <HStack className="items-center mb-4">
                    <Heading size="xl" className="text-yellow-500">
                        {product.ratings.average ? product.ratings.average.toFixed(1) : "0.0"}
                    </Heading>
                    <VStack className="ml-4">
                        <HStack className="items-center">
                            {[...Array(5)].map((_, i) => (
                                <Icon
                                    key={i}
                                    as={Star}
                                    size="sm"
                                    color={i < Math.round(product.ratings.average) ? "#f59e0b" : "#d1d5db"}
                                    fill={i < Math.round(product.ratings.average) ? "#f59e0b" : "transparent"}
                                />
                            ))}
                        </HStack>
                        <Text className="text-gray-500">
                            {totalRatings} {totalRatings === 1 ? 'đánh giá' : 'đánh giá'}
                        </Text>
                    </VStack>
                </HStack>

                {/* Rating Bars */}
                <VStack className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                        <Pressable key={rating} onPress={() => handleFilterChange(rating)}>
                            <HStack className="items-center">
                                <Text className="w-4 mr-2 text-gray-500">{rating}</Text>
                                <Icon as={Star} size="xs" color="#f59e0b" fill="#f59e0b" />
                                <Box className="flex-1 h-2 bg-gray-200 rounded-full ml-2">
                                    <Box
                                        className="h-2 bg-yellow-500 rounded-full"
                                        style={{width: `${ totalRatings > 0 ? (ratingCounts[rating] / totalRatings) * 100 : 0 }%`}}
                                    />
                                </Box>
                                <Text className="ml-2 text-gray-500 w-6 text-right">{ratingCounts[rating] || 0}</Text>
                            </HStack>
                        </Pressable>
                    ))}
                </VStack>
            </VStack>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <VStack className="flex-1 bg-white">
                <HStack className="px-4 py-3 bg-white items-center justify-between absolute top-0 left-0 right-0 z-10">
                    <Pressable
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white/70 items-center justify-center shadow-sm"
                    >
                        <Icon as={ChevronLeft} size="md" color="#374151" />
                    </Pressable>
                    <Heading size="md">Đánh giá sản phẩm</Heading>
                    <Box className="w-10" />
                </HStack>

                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerClassName="pt-16"
                >
                    {product && (
                        <VStack className="p-4">
                            <HStack className="bg-white rounded-lg p-4 mb-4 items-center">
                                <Image
                                    source={{uri: product.images?.[0] ? formatImageUrl(product.images[0]) : 'https://via.placeholder.com/80'}}
                                    className="w-16 h-16 rounded-md"
                                    alt={product.name}
                                />
                                <VStack className="ml-4 flex-1">
                                    <Text className="font-medium text-gray-900" numberOfLines={2}>{product.name}</Text>
                                    <HStack className="items-center">
                                        <Icon as={Star} size="xs" color="#f59e0b" fill="#f59e0b" />
                                        <Text className="ml-1 text-gray-700">{product.ratings?.average?.toFixed(1) || "0.0"}</Text>
                                    </HStack>
                                </VStack>
                            </HStack>

                            {renderRatingStats()}

                            <HStack className="mb-4 justify-between">
                                <HStack className="space-x-2">
                                    <Button
                                        variant={filterRating === 0 ? "solid" : "outline"}
                                        onPress={() => setFilterRating(0)}
                                        className={filterRating === 0 ? "bg-blue-500 mr-2" : "bg-white border-gray-300 mr-2"}
                                        size="sm"
                                    >
                                        <ButtonText className={filterRating === 0 ? "text-white" : "text-gray-600"}>Tất cả</ButtonText>
                                    </Button>
                                    {[5, 4, 3, 2, 1].map(rating => (
                                        <Button
                                            key={rating}
                                            variant={filterRating === rating ? "solid" : "outline"}
                                            onPress={() => handleFilterChange(rating)}
                                            className={filterRating === rating ? "bg-yellow-500 mr-2" : "bg-white border-gray-300 mr-2"}
                                            size="sm"
                                        >
                                            <ButtonText className={filterRating === rating ? "text-white" : "text-gray-600"}>{rating}★</ButtonText>
                                        </Button>
                                    ))}
                                </HStack>
                            </HStack>

                            <HStack className="mb-4">
                                <Button
                                    variant={sortBy === 'newest' ? "solid" : "outline"}
                                    onPress={() => handleSortChange('newest')}
                                    className={sortBy === 'newest' ? "bg-blue-500 mr-2" : "bg-white border-gray-300 mr-2"}
                                    size="sm"
                                >
                                    <ButtonText className={sortBy === 'newest' ? "text-white" : "text-gray-600"}>Mới nhất</ButtonText>
                                </Button>
                                <Button
                                    variant={sortBy === 'highest' ? "solid" : "outline"}
                                    onPress={() => handleSortChange('highest')}
                                    className={sortBy === 'highest' ? "bg-blue-500 mr-2" : "bg-white border-gray-300 mr-2"}
                                    size="sm"
                                >
                                    <HStack className="items-center space-x-1">
                                        <ButtonText className={sortBy === 'highest' ? "text-white" : "text-gray-600"}>Đánh giá</ButtonText>
                                        <Icon as={ArrowUp} size="xs" color={sortBy === 'highest' ? "white" : "#4B5563"} />
                                    </HStack>
                                </Button>
                                <Button
                                    variant={sortBy === 'lowest' ? "solid" : "outline"}
                                    onPress={() => handleSortChange('lowest')}
                                    className={sortBy === 'lowest' ? "bg-blue-500" : "bg-white border-gray-300"}
                                    size="sm"
                                >
                                    <HStack className="items-center space-x-1">
                                        <ButtonText className={sortBy === 'lowest' ? "text-white" : "text-gray-600"}>Đánh giá</ButtonText>
                                        <Icon as={ArrowDown} size="xs" color={sortBy === 'lowest' ? "white" : "#4B5563"} />
                                    </HStack>
                                </Button>
                            </HStack>

                            {displayReviews.length > 0 ? (
                                <VStack className="space-y-4">
                                    {displayReviews.map((review, index) => (
                                        <Box
                                            key={index}
                                            className="p-4 bg-white rounded-lg shadow-sm mb-2"
                                        >
                                            <HStack className="items-center mb-3">
                                                <Image
                                                    source={{uri: review.customerAvatar ? formatImageUrl(review.customerAvatar) : 'https://via.placeholder.com/40'}}
                                                    className="w-10 h-10 rounded-full mr-3"
                                                    alt="Avatar"
                                                />
                                                <VStack>
                                                    <Text className="font-medium">{review.customerName || "Khách hàng"}</Text>
                                                    <Text className="text-gray-500 text-xs">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</Text>
                                                </VStack>
                                                <Box className="ml-auto">
                                                    <HStack>
                                                        {[...Array(5)].map((_, i) => (
                                                            <Icon
                                                                key={i}
                                                                as={Star}
                                                                size="xs"
                                                                color={i < review.rating ? "#f59e0b" : "#d1d5db"}
                                                                fill={i < review.rating ? "#f59e0b" : "transparent"}
                                                            />
                                                        ))}
                                                    </HStack>
                                                </Box>
                                            </HStack>

                                            <Text className="text-gray-700 mb-3">{review.content}</Text>

                                            {review.photos && review.photos.length > 0 && (
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                                                    <HStack className="space-x-2">
                                                        {review.photos.map((photo, photoIndex) => (
                                                            <Pressable
                                                                key={photoIndex}
                                                                onPress={() => openImageViewer(formatImageUrl(photo))}
                                                                className='mr-2'
                                                            >
                                                                <Image
                                                                    source={{uri: formatImageUrl(photo)}}
                                                                    className="w-24 h-24 rounded-md"
                                                                    alt={`Review photo ${ photoIndex }`}
                                                                />
                                                            </Pressable>
                                                        ))}
                                                    </HStack>
                                                </ScrollView>
                                            )}

                                            {review.reply && (
                                                <Box className="bg-gray-50 p-3 rounded-lg mt-2">
                                                    <HStack className="items-center mb-1">
                                                        <Icon as={MessageSquare} size="sm" color="#4B5563" />
                                                        <Text className="font-medium ml-2">Phản hồi từ cửa hàng</Text>
                                                    </HStack>
                                                    <Text className="text-gray-700">{review.reply.content}</Text>
                                                    <Text className="text-gray-500 text-xs mt-1">{new Date(review.reply.date).toLocaleDateString('vi-VN')}</Text>
                                                </Box>
                                            )}
                                        </Box>
                                    ))}
                                </VStack>
                            ) : (
                                <Box className="bg-white p-8 rounded-lg items-center justify-center">
                                    <Text className="text-gray-500 text-center">
                                        {filterRating > 0
                                            ? `Không có đánh giá ${ filterRating } sao nào`
                                            : "Chưa có đánh giá nào cho sản phẩm này"}
                                    </Text>
                                </Box>
                            )}
                        </VStack>
                    )}
                </ScrollView>

                <Modal
                    visible={imageViewVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={closeImageViewer}
                >
                    <SafeAreaView style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.9)'}}>
                        <Pressable
                            style={{position: 'absolute', top: 40, right: 20, zIndex: 10}}
                            onPress={closeImageViewer}
                            accessibilityLabel="Close image viewer"
                            accessibilityRole="button"
                        >
                            <Icon as={X} size="lg" color="white" />
                        </Pressable>
                        <Box className="flex-1 justify-center items-center">
                            {selectedImage && (
                                <Image
                                    source={{uri: selectedImage}}
                                    style={{
                                        width: screenWidth * 0.9,
                                        height: screenWidth * 0.9,
                                        borderRadius: 8
                                    }}
                                    resizeMode="contain"
                                    alt="Review image"
                                    accessibilityLabel="Review image enlarged view"
                                />
                            )}
                        </Box>
                        <Box className="absolute bottom-10 left-0 right-0 items-center">
                            <Text className="text-white text-center">
                                Nhấn vào nút X để đóng
                            </Text>
                        </Box>
                    </SafeAreaView>
                </Modal>
            </VStack>
        </SafeAreaView>
    );
};

export default ProductReviewsScreen;
