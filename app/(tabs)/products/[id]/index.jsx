import {useState, useEffect} from 'react';
import {ScrollView, SafeAreaView, Dimensions, RefreshControl} from 'react-native';
import {useLocalSearchParams, router} from 'expo-router';
import {ChevronLeft, Heart, Share2, Star, Package, ShoppingCart, Truck, ArrowRight, ShieldCheck, Check} from 'lucide-react-native';
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
import {Badge, BadgeText} from "@/components/ui/badge";
import {Spinner} from "@/components/ui/spinner";
import {
    Accordion,
    AccordionItem,
    AccordionHeader,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";

const {width} = Dimensions.get('window');
const imageHeight = width * 0.8;

const ProductDetailScreen = () => {
    const {id} = useLocalSearchParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const {addToCart} = useCart();
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
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchProductDetails();
    }, [id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProductDetails();
    };

    const handleAddToCart = async () => {
        if (!product) return;

        try {
            const result = await addToCart(product, quantity);

            if (result.success) {
                toast.show({
                    render: ({id}) => (
                        <Toast nativeID={id} action="success" variant="solid">
                            <VStack space="xs">
                                <ToastTitle>Đã thêm vào giỏ hàng</ToastTitle>
                                <ToastDescription>{quantity} x {product.name}</ToastDescription>
                            </VStack>
                        </Toast>
                    ),
                });
            } else {
                toast.show({
                    render: ({id}) => (
                        <Toast nativeID={id} action="error" variant="solid">
                            <VStack space="xs">
                                <ToastTitle>Lỗi</ToastTitle>
                                <ToastDescription>{result.error}</ToastDescription>
                            </VStack>
                        </Toast>
                    ),
                });
            }
        } catch (error) {
            console.error("Failed to add to cart:", error);
        }
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
        // TODO: Implement saving to favorites using AsyncStorage
    };

    const handleShare = () => {
        // TODO: Implement share functionality
    };

    const increaseQuantity = () => {
        if (product && quantity < product.stock) {
            setQuantity(quantity + 1);
        }
    };

    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const handleBuyNow = async () => {
        if (!product || product.stock <= 0) return;

        try {
            // Save the product to storage for direct purchase
            await AsyncStorage.setItem('items', JSON.stringify([
                {
                    productId: product._id,
                    name: product.name,
                    image: product.images[0],
                    price: product.price,
                    salePrice: product.salePrice,
                    quantity: quantity,
                    onSale: product.onSale,
                    stock: product.stock,
                },
            ]));

            router.push('/checkout');

            // if (result.success) {
            //     // Navigate to checkout with direct buy flag
            //     router.push('/checkout?directBuy=true');
            // } else {
            //     toast.show({
            //         render: ({id}) => (
            //             <Toast nativeID={id} action="error" variant="solid">
            //                 <VStack space="xs">
            //                     <ToastTitle>Lỗi</ToastTitle>
            //                     <ToastDescription>{result.error || "Không thể xử lý yêu cầu"}</ToastDescription>
            //                 </VStack>
            //             </Toast>
            //         ),
            //     });
            // }
        } catch (error) {
            console.error("Failed to handle buy now:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể xử lý yêu cầu mua ngay</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        }
    };

    if (loading && !product) {
        return (
            <Box className="flex-1 justify-center items-center">
                <Spinner size="lg" color="blue" />
            </Box>
        );
    }

    if (!product) {
        return (
            <Box className="flex-1 justify-center items-center px-6">
                <Text className="text-gray-500 text-center mb-4">
                    Không tìm thấy thông tin sản phẩm
                </Text>
                <Button onPress={() => router.navigate("/products")} className="bg-blue-500">
                    <ButtonText>Quay lại</ButtonText>
                </Button>
            </Box>
        );
    }

    const displayPrice = product.onSale ? product.salePrice : product.price;
    const hasDiscount = product.onSale && product.salePrice < product.price;
    const discountPercentage = hasDiscount
        ? Math.round(((product.price - product.salePrice) / product.price) * 100)
        : 0;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <VStack className="flex-1 bg-white">
                {/* Header */}
                <HStack className="px-4 py-3 bg-white items-center justify-between absolute top-0 left-0 right-0 z-10">
                    <Pressable
                        onPress={() => router.replace('/products')}
                        className="w-10 h-10 rounded-full bg-white/70 items-center justify-center shadow-sm"
                    >
                        <Icon as={ChevronLeft} size="md" color="#374151" />
                    </Pressable>
                    <HStack space="md">
                        <Pressable
                            onPress={handleShare}
                            className="w-10 h-10 rounded-full bg-white/70 items-center justify-center shadow-sm"
                        >
                            <Icon as={Share2} size="md" color="#374151" />
                        </Pressable>
                    </HStack>
                </HStack>

                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerClassName='pt-16'
                >
                    {/* Product Images */}
                    <Box className="w-full" style={{height: imageHeight}}>
                        <Image
                            source={{uri: formatImageUrl(product.images[0])}}
                            alt={product.name}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                        {hasDiscount && (
                            <Badge
                                variant="solid"
                                className="bg-red-500 absolute top-4 right-4 px-2 py-1 rounded-lg"
                            >
                                <BadgeText className="text-white font-bold">-{discountPercentage}%</BadgeText>
                            </Badge>
                        )}
                    </Box>

                    {/* Product Info */}
                    <VStack className="px-6 pt-4">
                        {/* Category */}
                        <HStack className="mb-1">
                            <Pressable
                                onPress={() => router.push(`/products/category/${ product.categoryId._id }`)}
                                className="flex-row items-center"
                            >
                                <Text className="text-blue-500">{product.categoryId.name}</Text>
                                <Icon as={ArrowRight} size="xs" color="#3B82F6" className="ml-1" />
                            </Pressable>
                        </HStack>

                        {/* Title */}
                        <Heading size="lg" className="text-gray-900 mb-2">{product.name}</Heading>

                        {/* Rating */}
                        <HStack className="items-center mb-4">
                            <HStack className="items-center">
                                <Icon as={Star} size="sm" color={product.ratings.average > 0 ? "#f59e0b" : "#d1d5db"} fill={product.ratings.average > 0 ? "#f59e0b" : "transparent"} />
                                <Text className="ml-1 text-gray-700">
                                    {product.ratings.average > 0 ? product.ratings.average.toFixed(1) : "Chưa có đánh giá"}
                                </Text>
                            </HStack>
                            {product.ratings.count > 0 && (
                                <Pressable onPress={() => router.push(`/products/${ id }/reviews`)} className="ml-2">
                                    <HStack className="items-center">
                                        <Text className="text-blue-500">({product.ratings.count} đánh giá)</Text>
                                        <Icon as={ArrowRight} size="xs" color="#3B82F6" className="ml-1" />
                                    </HStack>
                                </Pressable>
                            )}
                        </HStack>

                        {/* Price */}
                        <HStack className="items-baseline mb-4">
                            <Heading size="xl" className="text-blue-600 mr-2">
                                {formatVietnamCurrency(displayPrice)}
                            </Heading>
                            {hasDiscount && (
                                <Text className="text-gray-500 line-through text-base">
                                    {formatVietnamCurrency(product.price)}
                                </Text>
                            )}
                        </HStack>

                        {/* Stock */}
                        <HStack className="items-center mb-4">
                            <Icon as={Package} size="sm" color={product.stock > 0 ? "#10b981" : "#ef4444"} />
                            <Text className={`ml-2 ${ product.stock > 0 ? 'text-green-600' : 'text-red-500' }`}>
                                {product.stock > 0 ? `Còn hàng (${ product.stock })` : 'Hết hàng'}
                            </Text>
                        </HStack>

                        <Divider className="my-4" />

                        {/* Quantity Selector */}
                        {product.stock > 0 && (
                            <VStack className="mb-6">
                                <Text className="mb-2 text-gray-700 font-medium">Số lượng:</Text>
                                <HStack className="items-center">
                                    <Pressable
                                        onPress={decreaseQuantity}
                                        className="w-10 h-10 rounded-lg bg-gray-100 items-center justify-center"
                                        disabled={quantity <= 1}
                                    >
                                        <Text className="text-xl font-bold text-gray-800">-</Text>
                                    </Pressable>
                                    <Box className="w-16 h-10 bg-gray-50 mx-2 rounded-lg items-center justify-center">
                                        <Text className="text-gray-800 font-bold">{quantity}</Text>
                                    </Box>
                                    <Pressable
                                        onPress={increaseQuantity}
                                        className="w-10 h-10 rounded-lg bg-gray-100 items-center justify-center"
                                        disabled={quantity >= product.stock}
                                    >
                                        <Text className="text-xl font-bold text-gray-800">+</Text>
                                    </Pressable>
                                </HStack>
                            </VStack>
                        )}

                        {/* Shipping Info */}
                        <HStack className="bg-blue-50 rounded-lg p-4 mb-6 items-center">
                            <Icon as={Truck} size="md" color="#3B82F6" />
                            <VStack className="ml-3">
                                <Text className="text-gray-800 font-medium">Giao hàng</Text>
                                <Text className="text-gray-600">Giao hàng miễn phí cho đơn hàng từ 500.000đ</Text>
                            </VStack>
                        </HStack>

                        {/* Product Description */}
                        <VStack className="mb-4">
                            <Heading size="md" className="mb-2">Mô tả sản phẩm</Heading>
                            <Text className="text-gray-700 mb-4">{product.description}</Text>
                        </VStack>

                        {/* Recent Reviews Section */}
                        {product.recentReviews && product.recentReviews.length > 0 && (
                            <VStack className="mb-6">
                                <HStack className="justify-between items-center mb-3">
                                    <Heading size="md">Đánh giá gần đây</Heading>
                                    <Pressable onPress={() => router.push(`/products/${ id }/reviews`)}>
                                        <HStack className="items-center">
                                            <Text className="text-blue-500">Xem tất cả</Text>
                                            <Icon as={ArrowRight} size="xs" color="#3B82F6" className="ml-1" />
                                        </HStack>
                                    </Pressable>
                                </HStack>

                                <VStack className="space-y-4">
                                    {product.recentReviews.slice(0, 2).map((review, index) => (
                                        <Box
                                            key={index}
                                            className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-2"
                                        >
                                            <HStack className="items-center mb-2">
                                                <Image
                                                    source={{uri: review.customerAvatar ? formatImageUrl(review.customerAvatar) : 'https://via.placeholder.com/40'}}
                                                    className="w-8 h-8 rounded-full mr-2"
                                                    alt="Avatar"
                                                />
                                                <Text className="font-medium">{review.customerName || "Khách hàng"}</Text>
                                                <Box className="ml-auto flex-row items-center">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Icon
                                                            key={i}
                                                            as={Star}
                                                            size="xs"
                                                            color={i < review.rating ? "#f59e0b" : "#d1d5db"}
                                                            fill={i < review.rating ? "#f59e0b" : "transparent"}
                                                        />
                                                    ))}
                                                </Box>
                                            </HStack>
                                            <Text className="text-gray-700 mb-1">{review.content}</Text>
                                            {review.photos && review.photos.length > 0 && (
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                                                    <HStack className="space-x-2">
                                                        {review.photos.map((photo, photoIndex) => (
                                                            <Image
                                                                key={photoIndex}
                                                                source={{uri: formatImageUrl(photo)}}
                                                                className="w-16 h-16 rounded-md"
                                                                alt={`Review photo ${ photoIndex }`}
                                                            />
                                                        ))}
                                                    </HStack>
                                                </ScrollView>
                                            )}
                                            <Text className="text-gray-500 text-xs">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</Text>
                                        </Box>
                                    ))}
                                </VStack>
                            </VStack>
                        )}

                        {/* Product Highlights */}
                        {product.highlights && product.highlights.length > 0 && (
                            <VStack className="mb-6">
                                <Heading size="md" className="mb-3">Điểm nổi bật</Heading>
                                <VStack className="bg-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm gap-4">
                                    {product.highlights.map((highlight, index) => (
                                        <HStack key={index} className=" items-center justify-start gap-2">
                                            <Box className="rounded-full bg-blue-100 p-1">
                                                <Icon as={Check} size="sm" color="#3B82F6" />
                                            </Box>
                                            <Text className="text-gray-700 flex-1 font-medium">{highlight}</Text>
                                        </HStack>
                                    ))}
                                </VStack>
                            </VStack>
                        )}

                        {/* Additional Information */}
                        <Accordion className="mb-6 rounded-2xl" type="single" defaultValue="item-1">
                            <AccordionItem value="item-1" className='rounded-2xl'>
                                <AccordionHeader>
                                    <AccordionTrigger>
                                        <Heading size="sm">Thông tin chi tiết</Heading>
                                    </AccordionTrigger>
                                </AccordionHeader>
                                <AccordionContent>
                                    <VStack className="space-y-2 pt-2">
                                        <HStack className="justify-between">
                                            <Text className="text-gray-600">Danh mục:</Text>
                                            <Text className="text-gray-800 font-medium">{product.categoryId.name}</Text>
                                        </HStack>
                                        <HStack className="justify-between">
                                            <Text className="text-gray-600">Loại thú cưng:</Text>
                                            <Text className="text-gray-800 font-medium">
                                                {product.petTypes.map(type => type === 'dog' ? 'Chó' : type === 'cat' ? 'Mèo' : type).join(', ')}
                                            </Text>
                                        </HStack>
                                        <HStack className="justify-between">
                                            <Text className="text-gray-600">Mã sản phẩm:</Text>
                                            <Text className="text-gray-800 font-medium">{product._id.slice(-8).toUpperCase()}</Text>
                                        </HStack>
                                        <Divider className="my-4" />
                                        <HStack className="space-x-2 items-start">
                                            <Icon as={ShieldCheck} size="sm" color="#10b981" className="mt-1 mr-2" />
                                            <VStack>
                                                <Text className="text-gray-800 font-medium">7 ngày đổi trả</Text>
                                                <Text className="text-gray-600">Đổi trả sản phẩm trong 7 ngày nếu hàng lỗi hoặc không đúng mô tả</Text>
                                            </VStack>
                                        </HStack>
                                    </VStack>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionContent>

                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                        {/* Similar Products placeholder - Can be implemented later */}
                    </VStack>
                </ScrollView>

                {/* Bottom Action Buttons */}
                <HStack className="p-4 pb-0 bg-white border-t border-gray-200">
                    <Button
                        className="flex-1 bg-gray-100 p-4 h-fit"
                        onPress={handleAddToCart}
                        disabled={product.stock <= 0}
                    >
                        <ButtonIcon as={ShoppingCart} mr="2" className='text-gray-600' />
                        <ButtonText className='text-gray-600'>{product.stock > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}</ButtonText>
                    </Button>
                    <Button
                        className="ml-3 flex-1 bg-blue-500 p-4 h-fit"
                        onPress={handleBuyNow}
                        disabled={product.stock <= 0}
                    >
                        <ButtonText>Mua ngay</ButtonText>
                    </Button>
                </HStack>
            </VStack>
        </SafeAreaView>
    );
};

export default ProductDetailScreen;
